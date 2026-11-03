"use client";
import { useState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Card, Empty, ErrorNote, inputClass, LinkButton, Loading, PageHeader, Table } from "@/components/ui";
import { ageFrom, matches, patientName } from "@/lib/format";
import { listPatients } from "@/lib/store";
import { useLoad } from "@/lib/useLoad";

export default function PatientsPage() {
  const { data: patients, loading, error } = useLoad(listPatients);
  const [query, setQuery] = useState("");

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  const visible = patients.filter((p) => matches(query, patientName(p), p.id, p.phone, p.nationalId));

  return (
    <>
      <PageHeader title="Patients" subtitle={`${patients.length} registered`}>
        <LinkButton href="/patients/new"><UserPlus size={16} aria-hidden /> Register patient</LinkButton>
      </PageHeader>
      <Card>
        <div className="p-4">
          <input
            aria-label="Search patients"
            placeholder="Search by name, number, phone or ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} sm:max-w-sm`}
          />
        </div>
        {visible.length === 0 ? (
          <Empty>No patients match your search.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Patient</th>
                <th className="hidden sm:table-cell">Age / gender</th>
                <th>Phone</th>
                <th className="hidden md:table-cell">Insurance</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td>
                    <Link href={`/patients/${p.id}`} className="font-medium text-brand-700 hover:underline">
                      {patientName(p)}
                    </Link>
                    <p className="text-xs text-slate-500">{p.id}</p>
                  </td>
                  <td className="hidden text-slate-600 sm:table-cell">
                    {ageFrom(p.dob) ?? "-"} / {p.gender}
                  </td>
                  <td className="whitespace-nowrap text-slate-600">{p.phone || "-"}</td>
                  <td className="hidden text-slate-600 md:table-cell">{p.insurer || "Self-pay"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
