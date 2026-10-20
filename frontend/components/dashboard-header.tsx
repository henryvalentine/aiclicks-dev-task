import { UiIcon } from "@/components/ui-icons";

const navLinkClass = "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950";

export function DashboardHeader() {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-[76px] items-center border-b border-slate-100 px-5">
          <a href="#top" className="flex items-center gap-3 no-underline" aria-label="AI Clicks dashboard home">
            <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-sm font-black tracking-tight text-white shadow-sm shadow-teal-600/20">AC</span>
            <span className="text-[17px] font-bold tracking-tight text-slate-950">AI<span className="text-teal-600">Clicks</span></span>
          </a>
        </div>

        <div className="border-b border-slate-100 p-4">
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Workspace</p>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-sm font-bold text-teal-700">D</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-slate-800">Demo workspace</span>
              <span className="mt-0.5 block text-xs text-slate-500">10,000 sample responses</span>
            </span>
          </div>
        </div>

        <nav aria-label="Dashboard navigation" className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          <div>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Monitoring</p>
            <a href="#top" aria-current="page" className={`${navLinkClass} bg-teal-50 font-semibold text-teal-700 hover:bg-teal-50 hover:text-teal-800`}>
              <UiIcon name="dashboard" className="size-[18px] shrink-0" />
              Dashboard
              <span className="ml-auto size-1.5 rounded-full bg-teal-600" aria-hidden="true" />
            </a>
          </div>
          <div>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Explore data</p>
            <a href="#trends" className={navLinkClass}>
              <UiIcon name="trend" className="size-[18px] shrink-0" />
              Trends
            </a>
            <a href="#records" className={navLinkClass}>
              <UiIcon name="records" className="size-[18px] shrink-0" />
              Mention records
            </a>
          </div>
        </nav>

        <div className="m-3 rounded-xl border border-teal-100 bg-teal-50/70 p-3.5">
          <div className="mb-2 flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <p className="m-0 text-xs font-semibold text-slate-800">Demo environment</p>
          </div>
          <p className="m-0 text-xs leading-5 text-slate-500">Historical sample data from January to March 2025. Not a live brand-tracking account.</p>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">Brand intelligence dashboard</div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <a href="#top" className="flex items-center gap-2.5 no-underline" aria-label="AI Clickss dashboard home">
            <span className="grid size-9 place-items-center rounded-xl bg-teal-600 text-xs font-black text-white">AC</span>
            <span className="text-base font-bold tracking-tight text-slate-950">AI<span className="text-teal-600">Clicks</span></span>
          </a>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-500">Demo data</span>
        </div>
        <nav aria-label="Mobile dashboard navigation" className="mt-3 flex gap-2 overflow-x-auto pb-0.5 text-xs font-semibold">
          <a href="#top" className="whitespace-nowrap rounded-lg bg-teal-50 px-3 py-2 text-teal-700 no-underline">Dashboard</a>
          <a href="#trends" className="whitespace-nowrap rounded-lg px-3 py-2 text-slate-600 no-underline hover:bg-slate-50">Trends</a>
          <a href="#records" className="whitespace-nowrap rounded-lg px-3 py-2 text-slate-600 no-underline hover:bg-slate-50">Mention records</a>
        </nav>
      </header>
    </>
  );
}
