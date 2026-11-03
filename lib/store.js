// The app's only data access layer. Everything here is async so these functions
// can be reimplemented against the new database without changing any page.
// Until then, data lives in this browser's localStorage (demo mode).
import { buildBill } from "./billing";
import { buildSeed } from "./seed";

const KEY = "hospital-pos:demo:v1";

function load() {
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  const db = buildSeed();
  save(db);
  return db;
}

function save(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

function nextId(db, counter, prefix, width) {
  db.counters[counter] += 1;
  return `${prefix}-${String(db.counters[counter]).padStart(width, "0")}`;
}

function findOrThrow(list, id, label) {
  const record = list.find((entry) => entry.id === id);
  if (!record) throw new Error(`${label} not found.`);
  return record;
}

const clean = (value) => (typeof value === "string" ? value.trim() : value);

function cleanAll(input) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, clean(value)]));
}

const isWholeNumber = (value, min = 0) => Number.isInteger(value) && value >= min;

const actorName = (actor) => `${actor.firstName} ${actor.lastName}`;

/* ---------- Patients ---------- */

export async function listPatients() {
  return load().patients.sort((a, b) => b.id.localeCompare(a.id));
}

export async function getPatient(id) {
  return findOrThrow(load().patients, id, "Patient");
}

function validatePatient(db, patient, currentId) {
  if (!patient.firstName || !patient.lastName) throw new Error("First and last name are required.");
  if (!patient.gender) throw new Error("Gender is required.");
  if (patient.dob && patient.dob > new Date().toISOString().slice(0, 10)) {
    throw new Error("Date of birth cannot be in the future.");
  }
  if (patient.insurer && !patient.memberNo) {
    throw new Error("Enter the insurance member number.");
  }
  if (
    patient.nationalId &&
    db.patients.some((p) => p.nationalId === patient.nationalId && p.id !== currentId)
  ) {
    throw new Error("A patient with this ID number is already registered.");
  }
}

export async function createPatient(input) {
  const db = load();
  const patient = cleanAll(input);
  validatePatient(db, patient);
  const created = {
    ...patient,
    id: nextId(db, "patient", "P", 5),
    createdAt: new Date().toISOString(),
  };
  db.patients.push(created);
  save(db);
  return created;
}

export async function updatePatient(id, input) {
  const db = load();
  const existing = findOrThrow(db.patients, id, "Patient");
  const patient = cleanAll(input);
  validatePatient(db, patient, id);
  Object.assign(existing, patient);
  save(db);
  return existing;
}

/* ---------- Catalogue (services and medication) ---------- */

