"use client";
import { Card, Empty, ErrorNote, Loading, PageHeader, Table } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { listAuditLog } from "@/lib/store";
import { useLoad } from "@/lib/useLoad";

const ACTIONS = { INSERT: "Created", UPDATE: "Changed", DELETE: "Deleted" };
const TABLES = { bills: "bill", patients: "patient", catalogue: "catalogue item", item_costs: "buying price of", staff: "staff account" };

export default function AuditPage() {
  const { data: entries, loading, error } = useLoad(() => listAuditLog());

  if (loading) return <Loading />;
  if (error) return <ErrorNote>{error}</ErrorNote>;

  return (
    <>
      <PageHeader title="Audit log" subtitle="The latest 200 changes. These records can't be edited or deleted from the app." />
      <Card>
        {entries.length === 0 ? (
          <Empty>No changes recorded yet.</Empty>
        ) : (
          <Table>
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>What</th>
                <th>Record</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap text-slate-600">{formatDateTime(entry.at)}</td>
                  <td>{entry.actor_name || "System"}</td>
                  <td>{ACTIONS[entry.action]} {TABLES[entry.table_name]}</td>
                  <td className="whitespace-nowrap font-medium">{entry.row_id}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
