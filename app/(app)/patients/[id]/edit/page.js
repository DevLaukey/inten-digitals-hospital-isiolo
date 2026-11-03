"use client";
import { useParams } from "next/navigation";
import PatientForm from "@/components/PatientForm";
import { ErrorNote, Loading, PageHeader } from "@/components/ui";
import { getPatient } from "@/lib/store";
import { useLoad } from "@/lib/useLoad";

export default function EditPatientPage() {
  const { id } = useParams();
  const { data: patient, loading, error } = useLoad(() => getPatient(id), [id]);

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  return (
    <>
      <PageHeader title="Edit patient" subtitle={patient.id} />
      <PatientForm patient={patient} />
    </>
  );
}
