import type { Mention } from "@/lib/types";
import { formatSourceTimestamp, safeCitationUrl } from "@/lib/format";

const modelLabels: Record<string, string> = {
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  perplexity: "Perplexity",
};

function MentionStatus({ mentioned }: { mentioned: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ${mentioned ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
      <i className={`size-1.5 rounded-full ${mentioned ? "bg-emerald-500" : "bg-slate-400"}`} />
      {mentioned ? "Mentioned" : "Not found"}
    </span>
  );
}

function CitationCell({ value }: { value: string | null }) {
  const citation = safeCitationUrl(value);
  if (!value) return <span className="text-slate-300">—</span>;
  if (!citation) return <span className="text-xs text-slate-400" title="Citation URL is invalid or uses an unsupported scheme">Invalid URL</span>;
  return (
    <a className="inline-flex max-w-[150px] items-center gap-1 truncate text-xs font-semibold text-teal-600 underline decoration-teal-200 underline-offset-4 hover:text-teal-800 hover:decoration-teal-600" href={citation.href} target="_blank" rel="noopener noreferrer" title={citation.href}>
      {citation.hostname}<span aria-hidden="true">↗</span>
    </a>
  );
}

export function MentionRow({ mention }: { mention: Mention }) {
  const sentimentClass = mention.sentiment === "positive"
    ? "bg-emerald-50 text-emerald-700"
    : mention.sentiment === "negative"
      ? "bg-rose-50 text-rose-700"
      : "bg-slate-100 text-slate-600";

  return (
    <tr className="transition-colors hover:bg-teal-50/40">
      <td className="max-w-[360px] whitespace-normal px-4 py-4 first:pl-5">
        <p className="mb-1 font-semibold leading-5 text-slate-800">{mention.query_text}</p>
        <p className="m-0 font-mono text-[10px] text-slate-400">{mention.id}</p>
      </td>
      <td className="px-4 py-4"><span className="inline-flex rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">{modelLabels[mention.model] ?? mention.model}</span></td>
      <td className="px-4 py-4"><MentionStatus mentioned={mention.mentioned} /></td>
      <td className="px-4 py-4 font-mono text-xs text-slate-600">{mention.position == null ? <span className="text-slate-300">—</span> : `#${mention.position}`}</td>
      <td className="px-4 py-4">{mention.sentiment ? <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${sentimentClass}`}>{mention.sentiment}</span> : <span className="text-slate-300">—</span>}</td>
      <td className="px-4 py-4"><CitationCell value={mention.citation_url} /></td>
      <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-500 last:pr-5"><time dateTime={mention.created_at} title="Timestamp displayed as stored in the source dataset">{formatSourceTimestamp(mention.created_at)}</time></td>
    </tr>
  );
}
