import { useStore } from "./store";
import { byPatient, matrizRelatorios, exigidosDoMes } from "./views";
const { useMemo } = React;
export function useResults() {
  const { lancs, servicos, rules } = useStore();
  return useMemo(() => byPatient(lancs, servicos, rules), [lancs, servicos, rules]);
}

/** Matriz de relatórios da competência, já com os tipos exigidos pelo PAD de cada paciente. */
export function useMatriz() {
  const { pacList, tipos, rels, pads, comp } = useStore();
  return useMemo(() => matrizRelatorios(pacList, tipos, rels, exigidosDoMes(pacList, pads, comp)), [pacList, tipos, rels, pads, comp]);
}
