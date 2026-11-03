export function joursRestants(naissance: string) {
  const d = new Date(naissance), now = new Date();
  const debut = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let prochain = new Date(now.getFullYear(), d.getUTCMonth(), d.getUTCDate());
  if (prochain < debut) prochain = new Date(now.getFullYear() + 1, d.getUTCMonth(), d.getUTCDate());
  return Math.round((prochain.getTime() - debut.getTime()) / 86400000);
}
