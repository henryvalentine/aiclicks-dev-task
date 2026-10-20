import { UiIcon } from "@/components/ui-icons";

const numberFormat = new Intl.NumberFormat("en-US");

type SummaryCardsProps = {
  total: number;
  mentionedCount: number;
  mentionRate: number;
  visibleCount: number;
  loading: boolean;
  error: string;
};

const cardDetails = [
  { label: "Matching responses", note: "All records matching filters", icon: "response" as const },
  { label: "Brand mentions", note: "Responses where a brand appeared", icon: "mention" as const },
  { label: "Mention rate", note: "Across all matching responses", icon: "rate" as const },
  { label: "On this page", note: "Rows currently displayed", icon: "records" as const },
];

export function SummaryCards({ total, mentionedCount, mentionRate, visibleCount, loading, error }: SummaryCardsProps) {
  const unavailable = loading || Boolean(error);
  const values = [numberFormat.format(total), numberFormat.format(mentionedCount), `${mentionRate.toFixed(1)}%`, numberFormat.format(visibleCount)];
  return (
    <section id="overview" aria-label="Summary metrics" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cardDetails.map((card, index) => (
        <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.025] transition hover:border-slate-300 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="m-0 text-sm font-semibold text-slate-600">{card.label}</p>
            <span className={`grid size-9 place-items-center rounded-xl ${index === 2 ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-500"}`}><UiIcon name={card.icon} className="size-[18px]" /></span>
          </div>
          <p className={`m-0 text-[30px] font-bold leading-none tracking-tight ${index === 2 ? "text-teal-700" : "text-slate-950"}`} aria-live="polite">
            {unavailable ? <span className="text-slate-300">—</span> : values[index]}
          </p>
          <p className="mb-0 mt-2.5 text-xs leading-5 text-slate-400">{card.note}</p>
        </article>
      ))}
    </section>
  );
}
