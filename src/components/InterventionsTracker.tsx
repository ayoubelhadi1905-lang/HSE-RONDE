import React, { useState } from 'react';
import { Intervention, PrestataireDossier, RoleType } from '../types';
import { formatDateFr, calculateDaysRemaining } from '../utils/dates';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  Plus,
  ArrowRight,
  TrendingUp,
  AlertOctagon,
  PlayCircle,
  Check,
  Ban,
} from 'lucide-react';
import { SITES_SICDA } from '../data/initialData';

interface InterventionsTrackerProps {
  interventions: Intervention[];
  prestataires: PrestataireDossier[];
  currentUserRole: RoleType;
  onUpdateIntervention: (updated: Intervention) => void;
  onCreateIntervention: (newIntervention: Intervention) => void;
  onOpenPrestataire: (prestataireId: string) => void;
}

export const InterventionsTracker: React.FC<InterventionsTrackerProps> = ({
  interventions,
  prestataires,
  currentUserRole,
  onUpdateIntervention,
  onCreateIntervention,
  onOpenPrestataire,
}) => {
  const [siteFilter, setSiteFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = interventions.filter((intv) => {
    const siteOk = siteFilter === 'Tous' || intv.site === siteFilter;
    const statusOk = statusFilter === 'Tous' || intv.statut === statusFilter;
    return siteOk && statusOk;
  });

  // KPIs
  const total = interventions.length;
  const enCours = interventions.filter((i) => i.statut === 'EN_COURS').length;
  const enRetard = interventions.filter((i) => i.statut === 'EN_RETARD').length;
  const planifiees = interventions.filter((i) => i.statut === 'PLANIFIEE').length;
  const terminees = interventions.filter((i) => i.statut === 'TERMINEE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-orange-500" />
            Suivi des Performances & Délais d'Intervention en Temps Réel
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Surveillance en temps réel du planning d'intervention, du respect des délais contractuels et de la conformité d'accès aux sites.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Planifier une Intervention
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            <span>En Cours</span>
            <PlayCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{enCours}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">Chantiers actifs</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            <span>En Retard</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">{enRetard}</div>
          <div className="text-[11px] text-rose-600 font-medium mt-1">Dépassement de délai</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            <span>Planifiées</span>
            <Calendar className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{planifiees}</div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">À démarrer</div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
            <span>Terminées</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{terminees}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Clôturées avec succès</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Site :</span>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs bg-white"
            >
              <option value="Tous">Tous les sites</option>
              {SITES_SICDA.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <span>Statut :</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs bg-white"
            >
              <option value="Tous">Tous les statuts</option>
              <option value="EN_COURS">En cours</option>
              <option value="EN_RETARD">En retard</option>
              <option value="PLANIFIEE">Planifiée</option>
              <option value="TERMINEE">Terminée</option>
            </select>
          </div>
        </div>

        <span className="text-xs text-slate-500">{filtered.length} intervention(s) affichée(s)</span>
      </div>

      {/* Interventions Matrix */}
      <div className="space-y-3">
        {filtered.map((intv) => {
          const prest = prestataires.find((p) => p.id === intv.prestataireId);
          const daysToDeadline = calculateDaysRemaining(intv.dateFinPrevue);
          const isLate = intv.statut === 'EN_RETARD' || (daysToDeadline !== null && daysToDeadline < 0 && intv.statut !== 'TERMINEE');

          return (
            <div
              key={intv.id}
              className={`p-5 bg-white border rounded-2xl shadow-sm transition-all hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                isLate ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                    {intv.site}
                  </span>
                  {intv.zone && (
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {intv.zone}
                    </span>
                  )}
                  <h3 className="font-black text-slate-900 text-base">{intv.prestationTitre}</h3>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                  <span className="font-bold text-slate-900 flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-orange-500" />
                    {prest ? prest.nomEntreprise : 'Prestataire inconnu'}
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span>
                    Période prévue : <strong>{formatDateFr(intv.dateDebutPrevue)}</strong> au{' '}
                    <strong>{formatDateFr(intv.dateFinPrevue)}</strong>
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span>Resp SICDA : {intv.responsableInterne}</span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-1 max-w-md">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600">
                    <span>Avancement des travaux</span>
                    <span>{intv.tauxAvancement}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        intv.tauxAvancement === 100
                          ? 'bg-emerald-500'
                          : isLate
                          ? 'bg-rose-500'
                          : 'bg-orange-500'
                      }`}
                      style={{ width: `${intv.tauxAvancement}%` }}
                    />
                  </div>
                </div>

                {/* Warning if contractor is non-compliant */}
                {prest && prest.statutFinal === 'NON_CONFORME' && !prest.derogation?.active && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-700 font-bold bg-rose-100/70 px-3 py-1 rounded-xl border border-rose-200 mt-1 max-w-fit">
                    <AlertOctagon className="w-4 h-4 text-rose-600" />
                    Alerte : Le prestataire présente des non-conformités bloquantes ! Intervention bloquée.
                  </div>
                )}
              </div>

              {/* Status & Timing Right Column */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 self-end lg:self-center">
                {/* Delay indicator */}
                <div className="text-right">
                  {daysToDeadline !== null && (
                    <div>
                      {daysToDeadline < 0 ? (
                        <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                          En retard de {Math.abs(daysToDeadline)} jour(s)
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                          Reste {daysToDeadline} jour(s)
                        </span>
                      )}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 mt-0.5">Délai max : {intv.delaiJoursMax}j</div>
                </div>

                {/* Status chip */}
                <div>
                  {intv.statut === 'EN_COURS' ? (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-blue-100 text-blue-800 flex items-center gap-1">
                      <PlayCircle className="w-3.5 h-3.5" /> En cours
                    </span>
                  ) : intv.statut === 'EN_RETARD' ? (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-rose-100 text-rose-800 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> En retard
                    </span>
                  ) : intv.statut === 'TERMINEE' ? (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Terminée
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-slate-100 text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Planifiée
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                {prest && (
                  <button
                    onClick={() => onOpenPrestataire(prest.id)}
                    className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Voir Dossier HSE
                  </button>
                )}

                {/* Update progress */}
                {intv.statut !== 'TERMINEE' && (
                  <button
                    onClick={() => {
                      const newTaux = prompt('Nouveau taux d’avancement (0 à 100%) :', String(intv.tauxAvancement));
                      if (newTaux !== null) {
                        const val = Math.min(100, Math.max(0, parseInt(newTaux) || 0));
                        onUpdateIntervention({
                          ...intv,
                          tauxAvancement: val,
                          statut: val === 100 ? 'TERMINEE' : val > 0 ? 'EN_COURS' : intv.statut,
                        });
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Mettre à jour
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Intervention */}
      {showCreateModal && (
        <CreateInterventionModal
          prestataires={prestataires}
          onClose={() => setShowCreateModal(false)}
          onCreate={(newIntv) => {
            onCreateIntervention(newIntv);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

const CreateInterventionModal: React.FC<{
  prestataires: PrestataireDossier[];
  onClose: () => void;
  onCreate: (intv: Intervention) => void;
}> = ({ prestataires, onClose, onCreate }) => {
  const today = new Date().toISOString().slice(0, 10);
  const [prestataireId, setPrestataireId] = useState(prestataires[0]?.id || '');
  const [titre, setTitre] = useState('');
  const [site, setSite] = useState(SITES_SICDA[0] as string);
  const [zone, setZone] = useState('');
  const [dateDebut, setDateDebut] = useState(today);
  const [dateFin, setDateFin] = useState(today);
  const [responsable, setResponsable] = useState('Adil Tazi');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titre.trim()) {
      alert('Veuillez renseigner le titre de la prestation.');
      return;
    }

    const selectedPrest = prestataires.find((p) => p.id === prestataireId);

    const newIntervention: Intervention = {
      id: `intv-${Date.now()}`,
      prestataireId,
      prestationTitre: titre.trim(),
      site,
      zone: zone.trim() || 'Zone Technique',
      datePrevue: dateDebut,
      dateDebutPrevue: dateDebut,
      dateFinPrevue: dateFin,
      statut: 'PLANIFIEE',
      delaiJoursMax: 5,
      tauxAvancement: 0,
      responsableInterne: responsable,
      contactPrestataire: selectedPrest?.telephone || '',
    };

    onCreate(newIntervention);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <h2 className="text-base font-bold">Planifier une Nouvelle Intervention</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Prestataire titulaire <span className="text-rose-500">*</span>
            </label>
            <select
              value={prestataireId}
              onChange={(e) => setPrestataireId(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs sm:text-sm"
            >
              {prestataires.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nomEntreprise} ({p.siteConcerne}) — {p.statutFinal}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Titre / Objet des travaux <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex : Maintenance préventive du transformateur HT 20kV"
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Site SICDA</label>
              <select
                value={site}
                onChange={(e) => setSite(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-orange-600 text-xs sm:text-sm"
              >
                {SITES_SICDA.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Zone / Atelier</label>
              <input
                type="text"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                placeholder="Ex : Atelier Production"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date Début Prévue</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date Fin Prévue (Délai)</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Responsable Interne SICDA</label>
            <input
              type="text"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-medium"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow"
            >
              Enregistrer l'Intervention
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
