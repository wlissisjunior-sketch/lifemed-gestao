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
console.log("OK pad");
