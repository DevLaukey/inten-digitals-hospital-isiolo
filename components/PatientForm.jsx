"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorNote, Field, inputClass } from "@/components/ui";
import { GENDERS, INSURERS } from "@/lib/constants";
import { createPatient, updatePatient } from "@/lib/store";

const EMPTY = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  phone: "",
  nationalId: "",
  town: "",
  insurer: "",
  memberNo: "",
  nextOfKinName: "",
  nextOfKinPhone: "",
};

export default function PatientForm({ patient }) {
  const router = useRouter();
  const [form, setForm] = useState(() => ({ ...EMPTY, ...patient }));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const bind = (name) => ({
    value: form[name],
    onChange: (e) => setForm((current) => ({ ...current, [name]: e.target.value })),
    className: inputClass,
  });

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const saved = patient ? await updatePatient(patient.id, form) : await createPatient(form);
      router.push(`/patients/${saved.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-4">
      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 font-semibold">Personal details</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First name" required><input required {...bind("firstName")} /></Field>
          <Field label="Last name" required><input required {...bind("lastName")} /></Field>
          <Field label="Date of birth"><input type="date" {...bind("dob")} /></Field>
          <Field label="Gender" required>
            <select required {...bind("gender")}>
              <option value="">Select</option>
              {GENDERS.map((gender) => <option key={gender}>{gender}</option>)}
            </select>
          </Field>
          <Field label="Phone"><input type="tel" {...bind("phone")} /></Field>
          <Field label="National ID / Passport"><input {...bind("nationalId")} /></Field>
          <Field label="Town"><input {...bind("town")} /></Field>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 font-semibold">Insurance</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Insurer" hint="Leave blank for self-paying patients.">
            <input list="insurers" {...bind("insurer")} />
            <datalist id="insurers">
              {INSURERS.map((insurer) => <option key={insurer} value={insurer} />)}
            </datalist>
          </Field>
          <Field label="Member number" required={Boolean(form.insurer.trim())}>
            <input {...bind("memberNo")} />
          </Field>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <h2 className="mb-4 font-semibold">Next of kin</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Name"><input {...bind("nextOfKinName")} /></Field>
          <Field label="Phone"><input type="tel" {...bind("nextOfKinPhone")} /></Field>
        </div>
      </Card>

      <ErrorNote>{error}</ErrorNote>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>{patient ? "Save changes" : "Register patient"}</Button>
        <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
