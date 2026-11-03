// Ludo à 2 joueurs, 4 pions chacun. Joueur 1 part de la case 0, joueur 2 de la case 26 d'une piste de 52 cases.
// Position d'un pion : -1 = à la base, 0..50 = sur la piste (relative à son départ), 51..55 = couloir final, 56 = arrivé.
export type Etat = { p: [number[], number[]]; de: number | null; dernier?: { j: 1 | 2; v: number } };
export const DEPART = [0, 26];
export const SURES = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
export const FIN = 56;
export const etatInitial = (): Etat => ({ p: [[-1, -1, -1, -1], [-1, -1, -1, -1]], de: null });
export const absCase = (j: 1 | 2, p: number) => (DEPART[j - 1] + p) % 52;

export function pionsJouables(e: Etat, j: 1 | 2, de: number): number[] {
  const out: number[] = [];
  e.p[j - 1].forEach((p, i) => {
    if (p === -1) { if (de === 6) out.push(i); }
    else if (p < FIN && p + de <= FIN) out.push(i);
  });
  return out;
}

export function jouerPion(e: Etat, j: 1 | 2, i: number, de: number): { etat: Etat; rejoue: boolean; gagne: boolean } {
  const p = e.p.map((a) => [...a]) as [number[], number[]];
  const autre: 1 | 2 = j === 1 ? 2 : 1;
  const me = p[j - 1], adv = p[autre - 1];
  const np = me[i] === -1 ? 0 : me[i] + de;
  me[i] = np;
  let capture = false;
  if (np <= 50) {
    const a = absCase(j, np);
    if (!SURES.has(a)) {
      const idx = adv.map((q, k) => (q >= 0 && q <= 50 && absCase(autre, q) === a ? k : -1)).filter((k) => k >= 0);
      if (idx.length === 1) { adv[idx[0]] = -1; capture = true; } // deux pions adverses côte à côte forment un blocage
    }
  }
  const gagne = me.every((x) => x === FIN);
  return { etat: { p, de: null, dernier: e.dernier }, rejoue: !gagne && (de === 6 || capture || np === FIN), gagne };
}
