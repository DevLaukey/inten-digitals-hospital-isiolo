"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useSession } from "@/components/AppShell";
import { TempPassword } from "@/components/StaffForm";
import { Button, Card, ErrorNote, LinkButton, Loading, PageHeader, Table } from "@/components/ui";
import { ROLES } from "@/lib/constants";
import { listStaff, resetStaffPassword, setStaffActive } from "@/lib/store";
import { useLoad } from "@/lib/useLoad";

export default function StaffPage() {
  const session = useSession();
  const { data: staff, loading, error, reload } = useLoad(listStaff);
  const [actionError, setActionError] = useState("");
  const [confirmingReset, setConfirmingReset] = useState(null);
  const [issued, setIssued] = useState(null);

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  const toggle = async (member) => {
    setActionError("");
    try {
      await setStaffActive(member.id, !member.active);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const reset = async (member) => {
    setActionError("");
    setConfirmingReset(null);
    try {
      const { tempPassword } = await resetStaffPassword(member.id);
      setIssued({ email: member.email, password: tempPassword });
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
      {issued && (
        <div className="mb-4">
          <TempPassword email={issued.email} password={issued.password}>
            <Button variant="secondary" onClick={() => setIssued(null)}>Done</Button>
          </TempPassword>
        </div>
      )}
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
                    <>
                      <button
                        type="button"
                        onClick={() => (confirmingReset === member.id ? reset(member) : setConfirmingReset(member.id))}
                        className="ml-3 text-brand-700 hover:underline"
                      >
                        {confirmingReset === member.id ? "Confirm reset" : "Reset password"}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggle(member)}
                        className={`ml-3 hover:underline ${member.active ? "text-red-700" : "text-brand-700"}`}
                      >
                        {member.active ? "Deactivate" : "Reactivate"}
                      </button>
                    </>
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
