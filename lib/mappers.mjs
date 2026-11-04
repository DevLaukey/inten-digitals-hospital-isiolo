// Converts between database rows (snake_case) and the objects the pages use (camelCase).

const text = (value) => (typeof value === "string" ? value.trim() : value ?? "");

export const patientFromRow = (row) => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  dob: row.dob ?? "",
  gender: row.gender,
  phone: row.phone,
  nationalId: row.national_id,
  town: row.town,
  insurer: row.insurer,
  memberNo: row.member_no,
  nextOfKinName: row.next_of_kin_name,
  nextOfKinPhone: row.next_of_kin_phone,
  createdAt: row.created_at,
});

export const patientToRow = (patient) => ({
  first_name: text(patient.firstName),
  last_name: text(patient.lastName),
  dob: text(patient.dob) || null,
  gender: text(patient.gender),
  phone: text(patient.phone),
  national_id: text(patient.nationalId),
  town: text(patient.town),
  insurer: text(patient.insurer),
  member_no: text(patient.memberNo),
  next_of_kin_name: text(patient.nextOfKinName),
  next_of_kin_phone: text(patient.nextOfKinPhone),
});

function costOf(row) {
  const cost = [row.item_costs].flat()[0]?.buying_price;
  return cost === undefined || cost === null ? null : Number(cost);
}

export const itemFromRow = (row) => ({
  id: row.id,
  name: row.name,
  department: row.department,
  price: row.price,
  // Null when none is recorded, or when this role isn't allowed to see it.
  buyingPrice: costOf(row),
  tracksStock: row.tracks_stock,
  stock: row.stock,
  reorderLevel: row.reorder_level,
  unit: row.unit,
});

// `stock` may be left out when editing, so a save can't overwrite sales made meanwhile.
export function itemToRow(item) {
  const row = {
    name: text(item.name),
    department: text(item.department),
    price: item.price,
    tracks_stock: Boolean(item.tracksStock),
    reorder_level: item.reorderLevel ?? 0,
    unit: text(item.unit),
  };
  if (item.stock !== undefined) row.stock = item.stock;
  return row;
}

export const staffFromRow = (row) => ({
  id: row.id,
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  phone: row.phone,
  role: row.role,
  active: row.active,
  mustChangePassword: row.must_change_password,
});

export const billFromRow = (row) => ({
  id: row.id,
  patientId: row.patient_id,
  patientName: row.patient_name,
  insurer: row.insurer,
  memberNo: row.member_no,
  lines: [...(row.bill_lines ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((line) => ({
      itemId: line.item_id,
      name: line.name,
      department: line.department,
      unitPrice: line.unit_price,
      qty: line.qty,
      amount: line.amount,
    })),
  subtotal: row.subtotal,
  waiver: row.waiver,
  total: row.total,
  status: row.status,
  payment: row.payment_method
    ? {
        method: row.payment_method,
        reference: row.payment_reference,
        paidAt: row.paid_at,
        receivedBy: row.received_by,
      }
    : null,
  createdAt: row.created_at,
  createdBy: row.created_by,
  voidReason: row.void_reason,
});

const DUPLICATE_MESSAGES = {
  patients_national_id_key: "A patient with this ID number is already registered.",
  catalogue_name_key: "An item with this name already exists in that department.",
  bills_mpesa_reference_key: "This M-Pesa code has already been used on another bill.",
  staff_email_key: "A staff member with this email already exists.",
};

// Turns a database error into something a member of staff can act on.
export function friendlyMessage(error) {
  if (error.code === "23505") {
    const match = Object.keys(DUPLICATE_MESSAGES).find((name) => error.message?.includes(name));
    return match ? DUPLICATE_MESSAGES[match] : "That record already exists.";
  }
  if (error.code === "42501") return "You do not have permission to do that.";
  if (error.code === "PGRST116") return "Record not found, or you do not have permission to change it.";
  if (error.code === "P0001") return error.message;
  if (error.code === "23502") return "An item on this bill has no selling price yet. Set one under Services & drugs first.";
  if (error.code === "23514") return "Some of the details entered are not valid. Check the form and try again.";
  // The app expects a table or column the database doesn't have: a script in docs/migrations hasn't been run.
  if (["PGRST200", "PGRST204", "PGRST205", "42703", "42P01"].includes(error.code)) {
    console.error("Database is missing part of the schema", error);
    return "The database needs an update before this can work. Contact your system provider.";
  }
  console.error("Database request failed", error);
  return "Something went wrong with the database. Check your connection and try again.";
}
