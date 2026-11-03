"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Card, Empty, ErrorNote, inputClass, LinkButton, Loading, PageHeader, StatusBadge, Table } from "@/components/ui";
import { BILL_STATUS, PAYMENT_METHODS } from "@/lib/constants";
import { formatDateTime, formatMoney, matches } from "@/lib/format";
import { listBills } from "@/lib/store";
import { useLoad } from "@/lib/useLoad";

export default function BillsPage() {
  const { data: bills, loading, error } = useLoad(listBills);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  const visible = bills.filter(
    (bill) =>
      (status === "all" || bill.status === status) &&
      matches(query, bill.id, bill.patientName, bill.patientId)
  );

  return (
    <>
      <PageHeader title="Bills" subtitle={`${bills.length} bills in total`}>
        <LinkButton href="/billing"><Plus size={16} aria-hidden /> New bill</LinkButton>
      </PageHeader>

      <Card>
        <div className="flex flex-col gap-2 p-4 sm:flex-row">
          <input
            aria-label="Search bills"
            placeholder="Search by bill number or patient"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} sm:max-w-sm`}
          />
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`${inputClass} sm:w-48`}
          >
            <option value="all">All statuses</option>
            {Object.entries(BILL_STATUS).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {visible.length === 0 ? (
          <Empty>No bills match your search.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Bill</th>
                <th>Patient</th>
                <th className="hidden lg:table-cell">Issued</th>
                <th className="hidden md:table-cell">Method</th>
                <th className="text-right">Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((bill) => (
                <tr key={bill.id} className="hover:bg-slate-50">
                  <td>
                    <Link href={`/bills/${bill.id}`} className="font-medium text-brand-700 hover:underline">
                      {bill.id}
                    </Link>
                  </td>
                  <td>
                    <p>{bill.patientName}</p>
                    <p className="text-xs text-slate-500">{bill.patientId}</p>
                  </td>
                  <td className="hidden text-slate-600 lg:table-cell">{formatDateTime(bill.createdAt)}</td>
                  <td className="hidden text-slate-600 md:table-cell">
                    {bill.payment ? PAYMENT_METHODS[bill.payment.method] : "-"}
                  </td>
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
