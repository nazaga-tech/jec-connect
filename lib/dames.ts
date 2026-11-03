// Jeu de dames internationales (10x10) : prise obligatoire, prise majoritaire,
// pions qui prennent en arrière, dames volantes. Joueur 1 = blancs (bas), joueur 2 = noirs (haut).
export type Move = { from: number; path: number[]; captured: number[] };
const N = 10;
export const row = (i: number) => Math.floor(i / N);
export const col = (i: number) => i % N;
const inb = (r: number, c: number) => r >= 0 && r < N && c >= 0 && c < N;
const DIRS: [number, number][] = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const couleur = (p: string) => p.toLowerCase();
export const estRoi = (p: string) => p !== " " && p === p.toUpperCase();

export function plateauInitial(): string {
  let s = "";
  for (let i = 0; i < 100; i++) {
    const r = row(i), c = col(i);
    s += (r + c) % 2 === 1 ? (r < 4 ? "b" : r > 5 ? "w" : " ") : " ";
  }
  return s;
}

function captures(b: string[], from: number): Move[] {
  const piece = b[from], me = couleur(piece), king = estRoi(piece);
  const w = [...b]; w[from] = " ";
  const out: Move[] = [];
  const dfs = (pos: number, path: number[], cap: number[]) => {
    let found = false;
    for (const [dr, dc] of DIRS) {
      let r = row(pos) + dr, c = col(pos) + dc;
      if (king) while (inb(r, c) && w[r * N + c] === " ") { r += dr; c += dc; }
      if (!inb(r, c)) continue;
      const cible = r * N + c, t = w[cible];
      if (t === " " || couleur(t) === me || cap.includes(cible)) continue;
      let lr = r + dr, lc = c + dc;
      while (inb(lr, lc) && w[lr * N + lc] === " ") {
        found = true;
        dfs(lr * N + lc, [...path, lr * N + lc], [...cap, cible]);
        if (!king) break;
        lr += dr; lc += dc;
      }
    }
    if (!found && cap.length > 0) out.push({ from, path, captured: cap });
  };
  dfs(from, [], []);
  return out;
}

function simples(b: string[], from: number): Move[] {
  const piece = b[from], king = estRoi(piece), avant = couleur(piece) === "w" ? -1 : 1;
  const out: Move[] = [];
  for (const [dr, dc] of DIRS) {
    if (!king && dr !== avant) continue;
    let r = row(from) + dr, c = col(from) + dc;
    while (inb(r, c) && b[r * N + c] === " ") {
      out.push({ from, path: [r * N + c], captured: [] });
      if (!king) break;
      r += dr; c += dc;
    }
  }
  return out;
}

export function coupsLegaux(plateau: string, joueur: 1 | 2): Move[] {
  const me = joueur === 1 ? "w" : "b", b = plateau.split("");
  const mine = b.map((p, i) => (p !== " " && couleur(p) === me ? i : -1)).filter((i) => i >= 0);
  const prises = mine.flatMap((i) => captures(b, i));
  if (prises.length) {
    const max = Math.max(...prises.map((m) => m.captured.length));
    return prises.filter((m) => m.captured.length === max);
  }
  return mine.flatMap((i) => simples(b, i));
}

export function appliquer(plateau: string, m: Move): string {
  const b = plateau.split(""), p = b[m.from], fin = m.path[m.path.length - 1];
  b[m.from] = " "; m.captured.forEach((i) => (b[i] = " "));
  let np = p;
  if (!estRoi(p)) { if (p === "w" && row(fin) === 0) np = "W"; if (p === "b" && row(fin) === 9) np = "B"; }
  b[fin] = np;
  return b.join("");
}
export const memeCoup = (a: Move, b: Move) => a.from === b.from && a.path.join() === b.path.join();
