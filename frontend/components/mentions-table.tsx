import { UiIcon } from "@/components/ui-icons";
import type { Mention } from "@/lib/types";
import { MentionRow } from "@/components/mention-row";
import { LoadingState, StatePanel } from "@/components/request-state";
import { TablePagination } from "@/components/table-pagination";

const numberFormat = new Intl.NumberFormat("en-US");
const headings = ["Prompt / query", "AI model", "Brand status", "Position", "Sentiment", "Citation source", "Source time"] as const;

type MentionsTableProps = {
  data: Mention[];
  loading: boolean;
  error: string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
  onRetry: () => void;
};

export function MentionsTable({ data, loading, error, page, pageSize, total, onPageChange, onResetFilters, onRetry }: MentionsTableProps) {
  const firstRow = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastRow = Math.min(page * pageSize, total);
  return (
    <section id="records" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.025]" aria-label="Mention records">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5 sm:py-5">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700"><UiIcon name="records" className="size-[19px]" /></span>
          <div>
            <h2 className="m-0 text-lg font-bold tracking-tight text-slate-950">Mention records</h2>
            <p className="mb-0 mt-1 text-sm text-slate-500">Inspect prompts, AI models, sentiment and citation sources.</p>
          </div>
        </div>
        <div className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-right ring-1 ring-slate-100">
          <p className="m-0 text-lg font-bold tracking-tight text-slate-900">{numberFormat.format(total)}</p>
          <p className="m-0 text-[11px] font-medium text-slate-500">Matching responses</p>
        </div>
      </div>

      {error ? (
        <StatePanel title="Couldn’t load mention records" description={error} actionLabel="Retry request" onAction={onRetry} isError />
      ) : loading ? (
        <LoadingState label="Loading mention records…" />
      ) : data.length === 0 ? (
        <StatePanel title="No matching responses" description="No records match these filters. Try a broader date range or clear the current filters." actionLabel="Clear filters" onAction={onResetFilters} />
      ) : (
        <>
          <div className="flex flex-wrap justify-between gap-2 border-y border-slate-100 bg-slate-50/70 px-4 py-3 text-xs text-slate-500 sm:px-5">
            <span>Showing <strong className="text-slate-800">{numberFormat.format(firstRow)}-{numberFormat.format(lastRow)}</strong> of <strong className="text-slate-800">{numberFormat.format(total)}</strong></span>
            <span>Sorted newest first <span aria-hidden="true">·</span> Stable ID tie-breaker</span>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500">
                <tr>{headings.map((heading) => <th key={heading} scope="col" className="border-b border-slate-200 px-4 py-3.5 font-semibold first:pl-5 last:pr-5">{heading}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">{data.map((mention) => <MentionRow key={mention.id} mention={mention} />)}</tbody>
            </table>
          </div>
          <TablePagination page={page} pageSize={pageSize} total={total} loading={loading} onPageChange={onPageChange} />
        </>
      )}
    </section>
  );
}
