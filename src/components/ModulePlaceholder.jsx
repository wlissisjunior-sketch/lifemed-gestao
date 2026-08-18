import Breadcrumbs from "./layout/Breadcrumbs";
import Card from "./Card";

export default function ModulePlaceholder({ icon: Icon, title, description, breadcrumb }) {
  return (
    <div className="space-y-5">
      <Breadcrumbs items={[{ label: "Dashboard", to: "/" }, { label: breadcrumb || title }]} />
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      <Card>
        <div className="flex flex-col items-center justify-center text-center py-14 gap-3">
          <div className="h-12 w-12 rounded-full bg-sage-50 text-sage-700 flex items-center justify-center">
            <Icon size={20} />
          </div>
          <p className="text-sm font-medium text-ink">Módulo da próxima fase</p>
          <p className="text-sm text-slate-400 max-w-sm">
            O layout, a navegação e o padrão visual já estão prontos. O
            fluxo funcional completo deste módulo entra na próxima etapa
            de desenvolvimento, mantendo este mesmo padrão.
          </p>
        </div>
      </Card>
    </div>
  );
}
