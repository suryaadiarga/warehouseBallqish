import Link from 'next/link';

type ModuleTab = {
  id: string;
  label: string;
  description: string;
};

export function ModuleTabs({ basePath, activeTab, tabs }: { basePath: string; activeTab: string; tabs: ModuleTab[] }) {
  return (
    <section className="surface-card overflow-hidden rounded-[28px] p-2">
      <div className="flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;

          return (
            <Link
              key={tab.id}
              href={`${basePath}?tab=${tab.id}`}
              className={`min-w-fit flex-1 rounded-[22px] px-5 py-4 transition ${
                active ? 'bg-slate-950 text-white shadow-lg shadow-slate-950/15' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="block text-sm font-black">{tab.label}</span>
              <span className={`mt-1 block text-xs ${active ? 'text-slate-300' : 'text-slate-400'}`}>{tab.description}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
