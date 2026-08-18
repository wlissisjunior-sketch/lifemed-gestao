const VARIANTS = {
  new: "bg-slate-100 text-slate-700",
  progress: "bg-sage-50 text-sage-700",
  warning: "bg-amber-50 text-amber",
  active: "bg-sage-100 text-sage-700",
  closed: "bg-slate-100 text-slate-500",
  danger: "bg-coral-50 text-coral",
  neutral: "bg-slate-100 text-slate-700",
};

export default function Badge({ variant = "neutral", children }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${VARIANTS[variant] || VARIANTS.neutral}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}
