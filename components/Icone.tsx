const P: Record<string, string> = {
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  juger: '<path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0L5 7ZM19 7l-3 7a3 3 0 0 0 6 0l-3-7ZM8 21h8"/>',
  agir: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  carte: '<rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M14 10h5M14 14h4M5 16c.5-1.5 2-2 3-2s2.5.5 3 2"/>',
  dossier: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/>',
  mallette: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 13h20"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.6A8 8 0 1 1 21 12Z"/>',
  jeux: '<rect x="2" y="7" width="20" height="11" rx="4"/><path d="M7 10v5M4.5 12.5h5M15 11h.01M18 14h.01"/>',
  gateau: '<path d="M4 20h16v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6ZM12 12V8M12 5v.01"/>',
  cloche: '<path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7ZM10 20a2 2 0 0 0 4 0"/>',
  annuaire: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6M16 4.5a3.5 3.5 0 0 1 0 7M22 20c0-2.8-1.7-4.8-4-5.6"/>',
  profil: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/>',
  actu: '<path d="M4 5h13a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5ZM19 9h2v8a2 2 0 0 1-2 2M8 9h7M8 13h7"/>',
};
export default function Icone({ n, className = "h-6 w-6" }: { n: string; className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: P[n] ?? "" }} />;
}
