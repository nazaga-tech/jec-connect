import Link from "next/link";
import type { ReactNode } from "react";
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <nav className="bg-nuit text-sm font-semibold text-white">
        <div className="mx-auto flex max-w-5xl gap-5 overflow-x-auto px-4 py-2.5">
          <Link href="/admin">Inscriptions</Link>
          <Link href="/admin/membres">Membres</Link>
          <Link href="/admin/validations">Validations</Link>
          <Link href="/admin/contenus">Contenus</Link>
          <Link href="/admin/video">Vidéo</Link>
          <Link href="/admin/apropos">Textes JEC</Link>
          <Link href="/admin/moderation">Modération</Link>
          <Link href="/admin/questions">Questions QCM</Link>
        </div>
      </nav>
      {children}
    </>
  );
}
