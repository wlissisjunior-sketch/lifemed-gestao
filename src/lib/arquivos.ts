// ============================================================================
// ARMAZENAMENTO DE ARQUIVOS (PDFs anexados) — ponto único de troca.
//
// As telas só usam estas três funções:
//   arquivos.put(blob, meta)  -> id      guarda o arquivo e devolve um identificador
//   arquivos.get(id)          -> Blob    devolve o arquivo (ou null se não existir)
//   arquivos.remove(id)                  apaga o arquivo
//
// Destino ainda NÃO definido. Enquanto não houver servidor (VPS), a implementação
// abaixo é provisória e guarda os arquivos no próprio navegador (IndexedDB), só para
// a demonstração funcionar. Quando o servidor existir, troque `provisorioNoNavegador()`
// por uma implementação que envie para a API (ex.: POST /arquivos, GET /arquivos/:id).
// Nenhuma tela precisa mudar.
// ============================================================================

export interface ArquivoMeta { nome: string; tipo: string; tamanho: number }
export interface ArquivoStore {
  put(blob: Blob, meta: ArquivoMeta): Promise<string>;
  get(id: string): Promise<Blob | null>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

function provisorioNoNavegador(): ArquivoStore {
  const DB = "lifemed.arquivos", ST = "arquivos";
  let dbp: Promise<IDBDatabase> | null = null;
  const open = () => (dbp ||= new Promise<IDBDatabase>((ok, fail) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(ST);
    r.onsuccess = () => ok(r.result);
    r.onerror = () => { dbp = null; fail(r.error); };
  }));
  const tx = async <T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>) => {
    const db = await open();
    return new Promise<T>((ok, fail) => {
      const t = db.transaction(ST, mode); const req = fn(t.objectStore(ST));
      t.oncomplete = () => ok(req.result); t.onerror = () => fail(t.error); t.onabort = () => fail(t.error);
    });
  };
  const newId = () => "a" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  return {
    async put(blob, meta) { const id = newId(); await tx("readwrite", (s) => s.put({ blob, meta }, id)); return id; },
    async get(id) { const v: any = await tx("readonly", (s) => s.get(id)); return v?.blob || null; },
    async remove(id) { await tx("readwrite", (s) => s.delete(id)); },
    async clear() { await tx("readwrite", (s) => s.clear()); },
  };
}

export const arquivos: ArquivoStore = provisorioNoNavegador();
