"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorNote, Field, inputClass } from "@/components/ui";
import { ROLES } from "@/lib/constants";
import { saveStaff } from "@/lib/store";

export default function StaffForm({ member }) {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: member?.firstName ?? "",
    lastName: member?.lastName ?? "",
    email: member?.email ?? "",
    phone: member?.phone ?? "",
    role: member?.role ?? "",
  });
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
      await saveStaff(member?.id, form);
      router.push("/staff");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      <Card className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6">
        <Field label="First name" required><input required {...bind("firstName")} /></Field>
        <Field label="Last name" required><input required {...bind("lastName")} /></Field>
        <Field label="Email" required><input type="email" required {...bind("email")} /></Field>
        <Field label="Phone"><input type="tel" {...bind("phone")} /></Field>
        <Field label="Role" required>
          <select required {...bind("role")}>
            <option value="">Select</option>
            {Object.entries(ROLES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
      </Card>
      <ErrorNote>{error}</ErrorNote>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>{member ? "Save changes" : "Add staff member"}</Button>
        <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
