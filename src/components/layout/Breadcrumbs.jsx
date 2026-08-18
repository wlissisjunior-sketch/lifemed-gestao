import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Breadcrumbs({ items }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 flex-wrap">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {item.to && !isLast ? (
              <Link to={item.to} className="hover:text-sage transition-colors">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-ink font-medium" : ""}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight size={14} className="text-slate-300" />}
          </span>
        );
      })}
    </div>
  );
}
