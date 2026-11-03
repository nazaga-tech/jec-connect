import { plateauInitial, coupsLegaux, appliquer } from "./dames";
const vide = () => Array(100).fill(" ");
const mk = (pairs: [number, string][]) => { const b = vide(); pairs.forEach(([i, p]) => (b[i] = p)); return b.join(""); };
let echecs = 0;
const ok = (n: string, c: boolean) => { if (!c) echecs++; console.log(c ? "OK  " : "FAIL", n); };
ok("ouverture blancs = 9 coups", coupsLegaux(plateauInitial(), 1).length === 9);
ok("ouverture noirs = 9 coups", coupsLegaux(plateauInitial(), 2).length === 9);
// pion blanc en 55 (r5,c5), noir en 44 (r4,c4) : prise vers 33
let m = coupsLegaux(mk([[55, "w"], [44, "b"]]), 1);
ok("prise simple", m.length === 1 && m[0].path.join() === "33" && m[0].captured.join() === "44");
// prise arrière par un pion : blanc 44, noir 55 -> atterrit 66
m = coupsLegaux(mk([[44, "w"], [55, "b"]]), 1);
ok("prise arrière", m.length === 1 && m[0].path.join() === "66");
// prise obligatoire : blanc peut aussi avancer ailleurs mais doit prendre
m = coupsLegaux(mk([[55, "w"], [44, "b"], [91, "w"]]), 1);
ok("prise obligatoire", m.every((x) => x.captured.length === 1));
// majorité : A prend 1, B prend 2
m = coupsLegaux(mk([[55, "w"], [44, "b"], [22, "b"], [97, "w"], [86, "b"]]), 1);
ok("majoritaire (2 prises)", m.length >= 1 && m.every((x) => x.captured.length === 2));
// dame volante : W en 99, noir en 44, case 33 libre -> prise avec atterrissages 33,22,11,00
m = coupsLegaux(mk([[99, "W"], [44, "b"]]), 1);
ok("dame volante", m.length === 4 && m.every((x) => x.captured[0] === 44));
// promotion
const p = appliquer(mk([[11, "w"]]), { from: 11, path: [0], captured: [] });
ok("promotion", p[0] === "W");
// plus de coups = perdu
ok("aucun coup", coupsLegaux(mk([[0, "w"]]), 2).length === 0);
// pas de double saut d'une même pièce
m = coupsLegaux(mk([[55, "w"], [44, "b"], [22, "b"], [24, "b"], [42, "b"]]), 1);
ok("boucle sans doublon", m.every((x) => new Set(x.captured).size === x.captured.length));

if (echecs) { console.error(echecs + " test(s) en échec"); process.exit(1); }
