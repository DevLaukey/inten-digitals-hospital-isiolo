"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";
import { useSession } from "@/components/AppShell";
import { Button, Card, ErrorNote, Field, inputClass, Loading, PageHeader, StatusBadge } from "@/components/ui";
import { HOSPITAL } from "@/config/hospital";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatDateTime, formatMoney } from "@/lib/format";
import { getBill, recordPayment, voidBill } from "@/lib/store";
import { useLoad } from "@/lib/useLoad";

function PaymentForm({ bill, actor, onDone }) {
  const isClaim = bill.status === "claim";
  const [method, setMethod] = useState(isClaim ? "insurance" : "cash");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  const options = Object.entries(PAYMENT_METHODS).filter(
    ([value]) => value !== "insurance" || bill.insurer
  );

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await recordPayment(bill.id, { method, reference }, actor);
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };

  const submitLabel = isClaim
    ? "Mark as paid"
    : method === "insurance"
      ? "Submit insurance claim"
      : "Record payment";

  return (
    <Card className="p-4 print:hidden">
      <h2 className="mb-3 font-semibold">
        {isClaim ? `Settle claim with ${bill.insurer}` : "Record payment"}
      </h2>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Method">
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={inputClass}>
            {options.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        {method !== "cash" && !(method === "insurance" && !isClaim) && (
          <Field label="Reference" required={method === "mpesa"}>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={`${inputClass} uppercase`}
            />
          </Field>
        )}
        <ErrorNote>{error}</ErrorNote>
        <Button type="submit" className="w-full">{submitLabel} · {formatMoney(bill.total)}</Button>
      </form>
    </Card>
  );
}

function VoidForm({ bill, actor, onDone }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await voidBill(bill.id, reason, actor);
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card className="p-4 print:hidden">
      <h2 className="font-semibold">Void this bill</h2>
      <p className="mb-3 mt-1 text-sm text-slate-600">
        Removes it from revenue and returns medication to stock. This cannot be undone.
      </p>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Reason" required>
          <input value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} />
        </Field>
        <ErrorNote>{error}</ErrorNote>
        <Button type="submit" variant="danger" className="w-full">Void bill</Button>
      </form>
    </Card>
  );
}

export default function BillDetailPage() {
  const { id } = useParams();
  const session = useSession();
  const { data: bill, loading, error, reload } = useLoad(() => getBill(id), [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  const canSettle = bill.status === "unpaid" || bill.status === "claim";

  return (
    <>
      <PageHeader title={bill.id} subtitle={`Issued ${formatDateTime(bill.createdAt)}`}>
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={16} aria-hidden /> Print
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start print:block">
        <Card className="p-5 sm:p-8 lg:col-span-2 print:border-0 print:p-0">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="text-lg font-bold">{HOSPITAL.name}</p>
              <p className="text-sm text-slate-600">{HOSPITAL.address}</p>
              <p className="text-sm text-slate-600">{HOSPITAL.phone} · {HOSPITAL.email}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-semibold">{bill.status === "paid" ? "Receipt" : "Invoice"} {bill.id}</p>
              <p className="mb-1 text-sm text-slate-600">{formatDateTime(bill.createdAt)}</p>
              <StatusBadge status={bill.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 border-b border-slate-200 py-5 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
              <Link href={`/patients/${bill.patientId}`} className="font-semibold hover:underline print:no-underline">
                {bill.patientName}
              </Link>
              <p className="text-slate-600">{bill.patientId}</p>
            </div>
            {bill.insurer && (
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Insurance</p>
                <p className="font-semibold">{bill.insurer}</p>
                <p className="text-slate-600">{bill.memberNo}</p>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-3 pr-3 font-semibold">Item</th>
                  <th className="px-3 py-3 text-right font-semibold">Qty</th>
                  <th className="whitespace-nowrap px-3 py-3 text-right font-semibold">Unit price</th>
                  <th className="py-3 pl-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.lines.map((line) => (
                  <tr key={line.itemId} className="border-t border-slate-100">
                    <td className="py-3 pr-3">
                      <p className="font-medium">{line.name}</p>
                      <p className="text-xs text-slate-500">{line.department}</p>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{line.qty}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right tabular-nums">{formatMoney(line.unitPrice)}</td>
                    <td className="whitespace-nowrap py-3 pl-3 text-right tabular-nums">{formatMoney(line.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="ml-auto mt-4 max-w-xs space-y-1.5 border-t border-slate-200 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(bill.subtotal)}</dd>
            </div>
            {bill.waiver > 0 && (
              <div className="flex justify-between">
                <dt className="text-slate-600">Waiver</dt>
                <dd className="tabular-nums">-{formatMoney(bill.waiver)}</dd>
              </div>
            )}
            <div className="flex justify-between text-base font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(bill.total)}</dd>
            </div>
          </dl>

          <div className="mt-6 space-y-1 text-sm text-slate-600">
            {bill.payment && (
              <p>
                {bill.status === "claim" ? "Claim submitted" : "Paid by"}{" "}
                {PAYMENT_METHODS[bill.payment.method]}
                {bill.payment.reference && ` (${bill.payment.reference})`}
                {bill.payment.paidAt && ` on ${formatDateTime(bill.payment.paidAt)}`}
                {` · ${bill.payment.receivedBy}`}
              </p>
            )}
            <p>Issued by {bill.createdBy}</p>
            {bill.status === "void" && <p className="font-medium text-slate-800">Voided: {bill.voidReason}</p>}
          </div>
        </Card>

        <div className="space-y-4">
          {canSettle && <PaymentForm bill={bill} actor={session} onDone={reload} />}
          {session.role === "admin" && bill.status !== "void" && (
            <VoidForm bill={bill} actor={session} onDone={reload} />
          )}
        </div>
      </div>
    </>
  );
}
