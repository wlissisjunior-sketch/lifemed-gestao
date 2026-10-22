// node test/pad.test.mjs  (gera o bundle com esbuild antes)
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
execSync("node_modules/.bin/esbuild src/lib/pad.ts --bundle --format=esm --outfile=test/.pad.bundle.mjs --log-level=error");
const P = await import("./.pad.bundle.mjs");
import fs from "node:fs";
const seed = JSON.parse(fs.readFileSync("src/demo-seed.json", "utf8"));
const svcs = Object.fromEntries(Object.entries(seed.servicos).map(([id, s]) => [id, { id, ...s }]));
const rules = Object.fromEntries(Object.entries(seed.regras).map(([id, r]) => [id, r.itens || {}]));

// pontuação
const E = P.ESCALA_PADRAO;
assert.equal(P.pontuar(E, {}).completo, false);
let r = P.pontuar(E, { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0, c6: 0, c7: 0 });
assert.equal(r.pontos, 0); assert.equal(r.sugerida, "s05"); assert.equal(r.completo, true);
r = P.pontuar(E, { c1: 1, c2: 2, c3: 1, c4: 1, c5: 1, c6: 2, c7: 1 }); // 2+2+1+2+1+2+1 = 11
assert.equal(r.pontos, 11); assert.equal(r.sugerida, "s03");
r = P.pontuar(E, { c1: 3, c2: 0, c3: 0, c4: 0, c5: 0, c6: 0, c7: 0 });
assert.equal(r.sugerida, "s01", "ventilação mecânica exige 24h c/ VM");

// quantidades
const pad = { ini: "2026-08-14", fim: "2026-09-12" };
assert.equal(P.qtdPrevista({ sid: "x", qtd: 3, freq: "dia" }, pad, "2026-08-01", "2026-08-31"), 54); // 18 dias
assert.equal(P.qtdPrevista({ sid: "x", qtd: 5, freq: "semana" }, pad, "2026-08-01", "2026-08-31"), 13); // 5*18/7=12.86
assert.equal(P.qtdPrevista({ sid: "x", qtd: 2, freq: "mes" }, pad, "2026-08-01", "2026-08-31"), 1); // 2*18/31=1.16
assert.equal(P.qtdPrevista({ sid: "x", qtd: 2, freq: "mes" }, pad, "2026-08-01", "2026-09-30"), 2); // 1.16+0.8
assert.equal(P.qtdPrevista({ sid: "x", qtd: 4, freq: "periodo" }, pad, "2026-08-01", "2026-08-31"), 2); // 4*18/30
assert.equal(P.qtdPrevista({ sid: "x", qtd: 1, freq: "dia" }, pad, "2026-10-01", "2026-10-31"), 0);

// orçamento usa o motor de cobrança (cama incluída no gerenciamento? depende da regra)
const full = { id: "t", pac: "p20", versao: 1, status: "autorizado", ini: "2026-08-14", fim: "2026-08-31", pacote: "s07", sugerida: "s07", motivo: "", escala: {}, pontos: 0,
  itens: [{ sid: "s41", qtd: 1, freq: "dia" }, { sid: "s08", qtd: 3, freq: "semana" }], relatorios: [], operadora: "", autorizacao: "", medico: "x", crm: "", objetivos: "", alta: "", reavaliacao: "" };
const o = P.orcamento(full, svcs, rules);
const exp = 18 * 364.89 + 18 * 356.23 + Math.round(3 * 18 / 7) * 59.74 * (rules.s07?.s08 ? 0 : 1);
console.log("orçamento", o.cobrado, "incluso", o.incluso, "esperado (se fisio cobrada)", exp.toFixed(2), "regra s07/s08:", rules.s07?.s08);
assert.ok(o.cobrado > 0);

// situação
assert.equal(P.situacao({ status: "autorizado", ini: "2026-09-13", fim: "2026-10-25" }, "2026-10-21").k, "avencer");
assert.equal(P.situacao({ status: "autorizado", ini: "2026-09-13", fim: "2026-10-25" }, "2026-10-21").label, "Vence em 4 dias");
assert.equal(P.situacao({ status: "autorizado", ini: "2026-08-11", fim: "2026-09-09" }, "2026-10-21").k, "vencido");
assert.equal(P.situacao({ status: "autorizado", ini: "2026-10-01", fim: "2026-11-30" }, "2026-10-21").k, "vigente");

// previsto x realizado
const pr = P.previstoRealizado([full], [{ sid: "s41", qtd: 19 }, { sid: "s07", qtd: 18 }, { sid: "s06", qtd: 1 }], "2026-08-01", "2026-08-31", svcs);
const m = Object.fromEntries(pr.map((x) => [x.sid, x]));
assert.equal(m.s41.dif, 1); assert.equal(m.s07.dif, 0); assert.equal(m.s06.foraDoPlano, true); assert.equal(m.s08.realizado, 0); assert.equal(m.s08.previsto, 8);

