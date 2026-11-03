// The app's only data access layer. What each user may do is enforced by the
// database (docs/schema.sql); the checks here just give friendlier messages sooner.
import { supabase } from "@/config/supabase";
import {
  billFromRow,
  friendlyMessage,
  itemFromRow,
  itemToRow,
  patientFromRow,
  patientToRow,
  staffFromRow,
} from "./mappers.mjs";

const PAGE_SIZE = 1000;
const BILL_COLUMNS = "*, bill_lines(position, item_id, name, department, unit_price, qty, amount)";
const ITEM_COLUMNS = "*, item_costs(buying_price)";

function unwrap({ data, error }) {
  if (error) throw new Error(friendlyMessage(error));
  return data;
}

// The API returns at most 1000 rows per request. Stopping there would silently
// understate reports, so this keeps going until it has everything.
async function fetchAll(buildQuery) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const page = unwrap(await buildQuery().range(from, from + PAGE_SIZE - 1));
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

async function getById(table, id, columns = "*") {
  const row = unwrap(await supabase().from(table).select(columns).eq("id", id).maybeSingle());
  if (!row) throw new Error("Record not found.");
  return row;
}

const isWholeNumber = (value, min = 0) => Number.isInteger(value) && value >= min;

/* ---------- Patients ---------- */

export async function listPatients() {
  const rows = await fetchAll(() =>
    supabase().from("patients").select().order("created_at", { ascending: false }).order("id")
  );
  return rows.map(patientFromRow);
}

export async function getPatient(id) {
  return patientFromRow(await getById("patients", id));
}

function validatePatient(patient) {
  if (!patient.first_name || !patient.last_name) throw new Error("First and last name are required.");
  if (!patient.gender) throw new Error("Gender is required.");
  if (patient.dob && patient.dob > new Date().toISOString().slice(0, 10)) {
    throw new Error("Date of birth cannot be in the future.");
  }
  if (patient.insurer && !patient.member_no) {
    throw new Error("Enter the insurance member number.");
  }
}

export async function createPatient(input) {
  const row = patientToRow(input);
  validatePatient(row);
  return patientFromRow(unwrap(await supabase().from("patients").insert(row).select().single()));
}

export async function updatePatient(id, input) {
  const row = patientToRow(input);
  validatePatient(row);
  return patientFromRow(unwrap(await supabase().from("patients").update(row).eq("id", id).select().single()));
}

/* ---------- Catalogue (services and medication) ---------- */

export async function listCatalogue() {
  const rows = await fetchAll(() => supabase().from("catalogue").select(ITEM_COLUMNS).order("name").order("id"));
  return rows.map(itemFromRow);
}

export async function getItem(id) {
  return itemFromRow(await getById("catalogue", id, ITEM_COLUMNS));
}

function validateItem(item) {
  if (!item.name) throw new Error("Name is required.");
  if (!item.department) throw new Error("Department is required.");
  if (!isWholeNumber(item.price)) throw new Error("Selling price must be a whole number of shillings.");
  if (item.buyingPrice !== null && !isWholeNumber(item.buyingPrice)) {
    throw new Error("Buying price must be a whole number of shillings.");
  }
  if (item.tracksStock) {
    if (item.stock !== undefined && !isWholeNumber(item.stock)) throw new Error("Stock must be a whole number.");
    if (!isWholeNumber(item.reorderLevel)) throw new Error("Reorder level must be a whole number.");
  }
}

export async function saveItem(id, input) {
  validateItem(input);
  const row = itemToRow(input);
  const query = id
    ? supabase().from("catalogue").update(row).eq("id", id)
    : supabase().from("catalogue").insert(row);
  const saved = unwrap(await query.select().single());

  const costs = supabase().from("item_costs");
  const { error } =
    input.buyingPrice === null
      ? await costs.delete().eq("id", saved.id)
      : await costs.upsert({ id: saved.id, buying_price: input.buyingPrice });
  if (error) throw new Error("The item was saved, but its buying price was not. Edit the item to try again.");

  return itemFromRow({ ...saved, item_costs: input.buyingPrice === null ? null : { buying_price: input.buyingPrice } });
}

export async function deleteItem(id) {
  const deleted = unwrap(await supabase().from("catalogue").delete().eq("id", id).select());
  if (!deleted.length) throw new Error("Record not found, or you do not have permission to delete it.");
}

/* ---------- Bills ---------- */

export async function listBills() {
  const rows = await fetchAll(() =>
    supabase().from("bills").select(BILL_COLUMNS).order("created_at", { ascending: false }).order("id")
  );
  return rows.map(billFromRow);
}

export async function listBillsForPatient(patientId) {
  const rows = await fetchAll(() =>
    supabase()
      .from("bills")
      .select(BILL_COLUMNS)
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false })
      .order("id")
  );
  return rows.map(billFromRow);
}

export async function getBill(id) {
  return billFromRow(await getById("bills", id, BILL_COLUMNS));
}

// `payment` is { method, reference }, or null to leave the bill unpaid.
export async function createBill({ patientId, lines, waiver = 0, payment }) {
  const id = unwrap(
    await supabase().rpc("create_bill", {
      p_patient_id: patientId,
      p_lines: lines.map(({ itemId, qty }) => ({ item_id: itemId, qty })),
      p_waiver: waiver,
      p_method: payment?.method ?? null,
      p_reference: payment?.reference ?? "",
    })
  );
  return getBill(id);
}

// Settles an unpaid bill, or marks a pending insurance claim as paid out.
export async function recordPayment(id, { method, reference }) {
  unwrap(await supabase().rpc("record_payment", { p_bill_id: id, p_method: method, p_reference: reference ?? "" }));
}

// Cancels a bill and returns its medication to stock. Administrators only.
export async function voidBill(id, reason) {
  unwrap(await supabase().rpc("void_bill", { p_bill_id: id, p_reason: reason }));
}

/* ---------- Staff ---------- */

export async function listStaff() {
  const rows = await fetchAll(() => supabase().from("staff").select().order("first_name").order("id"));
  return rows.map(staffFromRow);
}

export async function getStaff(id) {
  return staffFromRow(await getById("staff", id));
}

// Staff accounts also need a sign-in, which only the server can create.
async function staffAction(body) {
  const { data } = await supabase().auth.getSession();
  const response = await fetch("/api/staff", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session?.access_token}`,
    },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The change could not be saved.");
  return result;
}

// Returns { tempPassword } for a new account.
export const saveStaff = (id, input) => staffAction({ action: id ? "update" : "create", id, input });

export const setStaffActive = (id, active) => staffAction({ action: "setActive", id, active });

// Returns { tempPassword }.
export const resetStaffPassword = (id) => staffAction({ action: "resetPassword", id });

/* ---------- Audit log ---------- */

export async function listAuditLog(limit = 200) {
  return unwrap(
    await supabase()
      .from("audit_log")
      .select("id, at, table_name, row_id, action, actor_name")
      .order("at", { ascending: false })
      .limit(limit)
  );
}
