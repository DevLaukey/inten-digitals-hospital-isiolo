"use client";
import Link from "next/link";
import CollectedChart from "@/components/CollectedChart";
import { Card, Empty, ErrorNote, Loading, MeterList, PageHeader, StatusBadge, Table } from "@/components/ui";
import { collectedBills, isLowStock, outstandingBills, sumTotals } from "@/lib/billing";
import { PAYMENT_METHODS } from "@/lib/constants";
import { dateKey, daysAgo, formatDateTime, formatMoney } from "@/lib/format";
import { listBills, listCatalogue } from "@/lib/store";
import { useLoad } from "@/lib/useLoad";

const plural = (count, noun) => `${count} ${noun}${count === 1 ? "" : "s"}`;

function Stat({ label, value, note, href }) {
  const body = (
    <Card className="h-full p-4 transition-colors hover:border-brand-600">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </Card>
  );
  return <Link href={href}>{body}</Link>;
}

export default function DashboardPage() {
  const { data, loading, error } = useLoad(async () => ({
    bills: await listBills(),
    catalogue: await listCatalogue(),
  }));

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  const { bills, catalogue } = data;
  const today = dateKey();
  const weekStart = dateKey(daysAgo(6));
  const collectedToday = collectedBills(bills, today, today);
  const collectedWeek = collectedBills(bills, weekStart, today);
  const billedToday = bills.filter((b) => b.status !== "void" && dateKey(b.createdAt) === today);
  const patientsToday = new Set(billedToday.map((b) => b.patientId)).size;
  const outstanding = outstandingBills(bills);
  const lowStock = catalogue.filter(isLowStock);

  const perDay = Array.from({ length: 7 }, (_, i) => {
    const day = daysAgo(6 - i);
    const key = dateKey(day);
    return {
      label: day.toLocaleDateString("en-KE", { weekday: "short", day: "numeric" }),
      value: sumTotals(collectedBills(bills, key, key)),
    };
  });

  const perMethod = Object.entries(PAYMENT_METHODS)
    .map(([method, label]) => ({
      label,
      value: sumTotals(collectedWeek.filter((b) => b.payment.method === method)),
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Today at a glance" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Collected today"
          value={formatMoney(sumTotals(collectedToday))}
          note={plural(collectedToday.length, "paid bill")}
          href="/bills"
        />
        <Stat
          label="Patients billed today"
          value={patientsToday}
          note={`${plural(billedToday.length, "bill")} issued`}
          href="/patients"
        />
        <Stat
          label="Outstanding"
          value={formatMoney(sumTotals(outstanding))}
          note={`${plural(outstanding.length, "bill")} unpaid or awaiting insurer`}
          href="/bills"
        />
        <Stat
          label="Low stock items"
          value={lowStock.length}
          note={lowStock.length ? lowStock[0].name : "All stock above reorder level"}
          href="/catalogue"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Collected, last 7 days</h2>
          <CollectedChart rows={perDay} />
        </Card>
        <Card className="p-4">
          <h2 className="mb-4 font-semibold">By payment method, last 7 days</h2>
          <MeterList rows={perMethod} format={formatMoney} />
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="p-4 font-semibold">Latest bills</h2>
        {bills.length === 0 ? (
          <Empty>No bills yet.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Bill</th>
                <th>Patient</th>
                <th className="hidden md:table-cell">Issued</th>
                <th className="text-right">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bills.slice(0, 6).map((bill) => (
                <tr key={bill.id}>
                  <td>
                    <Link href={`/bills/${bill.id}`} className="font-medium text-brand-700 hover:underline">
                      {bill.id}
                    </Link>
                  </td>
                  <td>{bill.patientName}</td>
                  <td className="hidden text-slate-600 md:table-cell">{formatDateTime(bill.createdAt)}</td>
                  <td className="text-right font-medium tabular-nums">{formatMoney(bill.total)}</td>
                  <td><StatusBadge status={bill.status} /></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
