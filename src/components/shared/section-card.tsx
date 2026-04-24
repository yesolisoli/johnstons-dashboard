type SectionCardProps = {
  title: string;
  children: React.ReactNode;
};

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>
      {children}
    </section>
  );
}