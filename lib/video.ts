export type Video = { type: "youtube"; id: string } | { type: "fichier"; url: string };
export function lireVideo(url: string): Video | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([A-Za-z0-9_-]{11})/);
  if (yt) return { type: "youtube", id: yt[1] };
  if (/^https:\/\/[^\s]+\.(mp4|webm)(\?[^\s]*)?$/i.test(url)) return { type: "fichier", url };
  return null;
}
