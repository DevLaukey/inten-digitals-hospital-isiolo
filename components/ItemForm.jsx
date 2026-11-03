"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, ErrorNote, Field, inputClass } from "@/components/ui";
import { DEPARTMENTS } from "@/lib/constants";
import { saveItem } from "@/lib/store";

export default function ItemForm({ item }) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: item?.name ?? "",
    department: item?.department ?? "",
    price: item?.price ?? "",
    buyingPrice: item?.buyingPrice ?? "",
    tracksStock: item?.tracksStock ?? false,
    stock: item?.stock ?? "",
    reorderLevel: item?.reorderLevel ?? "",
    unit: item?.unit ?? "",
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
      const stock = form.tracksStock ? Number(form.stock) : 0;
      await saveItem(item?.id, {
        ...form,
        price: Number(form.price),
        buyingPrice: form.buyingPrice === "" ? null : Number(form.buyingPrice),
        // Left out when unchanged, so saving a price edit can't undo sales made meanwhile.
        stock: item && stock === item.stock ? undefined : stock,
        reorderLevel: form.tracksStock ? Number(form.reorderLevel) : 0,
        unit: form.tracksStock ? form.unit : "",
      });
      router.push("/catalogue");
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const sellsAtLoss = form.buyingPrice !== "" && form.price !== "" && Number(form.price) < Number(form.buyingPrice);

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-4">
      <Card className="p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Name" required><input required {...bind("name")} /></Field>
          </div>
          <Field label="Department" required>
            <select required {...bind("department")}>
              <option value="">Select</option>
              {DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}
            </select>
          </Field>
          <Field label="Buying price (KSh)" hint="What the hospital pays. Leave blank if there's no purchase cost, as with a consultation.">
            <input type="number" min="0" step="1" {...bind("buyingPrice")} />
          </Field>
          <Field
            label="Selling price (KSh)"
            required
            hint={sellsAtLoss ? "This is below the buying price." : "What the patient is charged."}
          >
            <input type="number" min="0" step="1" required {...bind("price")} />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.tracksStock}
              onChange={(e) => setForm((current) => ({ ...current, tracksStock: e.target.checked }))}
              className="h-4 w-4 accent-brand-700"
            />
            Track stock for this item
          </label>
          {form.tracksStock && (
            <>
              <Field label="Quantity in stock" required>
                <input type="number" min="0" step="1" required {...bind("stock")} />
              </Field>
              <Field label="Reorder level" required hint="Flagged as low stock at or below this number.">
                <input type="number" min="0" step="1" required {...bind("reorderLevel")} />
              </Field>
              <Field label="Unit" hint="For example tablet, vial or pack.">
                <input {...bind("unit")} />
              </Field>
            </>
          )}
        </div>
      </Card>
      <ErrorNote>{error}</ErrorNote>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>{item ? "Save changes" : "Add item"}</Button>
        <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
