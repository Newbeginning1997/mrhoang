export function PageHeader({
  eyebrow,
  title,
  description,
  actions
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 border-b border-slate-200 pb-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {eyebrow ? <p className="label">{eyebrow}</p> : null}
          <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink sm:text-3xl">{title}</h2>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </div>
  );
}
