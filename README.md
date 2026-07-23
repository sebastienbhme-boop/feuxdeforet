## Feux de forêt en direct

Application Next.js qui affiche une carte en direct des feux de forêt actifs (France métropolitaine). Au clic sur un foyer, un bouton ouvre dans un nouvel onglet une recherche Google Mode IA pour trouver l'actualité et les vidéos (YouTube, TikTok) liées au sinistre.

### Sources de données

- **Feux** : [NASA FIRMS](https://firms.modaps.eosdis.nasa.gov/) (satellite VIIRS, quasi temps réel) + [Copernicus EFFIS](https://effis.jrc.ec.europa.eu/) pour l'Europe.
- **Lieu** : les coordonnées des foyers sont converties en nom de commune via [Nominatim](https://nominatim.openstreetmap.org/) (OpenStreetMap, gratuit, sans clé).
- **Actualités/vidéos** : bouton "Recherche Google" qui ouvre un nouvel onglet avec une recherche Google Mode IA demandant explicitement des vidéos YouTube et TikTok du sinistre.

### Configuration

1. Copier `.env.example` en `.env.local`.
2. Renseigner `FIRMS_MAP_KEY` (gratuit) pour avoir les vraies données de feux.

Sans clé, l'app tourne en mode démonstration (données fictives, bandeau d'avertissement affiché).

### Développement

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

### Limites connues

- EFFIS expose ses données via un endpoint WFS public dont le schéma peut évoluer ; le connecteur échoue silencieusement (fail-soft) si le format change, pour ne pas casser l'affichage des données FIRMS.
- Le rafraîchissement des foyers se fait toutes les heures côté client, ce qui correspond au rythme de mise à jour des sources satellite.
