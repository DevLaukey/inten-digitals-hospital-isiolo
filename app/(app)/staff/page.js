"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useSession } from "@/components/AppShell";
import { Card, ErrorNote, LinkButton, Loading, PageHeader, Table } from "@/components/ui";
import { ROLES } from "@/lib/constants";
import { listStaff, setStaffActive } from "@/lib/store";
import { useLoad } from "@/lib/useLoad";

export default function StaffPage() {
  const session = useSession();
  const { data: staff, loading, error, reload } = useLoad(listStaff);
  const [actionError, setActionError] = useState("");

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  const toggle = async (member) => {
    setActionError("");
    try {
      await setStaffActive(member.id, !member.active, session);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Staff" subtitle={`${staff.filter((m) => m.active).length} active accounts`}>
        <LinkButton href="/staff/new"><Plus size={16} aria-hidden /> Add staff</LinkButton>
      </PageHeader>
      <div className="mb-4 empty:hidden"><ErrorNote>{actionError}</ErrorNote></div>
      <Card>
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="hover:bg-slate-50">
                <td>
                  <p className="font-medium">{member.firstName} {member.lastName}</p>
                  <p className="text-xs text-slate-500">{member.email}</p>
                </td>
                <td className="whitespace-nowrap text-slate-600">{ROLES[member.role]}</td>
                <td className="text-slate-600">{member.active ? "Active" : "Deactivated"}</td>
                <td className="whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/staff/${member.id}/edit`} className="text-brand-700 hover:underline">Edit</Link>
                  {member.id !== session.id && (
                    <button
                      type="button"
                      onClick={() => toggle(member)}
                      className={`ml-3 hover:underline ${member.active ? "text-red-700" : "text-brand-700"}`}
                    >
                      {member.active ? "Deactivate" : "Reactivate"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}
