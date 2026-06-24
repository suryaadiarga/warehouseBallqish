type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white/90 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-600">{eyebrow}</p> : null}
        <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{title}</h1>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
