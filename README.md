# Hand Institut — site vitrine

Site statique de l'institut de beauté **Hand Institut** (10 rue Keravel, 29200 Brest).
Objectif : faire prendre rendez-vous (Planity ou téléphone).

Aucune étape de build : ouvrir `index.html` suffit. Pour tester en local avec un vrai serveur :

```bash
python3 -m http.server 8000
```

Puis http://localhost:8000.

## Direction artistique

Le fil rouge est **l'ongle** : arches, doigts qui montent, gouttes de vernis, reflet qui glisse.

| Rôle | Couleur |
|---|---|
| Fond principal | Ivoire `#F6EEE8` |
| Fond secondaire, nude | Poudre `#EBD7CE` |
| Marque (imposée) | Cacao `#6E4742` |
| Texte, fonds profonds | Nuit `#2A1917` |
| Gris (imposé) | Brume `#A1A9AC` |
| Accent (rouge des ongles) | Laque `#A1182B` |
| Reflet doré, survols | Champagne `#D9AE94` |

Typographies, auto-hébergées : **Bodoni Moda** (titres, axe optique variable) + **Jost** (texte).

## Structure

```
index.html        contenu, SEO, données structurées LocalBusiness
css/style.css     styles (tokens en tête de fichier)
js/main.js        mouvement (GSAP, ScrollTrigger, SplitText, Lenis) et interactions
vendor/           GSAP 3.15, ScrollTrigger, SplitText, DrawSVG, Lenis 1.3 (copies locales)
fonts/            Bodoni Moda, Jost (woff2, licence SIL OFL)
img/              photos du salon et des réalisations (webp) + texture de grain
```

## Sections

Préchargeur · Hero (parallax multicouche) · Bandeaux défilants · Rendez-vous étape par étape (section épinglée) ·
Prestations (défilement horizontal) · Chiffres clés · Nuancier interactif · Le salon (la porte s'ouvre) ·
Galerie · Avis · Appel à l'action · Nous trouver (carte, horaires, statut ouvert/fermé) · Footer.

## Mouvement, accessibilité, performance

- Le site reste complet et lisible **sans JavaScript** et avec **« réduire les animations »** (pas de smooth scroll, pas de sections épinglées, compteurs à leur valeur finale).
- Sur mobile et tablette (< 900 px) : pas de sections épinglées, prestations en carrousel tactile, effets lourds retirés.
- Contrastes AA, navigation clavier, lien d'évitement, alternatives textuelles, carrousel avec pause, précédent/suivant et annonce de position. Audit axe-core : 0 violation (bureau et mobile).
- Polices et bibliothèques servies depuis le site (aucun appel tiers hormis Google Maps et Planity).

## À mettre à jour

- **Photos** : celles fournies font environ 200 × 300 px. Elles sont agrandies et grainées, ce qui tient dans les cadres actuels, mais des originaux d'au moins 1200 px de large donneront un rendu bien plus net. Remplacer les fichiers de `img/` (mêmes noms) suffit.
- **Chiffres clés** : issus des horaires (5 jours, 44 h par semaine) et de la réservation en ligne. Pour des chiffres plus parlants (années d'expérience, nombre de clientes), modifier les `data-count` dans la section « chiffres ».
- **Tarifs** : non fournis, donc non affichés ; le site renvoie vers Planity.
- **Adresse du site** : ajouter `<link rel="canonical">` et une image `og:image` (URL absolue) une fois le domaine connu.
- **Mentions légales** : à ajouter (éditeur, hébergeur, SIRET) avant la mise en ligne.
- **Horaires** : dans le HTML (tableau `#hours`) et dans le JSON-LD de `index.html`, plus l'objet `schedule` de `js/main.js` pour le statut « ouvert maintenant ».
