import React, { useState } from 'react';
import { PrestataireDossier, Intervention, RondeInspection, RoleType } from '../types';
import { formatDateFr, calculateDaysRemaining } from '../utils/dates';
import { DualBrandHeader } from './Logos';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Clock,
  Footprints,
  TrendingUp,
  Building,
  Calendar,
  AlertOctagon,
  ArrowRight,
  ChevronRight,
  FileText,
  Users,
  Bell,
  PlayCircle,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { SITES_SICDA } from '../data/initialData';
import { RapportMensuelHseModal } from './RapportMensuelHseModal';

interface DashboardViewProps {
  prestataires: PrestataireDossier[];
  interventions: Intervention[];
  rondes: RondeInspection[];
  currentUserRole: RoleType;
  currentUserName?: string;
  onNavigateToTab: (tab: 'prestataires' | 'interventions' | 'rondes') => void;
  onSelectPrestataire: (prestataire: PrestataireDossier) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  prestataires,
  interventions,
  rondes,
  currentUserRole,
  currentUserName = 'EL HADI Ayoub',
  onNavigateToTab,
  onSelectPrestataire,
}) => {
  const [showRapportModal, setShowRapportModal] = useState(false);

  // Statistics computation
  const totalPrestataires = prestataires.length;
  const conformesCount = prestataires.filter((p) => p.statutFinal === 'CONFORME').length;
  const sousReserveCount = prestataires.filter((p) => p.statutFinal === 'CONFORME_SOUS_RESERVE').length;
  const nonConformesCount = prestataires.filter((p) => p.statutFinal === 'NON_CONFORME' && !p.derogation?.active).length;
  const derogationCount = prestataires.filter((p) => p.derogation?.active).length;

  const globalComplianceRate =
    totalPrestataires > 0 ? Math.round(((conformesCount + derogationCount * 0.5) / totalPrestataires) * 100) : 0;

  // Interventions stats
  const totalInterventions = interventions.length;
  const interventionsEnCours = interventions.filter((i) => i.statut === 'EN_COURS').length;
  const interventionsEnRetard = interventions.filter((i) => i.statut === 'EN_RETARD').length;
  const interventionsPlanifiees = interventions.filter((i) => i.statut === 'PLANIFIEE').length;
  const interventionsTerminees = interventions.filter((i) => i.statut === 'TERMINEE').length;

  // Rondes stats
  let totalPointsControles = 0;
  let totalConstatsNC = 0;
  let ncOuvertes = 0;
  let ncEnCours = 0;
  let ncCloturees = 0;

  rondes.forEach((r) => {
    (Object.values(r.ateliers) as { items: any[] }[]).forEach((at) => {
      at.items.forEach((item) => {
        if (item.t1 || item.t2) totalPointsControles++;
        if (item.t1 === 'bad' || item.t2 === 'bad') {
          totalConstatsNC++;
          if (item.detail?.statut === 'Ouvert') ncOuvertes++;
          else if (item.detail?.statut === 'En cours') ncEnCours++;
          else if (item.detail?.statut === 'Clôturé') ncCloturees++;
        }
      });
    });
  });

  // Data for Conformity Pie Chart
  const pieData = [
    { name: '🟢 Conformes', value: conformesCount, color: '#10B981' },
    { name: '🟠 Sous Réserve', value: sousReserveCount, color: '#F59E0B' },
    { name: '🔴 Non Conformes', value: nonConformesCount, color: '#EF4444' },
    { name: '⚡ Dérogations', value: derogationCount, color: '#8B5CF6' },
  ].filter((d) => d.value > 0);

  // Data for Compliance by Site
  const siteData = SITES_SICDA.map((site) => {
    const sitePrestataires = prestataires.filter((p) => p.siteConcerne === site);
    const total = sitePrestataires.length;
    const ok = sitePrestataires.filter((p) => p.statutFinal === 'CONFORME' || p.derogation?.active).length;
    const rate = total > 0 ? Math.round((ok / total) * 100) : 0;
    const siteInterventions = interventions.filter((i) => i.site === site);
    const late = siteInterventions.filter((i) => i.statut === 'EN_RETARD').length;

    return {
      site,
      tauxConformite: rate,
      totalPrestataires: total,
      interventionsEnRetard: late,
    };
  });

  // Urgent alerts
  const urgentAlerts: Array<{
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    actionLabel?: string;
    dossier?: PrestataireDossier;
  }> = [];

  // 1. Blocked contractors with upcoming intervention
  prestataires
    .filter((p) => p.statutFinal === 'NON_CONFORME' && !p.derogation?.active)
    .forEach((p) => {
      urgentAlerts.push({
        type: 'critical',
        title: `Accès non autorisé : ${p.nomEntreprise} (${p.siteConcerne})`,
        description: `Dossier bloqué (${p.motifsNonConformite.length} motif(s)). Intervention prévue le ${formatDateFr(
          p.datePrevueIntervention,
        )}.`,
        actionLabel: 'Examiner Dossier',
        dossier: p,
      });
    });

  // 2. Active derogations nearing expiration (< 15 days)
  prestataires
    .filter((p) => p.derogation?.active)
    .forEach((p) => {
      const days = calculateDaysRemaining(p.derogation?.dateFin);
      urgentAlerts.push({
        type: 'warning',
        title: `Dérogation active : ${p.nomEntreprise}`,
        description: `Échéance le ${formatDateFr(p.derogation?.dateFin)} (${
          days !== null && days >= 0 ? `reste ${days} jour(s)` : 'expirée'
        }) - Accordée par ${p.derogation?.accordeePar}`,
        actionLabel: 'Gérer Dérogation',
        dossier: p,
      });
    });

  // 3. Late interventions
  interventions
    .filter((i) => i.statut === 'EN_RETARD')
    .forEach((i) => {
      const prest = prestataires.find((p) => p.id === i.prestataireId);
      urgentAlerts.push({
        type: 'warning',
        title: `Chantier en retard : ${i.prestationTitre} (${i.site})`,
        description: `Prestataire : ${prest?.nomEntreprise || 'Inconnu'} &bull; Échéance dépassée &bull; Avancement : ${
          i.tauxAvancement
        }%`,
      });
    });

  return (
    <div className="space-y-6">
      {/* Corporate Brand Identity Ribbon */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DualBrandHeader size="md" inverted={true} showTagline={true} />
        <div className="flex items-center gap-2.5 text-xs text-slate-300 flex-wrap">
          <div className="px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Périmètre :</span>
            <strong className="text-orange-400">Sites 1 à 5 &bull; 12 Ateliers</strong>
          </div>
          <div className="px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center gap-1.5">
            <span className="text-slate-400 font-semibold">Service :</span>
            <strong className="text-white">QHSE &bull; ISO 45001</strong>
          </div>
        </div>
      </div>

      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-orange-500" />
            Tableau de Bord HSE & Performance des Prestataires
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Suivi consolidé de la conformité réglementaire, du contrôle d'accès et des délais d'intervention sur l'ensemble des sites SICDA.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowRapportModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-transform active:scale-95"
            title="Générer et exporter la synthèse globale des performances HSE (CSV / PDF)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Exporter Rapport
          </button>
          <button
            onClick={() => onNavigateToTab('prestataires')}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-transform active:scale-95"
          >
            <Building className="w-3.5 h-3.5 text-orange-400" />
            Dossiers Prestataires
          </button>
          <button
            onClick={() => onNavigateToTab('interventions')}
            className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-transform active:scale-95"
          >
            <Clock className="w-3.5 h-3.5" />
            Suivi Délais Chantiers
          </button>
          <button
            onClick={() => onNavigateToTab('rondes')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Footprints className="w-3.5 h-3.5 text-orange-600" />
            Rondes HSE
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Conformité Globale */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
              <span>Taux de Conformité</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{globalComplianceRate}%</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-bold">{conformesCount} autorisés à 100%</span>
            <span className="text-slate-400">sur {totalPrestataires}</span>
          </div>
        </div>

        {/* KPI 2: Prestataires Bloqués */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
              <span>Dossiers Non Conformes</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-3xl font-black text-rose-600 tracking-tight">{nonConformesCount}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-rose-700 font-bold">Accès site interdit</span>
            {derogationCount > 0 && (
              <span className="text-amber-600 font-bold">({derogationCount} sous dérog.)</span>
            )}
          </div>
        </div>

        {/* KPI 3: Interventions en retard */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
              <span>Chantiers en Retard</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black text-amber-600 tracking-tight">{interventionsEnRetard}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">{interventionsEnCours} en cours actifs</span>
            <span className="text-slate-400">{totalInterventions} total</span>
          </div>
        </div>

        {/* KPI 4: Rondes et NC ouvertes */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
              <span>Constats Rondes HSE</span>
              <Footprints className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-3xl font-black text-slate-900 tracking-tight">{totalConstatsNC}</div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-rose-600 font-bold">{ncOuvertes} NC ouvertes</span>
            <span className="text-emerald-600 font-bold">{ncCloturees} résolues</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Répartition Statuts Prestataires */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Répartition des Statuts de Conformité HSE
              </h3>
              <p className="text-xs text-slate-500">Contrôle strict des pièces administratives et habilitations</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
              {totalPrestataires} prestataires
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  formatter={(value) => <span className="text-xs font-semibold text-slate-700">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Taux de Conformité par Site */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Taux de Conformité par Site SICDA (%)
              </h3>
              <p className="text-xs text-slate-500">Comparatif de conformité sur les sites industriels SICDA 1 à 5</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
              5 sites surveillés
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={siteData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="site" tick={{ fontSize: 11, fontWeight: 600, fill: '#475569' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Taux de conformité']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                />
                <Bar dataKey="tauxConformite" fill="#F97316" radius={[6, 6, 0, 0]} name="Conformité (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Urgent Alerts & Critical Watch */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Alertes de Sécurité & Non-Conformités Actives</h3>
              <p className="text-xs text-slate-500">
                Actions correctives prioritaires requises pour lever les blocages d'accès
              </p>
            </div>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            {urgentAlerts.length} point(s) d'attention
          </span>
        </div>

        <div className="space-y-2.5">
          {urgentAlerts.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              Aucune non-conformité bloquante ou alerte critique actuellement.
            </div>
          ) : (
            urgentAlerts.slice(0, 4).map((alert, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  alert.type === 'critical'
                    ? 'bg-rose-50/60 border-rose-200'
                    : 'bg-amber-50/60 border-amber-200'
                }`}
              >
                <div className="space-y-0.5 flex-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                    {alert.type === 'critical' ? (
                      <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    )}
                    {alert.title}
                  </div>
                  <p className="text-xs text-slate-600">{alert.description}</p>
                </div>

                {alert.dossier && (
                  <button
                    onClick={() => onSelectPrestataire(alert.dossier!)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 self-start sm:self-auto transition-transform active:scale-95"
                  >
                    {alert.actionLabel || 'Ouvrir'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Real-time Interventions Delays Snapshot */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Chantiers & Interventions en Cours (Temps Réel)
            </h3>
            <p className="text-xs text-slate-500">
              Suivi instantané de l'état d'avancement et du respect des délais
            </p>
          </div>
          <button
            onClick={() => onNavigateToTab('interventions')}
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            Voir tous les délais ({interventions.length})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-2.5">Site / Atelier</th>
                <th className="pb-2.5">Objet de la prestation</th>
                <th className="pb-2.5">Prestataire</th>
                <th className="pb-2.5">Échéance</th>
                <th className="pb-2.5">Avancement</th>
                <th className="pb-2.5">Statut Délais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {interventions.slice(0, 5).map((intv) => {
                const prest = prestataires.find((p) => p.id === intv.prestataireId);
                const daysLeft = calculateDaysRemaining(intv.dateFinPrevue);

                return (
                  <tr key={intv.id} className="hover:bg-slate-50">
                    <td className="py-3 font-bold text-slate-900">
                      <span className="px-2 py-0.5 rounded bg-slate-100 mr-1.5">{intv.site}</span>
                      {intv.zone}
                    </td>
                    <td className="py-3 font-semibold text-slate-800">{intv.prestationTitre}</td>
                    <td className="py-3 text-slate-600 font-medium">{prest?.nomEntreprise || '—'}</td>
                    <td className="py-3 text-slate-600">{formatDateFr(intv.dateFinPrevue)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              intv.tauxAvancement === 100
                                ? 'bg-emerald-500'
                                : intv.statut === 'EN_RETARD'
                                ? 'bg-rose-500'
                                : 'bg-orange-500'
                            }`}
                            style={{ width: `${intv.tauxAvancement}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-700">{intv.tauxAvancement}%</span>
                      </div>
                    </td>
                    <td className="py-3">
                      {intv.statut === 'EN_RETARD' ? (
                        <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-rose-100 text-rose-800">
                          En retard
                        </span>
                      ) : intv.statut === 'EN_COURS' ? (
                        <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-blue-100 text-blue-800">
                          En cours ({daysLeft}j)
                        </span>
                      ) : intv.statut === 'TERMINEE' ? (
                        <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-emerald-100 text-emerald-800">
                          Terminée
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-slate-100 text-slate-700">
                          Planifiée
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Rapport Mensuel HSE (PDF / CSV) */}
      <RapportMensuelHseModal
        isOpen={showRapportModal}
        onClose={() => setShowRapportModal(false)}
        prestataires={prestataires}
        interventions={interventions}
        rondes={rondes}
        currentUserName={currentUserName}
      />
    </div>
  );
};
