const numberFormat = new Intl.NumberFormat("en-US");

type TablePaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  loading: boolean;
  onPageChange: (page: number) => void;
};

export function TablePagination({ page, pageSize, total, loading, onPageChange }: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <p className="m-0 text-xs text-slate-500">Page <strong className="text-slate-900">{page}</strong> of <strong className="text-slate-900">{totalPages}</strong></p>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">← Previous</button>
        <button type="button" disabled={page >= totalPages || loading} onClick={() => onPageChange(page + 1)} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Next →</button>
      </div>
    </div>
  );
}
