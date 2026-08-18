import { STAGES } from "../data/mockData";

// Elemento de assinatura visual do sistema: o "trilho de etapas".
// Representa o ciclo do paciente (Cadastro → ... → Encerrado) como uma
// linha segmentada com marcadores numerados — reaproveitado no
// Dashboard e no cabeçalho do Perfil do Paciente, para reforçar a
// ideia de "uma única esteira para todo o ciclo de atendimento".
export default function StageRail({ current, compact = false }) {
  const currentIndex = STAGES.indexOf(current);

  return (
    <div className="w-full overflow-x-auto scrollbar-thin">
      <div className={`flex items-start ${compact ? "min-w-[640px]" : "min-w-[820px]"}`}>
        {STAGES.map((stage, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const isLast = i === STAGES.length - 1;
          return (
            <div key={stage} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div
                  className={`flex items-center justify-center rounded-full font-mono text-[11px] transition-colors
                    ${compact ? "h-6 w-6" : "h-8 w-8"}
                    ${
                      active
                        ? "bg-sage text-white ring-4 ring-sage-100"
                        : done
                        ? "bg-sage-600 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <span
                  className={`text-center leading-tight ${compact ? "text-[10px] max-w-[64px]" : "text-xs max-w-[84px]"} ${
                    active ? "text-ink font-semibold" : done ? "text-slate-700" : "text-slate-400"
                  }`}
                >
                  {stage}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`mx-1 mt-3 h-[2px] flex-1 ${i < currentIndex ? "bg-sage-600" : "bg-slate-200"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
