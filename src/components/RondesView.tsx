import React, { useState } from 'react';
import { RondeInspection, RondeItem, RondeConstatDetail } from '../types';
import { formatDateFr, getTodayIso } from '../utils/dates';
import {
  Footprints,
  Calendar,
  Building,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Camera,
  Download,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Check,
  Search,
  Filter,
  UserCheck,
  ListChecks,
  X,
  Maximize2,
} from 'lucide-react';
import { SITES_SICDA, INSPECTEURS_HSE } from '../data/initialData';
import { ConstatPhotoManager } from './ConstatPhotoManager';

// Definition of all 12 workshops and premises (Ensemble des ateliers et locaux)
export const TOUS_ATELIERS_LOCAUX_DEF: Record<
  string,
  { type: 'Atelier' | 'Local'; items: string[] }
> = {
  'Atelier Électrique': {
    type: 'Atelier',
    items: [
      'Etat des coffrets électriques',
      'Extincteur',
      'Eclairage',
      'Respect de nettoyage et rangement (5S)',
      'Respect du port des EPI',
      'Etat des infrastructures',
      'Respect du tri des déchets',
      'Blocs de secours',
    ],
  },
  'Atelier Outillage': {
    type: 'Atelier',
    items: [
      "Respect des dispositifs de sécurité (carters, chemin de câbles, arrêt d'urgence, fin de course…)",
      'Détecteur incendie',
      'Respect du tri des déchets',
      'Respect de nettoyage et rangement',
      'Extincteur',
      'Blocs de secours',
      'Respect du port des EPI',
      'Etat des infrastructures',
      'Eclairage',
    ],
  },
  'Atelier Mélange': {
    type: 'Atelier',
    items: [
      'Respect de nettoyage et rangement',
      "Respect des dispositifs de sécurité (carters, chemin de câbles, arrêt d'urgence, fin de course…)",
      'Respect du port des EPI',
      'Eclairage',
      'Déclencheur manuel',
      'Extincteur',
      'Respect du tri des déchets',
      'Détecteur incendie',
      'Blocs de secours',
      'Etat des infrastructures',
    ],
  },
  'Atelier Broyage': {
    type: 'Atelier',
    items: [
      'Respect du port des EPI',
      "Respect des dispositifs de sécurité (carters, chemin de câbles, arrêt d'urgence, fin de course…)",
      'Respect du tri des déchets',
      'Détecteur incendie',
      'RIA',
      'Extincteur',
      'Respect du passage piéton',
      'Respect des zones de stockage',
      'Vérification de l’état de sécurité des machines',
    ],
  },
  'Atelier Production': {
    type: 'Atelier',
    items: [
      'RIA',
      'Extincteur',
      'Respect du tri des déchets',
      'Respect du port des EPI',
      'Blocs de secours',
      'Déclencheur manuel',
      'Armoire électrique',
    ],
  },
  'Magasin PR': {
    type: 'Atelier',
    items: [
      'Respect du rangement 5S',
      'Extincteur',
      'Blocs de secours',
      'Eclairage',
      'Respect de la gestion des produits chimiques',
      'RIA',
      'Utilisation des accès conforme',
      'Déclencheur manuel',
      'Détecteur incendie',
    ],
  },
  Administration: {
    type: 'Local',
    items: [
      'Extincteur',
      'Blocs de secours',
      'Issue de secours',
      'Eclairage',
      'Etat des infrastructures',
      'Etat des immobiliers',
      'Détecteur incendie',
      'Déclencheur manuel',
    ],
  },
  'Couloirs de stockage': {
    type: 'Local',
    items: [
      'Respect du rangement des zones',
      'Respect des accès en hauteur',
      'Issue de secours dégagée',
      'Extincteur',
      'RIA',
      'Détecteur incendie',
      'Eclairage',
      'Respect du port des EPI',
      'Respect du passage piétons',
    ],
  },
  Laboratoire: {
    type: 'Local',
    items: [
      'Extincteur',
      'Issue de secours',
      'Détecteur incendie',
      'Eclairage',
      'RIA',
      'Etat des infrastructures',
      'Rangement et nettoyage',
    ],
  },
  'WC / Réfectoire': {
    type: 'Local',
    items: ['Nettoyage', 'Etat des infrastructures'],
  },
  'Zone déchet': {
    type: 'Local',
    items: ['Collecte des déchets', 'Etat des bennes', 'Bac de rétention d’huile'],
  },
  'Poste garde': {
    type: 'Local',
    items: ['Extincteur', 'Etat de la centrale d’alarme'],
  },
};

