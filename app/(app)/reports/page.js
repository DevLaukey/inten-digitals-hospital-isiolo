"use client";
import { useState } from "react";
import { Card, Empty, ErrorNote, Field, inputClass, Loading, MeterList, PageHeader } from "@/components/ui";
import { collectedBills, outstandingBills, sumTotals } from "@/lib/billing";
import { DEPARTMENTS, PAYMENT_METHODS } from "@/lib/constants";
import { dateKey, daysAgo, formatMoney } from "@/lib/format";
import { listBills } from "@/lib/store";
import { useLoad } from "@/lib/useLoad";

export default function ReportsPage() {
  const { data: bills, loading, error } = useLoad(listBills);
  const [from, setFrom] = useState(() => dateKey(daysAgo(29)));
  const [to, setTo] = useState(() => dateKey());

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  const collected = collectedBills(bills, from, to);
  const net = sumTotals(collected);
  const waivers = collected.reduce((sum, bill) => sum + bill.waiver, 0);
  const allLines = collected.flatMap((bill) => bill.lines);

  const byDepartment = DEPARTMENTS.map((department) => ({
    label: department,
    value: allLines
      .filter((line) => line.department === department)
      .reduce((sum, line) => sum + line.amount, 0),
  })).sort((a, b) => b.value - a.value);

  const byMethod = Object.entries(PAYMENT_METHODS)
    .map(([method, label]) => ({
      label,
      value: sumTotals(collected.filter((bill) => bill.payment.method === method)),
    }))
    .sort((a, b) => b.value - a.value);

  const outstanding = outstandingBills(bills);
  const gross = byDepartment.reduce((sum, row) => sum + row.value, 0);

  return (
    <>
      <PageHeader title="Reports" subtitle="Money collected in the selected period, by date of payment." />

      <Card className="mb-4 grid grid-cols-2 gap-3 p-4 sm:max-w-md">
        <Field label="From">
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className={inputClass} />
        </Field>
        <Field label="To">
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className={inputClass} />
        </Field>
      </Card>

      {collected.length === 0 ? (
        <Card><Empty>No payments collected in this period.</Empty></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <h2 className="mb-4 font-semibold">By department</h2>
            <MeterList rows={byDepartment} format={formatMoney} />
            <dl className="mt-4 space-y-1.5 border-t border-slate-200 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-600">Total billed</dt>
                <dd className="tabular-nums">{formatMoney(gross)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-600">Less waivers</dt>
                <dd className="tabular-nums">-{formatMoney(waivers)}</dd>
              </div>
              <div className="flex justify-between font-bold">
                <dt>Net collected</dt>
                <dd className="tabular-nums">{formatMoney(net)}</dd>
              </div>
            </dl>
          </Card>
          <div className="space-y-4">
            <Card className="p-4">
              <h2 className="mb-4 font-semibold">By payment method</h2>
              <MeterList rows={byMethod} format={formatMoney} />
            </Card>
            <Card className="p-4">
              <p className="text-sm text-slate-600">Outstanding now (all dates)</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{formatMoney(sumTotals(outstanding))}</p>
              <p className="mt-1 text-xs text-slate-500">
                Unpaid: {outstanding.filter((b) => b.status === "unpaid").length} · Pending insurance
                claims: {outstanding.filter((b) => b.status === "claim").length}
              </p>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
