"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button, Card, Empty, ErrorNote, inputClass, LinkButton, Loading, PageHeader, Table } from "@/components/ui";
import { isLowStock } from "@/lib/billing";
import { DEPARTMENTS } from "@/lib/constants";
import { formatCost, formatMoney, matches } from "@/lib/format";
import { deleteItem, listCatalogue } from "@/lib/store";
import { useLoad } from "@/lib/useLoad";

export default function CataloguePage() {
  const { data: items, loading, error, reload } = useLoad(listCatalogue);
  const [query, setQuery] = useState("");
  const [department, setDepartment] = useState("All");
  const [lowOnly, setLowOnly] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [actionError, setActionError] = useState("");

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  const visible = items.filter(
    (item) =>
      (department === "All" || item.department === department) &&
      (!lowOnly || isLowStock(item)) &&
      matches(query, item.name)
  );

  const remove = async (id) => {
    setActionError("");
    try {
      await deleteItem(id);
      reload();
    } catch (err) {
      setActionError(err.message);
    }
    setConfirmingId(null);
  };

  return (
    <>
      <PageHeader title="Services & drugs" subtitle="Everything that can be added to a bill">
        <LinkButton href="/catalogue/new"><Plus size={16} aria-hidden /> Add item</LinkButton>
      </PageHeader>
      <div className="mb-4 empty:hidden"><ErrorNote>{actionError}</ErrorNote></div>
      <Card>
        <div className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
          <input
            aria-label="Search catalogue"
            placeholder="Search by name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`${inputClass} sm:max-w-xs`}
          />
          <select
            aria-label="Filter by department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={`${inputClass} sm:w-44`}
          >
            <option value="All">All departments</option>
            {DEPARTMENTS.map((name) => <option key={name}>{name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-700 sm:ml-2">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
              className="h-4 w-4 accent-brand-700"
            />
            Low stock only
          </label>
        </div>
        {visible.length === 0 ? (
          <Empty>Nothing matches your filters.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>Item</th>
                <th className="text-right">Buying price</th>
                <th className="text-right">Selling price</th>
                <th className="text-right">Stock</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.department}</p>
                  </td>
                  <td className="whitespace-nowrap text-right tabular-nums">
                    {item.buyingPrice === null ? <span className="text-slate-400">-</span> : formatCost(item.buyingPrice)}
                  </td>
                  <td className="whitespace-nowrap text-right tabular-nums">
                    {item.price === null ? <span className="font-semibold text-amber-800">Not set</span> : formatMoney(item.price)}
                  </td>
                  <td className="whitespace-nowrap text-right tabular-nums">
                    {item.tracksStock ? (
                      <>
                        {item.stock}
                        {isLowStock(item) && (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            Low
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap text-right">
                    {confirmingId === item.id ? (
                      <span className="inline-flex gap-2">
                        <Button variant="danger" className="!px-2 !py-1" onClick={() => remove(item.id)}>
                          Confirm delete
                        </Button>
                        <Button variant="secondary" className="!px-2 !py-1" onClick={() => setConfirmingId(null)}>
                          Keep
                        </Button>
                      </span>
                    ) : (
                      <span className="inline-flex gap-3 text-sm font-medium">
                        <Link href={`/catalogue/${item.id}/edit`} className="text-brand-700 hover:underline">
                          Edit
                        </Link>
                        <button type="button" onClick={() => setConfirmingId(item.id)} className="text-red-700 hover:underline">
                          Delete
                        </button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
