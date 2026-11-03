# Mise en ligne de JEC CONNECT

## 1. Base de données (Supabase)
1. Créez le projet sur supabase.com (choisissez la région la plus proche de vos membres).
2. Dans *SQL Editor*, exécutez dans l'ordre : `schema.sql`, `phase4.sql`, `phase5.sql`, `phase6a.sql`, `phase6b.sql`, `phase7.sql`, `phase8.sql`.
3. *Authentication > Providers > Email* : laissez **Confirm email** activé.
4. *Authentication > URL Configuration* : mettez l'adresse du site en **Site URL** (ex. `https://jec-connect.vercel.app`, puis votre domaine)
   et ajoutez `https://VOTRE-ADRESSE/**` dans **Redirect URLs** (sans cela, les liens des e-mails ne fonctionnent pas).
5. *Authentication > SMTP Settings* : configurez un vrai service d'envoi d'e-mails (Resend, Brevo, etc.). L'envoi par défaut de Supabase est très limité :
   à l'ouverture, plusieurs dizaines d'inscriptions le saturent et les confirmations n'arrivent plus.
6. Vérifiez que **Realtime** est actif sur la table `messages` et `matchs` (Database > Replication) si `phase5.sql` ou `phase6b.sql` a signalé une erreur.

## 2. Code sur GitHub
1. Créez un dépôt **privé** sur github.com, puis poussez le dossier (`git init`, `git add .`, `git commit`, `git push`).
2. Vérifiez que `.env.local` n'est PAS dans le dépôt (il est ignoré par défaut).

## 3. Vercel
1. *Add New > Project*, importez le dépôt.
2. *Environment Variables* : ajoutez
   - `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Supabase > Settings > API),
   - `SUPABASE_SERVICE_ROLE_KEY` (clé « service_role », **secrète**, jamais préfixée par NEXT_PUBLIC_).
3. *Deploy*. Chaque `git push` redéploie automatiquement.
4. Vérifiez les conditions du forfait gratuit de Vercel pour un usage associatif.

## 4. Nom de domaine
Vercel > Settings > Domains : ajoutez votre domaine et créez chez votre registrar les enregistrements DNS indiqués. Mettez ensuite le domaine dans **Site URL** et **Redirect URLs** de Supabase (étape 1.4).

## 5. Premier super administrateur
1. Inscrivez-vous sur le site et confirmez votre e-mail.
2. Dans Supabase *SQL Editor* :
   `update public.profiles set role='super_admin', statut='approuve' where id=(select id from auth.users where email='VOTRE_EMAIL');`
3. Connectez-vous : le bouton « Administration » apparaît. Créez ensuite les groupes (`/admin/moderation`), ajoutez vos questions de QCM, puis nommez les validateurs et modérateurs (`/admin/membres`).

## 6. Tests à faire avant d'inviter les membres
Créez 3 comptes (membre, validateur, super admin) et vérifiez :
- [ ] Un compte en attente ne voit aucune page de l'espace membre, et ne peut pas écrire dans le chat.
- [ ] Un compte refusé ou suspendu est bloqué.
- [ ] Un membre qui tape `/admin` dans l'adresse est renvoyé vers son espace.
- [ ] Un membre ne peut pas se donner un rôle (essayez depuis la console du navigateur : la base refuse).
- [ ] Dans l'annuaire, aucun téléphone ni date de naissance n'apparaît ; la date n'apparaît dans « Anniversaires » que si la case est cochée.
- [ ] Un membre bloqué ne peut plus écrire en privé à celui qui l'a bloqué.
- [ ] Le QCM : on ne peut pas rejouer plus de 10 fois par jour ; les points arrivent dans le classement.
- [ ] Dames : une partie complète à deux comptes (deux navigateurs), puis un abandon.
- [ ] « Mot de passe oublié » : le lien reçu par e-mail permet de choisir un nouveau mot de passe.
- [ ] Le site est lisible sur téléphone.
- [ ] Ludo : une partie à deux comptes (lancer le dé, sortir un pion avec un 6, capturer, arriver au centre).
- [ ] Vidéo d'accueil : collez un lien YouTube dans /admin/video, elle apparaît sur la page d'accueil.
- [ ] Un jéciste actif propose un document : il apparaît dans /admin/validations, pas encore chez les autres.
- [ ] `npm test` : les règles de dames et de Ludo passent.

## 7. Sauvegardes et suivi
- Supabase > Database > Backups : regardez ce que votre offre inclut. Sinon, faites un export régulier de la base (`pg_dump`) et conservez-le hors de Supabase.
- Les projets de l'offre gratuite peuvent être mis en pause en cas d'inactivité prolongée : vérifiez les conditions de votre offre.
- Relisez les pages `/confidentialite` et `/conditions` (zones entre crochets) avant l'ouverture.
- Le téléphone et la date de naissance sont lisibles par les responsables : limitez le nombre de personnes qui ont ce rôle.
