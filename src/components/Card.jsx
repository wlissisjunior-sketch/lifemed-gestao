export default function Card({ title, action, children, className = "", padded = true }) {
  return (
    <div className={`bg-surface rounded-card border border-slate-200 shadow-card ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3">
          <h3 className="font-display text-[15px] font-semibold text-ink">
            {title}
          </h3>
          {action}
        </div>
      )}
      <div className={padded ? "px-5 pb-5" : ""}>{children}</div>
    </div>
  );
}

export function KpiCard({ label, value, icon: Icon, tone = "sage", hint }) {
  const tones = {
    sage: "bg-sage-50 text-sage-700",
    amber: "bg-amber-50 text-amber",
    coral: "bg-coral-50 text-coral",
    ink: "bg-slate-100 text-ink",
  };
  return (
    <div className="bg-surface rounded-card border border-slate-200 shadow-card px-4 py-4 flex items-start gap-3">
      <div className={`h-10 w-10 rounded-md flex items-center justify-center shrink-0 ${tones[tone]}`}>
        <Icon size={18} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-display font-semibold text-ink leading-none font-mono">
          {value}
        </p>
        <p className="text-xs text-slate-500 mt-1.5 leading-snug">{label}</p>
        {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}
