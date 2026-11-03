export const DEPARTMENTS = [
  "Consultation",
  "Laboratory",
  "Imaging",
  "Pharmacy",
  "Procedures",
  "Ward",
];

export const ROLES = {
  admin: "Administrator",
  cashier: "Cashier",
  receptionist: "Receptionist",
  pharmacist: "Pharmacist",
  lab: "Lab Technician",
  nurse: "Nurse",
  doctor: "Doctor",
};

export const PAYMENT_METHODS = {
  cash: "Cash",
  mpesa: "M-Pesa",
  card: "Card",
  insurance: "Insurance",
};

export const BILL_STATUS = {
  paid: { label: "Paid", className: "bg-green-100 text-green-800" },
  unpaid: { label: "Unpaid", className: "bg-amber-100 text-amber-800" },
  claim: { label: "Claim pending", className: "bg-blue-100 text-blue-800" },
  void: { label: "Void", className: "bg-slate-200 text-slate-700" },
};

export const GENDERS = ["Female", "Male", "Other"];

// Suggestions only: the insurer field accepts any value.
export const INSURERS = ["SHA", "AAR", "Britam", "CIC", "Jubilee", "Old Mutual"];

// Top-level route each role may open. The first entry is the role's home page.
// This only shapes the UI. The rules that protect data are in docs/schema.sql.
const ACCESS = {
  admin: ["/dashboard", "/billing", "/bills", "/patients", "/catalogue", "/reports", "/staff", "/audit"],
  cashier: ["/dashboard", "/billing", "/bills", "/patients"],
  receptionist: ["/billing", "/bills", "/patients"],
  pharmacist: ["/billing", "/bills", "/patients", "/catalogue"],
  lab: ["/billing", "/bills", "/patients"],
  nurse: ["/billing", "/patients"],
  doctor: ["/patients"],
};

// Giving a waiver reduces what the hospital collects, so it's limited. Enforced in create_bill too.
export const canWaive = (role) => role === "admin" || role === "cashier";

export function canAccess(role, pathname) {
  if (pathname === "/account" && ACCESS[role]) return true;
  return (ACCESS[role] || []).some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export function homeFor(role) {
  return (ACCESS[role] || ["/login"])[0];
}