// diff
const v2 = { ...full, itens: [{ sid: "s41", qtd: 2, freq: "dia" }, { sid: "s17", qtd: 1, freq: "dia" }], pacote: "s06" };
const d = P.diffVersoes(full, v2, svcs);
console.log(d);
assert.equal(d.length, 4);

// ---- caso real (Crispina, set/2026): gerenciamento 1x em dias alternados, 17/09 a 30/09 ----
assert.equal(P.diasAlternados("2026-09-17", "2026-09-17", "2026-09-30"), 7);
assert.equal(P.diasAlternados("2026-09-17", "2026-09-18", "2026-09-30"), 6);   // 19, 21, ..., 29
assert.equal(P.diasAlternados("2026-09-17", "2026-09-01", "2026-09-16"), 0);
assert.equal(P.diasAlternados("2026-09-17", "2026-10-01", "2026-10-31"), 16);  // 01/10, 03/10, ..., 31/10
const cr = { id: "c", pac: "x", versao: 1, status: "autorizado", ini: "2026-09-17", fim: "2026-09-30", pacote: "s05", pacoteFreq: "alternados", sugerida: "", motivo: "",
  escala: {}, pontos: 0, relatorios: [], operadora: "", autorizacao: "", medico: "x", crm: "", objetivos: "", alta: "", reavaliacao: "", codSesab: "102.769",
  itens: [
    { sid: "s28", qtd: 1, freq: "48h" },                                            // alginato de prata, troca a cada 48 h
    { sid: "s32", qtd: 1, freq: "periodo" },                                        // creme de barreira
    { sid: "s47", qtd: 2, freq: "dia", ini: "2026-09-22", fim: "2026-09-30" },      // suplemento 2x/dia a partir de 22/09
    { sid: "s08", qtd: 3, freq: "semana" },                                         // fisioterapia (inclusa)
  ] };
const crl = Object.fromEntries(P.linhasPrevistas(cr, "2026-09-01", "2026-09-30", svcs).map((l) => [l.sid, l]));
assert.equal(crl.s05.qtd, 7, "7 diárias em dias alternados");
assert.equal(crl.s28.qtd, 7); assert.equal(crl.s32.qtd, 1);
assert.equal(crl.s47.qtd, 18, "suplemento a partir de 22/09 = 18"); assert.equal(crl.s47.ini, "2026-09-22");
const co = P.orcamento(cr, svcs, rules);
console.log("Crispina previsto:", co.cobrado, "(fatura real R$ 3.673,80 com 9 curativos; previsto com 7 =", (3673.80 - 2 * 90.21).toFixed(2) + ")");
assert.equal(co.cobrado, 3493.38);
// item fora do período do PAD é recusado no envio
assert.ok(P.pendenciasPad({ ...cr, itens: [{ sid: "s47", qtd: 1, freq: "dia", ini: "2026-10-05" }] }, E).some((x) => x.includes("fora do período")));
// escala desligada não é exigida
assert.equal(P.pendenciasPad({ ...cr, usarEscala: false }, E).length, 0);
assert.ok(P.pendenciasPad({ ...cr, usarEscala: true }, E).some((x) => x.includes("complexidade")));

// ---- aditivo aprovado entra na previsão; solicitado/negado não ----
const adit = { id: "ad1", codigo: "61329", tipo: "Antibioticoterapia", ini: "2026-09-19", fim: "2026-09-25", status: "aprovado", obs: "", itens: [{ sid: "s40", qtd: 2, freq: "dia" }] };
const cra = { ...cr, aditivos: [adit] };
const cal = P.linhasPrevistas(cra, "2026-09-01", "2026-09-30", svcs).filter((l) => l.sid === "s40");
assert.equal(cal.length, 1); assert.equal(cal[0].qtd, 14);
const oa = P.orcamento(cra, svcs, rules);
assert.equal(oa.aditivos, 2456.58); // 14 × R$ 175,47 (acima do limite de medicamento do pacote: cobrado)
assert.equal(P.linhasPrevistas({ ...cr, aditivos: [{ ...adit, status: "solicitado" }] }, "2026-09-01", "2026-09-30", svcs).some((l) => l.sid === "s40"), false);
const prr = P.previstoRealizado([cra], [{ sid: "s40", qtd: 14 }], "2026-09-01", "2026-09-30", svcs);
assert.equal(prr.find((x) => x.sid === "s40").dif, 0);
console.log("OK pad");
