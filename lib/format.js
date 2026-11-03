const money = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

export const formatMoney = (amount) => money.format(amount || 0);

export const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
    : "-";

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-KE", { dateStyle: "medium" }) : "-";

// Local calendar day as YYYY-MM-DD, so "today" follows the hospital's clock, not UTC.
export function dateKey(value = new Date()) {
  const d = new Date(value);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export function daysAgo(count) {
  const d = new Date();
  d.setDate(d.getDate() - count);
  return d;
}

export function ageFrom(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export const patientName = (p) => `${p.firstName} ${p.lastName}`;

export const matches = (query, ...fields) => {
  const q = query.trim().toLowerCase();
  return !q || fields.some((field) => (field || "").toLowerCase().includes(q));
};
