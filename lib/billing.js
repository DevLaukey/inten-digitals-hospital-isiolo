import { dateKey } from "./format";

// Item names and prices are copied onto the bill, so later catalogue edits
// or deletions never change a bill that has already been issued.
export function buildBill({ id, patient, items, lines, waiver = 0, payment, actorName, at }) {
  const billLines = lines.map(({ itemId, qty }) => {
    const item = items.find((candidate) => candidate.id === itemId);
    return {
      itemId,
      name: item.name,
      department: item.department,
      unitPrice: item.price,
      qty,
      amount: item.price * qty,
    };
  });
  const subtotal = billLines.reduce((sum, line) => sum + line.amount, 0);
  const method = payment?.method || null;
  const status = !method ? "unpaid" : method === "insurance" ? "claim" : "paid";

  return {
    id,
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    insurer: patient.insurer || "",
    memberNo: patient.memberNo || "",
    lines: billLines,
    subtotal,
    waiver,
    total: subtotal - waiver,
    status,
    payment: method
      ? {
          method,
          reference: payment.reference || "",
          paidAt: status === "paid" ? at : null,
          receivedBy: actorName,
        }
      : null,
    createdAt: at,
    createdBy: actorName,
    voidReason: null,
  };
}

// Collected money: paid bills only, dated by when the money came in.
// from/to are inclusive YYYY-MM-DD keys.
export function collectedBills(bills, from, to) {
  return bills.filter((bill) => {
    if (bill.status !== "paid") return false;
    const day = dateKey(bill.payment.paidAt);
    return day >= from && day <= to;
  });
}

export const sumTotals = (bills) => bills.reduce((sum, bill) => sum + bill.total, 0);

export const outstandingBills = (bills) =>
  bills.filter((bill) => bill.status === "unpaid" || bill.status === "claim");

export const isLowStock = (item) => item.tracksStock && item.stock <= item.reorderLevel;
