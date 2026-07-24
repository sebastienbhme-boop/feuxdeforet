"use client";

import type { FirePoint } from "@/lib/types";
import SatelliteTimeline from "./SatelliteTimeline";
import LastSatelliteUpdates from "./LastSatelliteUpdates";

const FAQ_ITEMS = [
  {
    question: "D'où viennent les données ?",
    answer:
      "De deux sources publiques : NASA FIRMS (détections thermiques des satellites VIIRS) et Copernicus EFFIS (foyers actifs européens). Aucune saisie manuelle.",
  },
  {
    question: "Les données sont-elles en direct, en continu ?",
    answer:
      "Non. Les satellites VIIRS (Suomi NPP, NOAA-20, NOAA-21) sont en orbite polaire : chacun ne survole la France que 2 fois par jour, pas en continu. Résultat : les données arrivent par paquets à chaque passage, avec des trous de plusieurs heures entre deux passages, pas un flux ininterrompu.",
  },
  {
    question: "À quelle heure les satellites passent-ils ?",
    answer:
      "Environ en début d'après-midi (12h40-14h, heure de Paris) et en pleine nuit (00h40-02h). Les 3 satellites sont décalés de quelques dizaines de minutes entre eux, ce qui étale chaque créneau sur 1h-1h30.",
  },
  {
    question: "Pourquoi une donnée n'apparaît-elle pas tout de suite après un passage ?",
    answer:
      "NASA publie ses données en \"quasi temps réel\" (NRT) : il faut compter 1 à 3 heures entre le passage réel du satellite et la mise à disposition de la donnée via l'API.",
  },
  {
    question: "Le site interroge-t-il l'API en continu ?",
    answer:
      "Non, pour économiser les appels : toutes les 10 minutes pendant les créneaux où un passage satellite est probable (12h-17h et 0h-5h), et seulement 1 fois par heure en dehors, en filet de sécurité. Le serveur garde aussi les résultats en cache 10 minutes.",
  },
  {
    question: "Pourquoi le nombre de foyers ne change pas quand je recharge la page ?",
    answer:
      "C'est normal en dehors des créneaux de passage : il n'y a simplement aucune nouvelle détection satellite disponible depuis le dernier passage. Ce n'est pas un bug.",
  },
];

export default function FaqModal({ fires, onClose }: { fires: FirePoint[]; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 sm:p-4"
      style={{ zIndex: 10000 }}
      onClick={onClose}
    >
      <div
        className="h-full w-full overflow-y-auto bg-white p-4 shadow-xl dark:bg-zinc-900 sm:h-auto sm:max-h-[85vh] sm:max-w-lg sm:rounded-lg sm:p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Comment ça marche ?
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded p-2 text-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>
        <div className="mb-4 space-y-3">
          <SatelliteTimeline />
          <LastSatelliteUpdates fires={fires} />
        </div>
        <dl className="space-y-4">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question}>
              <dt className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {item.question}
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {item.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
