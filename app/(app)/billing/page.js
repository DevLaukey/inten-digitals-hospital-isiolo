"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Minus, Plus, Search, Trash2, UserPlus, X } from "lucide-react";
import { useSession } from "@/components/AppShell";
import { Button, Card, Empty, ErrorNote, Field, inputClass, Loading, PageHeader } from "@/components/ui";
import { canWaive, DEPARTMENTS, PAYMENT_METHODS } from "@/lib/constants";
import { formatMoney, matches, patientName } from "@/lib/format";
import { createBill, listCatalogue, listPatients } from "@/lib/store";
import { useLoad } from "@/lib/useLoad";

function PatientPicker({ patients, selected, onSelect }) {
  const [query, setQuery] = useState("");

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-600 bg-brand-50 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{patientName(selected)}</p>
          <p className="truncate text-xs text-slate-600">
            {selected.id} · {selected.insurer ? `${selected.insurer} (${selected.memberNo})` : "No insurance"}
          </p>
        </div>
        <button
          type="button"
          aria-label="Change patient"
          onClick={() => onSelect(null)}
          className="rounded p-1 text-slate-600 hover:bg-brand-100"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
    );
  }

  const results = query.trim()
    ? patients
        .filter((p) => matches(query, patientName(p), p.id, p.phone, p.nationalId))
        .slice(0, 6)
    : [];

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            aria-label="Find patient"
            placeholder="Find patient by name, number or phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
        <Link
          href="/patients/new"
          aria-label="Register new patient"
          title="Register new patient"
          className="flex items-center rounded-lg border border-slate-300 bg-white px-3 text-slate-700 hover:bg-slate-100"
        >
          <UserPlus size={18} aria-hidden />
        </Link>
      </div>
      {query.trim() && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(p);
                  setQuery("");
                }}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
              >
                <span className="font-medium">{patientName(p)}</span>
                <span className="ml-2 text-xs text-slate-500">{p.id} · {p.phone || "no phone"}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-2 text-sm text-slate-500">No patient found.</li>}
        </ul>
      )}
    </div>
  );
}

