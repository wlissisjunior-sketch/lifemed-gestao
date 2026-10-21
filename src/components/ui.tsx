const { createContext, useContext, useEffect } = React;

export type Route = "inicio" | "pad" | "checklist" | "pacientes" | "valores" | "pacotes" | "fechamento" | "faturamento" | "fisico" | "relatorios" | "painel" | "medicamentos" | "dietas" | "ajustes";
export const NavCtx = createContext(null as any as { route: Route; go: (r: Route, arg?: any) => void; arg: any });
export const useNav = () => useContext(NavCtx);

export function PageHead({ title, children, actions }: { title: string; children?: any; actions?: any }) {
  return (
    <div className="page-head">
      <div className="grow"><h1>{title}</h1>{children && <p>{children}</p>}</div>
      {actions && <div className="row">{actions}</div>}
    </div>
  );
}
export const Banner = ({ kind = "info", children }: { kind?: "info" | "warn" | "err" | "ok"; children: any }) =>
  <div className={`banner ${kind}`} role={kind === "err" ? "alert" : undefined}>{children}</div>;
export const Empty = ({ children }: { children: any }) => <div className="empty">{children}</div>;
export function Field({ label, children, hint, id }: { label: string; children: any; hint?: string; id?: string }) {
  return <div className="field"><label htmlFor={id}>{label}</label>{children}{hint && <span className="hint">{hint}</span>}</div>;
}
export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: any; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="scrim sheet-mobile" onMouseDown={(e: any) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={wide ? { width: "min(820px, 100%)" } : undefined}>
        <div className="mhead"><h2>{title}</h2><button className="btn ghost sm" onClick={onClose} aria-label="Fechar">Fechar</button></div>
        {children}
      </div>
    </div>
  );
}
/** Confirmação dentro da página (o visualizador não mostra confirm()). */
export function Confirm({ text, okText, onOk, onCancel, danger }: { text: string; okText: string; onOk: () => void; onCancel: () => void; danger?: boolean }) {
  return (
    <Modal title="Confirmar" onClose={onCancel}>
      <p>{text}</p>
      <div className="row"><button className={`btn ${danger ? "danger" : ""}`} onClick={onOk}>{okText}</button><button className="btn sec" onClick={onCancel}>Cancelar</button></div>
    </Modal>
  );
}
export const Ico = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></svg>,
  check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 9l2 2 4-4" /><path d="M8 15h8" /></svg>,
  money: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>,
  doc: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h9l3 3v15H6z" /><path d="M9 12h6M9 16h6" /></svg>,
  more: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
};
