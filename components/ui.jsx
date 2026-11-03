import Link from "next/link";
import { BILL_STATUS } from "@/lib/constants";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-600 disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON_VARIANTS = {
  primary: "bg-brand-700 text-white hover:bg-brand-800",
  secondary: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
  danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
};

export function Button({ variant = "primary", className = "", ...props }) {
  return (
    <button
      type="button"
      className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export function LinkButton({ variant = "primary", className = "", ...props }) {
  return <Link className={`${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${className}`} {...props} />;
}

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600 disabled:bg-slate-100";

export function Field({ label, required, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Card({ className = "", ...props }) {
  return <div className={`rounded-xl border border-slate-200 bg-white ${className}`} {...props} />;
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const { label, className } = BILL_STATUS[status];
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

export function ErrorNote({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {children}
    </p>
  );
}

export function Loading() {
  return <p className="py-12 text-center text-sm text-slate-500">Loading…</p>;
}

export function Empty({ children }) {
  return <p className="px-4 py-12 text-center text-sm text-slate-500">{children}</p>;
}

// Scrolls sideways inside the card on narrow screens, never the whole page.
export function Table({ children }) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-left text-sm [&_td]:px-4 [&_td]:py-3 [&_th]:whitespace-nowrap [&_th]:px-4 [&_th]:py-3 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-slate-500 [&_tbody_tr]:border-t [&_tbody_tr]:border-slate-100">
        {children}
      </table>
    </div>
  );
}

// Ranked horizontal bars with the value in text beside each one.
export function MeterList({ rows, format }) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="text-slate-700">{row.label}</span>
            <span className="font-semibold tabular-nums">{format(row.value)}</span>
          </div>
          <div className="h-2 rounded bg-slate-100">
            <div
              className="h-2 rounded bg-brand-600"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
