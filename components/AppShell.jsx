"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  PlusCircle,
  Receipt,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { HOSPITAL } from "@/config/hospital";
import { getSession, logout } from "@/lib/auth";
import { canAccess, homeFor, ROLES } from "@/lib/constants";
import { Loading } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/billing", label: "New bill", icon: PlusCircle },
  { href: "/bills", label: "Bills", icon: Receipt },
  { href: "/patients", label: "Patients", icon: Users },
  { href: "/catalogue", label: "Services & drugs", icon: Pill },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/staff", label: "Staff", icon: UserCog },
];

const SUBSCRIPTION_CHECK_MS = 5 * 60 * 1000;

const SessionContext = createContext(null);
export const useSession = () => useContext(SessionContext);

export function Logo({ light = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-white">
        <HeartPulse size={20} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className={`block truncate text-sm font-bold ${light ? "text-white" : "text-slate-900"}`}>
          {HOSPITAL.name}
        </span>
        <span className={`block truncate text-xs ${light ? "text-slate-400" : "text-slate-500"}`}>
          {HOSPITAL.tagline}
        </span>
      </span>
    </div>
  );
}

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState(undefined);
  const [menuOpen, setMenuOpen] = useState(false);

  // Re-checked on each navigation so a deactivated account or changed role applies at once.
  useEffect(() => {
    getSession().then((member) => {
      setSession(member);
      if (!member) router.replace("/login");
      else if (!canAccess(member.role, pathname)) router.replace(homeFor(member.role));
    });
    setMenuOpen(false);
  }, [pathname, router]);

  // The server checks on page load, but a tab left open needs to notice a pause too.
  useEffect(() => {
    const check = async () => {
      try {
        const response = await fetch("/api/subscription", { cache: "no-store" });
        const { active } = await response.json();
        if (active === false) window.location.replace("/suspended");
      } catch {
        // A network blip must not interrupt work. The next check will catch up.
      }
    };
    check();
    const timer = setInterval(check, SUBSCRIPTION_CHECK_MS);
    return () => clearInterval(timer);
  }, [pathname]);

  if (!session || !canAccess(session.role, pathname)) {
    return <Loading />;
  }

  const signOut = () => {
    logout();
    router.replace("/login");
  };

  return (
    <SessionContext.Provider value={session}>
      <div className="min-h-screen lg:flex">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5 lg:hidden print:hidden">
          <Logo />
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100"
          >
            <Menu size={22} aria-hidden />
          </button>
        </header>

        {menuOpen && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 print:hidden ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-4">
            <Logo light />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-800 lg:hidden"
            >
              <X size={20} aria-hidden />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
            {NAV.filter((item) => canAccess(session.role, item.href)).map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    active
                      ? "bg-brand-700 text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon size={18} aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-800 p-4">
            <p className="truncate text-sm font-medium text-white">
              {session.firstName} {session.lastName}
            </p>
            <p className="mb-3 text-xs text-slate-400">{ROLES[session.role]}</p>
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"
            >
              <LogOut size={16} aria-hidden /> Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900 print:hidden">
            Demo mode: sample data stored in this browser only. Do not enter real patient information.
          </p>
          <main className="mx-auto max-w-7xl p-4 sm:p-6 print:max-w-none print:p-0">{children}</main>
        </div>
      </div>
    </SessionContext.Provider>
  );
}
