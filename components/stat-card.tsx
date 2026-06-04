export function StatCard({
  label,
  value,
  help,
  tone = "primary",
  icon
}: {
  label: string;
  value: string | number;
  help?: string;
  tone?: "primary" | "lagoon" | "sun" | "rose";
  icon?: React.ReactNode;
}) {
  const toneClass = {
    primary: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    lagoon: "bg-blue-100 text-blue-700 ring-blue-200",
    sun: "bg-amber-100 text-amber-700 ring-amber-200",
    rose: "bg-rose-100 text-rose-700 ring-rose-200"
  }[tone];

  return (
    <article className="surface group min-h-[148px] p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <p className="label">{label}</p>
        {icon ? (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 saturate-150 ${toneClass}`}>
            {icon}
          </div>
        ) : null}
      </div>
      <div className="mt-5 flex items-end gap-3">
        <span className="text-3xl font-bold leading-none tracking-normal text-ink">{value}</span>
        <span className={`mb-1 h-2 w-2 rounded-full ring-4 ${toneClass}`} aria-hidden />
      </div>
      {help ? <p className="mt-3 text-sm leading-5 text-muted">{help}</p> : null}
    </article>
  );
}
