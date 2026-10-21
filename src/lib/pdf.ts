// Utilitários de PDF que rodam no navegador: validação, prévia, foto → PDF e junção.
// Bibliotecas carregadas só quando usadas (não pesam na abertura do sistema).

export const MAX_MB = 15;

async function pdfjs() {
  const lib: any = await import("pdfjs-dist");
  if (!lib.GlobalWorkerOptions.workerSrc) {
    const w: any = await import("pdfjs-dist/build/pdf.worker.min.js?url");
    lib.GlobalWorkerOptions.workerSrc = w.default;
  }
  return lib;
}
const pdflib = () => import("pdf-lib");

export interface PdfInfo { ok: boolean; erro?: string; paginas?: number; blob?: Blob; nome?: string }

/** Confere se o arquivo é um PDF de verdade, legível e não vazio. */
export async function validarPdf(file: Blob, nome: string): Promise<PdfInfo> {
  if (!file.size) return { ok: false, erro: "O arquivo está vazio." };
  if (file.size > MAX_MB * 1024 * 1024) return { ok: false, erro: `O arquivo tem ${(file.size / 1048576).toFixed(1).replace(".", ",")} MB. O limite é ${MAX_MB} MB.` };
  const head = new Uint8Array(await file.slice(0, 1024).arrayBuffer());
  const txt = String.fromCharCode(...head);
  if (!txt.includes("%PDF-")) return { ok: false, erro: "Este arquivo não é um PDF. Envie o relatório em PDF ou fotografe o documento." };
  try {
    const lib = await pdfjs();
    const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const n = doc.numPages; await doc.destroy();
    if (!n) return { ok: false, erro: "O PDF não tem páginas." };
    return { ok: true, paginas: n, blob: file.type === "application/pdf" ? file : new Blob([file], { type: "application/pdf" }), nome };
  } catch (e: any) {
    if (e?.name === "PasswordException") return { ok: false, erro: "O PDF está protegido por senha. Envie uma versão sem senha." };
    return { ok: false, erro: "Não foi possível ler o PDF: o arquivo parece corrompido." };
  }
}

/** Desenha as primeiras páginas em <canvas> (funciona em qualquer navegador, inclusive no celular). */
export async function desenharPaginas(blob: Blob, alvo: HTMLElement, largura: number, max = 3) {
  const lib = await pdfjs();
  const doc = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
  alvo.innerHTML = "";
  const n = Math.min(doc.numPages, max);
  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i);
    const v1 = page.getViewport({ scale: 1 });
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const vp = page.getViewport({ scale: (largura / v1.width) * dpr });
    const c = document.createElement("canvas");
    c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
    c.style.width = "100%"; c.style.height = "auto";
    c.setAttribute("aria-label", `Página ${i} de ${doc.numPages}`);
    alvo.appendChild(c);
    await page.render({ canvasContext: c.getContext("2d")!, viewport: vp }).promise;
  }
  const total = doc.numPages; await doc.destroy();
  return total;
}

/** Fotos (JPG/PNG/etc.) → um PDF A4, uma foto por página. */
export async function fotosParaPdf(files: File[]): Promise<Blob> {
  const { PDFDocument } = await pdflib();
  const pdf = await PDFDocument.create();
  for (const f of files) {
    const jpg = await paraJpeg(f);
    const img = await pdf.embedJpg(jpg);
    const W = 595.28, H = 841.89, m = 24;
    const s = Math.min((W - 2 * m) / img.width, (H - 2 * m) / img.height);
    const page = pdf.addPage([W, H]);
    page.drawImage(img, { x: (W - img.width * s) / 2, y: (H - img.height * s) / 2, width: img.width * s, height: img.height * s });
  }
  return new Blob([await pdf.save()], { type: "application/pdf" });
}
async function paraJpeg(f: File): Promise<Uint8Array> {
  const url = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((ok, fail) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => fail(new Error("img")); i.src = url; });
    const max = 2000, s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
    const g = c.getContext("2d")!; g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    const b: Blob = await new Promise((ok) => c.toBlob((x) => ok(x!), "image/jpeg", 0.85));
    return new Uint8Array(await b.arrayBuffer());
  } finally { URL.revokeObjectURL(url); }
}

export interface ItemPasta { titulo: string; blob: Blob | null; detalhe?: string }
/** Junta os relatórios de um paciente num PDF só, com uma capa listando o que entrou e o que falta. */
export async function montarPasta(capa: { titulo: string; linhas: string[] }, itens: ItemPasta[]): Promise<{ blob: Blob; falhas: string[] }> {
  const { PDFDocument, StandardFonts, rgb } = await pdflib();
  const out = await PDFDocument.create();
  const font = await out.embedFont(StandardFonts.Helvetica), bold = await out.embedFont(StandardFonts.HelveticaBold);
  const W = 595.28, H = 841.89;
  const pg = out.addPage([W, H]);
  const azul = rgb(6 / 255, 90 / 255, 140 / 255), tinta = rgb(18 / 255, 41 / 255, 59 / 255), cinza = rgb(86 / 255, 112 / 255, 132 / 255), verde = rgb(147 / 255, 192 / 255, 31 / 255);
  let y = H - 64;
  pg.drawText("LifeMed · Pasta de cobrança", { x: 48, y, size: 11, font: bold, color: cinza }); y -= 30;
  pg.drawText(limpa(capa.titulo), { x: 48, y, size: 18, font: bold, color: azul }); y -= 12;
  pg.drawRectangle({ x: 48, y, width: W - 96, height: 3, color: verde }); y -= 26;
  for (const l of capa.linhas) { pg.drawText(limpa(l), { x: 48, y, size: 11, font, color: tinta }); y -= 17; }
  y -= 14; pg.drawText("Conteúdo", { x: 48, y, size: 12, font: bold, color: tinta }); y -= 20;
  const falhas: string[] = [];
  let pagina = 2;
  const docs: { t: string; d: any }[] = [];
  for (const it of itens) {
    if (!it.blob) { pg.drawText(limpa(`${it.titulo}: pendente`), { x: 60, y, size: 10.5, font, color: cinza }); y -= 16; continue; }
    try {
      const d = await PDFDocument.load(await it.blob.arrayBuffer(), { ignoreEncryption: true });
      const n = d.getPageCount();
      pg.drawText(limpa(`${it.titulo}: páginas ${pagina} a ${pagina + n - 1}${it.detalhe ? " · " + it.detalhe : ""}`), { x: 60, y, size: 10.5, font, color: tinta }); y -= 16;
      pagina += n; docs.push({ t: it.titulo, d });
    } catch { falhas.push(it.titulo); pg.drawText(limpa(`${it.titulo}: não foi possível incluir (arquivo protegido ou danificado)`), { x: 60, y, size: 10.5, font, color: rgb(.7, .15, .12) }); y -= 16; }
    if (y < 60) break;
  }
  for (const { t, d } of docs) {
    try { const ps = await out.copyPages(d, d.getPageIndices()); ps.forEach((p: any) => out.addPage(p)); } catch { falhas.push(t); }
  }
  return { blob: new Blob([await out.save()], { type: "application/pdf" }), falhas };
}
// Helvetica padrão só tem o alfabeto latino; troca o que não cabe
const limpa = (s: string) => s.replace(/[–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[^\x20-\x7E\xA0-\xFF]/g, "");

export async function zipar(arqs: { nome: string; blob: Blob }[]): Promise<Blob> {
  const JSZip: any = (await import("jszip")).default;
  const z = new JSZip();
  for (const a of arqs) z.file(a.nome, a.blob);
  return z.generateAsync({ type: "blob" });
}
export const nomeArquivo = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
