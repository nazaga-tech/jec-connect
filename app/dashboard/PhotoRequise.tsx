"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PhotoRequise({ id }: { id: string }) {
  const router = useRouter();
  const [info, setInfo] = useState("");
  async function envoyer(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type) || f.size > 2 * 1024 * 1024) return setInfo("Choisissez une photo JPEG, PNG ou WebP de moins de 2 Mo.");
    const supabase = createClient();
    const chemin = `${id}/avatar-${Date.now()}`;
    const { error } = await supabase.storage.from("avatars").upload(chemin, f, { contentType: f.type });
    if (error) return setInfo("Envoi impossible. Réessayez.");
    await supabase.from("profiles").update({ avatar_url: supabase.storage.from("avatars").getPublicUrl(chemin).data.publicUrl }).eq("id", id);
    router.refresh();
  }
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="carte-ui border-t-4 border-or p-8">
        <h1 className="text-2xl font-extrabold">Ajoutez votre photo</h1>
        <p className="mt-2 text-slate-600">Une photo de profil est obligatoire : elle apparaît sur votre carte de jéciste et aide les responsables à valider votre compte.</p>
        <label className="btn-or mt-6 cursor-pointer">Choisir une photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={envoyer} className="sr-only" /></label>
        {info && <p role="alert" className="mt-3 text-sm text-red-600">{info}</p>}
      </div>
    </main>
  );
}