function BillingScreen() {
  const router = useRouter();
  const session = useSession();
  const preselectedId = useSearchParams().get("patient");
  const { data, loading, error: loadError } = useLoad(async () => ({
    items: await listCatalogue(),
    patients: await listPatients(),
  }));

  const [pickedPatient, setPatient] = useState(undefined); // undefined until someone chooses
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");
  const [cart, setCart] = useState({}); // itemId -> qty
  const [waiver, setWaiver] = useState("");
  const [chosenMethod, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const patient =
    pickedPatient !== undefined
      ? pickedPatient
      : data?.patients.find((p) => p.id === preselectedId) || null;
  const hasInsurance = Boolean(patient?.insurer);
  const method = chosenMethod === "insurance" && !hasInsurance ? "cash" : chosenMethod;

  const lines = useMemo(() => {
    if (!data) return [];
    return Object.entries(cart).map(([itemId, qty]) => ({
      item: data.items.find((item) => item.id === itemId),
      qty,
    }));
  }, [cart, data]);

  if (loading) return <Loading />;
  if (loadError) return <ErrorNote>{loadError}</ErrorNote>;

  const setQty = (item, qty) => {
    setCart((current) => {
      const next = { ...current };
      const capped = item.tracksStock ? Math.min(qty, item.stock) : qty;
      if (capped <= 0) delete next[item.id];
      else next[item.id] = capped;
      return next;
    });
  };

  const visibleItems = data.items.filter(
    (item) => (department === "All" || item.department === department) && matches(query, item.name)
  );
  const subtotal = lines.reduce((sum, { item, qty }) => sum + item.price * qty, 0);
  const waiverAmount = Number(waiver) || 0;
  const total = Math.max(subtotal - waiverAmount, 0);
  const itemCount = lines.reduce((sum, { qty }) => sum + qty, 0);

  const submit = async (payment) => {
    setError("");
    if (!patient) {
      setError("Choose a patient first.");
      return;
    }
    setBusy(true);
    try {
      const bill = await createBill({
        patientId: patient.id,
        lines: lines.map(({ item, qty }) => ({ itemId: item.id, qty })),
        waiver: waiverAmount,
        payment,
      });
      router.push(`/bills/${bill.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="New bill" subtitle="Choose a patient, add services and medication, then take payment." />

      <div className="grid grid-cols-1 gap-4 pb-20 lg:grid-cols-3 lg:items-start lg:pb-0">
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-4">
            <h2 className="mb-2 text-sm font-semibold">Patient</h2>
            <PatientPicker patients={data.patients} selected={patient} onSelect={setPatient} />
          </Card>

          <Card className="p-4">
            <div className="relative mb-3">
              <Search size={16} aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                aria-label="Search services and medication"
                placeholder="Search services and medication"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`${inputClass} pl-9`}
              />
            </div>
            <div className="-mx-1 mb-4 flex flex-wrap gap-1.5">
              {["All", ...DEPARTMENTS].map((name) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={department === name}
                  onClick={() => setDepartment(name)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    department === name
                      ? "bg-brand-700 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {visibleItems.length === 0 ? (
              <Empty>Nothing matches your search.</Empty>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {visibleItems.map((item) => {
                  const noPrice = item.price === null;
                  const out = noPrice || (item.tracksStock && item.stock - (cart[item.id] || 0) <= 0);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      disabled={out}
                      onClick={() => setQty(item, (cart[item.id] || 0) + 1)}
                      className="rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-brand-600 hover:bg-brand-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60 disabled:hover:border-slate-200"
                    >
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.department}
                        {item.tracksStock && ` · ${item.stock} in stock`}
                      </p>
                      <p className="mt-1 text-sm font-semibold tabular-nums">
                        {noPrice ? "No selling price set" : formatMoney(item.price)}
                        {!noPrice && item.unit && <span className="font-normal text-slate-500"> / {item.unit}</span>}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <Card id="bill-summary" className="scroll-mt-16 p-4 lg:sticky lg:top-4">
          <h2 className="mb-3 font-semibold">Bill summary</h2>
          {lines.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No items added yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {lines.map(({ item, qty }) => (
                <li key={item.id} className="py-2.5">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium">{item.name}</span>
                    <span className="font-semibold tabular-nums">{formatMoney(item.price * qty)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Reduce ${item.name}`}
                      onClick={() => setQty(item, qty - 1)}
                      className="rounded border border-slate-300 p-1 hover:bg-slate-100"
                    >
                      <Minus size={14} aria-hidden />
                    </button>
                    <span className="w-8 text-center text-sm tabular-nums">{qty}</span>
                    <button
                      type="button"
                      aria-label={`Increase ${item.name}`}
                      disabled={item.tracksStock && qty >= item.stock}
                      onClick={() => setQty(item, qty + 1)}
                      className="rounded border border-slate-300 p-1 hover:bg-slate-100 disabled:opacity-40"
                    >
                      <Plus size={14} aria-hidden />
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => setQty(item, 0)}
                      className="ml-auto rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 size={16} aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 space-y-3 border-t border-slate-200 pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Subtotal</span>
              <span className="tabular-nums">{formatMoney(subtotal)}</span>
            </div>
            {canWaive(session.role) && (
              <Field label="Waiver (KSh)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  value={waiver}
                  onChange={(e) => setWaiver(e.target.value)}
                  className={inputClass}
                />
              </Field>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(total)}</span>
            </div>

            <fieldset>
              <legend className="mb-1 text-sm font-medium text-slate-700">Payment method</legend>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(PAYMENT_METHODS).map(([value, label]) => {
                  const disabled = value === "insurance" && !hasInsurance;
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={disabled}
                      aria-pressed={method === value}
                      title={disabled ? "This patient has no insurance on file" : undefined}
                      onClick={() => setMethod(value)}
                      className={`rounded-lg border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                        method === value
                          ? "border-brand-700 bg-brand-700 text-white"
                          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {(method === "mpesa" || method === "card") && (
              <Field label={method === "mpesa" ? "M-Pesa transaction code" : "Card reference"} required={method === "mpesa"}>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className={`${inputClass} uppercase`}
                />
              </Field>
            )}

            <ErrorNote>{error}</ErrorNote>

            <Button
              className="w-full"
              disabled={busy || lines.length === 0}
              onClick={() => submit({ method, reference: method === "cash" ? "" : reference })}
            >
              {method === "insurance" ? "Submit insurance claim" : `Take payment · ${formatMoney(total)}`}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              disabled={busy || lines.length === 0}
              onClick={() => submit(null)}
            >
              Save as unpaid
            </Button>
          </div>
        </Card>
      </div>

      {/* Keeps the running total in reach while scrolling the item list on a phone. */}
      {lines.length > 0 && (
        <a
          href="#bill-summary"
          className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between bg-brand-700 px-4 py-3 text-sm font-semibold text-white lg:hidden"
        >
          <span>{itemCount} {itemCount === 1 ? "item" : "items"} · {formatMoney(total)}</span>
          <span>Review bill</span>
        </a>
      )}
    </>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <BillingScreen />
    </Suspense>
  );
}
