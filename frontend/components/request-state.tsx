type StatePanelProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  isError?: boolean;
};

export function StatePanel({ title, description, actionLabel, onAction, isError = false }: StatePanelProps) {
  return (
    <div className="grid min-h-[230px] place-content-center justify-items-center gap-2 px-6 py-10 text-center">
      <span className={`mb-1 grid size-11 place-items-center rounded-xl text-lg font-bold ${isError ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100" : "bg-slate-100 text-slate-500"}`} aria-hidden="true">
        {isError ? "!" : "—"}
      </span>
      <h3 className={`m-0 text-base font-bold ${isError ? "text-rose-900" : "text-slate-900"}`}>{title}</h3>
      <p className="mb-1 max-w-lg text-sm leading-6 text-slate-500">{description}</p>
      {actionLabel && onAction && <button type="button" onClick={onAction} className="mt-1 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700">{actionLabel}</button>}
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="grid min-h-[230px] place-items-center text-sm text-slate-500" role="status">
      <span className="flex items-center gap-3"><span className="size-4 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />{label}</span>
    </div>
  );
}
