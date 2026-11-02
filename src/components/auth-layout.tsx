import { IconCheckCircle, IconClipboardCheck, IconGraduation, IconShield } from "./icons";

/** Split-screen frame for the login and registration pages. */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-full flex-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel (hidden on small screens) */}
      <section className="brand-panel relative hidden overflow-hidden text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="brand-grid absolute inset-0" aria-hidden="true" />
        <div className="blob absolute -left-20 top-24 size-72 rounded-full bg-indigo-500/30" aria-hidden="true" />
        <div className="blob absolute -right-16 bottom-16 size-80 rounded-full bg-amber-400/20 [animation-delay:-6s]" aria-hidden="true" />

        <div className="enter relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-white/10 text-[var(--accent)] ring-1 ring-white/20 backdrop-blur">
            <IconGraduation size={24} />
          </span>
          <span className="leading-tight">
            <span className="block font-bold">Daystar University</span>
            <span className="block text-sm text-indigo-200/80">Student Clearance System</span>
          </span>
        </div>

        <div className="relative max-w-md">
          <h2 className="enter text-4xl font-bold leading-tight tracking-tight" style={{ ["--i" as string]: 1 }}>
            Get cleared without the <span className="text-[var(--accent)]">paper chase</span>.
          </h2>
          <p className="enter mt-4 text-indigo-100/80" style={{ ["--i" as string]: 2 }}>
            Submit one request and every department reviews it online. See each decision in one place.
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: IconClipboardCheck, text: "Library, Finance, Accommodation and Administration in one place" },
              { icon: IconCheckCircle, text: "Clear status for every department, with the reason for any rejection" },
              { icon: IconShield, text: "Secure sign-in with separate access for students, officers and admins" },
            ].map(({ icon: Ico, text }, i) => (
              <li key={text} className="enter flex items-start gap-3 text-sm text-indigo-50/90" style={{ ["--i" as string]: i + 3 }}>
                <span className="mt-0.5 grid size-7 flex-none place-items-center rounded-lg bg-white/10 text-[var(--accent)]">
                  <Ico size={16} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-indigo-200/60">MIS 400A · Student Clearance Management System</p>
      </section>

      {/* Form side */}
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="enter-scale w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--brand)] text-white">
              <IconGraduation size={22} />
            </span>
            <span className="leading-tight">
              <span className="block font-bold">Daystar University</span>
              <span className="muted block text-sm">Student Clearance System</span>
            </span>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
