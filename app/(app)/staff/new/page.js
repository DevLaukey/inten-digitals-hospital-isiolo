"use client";
import StaffForm from "@/components/StaffForm";
import { PageHeader } from "@/components/ui";

export default function NewStaffPage() {
  return (
    <>
      <PageHeader title="Add staff member" />
      <StaffForm />
    </>
  );
}
