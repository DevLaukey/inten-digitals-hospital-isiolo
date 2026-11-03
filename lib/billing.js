import { dateKey } from "./format";

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
