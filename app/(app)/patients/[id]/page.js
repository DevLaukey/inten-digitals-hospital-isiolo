"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { useSession } from "@/components/AppShell";
import { Card, Empty, ErrorNote, LinkButton, Loading, PageHeader, StatusBadge, Table } from "@/components/ui";
import { outstandingBills, sumTotals } from "@/lib/billing";
import { canAccess } from "@/lib/constants";
import { ageFrom, formatDate, formatDateTime, formatMoney, patientName } from "@/lib/format";
import { getPatient, listBillsForPatient } from "@/lib/store";
import { useLoad } from "@/lib/useLoad";

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm">{children || "-"}</dd>
    </div>
  );
}

export default function PatientDetailPage() {
  const { id } = useParams();
  const session = useSession();
  const { data, loading, error } = useLoad(
    async () => ({ patient: await getPatient(id), bills: await listBillsForPatient(id) }),
    [id]
  );

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  const { patient, bills } = data;
  const age = ageFrom(patient.dob);
  const balance = sumTotals(outstandingBills(bills));
  const canBill = canAccess(session.role, "/billing");
  const canOpenBills = canAccess(session.role, "/bills");

  return (
    <>
      <PageHeader title={patientName(patient)} subtitle={patient.id}>
        <LinkButton variant="secondary" href={`/patients/${patient.id}/edit`}>
          <Pencil size={16} aria-hidden /> Edit
        </LinkButton>
        {canBill && (
          <LinkButton href={`/billing?patient=${patient.id}`}>
            <Plus size={16} aria-hidden /> New bill
          </LinkButton>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
        <Card className="p-4">
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-1">
            <Detail label="Date of birth">
              {patient.dob && `${formatDate(patient.dob)}${age !== null ? ` (${age} yrs)` : ""}`}
            </Detail>
            <Detail label="Gender">{patient.gender}</Detail>
            <Detail label="Phone">{patient.phone}</Detail>
            <Detail label="National ID / Passport">{patient.nationalId}</Detail>
            <Detail label="Town">{patient.town}</Detail>
            <Detail label="Insurance">
              {patient.insurer ? `${patient.insurer} (${patient.memberNo})` : "Self-pay"}
            </Detail>
            <Detail label="Next of kin">
              {[patient.nextOfKinName, patient.nextOfKinPhone].filter(Boolean).join(" · ")}
            </Detail>
            <Detail label="Outstanding balance">
              <span className="font-semibold tabular-nums">{formatMoney(balance)}</span>
            </Detail>
          </dl>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="p-4 font-semibold">Billing history</h2>
          {bills.length === 0 ? (
            <Empty>No bills for this patient yet.</Empty>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Bill</th>
                  <th className="hidden sm:table-cell">Issued</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id}>
                    <td>
                      {canOpenBills ? (
                        <Link href={`/bills/${bill.id}`} className="font-medium text-brand-700 hover:underline">
                          {bill.id}
                        </Link>
                      ) : (
                        bill.id
                      )}
                    </td>
                    <td className="hidden text-slate-600 sm:table-cell">{formatDateTime(bill.createdAt)}</td>
                    <td className="text-right font-medium tabular-nums">{formatMoney(bill.total)}</td>
                    <td><StatusBadge status={bill.status} /></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
