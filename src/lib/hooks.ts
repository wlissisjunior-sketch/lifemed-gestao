import { useStore } from "./store";
import { byPatient } from "./views";
const { useMemo } = React;
export function useResults() {
  const { lancs, servicos, rules } = useStore();
  return useMemo(() => byPatient(lancs, servicos, rules), [lancs, servicos, rules]);
}
