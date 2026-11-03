import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { deconnexion } from "@/lib/auth-actions";

export const metadata = { title: "JEC CONNECT · Saint-Joseph Artisan", description: "La communauté qui unit les générations de jécistes" };

export default async function RootLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <header className="sticky top-0 z-30 border-b border-black/5 bg-white/80 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-nuit font-serif text-sm font-extrabold text-or ring-2 ring-or">JEC</span>
              <span className="font-serif text-lg font-extrabold tracking-tight">CONNECT</span>
            </Link>
            <div className="flex items-center gap-4 text-sm font-semibold">
              {user ? (
                <>
                  <Link href="/dashboard" className="btn !py-2">Mon espace</Link>
                  <form action={deconnexion}><button className="text-slate-600 underline-offset-4 hover:underline">Se déconnecter</button></form>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-slate-700 hover:text-ciel">Se connecter</Link>
                  <Link href="/inscription" className="btn-or !py-2">Rejoindre</Link>
                </>
              )}
            </div>
          </nav>
        </header>
        {children}
        <footer className="mt-20 bg-nuit text-slate-300">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8 text-sm">
            <p><span className="font-serif font-bold text-white">JEC CONNECT</span> · Saint-Joseph Artisan · <span className="text-or">Voir. Juger. Agir.</span></p>
            <p><Link href="/confidentialite" className="hover:text-white">Confidentialité</Link> · <Link href="/conditions" className="hover:text-white">Conditions d’utilisation</Link></p>
          </div>
        </footer>
      </body>
    </html>
  );
}
