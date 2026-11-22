import Link from "next/link";
import { cn } from "@/lib/cn";

export type Stat = {
  label: string;
  value: string | number;
  /** Short qualifier under the number, e.g. "3 new". */
  detail?: string;
  href?: string;
};

/**
 * Headline numbers separated by rules. Values are always text. A tile with an
 * `href` is a stretched link: the number carries the link, the tile is the
 * hit area.
 */
export function StatRow({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 border-y border-rule md:grid-flow-col md:auto-cols-fr md:grid-cols-none",
        className,
      )}
    >
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={cn(
            "relative flex min-w-0 flex-col px-5 py-4",
            index % 2 === 1 && "border-l border-rule",
            index >= 2 && "border-t border-rule md:border-t-0",
            index >= 1 && "md:border-l",
            stat.href && "transition-colors duration-150 hover:bg-surface",
          )}
        >
          <dt className="order-1 font-mono text-xs uppercase tracking-widest text-secondary">
            {stat.label}
          </dt>
          <dd className="order-2 mt-1 font-sans text-2xl font-semibold tabular-nums text-ink">
            {stat.href ? (
              <Link href={stat.href} className="after:absolute after:inset-0">
                {stat.value}
              </Link>
            ) : (
              stat.value
            )}
          </dd>
          {stat.detail ? (
            <dd className="order-3 mt-0.5 font-sans text-sm text-secondary">{stat.detail}</dd>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