export async function listCatalogue() {
  return load().catalogue.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getItem(id) {
  return findOrThrow(load().catalogue, id, "Item");
}

function validateItem(db, item, currentId) {
  if (!item.name) throw new Error("Name is required.");
  if (!item.department) throw new Error("Department is required.");
  if (!isWholeNumber(item.price)) throw new Error("Price must be a whole number of shillings.");
  if (item.tracksStock && (!isWholeNumber(item.stock) || !isWholeNumber(item.reorderLevel))) {
    throw new Error("Stock and reorder level must be whole numbers.");
  }
  const duplicate = db.catalogue.some(
    (entry) =>
      entry.id !== currentId &&
      entry.department === item.department &&
      entry.name.toLowerCase() === item.name.toLowerCase()
  );
  if (duplicate) throw new Error(`"${item.name}" already exists in ${item.department}.`);
}

export async function saveItem(id, input) {
  const db = load();
  const item = cleanAll(input);
  validateItem(db, item, id);
  if (id) {
    const saved = Object.assign(findOrThrow(db.catalogue, id, "Item"), item);
    save(db);
    return saved;
  }
  const created = { ...item, id: nextId(db, "item", "ITM", 4) };
  db.catalogue.push(created);
  save(db);
  return created;
}

export async function deleteItem(id) {
  const db = load();
  findOrThrow(db.catalogue, id, "Item");
  db.catalogue = db.catalogue.filter((item) => item.id !== id);
  save(db);
}

/* ---------- Bills ---------- */

export async function listBills() {
  return load().bills.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listBillsForPatient(patientId) {
  return (await listBills()).filter((bill) => bill.patientId === patientId);
}

export async function getBill(id) {
  return findOrThrow(load().bills, id, "Bill");
}

function validatePayment(payment, insurer) {
  if (payment.method === "mpesa" && !payment.reference?.trim()) {
    throw new Error("Enter the M-Pesa transaction code.");
  }
  if (payment.method === "insurance" && !insurer) {
    throw new Error("This patient has no insurance on file.");
  }
}

// `payment` is { method, reference }, or null to leave the bill unpaid.
export async function createBill({ patientId, lines, waiver = 0, payment, actor }) {
  const db = load();
  const patient = findOrThrow(db.patients, patientId, "Patient");
  if (!lines.length) throw new Error("Add at least one item to the bill.");

  for (const { itemId, qty } of lines) {
    const item = findOrThrow(db.catalogue, itemId, "Item");
    if (!isWholeNumber(qty, 1)) throw new Error(`Invalid quantity for ${item.name}.`);
    if (item.tracksStock && qty > item.stock) {
      throw new Error(`Only ${item.stock} of ${item.name} left in stock.`);
    }
  }

  const subtotal = lines.reduce(
    (sum, { itemId, qty }) => sum + findOrThrow(db.catalogue, itemId, "Item").price * qty,
    0
  );
  if (!isWholeNumber(waiver) || waiver > subtotal) {
    throw new Error("Waiver must be a whole number no larger than the bill.");
  }
  if (payment) validatePayment(payment, patient.insurer);

  const bill = buildBill({
    id: nextId(db, "bill", "INV", 5),
    patient,
    items: db.catalogue,
    lines,
    waiver,
    payment: payment && { ...payment, reference: clean(payment.reference)?.toUpperCase() },
    actorName: actorName(actor),
    at: new Date().toISOString(),
  });

  for (const { itemId, qty } of lines) {
    const item = findOrThrow(db.catalogue, itemId, "Item");
    if (item.tracksStock) item.stock -= qty;
  }
  db.bills.push(bill);
  save(db);
  return bill;
}

// Settles an unpaid bill, or marks a pending insurance claim as paid out.
export async function recordPayment(id, { method, reference }, actor) {
  const db = load();
  const bill = findOrThrow(db.bills, id, "Bill");
  if (bill.status !== "unpaid" && bill.status !== "claim") {
    throw new Error("This bill has no outstanding balance.");
  }
  validatePayment({ method, reference }, bill.insurer);

  const at = new Date().toISOString();
  if (bill.status === "unpaid" && method === "insurance") {
    bill.status = "claim";
    bill.payment = { method, reference: "", paidAt: null, receivedBy: actorName(actor) };
  } else {
    bill.status = "paid";
    bill.payment = {
      method,
      reference: clean(reference)?.toUpperCase() || "",
      paidAt: at,
      receivedBy: actorName(actor),
    };
  }
  save(db);
  return bill;
}

// Cancels a bill and returns its medication to stock. Administrators only.
export async function voidBill(id, reason, actor) {
  if (actor.role !== "admin") throw new Error("Only an administrator can void a bill.");
  if (!reason?.trim()) throw new Error("Give a reason for voiding this bill.");
  const db = load();
  const bill = findOrThrow(db.bills, id, "Bill");
  if (bill.status === "void") throw new Error("This bill is already void.");

  for (const line of bill.lines) {
    const item = db.catalogue.find((entry) => entry.id === line.itemId);
    if (item?.tracksStock) item.stock += line.qty;
  }
  bill.status = "void";
  bill.voidReason = reason.trim();
  save(db);
  return bill;
}

/* ---------- Staff ---------- */

export async function listStaff() {
  return load().staff.sort((a, b) => a.firstName.localeCompare(b.firstName));
}

export async function getStaff(id) {
  return findOrThrow(load().staff, id, "Staff member");
}

export async function findStaffByEmail(email) {
  const target = email.trim().toLowerCase();
  return load().staff.find((member) => member.email === target) || null;
}

export async function saveStaff(id, input) {
  const db = load();
  const member = cleanAll(input);
  member.email = member.email?.toLowerCase();
  if (!member.firstName || !member.lastName) throw new Error("First and last name are required.");
  if (!/^\S+@\S+\.\S+$/.test(member.email || "")) throw new Error("Enter a valid email address.");
  if (!member.role) throw new Error("Choose a role.");
  if (db.staff.some((entry) => entry.email === member.email && entry.id !== id)) {
    throw new Error("A staff member with this email already exists.");
  }
  if (id) {
    const saved = Object.assign(findOrThrow(db.staff, id, "Staff member"), member);
    save(db);
    return saved;
  }
  const created = { ...member, id: nextId(db, "staff", "STF", 3), active: true };
  db.staff.push(created);
  save(db);
  return created;
}

// Staff are deactivated rather than deleted so their names stay on past bills.
export async function setStaffActive(id, active, actor) {
  if (id === actor.id) throw new Error("You cannot deactivate your own account.");
  const db = load();
  findOrThrow(db.staff, id, "Staff member").active = active;
  save(db);
}
