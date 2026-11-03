"use client";
import { useParams } from "next/navigation";
import StaffForm from "@/components/StaffForm";
import { ErrorNote, Loading, PageHeader } from "@/components/ui";
import { getStaff } from "@/lib/store";
import { useLoad } from "@/lib/useLoad";

export default function EditStaffPage() {
  const { id } = useParams();
  const { data: member, loading, error } = useLoad(() => getStaff(id), [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  return (
    <>
      <PageHeader title="Edit staff member" subtitle={member.id} />
      <StaffForm member={member} />
    </>
  );
}
