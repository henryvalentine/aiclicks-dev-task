import type { SVGProps } from "react";

type IconName = "dashboard" | "trend" | "records" | "filter" | "response" | "mention" | "rate";
type IconProps = SVGProps<SVGSVGElement> & { name: IconName };

const shared = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

export function UiIcon({ name, ...props }: IconProps) {
  const drawing = {
    dashboard: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.4" /><rect x="13.5" y="3.5" width="7" height="4" rx="1.4" /><rect x="13.5" y="10.5" width="7" height="10" rx="1.4" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.4" /></>,
    trend: <><path d="M3.5 19.5h17" /><path d="m4.5 15.5 5-5 3.5 2.8 6.5-7" /><path d="M15.5 6.3h4v4" /></>,
    records: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    filter: <><path d="M4 5h16l-6.2 7.1v5.2l-3.6 1.7v-6.9L4 5Z" /></>,
    response: <><path d="M4 5.5h16v11H9l-5 3v-14Z" /><path d="M8 9.5h8M8 13h5" /></>,
    mention: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    rate: <><path d="m7 17 10-10" /><circle cx="7.5" cy="7.5" r="2.5" /><circle cx="16.5" cy="16.5" r="2.5" /></>,
  }[name];

  return <svg {...shared} {...props}>{drawing}</svg>;
}
