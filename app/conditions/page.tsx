const blocs: [string, string][] = [
  ["Accès", "JEC CONNECT est réservé aux jécistes en fonction et aux anciens jécistes. Chaque inscription est vérifiée puis validée par un responsable habilité, qui peut la refuser."],
  ["Respect et bienveillance", "Les échanges doivent rester respectueux, conformes aux valeurs de la JEC. Sont interdits : harcèlement, propos haineux, contenus choquants, publicité, usurpation d’identité."],
  ["Modération", "Tout membre peut signaler un message ou en bloquer l’auteur. Les modérateurs peuvent supprimer un contenu et les responsables suspendre un compte en cas de manquement."],
  ["Jeux et points", "Les points sont purement virtuels : aucune mise d’argent, aucun gain, aucun retrait. Toute tentative de fraude (parties arrangées, comptes multiples) peut entraîner la remise à zéro des points ou la suspension."],
  ["Votre compte", "Gardez votre mot de passe confidentiel. Vous pouvez demander la suppression de votre compte à tout moment."],
  ["Évolution", "Ces conditions peuvent évoluer ; les membres seront informés des changements importants."],
];
export const metadata = { title: "Conditions d’utilisation · JEC CONNECT" };
export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Conditions d’utilisation</h1>
      <p className="mt-2 rounded-lg bg-or/25 p-3 text-sm">Texte type à adapter et à faire valider par le bureau de la JEC.</p>
      {blocs.map(([t, d]) => (<section key={t} className="mt-6"><h2 className="text-xl font-semibold">{t}</h2><p className="mt-1 text-slate-700">{d}</p></section>))}
    </main>
  );
}