interface RondesViewProps {
  rondes: RondeInspection[];
  currentUserName: string;
  onSaveRonde: (ronde: RondeInspection) => void;
  onDeleteRonde: (id: string) => void;
}

export const RondesView: React.FC<RondesViewProps> = ({
  rondes,
  currentUserName,
  onSaveRonde,
  onDeleteRonde,
}) => {
  const [subTab, setSubTab] = useState<'nouvelle' | 'historique' | 'rapport'>('nouvelle');
  const [selectedSite, setSelectedSite] = useState<string>(SITES_SICDA[0]);
  const [dateRonde, setDateRonde] = useState(getTodayIso());
  const [heureTournee, setHeureTournee] = useState('09:30');

  // Inspector selection based on requested list
  const [selectedInspecteur, setSelectedInspecteur] = useState<string>(() => {
    return INSPECTEURS_HSE.includes(currentUserName as any) ? currentUserName : INSPECTEURS_HSE[0];
  });

  // Filter for ateliers & locaux display
  const [zoneCategoryFilter, setZoneCategoryFilter] = useState<'TOUS' | 'ATELIERS' | 'LOCAUX'>('TOUS');
  const [searchTerm, setSearchTerm] = useState('');

  // Active form state for all 12 workshops and premises
  const [itemsState, setItemsState] = useState<Record<string, Record<string, RondeItem>>>(() => {
    const init: Record<string, Record<string, RondeItem>> = {};
    Object.keys(TOUS_ATELIERS_LOCAUX_DEF).forEach((atelier) => {
      init[atelier] = {};
      TOUS_ATELIERS_LOCAUX_DEF[atelier].items.forEach((itemName) => {
        init[atelier][itemName] = {
          name: itemName,
          t1: null,
          t2: null,
          observation: '',
        };
      });
    });
    return init;
  });

  // Accordion open/close state
  const [openAteliers, setOpenAteliers] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    Object.keys(TOUS_ATELIERS_LOCAUX_DEF).forEach((k, idx) => {
      init[k] = idx < 3; // Open first 3 by default
    });
    return init;
  });

  // Lightbox preview for full-screen photo viewing
  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  // Toggle Conforme / Non Conforme on single tour
  const handleToggleItemStatus = (atelier: string, itemName: string, val: 'ok' | 'bad') => {
    setItemsState((prev) => {
      const atelierItems = { ...prev[atelier] };
      const currentItem = atelierItems[itemName];
      const nextVal = currentItem.t1 === val ? null : val;

      const updatedItem: RondeItem = {
        ...currentItem,
        t1: nextVal,
        t2: nextVal, // Kept in sync for single tour
      };

      if (nextVal === 'bad' && !updatedItem.detail) {
        updatedItem.detail = {
          description: updatedItem.observation || itemName,
          cause: '',
          action: '',
          pilote: 'Chef d’atelier / Maintenance',
          statut: 'Ouvert',
          commentaire: '',
          datePrevue: getTodayIso(),
          dateRealisation: '',
          photos: [],
        };
      } else if (nextVal !== 'bad' && updatedItem.detail) {
        updatedItem.detail = null;
      }

      atelierItems[itemName] = updatedItem;
      return { ...prev, [atelier]: atelierItems };
    });
  };

  // Mark all items in an atelier/local as Conforme in 1-click
  const handleMarkAtelierAllConforme = (atelier: string) => {
    setItemsState((prev) => {
      const atelierItems = { ...prev[atelier] };
      Object.keys(atelierItems).forEach((itemName) => {
        atelierItems[itemName] = {
          ...atelierItems[itemName],
          t1: 'ok',
          t2: 'ok',
          detail: null,
        };
      });
      return { ...prev, [atelier]: atelierItems };
    });
  };

  const handleUpdateItemDetail = (
    atelier: string,
    itemName: string,
    updates: Partial<RondeConstatDetail>,
  ) => {
    setItemsState((prev) => {
      const atelierItems = { ...prev[atelier] };
      const item = { ...atelierItems[itemName] };
      if (item.detail) {
        item.detail = { ...item.detail, ...updates };
      }
      atelierItems[itemName] = item;
      return { ...prev, [atelier]: atelierItems };
    });
  };

  // Expand / collapse all
  const handleExpandAll = (expanded: boolean) => {
    const next: Record<string, boolean> = {};
    Object.keys(TOUS_ATELIERS_LOCAUX_DEF).forEach((k) => {
      next[k] = expanded;
    });
    setOpenAteliers(next);
  };

  // Compute statistics
  let totalItems = 0;
  let controlledItems = 0;
  let ncItems = 0;

  Object.keys(itemsState).forEach((at) => {
    (Object.values(itemsState[at]) as RondeItem[]).forEach((it) => {
      totalItems++;
      if (it.t1) controlledItems++;
      if (it.t1 === 'bad') ncItems++;
    });
  });

  const progressPct = totalItems > 0 ? Math.round((controlledItems / totalItems) * 100) : 0;

  // Save Ronde
  const handleSaveCurrentRonde = () => {
    const roundObj: RondeInspection = {
      id: `ronde-${Date.now()}`,
      date: dateRonde,
      site: selectedSite,
      zone: 'Ensemble des Ateliers & Locaux',
      heure1: heureTournee,
      heure2: heureTournee,
      inspecteur: selectedInspecteur,
      createdAt: new Date().toISOString(),
      ateliers: {},
    };

    Object.keys(itemsState).forEach((atelier) => {
      roundObj.ateliers[atelier] = {
        items: Object.values(itemsState[atelier]),
      };
    });

    onSaveRonde(roundObj);
    alert(`✓ Ronde HSE enregistrée avec succès par ${selectedInspecteur} pour l'ensemble des ateliers & locaux.`);
    setSubTab('historique');
  };

  // Word export logic (.doc)
  const handleExportWordReport = () => {
    const constats: Array<{
      date: string;
      site: string;
      zone: string;
      atelier: string;
      item: string;
      inspecteur: string;
      detail: RondeConstatDetail;
    }> = [];

    rondes.forEach((r) => {
      Object.keys(r.ateliers).forEach((at) => {
        r.ateliers[at].items.forEach((it) => {
          if (it.detail && (it.t1 === 'bad' || it.t2 === 'bad')) {
            constats.push({
              date: r.date,
              site: r.site,
              zone: r.zone,
              atelier: at,
              inspecteur: r.inspecteur,
              item: it.name,
              detail: it.detail,
            });
          }
        });
      });
    });

    if (constats.length === 0) {
      alert('Aucun constat de non-conformité à exporter.');
      return;
    }

    const rowsHtml = constats
      .map(
        (c) => `
      <tr>
        <td>${formatDateFr(c.date)}</td>
        <td>${c.detail.photos && c.detail.photos.length ? c.detail.photos.map((p) => `<img src="${p.dataUrl}" width="120"><br>`).join('') : 'Aucune photo'}</td>
        <td><strong>${c.item}</strong><br>${c.detail.description || ''}</td>
        <td>${c.detail.cause || '—'}</td>
        <td>${c.atelier} (${c.site})</td>
        <td>${c.inspecteur}</td>
        <td>${c.detail.action || '—'}</td>
        <td>${c.detail.pilote || '—'}</td>
        <td><strong>${c.detail.statut}</strong></td>
        <td>${c.detail.commentaire || '—'}</td>
        <td>${c.detail.datePrevue ? formatDateFr(c.detail.datePrevue) : '—'}</td>
        <td>${c.detail.dateRealisation ? formatDateFr(c.detail.dateRealisation) : '—'}</td>
      </tr>
    `,
      )
      .join('');

    const doc = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"><title>Rapport des constats HSE — SICDA</title>
      <style>
        @page { size: 29.7cm 21cm; mso-page-orientation: landscape; margin: 1.5cm; }
        body { font-family: Calibri, Arial, sans-serif; font-size: 10.5pt; color: #1A1D23; }
        .ref { font-size: 9pt; color: #555; }
        .title { font-size: 16pt; font-weight: bold; text-align: center; color: #0B2545; margin: 6px 0 2px; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th { background: #0B2545; color: #fff; font-size: 9pt; padding: 6px; border: 1px solid #0B2545; text-align: left; }
        td { border: 1px solid #999; padding: 6px; font-size: 9.5pt; vertical-align: top; }
      </style></head>
      <body>
        <div class="ref">021F.Ps.POT.02 — RAPPORT DES CONSTATS HSE</div>
        <div class="title">RAPPORT DES CONSTATS DE NON-CONFORMITÉ HSE — SICDA</div>
        <p><strong>Périmètre :</strong> Ensemble des Ateliers et Locaux industriels &bull; <strong>Tournée journalière unique</strong> &bull; <strong>Date d'extraction :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Photo</th>
              <th>Description Constat</th>
              <th>Causes potentielles</th>
              <th>Zone / Atelier</th>
              <th>Inspecteur HSE</th>
              <th>Action proposée</th>
              <th>Pilote</th>
              <th>Statut</th>
              <th>Commentaire</th>
              <th>Date prévue</th>
              <th>Date réal.</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body></html>
    `;

    const blob = new Blob(['\ufeff' + doc], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SICDA_Rapport_Constats_HSE_${getTodayIso()}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtered ateliers list for rendering
  const displayedAteliers = Object.keys(TOUS_ATELIERS_LOCAUX_DEF).filter((atelierName) => {
    const def = TOUS_ATELIERS_LOCAUX_DEF[atelierName];
    if (zoneCategoryFilter === 'ATELIERS' && def.type !== 'Atelier') return false;
    if (zoneCategoryFilter === 'LOCAUX' && def.type !== 'Local') return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchAtelier = atelierName.toLowerCase().includes(term);
      const matchItem = def.items.some((it) => it.toLowerCase().includes(term));
      if (!matchAtelier && !matchItem) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & SubTabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
              Réf. 021F.Ps.POT.02
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Tournée journalière unique &bull; Ensemble des Ateliers & Locaux
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Rondes de Sécurité HSE (Ateliers & Locaux)
          </h1>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setSubTab('nouvelle')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
              subTab === 'nouvelle'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Nouvelle Ronde
          </button>
          <button
            onClick={() => setSubTab('historique')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
              subTab === 'historique'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Historique ({rondes.length})
          </button>
          <button
            onClick={() => setSubTab('rapport')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors ${
              subTab === 'rapport'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rapport des Constats
          </button>
        </div>
      </div>

      {/* SUBTAB 1: NOUVELLE RONDE */}
      {subTab === 'nouvelle' && (
        <div className="space-y-6">
          {/* Metadata Card: Date, Site, Heure Tournée, Inspecteur HSE */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Footprints className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Paramètres de la Ronde Journalière</h2>
                  <p className="text-[11px] text-slate-500">
                    Tournée unique couvrant l'ensemble des 12 ateliers et locaux du site SICDA
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  1 Tournée par jour
                </span>
                <span className="text-xs font-bold px-3 py-1 bg-slate-900 text-white rounded-full">
                  12 Ateliers & Locaux
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Site */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  Site SICDA
                </label>
                <select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                >
                  {SITES_SICDA.map((site) => (
                    <option key={site} value={site}>
                      {site}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date de la ronde */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Date de la ronde
                </label>
                <input
                  type="date"
                  value={dateRonde}
                  onChange={(e) => setDateRonde(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                >
                </input>
              </div>

              {/* Heure de la tournée journalière */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  Heure de la tournée journalière
                </label>
                <input
                  type="time"
                  value={heureTournee}
                  onChange={(e) => setHeureTournee(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Inspecteur HSE référent */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-orange-500" />
                  Inspecteur HSE
                </label>
                <select
                  value={selectedInspecteur}
                  onChange={(e) => setSelectedInspecteur(e.target.value)}
                  className="w-full border border-orange-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 bg-orange-50/50 focus:bg-white"
                >
                  {INSPECTEURS_HSE.map((ins) => (
                    <option key={ins} value={ins}>
                      {ins}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scope info banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
              <div>
                <strong>Périmètre consolidé :</strong> Ensemble des ateliers industriels (Électrique, Outillage, Mélange, Broyage, Production, Magasin PR) et locaux de support (Administration, Couloirs stockage, Laboratoire, WC/Réfectoire, Zone déchet, Poste garde).
              </div>
              <div className="font-semibold text-orange-700 whitespace-nowrap">
                Inspecteur assigné : {selectedInspecteur}
              </div>
            </div>
          </div>

          {/* Progress & Filters Bar */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Progress */}
              <div className="space-y-1.5 flex-1 max-w-md">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Progression du contrôle journalier</span>
                  <span className="font-mono font-bold text-slate-900">
                    {controlledItems} / {totalItems} points ({progressPct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-orange-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Status summary counters */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  🟢 {controlledItems - ncItems} Conformes
                </span>
                <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                  🔴 {ncItems} Non Conformes
                </span>
              </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              {/* Filter pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filtrer :
                </span>
                <button
                  type="button"
                  onClick={() => setZoneCategoryFilter('TOUS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    zoneCategoryFilter === 'TOUS'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Tous (12 Ateliers & Locaux)
                </button>
                <button
                  type="button"
                  onClick={() => setZoneCategoryFilter('ATELIERS')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    zoneCategoryFilter === 'ATELIERS'
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Ateliers de Production (6)
                </button>
                <button
                  type="button"
                  onClick={() => setZoneCategoryFilter('LOCAUX')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    zoneCategoryFilter === 'LOCAUX'
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Locaux & Communs (6)
                </button>
              </div>

              {/* Search & Collapse controls */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Chercher atelier ou point..."
                    className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none w-44"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleExpandAll(true)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  title="Déplier tous les ateliers"
                >
                  Déplier
                </button>
                <button
                  type="button"
                  onClick={() => handleExpandAll(false)}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                  title="Replier tous les ateliers"
                >
                  Replier
                </button>
              </div>
            </div>
          </div>

          {/* List of Workshops and Premises Blocks */}
          <div className="space-y-4">
            {displayedAteliers.map((atelierName) => {
              const atelierItems = itemsState[atelierName] || {};
              const isOpen = openAteliers[atelierName] ?? false;
              const itemsList = Object.values(atelierItems) as RondeItem[];
              const doneCount = itemsList.filter((i) => i.t1).length;
              const badCount = itemsList.filter((i) => i.t1 === 'bad').length;
              const atelierDef = TOUS_ATELIERS_LOCAUX_DEF[atelierName];

              return (
                <div
                  key={atelierName}
                  className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* Atelier Header */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 border-b border-slate-100">
                    <div
                      onClick={() => setOpenAteliers((prev) => ({ ...prev, [atelierName]: !isOpen }))}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        atelierDef?.type === 'Atelier' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {atelierDef?.type === 'Atelier' ? '🏭' : '🏢'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base">{atelierName}</h3>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                            {atelierDef?.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {doneCount}/{itemsList.length} points contrôlés
                          {badCount > 0 && (
                            <span className="text-rose-600 font-bold ml-1"> &bull; {badCount} Non-Conforme(s)</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Quick actions for this atelier */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleMarkAtelierAllConforme(atelierName)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                        title="Marquer tous les points de cet atelier comme conformes"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Tout Conforme
                      </button>

                      <button
                        type="button"
                        onClick={() => setOpenAteliers((prev) => ({ ...prev, [atelierName]: !isOpen }))}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Atelier Items Body */}
                  {isOpen && (
                    <div className="p-4 divide-y divide-slate-100">
                      {itemsList.map((item) => {
                        const isBad = item.t1 === 'bad';
                        const isOk = item.t1 === 'ok';

                        return (
                          <div key={item.name} className="py-3 space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <span className="font-semibold text-xs sm:text-sm text-slate-900 flex-1">
                                {item.name}
                              </span>

                              {/* Single tour check buttons */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleToggleItemStatus(atelierName, item.name, 'ok')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    isOk
                                      ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Conforme
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleItemStatus(atelierName, item.name, 'bad')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                                    isBad
                                      ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-400'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Non Conforme
                                </button>
                              </div>
                            </div>

                            {/* Observation input */}
                            <div>
                              <input
                                type="text"
                                value={item.observation || ''}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  setItemsState((prev) => {
                                    const atItems = { ...prev[atelierName] };
                                    atItems[item.name] = { ...atItems[item.name], observation: text };
                                    return { ...prev, [atelierName]: atItems };
                                  });
                                }}
                                placeholder="Observation facultative (ex : ras, bon état, à surveiller)..."
                                className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 bg-slate-50 focus:bg-white focus:outline-none"
                              />
                            </div>

                            {/* Non-Conformity Constat Detail Panel */}
                            {isBad && item.detail && (
                              <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl space-y-3 text-xs">
                                <div className="font-black text-rose-900 flex items-center justify-between">
                                  <span className="flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                                    Fiche de Constat de Non-Conformité (Réf. 021F.Ps.POT.02)
                                  </span>
                                  <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold">
                                    Action Requise
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-slate-700 font-bold mb-1">
                                      Description précise du constat
                                    </label>
                                    <input
                                      type="text"
                                      value={item.detail.description || ''}
                                      onChange={(e) =>
                                        handleUpdateItemDetail(atelierName, item.name, {
                                          description: e.target.value,
                                        })
                                      }
                                      placeholder="Ex : Extincteur CO2 décroché et goupille absente"
                                      className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-slate-700 font-bold mb-1">
                                      Causes potentielles
                                    </label>
                                    <input
                                      type="text"
                                      value={item.detail.cause || ''}
                                      onChange={(e) =>
                                        handleUpdateItemDetail(atelierName, item.name, {
                                          cause: e.target.value,
                                        })
                                      }
                                      placeholder="Ex : Décroché lors du passage d'un chariot"
                                      className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-slate-700 font-bold mb-1">
                                      Action corrective engagée
                                    </label>
                                    <input
                                      type="text"
                                      value={item.detail.action || ''}
                                      onChange={(e) =>
                                        handleUpdateItemDetail(atelierName, item.name, {
                                          action: e.target.value,
                                        })
                                      }
                                      placeholder="Ex : Remplacer l'extincteur et vérifier le scellé"
                                      className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-slate-700 font-bold mb-1">
                                      Pilote de l'action
                                    </label>
                                    <input
                                      type="text"
                                      value={item.detail.pilote || ''}
                                      onChange={(e) =>
                                        handleUpdateItemDetail(atelierName, item.name, {
                                          pilote: e.target.value,
                                        })
                                      }
                                      placeholder="Ex : Chef d'Atelier / Maintenance"
                                      className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-slate-700 font-bold mb-1">Statut du constat</label>
                                    <select
                                      value={item.detail.statut}
                                      onChange={(e) =>
                                        handleUpdateItemDetail(atelierName, item.name, {
                                          statut: e.target.value as any,
                                        })
                                      }
                                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-semibold text-xs"
                                    >
                                      <option value="Ouvert">Ouvert</option>
                                      <option value="En cours">En cours</option>
                                      <option value="Clôturé">Clôturé</option>
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-slate-700 font-bold mb-1">Date d'échéance prévue</label>
                                    <input
                                      type="date"
                                      value={item.detail.datePrevue || ''}
                                      onChange={(e) =>
                                        handleUpdateItemDetail(atelierName, item.name, {
                                          datePrevue: e.target.value,
                                        })
                                      }
                                      className="w-full border border-slate-300 rounded-lg p-2 bg-white text-xs"
                                    />
                                  </div>
                                </div>

                                {/* Insertion des photos du constat de non-conformité */}
                                <div className="pt-3 border-t border-rose-200/80">
                                  <ConstatPhotoManager
                                    photos={item.detail.photos || []}
                                    onChangePhotos={(newPhotos) =>
                                      handleUpdateItemDetail(atelierName, item.name, {
                                        photos: newPhotos,
                                      })
                                    }
                                    constatTitre={`${atelierName} — ${item.name}`}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sticky Action Footer */}
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky bottom-4 z-20">
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900">{controlledItems} éléments contrôlés</span> &bull;{' '}
              {ncItems > 0 ? (
                <span className="text-rose-600 font-bold">{ncItems} non-conformité(s) relevée(s)</span>
              ) : (
                <span className="text-emerald-600 font-bold">Tous conformes</span>
              )}
              <span className="text-slate-400 ml-1">
                &bull; Inspecteur : <strong>{selectedInspecteur}</strong>
              </span>
            </div>
            <button
              onClick={handleSaveCurrentRonde}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              Enregistrer & Clôturer la Ronde HSE
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 2: HISTORIQUE DES RONDES */}
      {subTab === 'historique' && (
        <div className="space-y-4">
          {rondes.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
              <Footprints className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-800 text-sm">Aucune ronde enregistrée</p>
              <p className="text-xs text-slate-500 mt-1">Lancez une nouvelle inspection depuis l'onglet "Nouvelle Ronde".</p>
            </div>
          ) : (
            rondes.map((ronde) => {
              let ncCount = 0;
              let totalCount = 0;
              (Object.values(ronde.ateliers) as { items: RondeItem[] }[]).forEach((a) => {
                a.items.forEach((it) => {
                  totalCount++;
                  if (it.t1 === 'bad' || it.t2 === 'bad') ncCount++;
                });
              });

              return (
                <div
                  key={ronde.id}
                  className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                        {ronde.site}
                      </span>
                      <span className="font-black text-slate-900 text-sm sm:text-base">
                        {formatDateFr(ronde.date)} &bull; {ronde.zone || 'Ensemble des Ateliers & Locaux'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      <strong>Inspecteur HSE :</strong> {ronde.inspecteur} &bull; <strong>Tournée unique :</strong>{' '}
                      {ronde.heure1 || '09:30'} &bull; {totalCount} points audités
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {ncCount > 0 ? (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        🔴 {ncCount} Non-conformité(s)
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        🟢 Conforme
                      </span>
                    )}

                    <button
                      onClick={() => onDeleteRonde(ronde.id)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Supprimer cette ronde"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUBTAB 3: RAPPORT DES CONSTATS */}
      {subTab === 'rapport' && (
        <div className="space-y-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-slate-900 text-base">
                Rapport Consolidé des Non-Conformités Relevées (Réf. 021F.Ps.POT.02)
              </h3>
              <p className="text-xs text-slate-500">
                Génération automatique du rapport d'actions correctives avec pilote, statut et délais.
              </p>
            </div>
            <button
              onClick={handleExportWordReport}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow transition-colors"
            >
              <Download className="w-4 h-4 text-orange-400" />
              Exporter en Word (.doc)
            </button>
          </div>

          <div className="space-y-3">
            {(() => {
              const allItems = rondes.flatMap((r) =>
                Object.keys(r.ateliers).flatMap((at) =>
                  r.ateliers[at].items
                    .filter((it) => it.detail && (it.t1 === 'bad' || it.t2 === 'bad'))
                    .map((it, idx) => ({
                      ronde: r,
                      atelier: at,
                      item: it,
                      key: `${r.id}-${at}-${idx}`,
                    })),
                ),
              );

              if (allItems.length === 0) {
                return (
                  <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl text-slate-500 text-sm">
                    Aucun constat de non-conformité ouvert pour le moment.
                  </div>
                );
              }

              return allItems.map(({ ronde: r, atelier: at, item: it, key }) => (
                <div
                  key={key}
                  className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-xs">
                        {r.site} &bull; {at}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDateFr(r.date)} &bull; Inspecteur : {r.inspecteur}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        it.detail?.statut === 'Clôturé'
                          ? 'bg-emerald-100 text-emerald-800'
                          : it.detail?.statut === 'En cours'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {it.detail?.statut}
                    </span>
                  </div>

                  <div className="font-bold text-sm text-slate-900">{it.detail?.description || it.name}</div>
                  {it.detail?.cause && (
                    <div className="text-xs text-slate-600">
                      <strong>Cause :</strong> {it.detail.cause}
                    </div>
                  )}
                  {it.detail?.action && (
                    <div className="text-xs text-slate-600">
                      <strong>Action corrective :</strong> {it.detail.action}
                    </div>
                  )}
                  {/* Photos du constat de non-conformité */}
                  {it.detail?.photos && it.detail.photos.length > 0 ? (
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1.5 text-slate-800">
                          <Camera className="w-3.5 h-3.5 text-orange-500" />
                          Preuves Visuelles / Photos ({it.detail.photos.length}) :
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          Cliquer pour agrandir
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                        {it.detail.photos.map((photo, pIdx) => (
                          <div
                            key={photo.id || pIdx}
                            onClick={() =>
                              setPreviewPhoto({
                                url: photo.dataUrl,
                                title: `${at} — ${it.detail?.description || it.name}`,
                                subtitle: `${r.site} • Inspecteur : ${r.inspecteur} • ${
                                  photo.name || 'Photo'
                                } • ${photo.dateAjout || ''}`,
                              })
                            }
                            className="group relative w-24 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex-shrink-0 cursor-pointer shadow-sm hover:border-orange-500 hover:shadow-md transition-all"
                            title="Agrandir cette photo"
                          >
                            <img
                              src={photo.dataUrl}
                              alt={photo.name || `Photo ${pIdx + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 className="w-4 h-4" />
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-white text-[9px] px-1.5 py-0.5 truncate font-semibold">
                              Photo #{pIdx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5 italic">
                      <Camera className="w-3.5 h-3.5 text-slate-300" />
                      Aucune photo attachée à ce constat
                    </div>
                  )}

                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>Pilote : {it.detail?.pilote || '—'}</span>
                    <span>Date prévue : {formatDateFr(it.detail?.datePrevue)}</span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Lightbox Modal for Photo Preview */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="p-3 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                  📸
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{previewPhoto.title}</h4>
                  {previewPhoto.subtitle && (
                    <p className="text-[10px] text-slate-400">{previewPhoto.subtitle}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 bg-black/60 flex-1 overflow-auto flex items-center justify-center">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.title}
                className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain shadow-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
