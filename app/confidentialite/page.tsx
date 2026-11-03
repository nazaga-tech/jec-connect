const blocs: [string, string][] = [
  ["Qui sommes-nous ?", "JEC CONNECT est une plateforme privée destinée aux jécistes en fonction et aux anciens jécistes. Responsable du traitement : [nom de l’association / du bureau], contact : [adresse e-mail]."],
  ["Données collectées", "Identité (nom, prénom, surnom, sexe, date de naissance), adresse e-mail, année d’adhésion, section et paroisse, responsabilité ou profession, entreprise, numéro de téléphone, photo de profil, messages, parties de jeux et points."],
  ["Pourquoi ces données ?", "Gérer les inscriptions, maintenir le lien entre les générations, permettre la messagerie, les anniversaires, les jeux et le mentorat. Aucune donnée n’est vendue ni utilisée à des fins publicitaires."],
  ["Qui voit quoi ?", "Seuls les membres approuvés accèdent à l’annuaire (nom, surnom, photo, année, section ou profession). La date de naissance n’est visible que si vous l’avez choisi. Le numéro de téléphone n’est jamais visible par les autres membres. Les responsables habilités peuvent consulter les fiches pour valider les inscriptions et modérer."],
  ["Hébergement", "Les données sont hébergées chez Supabase (base de données, fichiers) et le site chez Vercel. [Indiquer la région choisie pour la base de données.]"],
  ["Conservation", "Vos données sont conservées tant que votre compte existe. Après suppression du compte, elles sont effacées, sauf obligation légale."],
  ["Vos droits", "Vous pouvez demander l’accès, la correction ou la suppression de vos données en écrivant à l’adresse de contact ci-dessus. Les corrections de nom, de date de naissance et de catégorie passent par un responsable."],
];
export const metadata = { title: "Politique de confidentialité · JEC CONNECT" };
export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-bold">Politique de confidentialité</h1>
      <p className="mt-2 rounded-lg bg-or/25 p-3 text-sm">Texte type à compléter (zones entre crochets) et à faire relire par une personne compétente avant l’ouverture, notamment au regard de la loi ivoirienne sur la protection des données personnelles.</p>
      {blocs.map(([t, d]) => (<section key={t} className="mt-6"><h2 className="text-xl font-semibold">{t}</h2><p className="mt-1 text-slate-700">{d}</p></section>))}
    </main>
  );
}
