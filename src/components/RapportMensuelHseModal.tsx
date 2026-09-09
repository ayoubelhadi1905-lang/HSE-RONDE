import React, { useState } from 'react';
import { PrestataireDossier, Intervention, RondeInspection } from '../types';
import { formatDateFr } from '../utils/dates';
import { INSPECTEURS_HSE, SITES_SICDA } from '../data/initialData';
import { GroupeLogo, SicdaLogo } from './Logos';
import {
  X,
  Printer,
  Download,
  ShieldCheck,
  Building,
  Clock,
  Footprints,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Camera,
} from 'lucide-react';

interface RapportMensuelHseModalProps {
  isOpen: boolean;
  onClose: () => void;
  prestataires: PrestataireDossier[];
  interventions: Intervention[];
  rondes: RondeInspection[];
  currentUserName: string;
}

export const RapportMensuelHseModal: React.FC<RapportMensuelHseModalProps> = ({
  isOpen,
  onClose,
  prestataires,
  interventions,
  rondes,
  currentUserName,
}) => {
  const [selectedMois, setSelectedMois] = useState<string>('2026-09');
  const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>('TOUS');
  const [selectedInspecteur, setSelectedInspecteur] = useState<string>(
    INSPECTEURS_HSE.includes(currentUserName as any) ? currentUserName : INSPECTEURS_HSE[0]
  );
  const [selectedZoomPhoto, setSelectedZoomPhoto] = useState<{
    url: string;
    title: string;
    desc?: string;
  } | null>(null);

  if (!isOpen) return null;

  // Filters
  const filteredPrestataires = selectedSiteFilter === 'TOUS'
    ? prestataires
    : prestataires.filter((p) => p.siteConcerne === selectedSiteFilter);

  const filteredInterventions = selectedSiteFilter === 'TOUS'
    ? interventions
    : interventions.filter((i) => i.site === selectedSiteFilter);

  const filteredRondes = selectedSiteFilter === 'TOUS'
    ? rondes
    : rondes.filter((r) => r.site === selectedSiteFilter);

  // KPIs
  const totalPrest = filteredPrestataires.length;
  const conformes = filteredPrestataires.filter((p) => p.statutFinal === 'CONFORME').length;
  const sousReserve = filteredPrestataires.filter((p) => p.statutFinal === 'CONFORME_SOUS_RESERVE').length;
  const nonConformes = filteredPrestataires.filter((p) => p.statutFinal === 'NON_CONFORME' && !p.derogation?.active).length;
  const derogations = filteredPrestataires.filter((p) => p.derogation?.active).length;

  const globalComplianceRate = totalPrest > 0
    ? Math.round((filteredPrestataires.reduce((acc, p) => acc + p.tauxConformite, 0) / totalPrest))
    : 0;

  const totalInterventions = filteredInterventions.length;
  const enCoursInterventions = filteredInterventions.filter((i) => i.statut === 'EN_COURS').length;
  const retardsInterventions = filteredInterventions.filter((i) => i.statut === 'EN_RETARD').length;
  const termineesInterventions = filteredInterventions.filter((i) => i.statut === 'TERMINEE').length;

  let totalPointsControles = 0;
  let totalPointsNC = 0;
  let ncCloturees = 0;

  filteredRondes.forEach((r) => {
    (Object.values(r.ateliers) as { items: any[] }[]).forEach((at) => {
      at.items.forEach((item) => {
        if (item.t1 || item.t2) totalPointsControles++;
        if (item.t1 === 'bad' || item.t2 === 'bad') {
          totalPointsNC++;
          if (item.detail?.statut === 'Clôturé') ncCloturees++;
        }
      });
    });
  });

  const moisNom = (() => {
    try {
      const [y, m] = selectedMois.split('-');
      const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    } catch {
      return selectedMois;
    }
  })();

  // CSV Generator
  const handleExportCSV = () => {
    const lines: string[] = [];

    lines.push(`RAPPORT MENSUEL DE PERFORMANCE HSE & CONFORMITÉ PRESTATAIRES - GROUPE SICDA`);
    lines.push(`Période :;${moisNom.toUpperCase()}`);
    lines.push(`Site concerné :;${selectedSiteFilter === 'TOUS' ? 'Ensemble des sites (SICDA 1 à 5)' : selectedSiteFilter}`);
    lines.push(`Inspecteur HSE référent :;${selectedInspecteur}`);
    lines.push(`Responsable HSE (RHSE) :;RHSE ELMAGHRAOUI Ilyass`);
    lines.push(`Manager QHSE :;AMAL JAAFARI`);
    lines.push(`Directeur Général :;LOULIDI ADIL`);
    lines.push(`Date d'extraction :;${new Date().toLocaleString('fr-FR')}`);
    lines.push(``);

    // Section KPIs
    lines.push(`--- SYNTHÈSE DES INDICATEURS CLÉS (KPIS) ---`);
    lines.push(`Indicateur;Valeur;Cible`);
    lines.push(`Taux global de conformité prestataires;${globalComplianceRate}%;>= 95%`);
    lines.push(`Nombre total de prestataires suivis;${totalPrest};-`);
    lines.push(`Prestataires Conformes (Accès autorisé);${conformes};-`);
    lines.push(`Prestataires Conformes sous réserve;${sousReserve};0`);
    lines.push(`Prestataires Non Conformes (Accès bloqué);${nonConformes};0`);
    lines.push(`Dérogations exceptionnelles actives;${derogations};Tolérance min.`);
    lines.push(`Interventions en cours;${enCoursInterventions};-`);
    lines.push(`Chantiers en retard de délai;${retardsInterventions};0`);
    lines.push(`Rondes HSE journalières effectuées;${filteredRondes.length};-`);
    lines.push(`Points de sécurité inspectés (Ateliers & Locaux);${totalPointsControles};-`);
    lines.push(`Non-conformités détectées en ronde;${totalPointsNC};0`);
    lines.push(`Constats de sécurité clôturés;${ncCloturees};100%`);
    lines.push(``);

    // Section Prestataires
    lines.push(`--- DÉTAIL DE CONFORMITÉ DES PRESTATAIRES ---`);
    lines.push(`Entreprise;ICE;Site;Type Prestation;Taux Conformité;Statut Accès;Assurance AT;Assurance RC;CNSS;APR;Intervenants`);
    filteredPrestataires.forEach((p) => {
      lines.push(
        `"${p.nomEntreprise}";"${p.ice}";"${p.siteConcerne}";"${p.typePrestation}";${p.tauxConformite}%;"${p.statutFinal}";"${p.documents.assuranceAT.status}";"${p.documents.assuranceRC.status}";"${p.documents.bordereauCNSS.status}";"${p.documents.analyseRisques.status}";${p.intervenants.length} intervenant(s)`
      );
    });
    lines.push(``);

    // Section Interventions
    lines.push(`--- SUIVI DES CHANTIERS & RESPECT DES DÉLAIS ---`);
    lines.push(`Intitulé Intervention;Prestataire;Site;Date Début;Date Fin Prévue;Avancement;Statut Délais;Responsable Interne`);
    filteredInterventions.forEach((i) => {
      const p = prestataires.find((pr) => pr.id === i.prestataireId);
      lines.push(
        `"${i.prestationTitre}";"${p?.nomEntreprise || ''}";"${i.site}";"${formatDateFr(i.dateDebutPrevue)}";"${formatDateFr(i.dateFinPrevue)}";${i.tauxAvancement}%;"${i.statut}";"${i.responsableInterne}"`
      );
    });
    lines.push(``);

    // Section Rondes & Constats
    lines.push(`--- BILAN DES RONDES DE SÉCURITÉ (ENSEMBLE DES ATELIERS & LOCAUX) ---`);
    lines.push(`Date Ronde;Site;Inspecteur HSE;Atelier / Local;Point de Contrôle;Résultat;Description Constat;Action Corrective;Pilote;Statut Action`);
    filteredRondes.forEach((r) => {
      Object.keys(r.ateliers).forEach((atelier) => {
        r.ateliers[atelier].items.forEach((it) => {
          const res = (it.t1 === 'bad' || it.t2 === 'bad') ? 'NON CONFORME' : (it.t1 === 'ok' || it.t2 === 'ok') ? 'CONFORME' : 'NON CONTRÔLÉ';
          lines.push(
            `"${formatDateFr(r.date)}";"${r.site}";"${r.inspecteur}";"${atelier}";"${it.name}";"${res}";"${it.detail?.description || it.observation || ''}";"${it.detail?.action || ''}";"${it.detail?.pilote || ''}";"${it.detail?.statut || ''}"`
          );
        });
      });
    });

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Synthese_Mensuelle_HSE_SICDA_${selectedMois}_${selectedSiteFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto print:shadow-none print:border-none print:max-w-none print:my-0">
        {/* Modal Toolbar (hidden on print) */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-black">
              📊
            </div>
            <div>
              <h2 className="text-sm font-bold">Reporting Mensuel HSE — Performance & Conformité</h2>
              <p className="text-[11px] text-slate-400">Génération du rapport de synthèse sous format PDF et CSV</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Filters */}
            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 text-[11px]">Mois :</span>
              <input
                type="month"
                value={selectedMois}
                onChange={(e) => setSelectedMois(e.target.value)}
                className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 text-[11px]">Site :</span>
              <select
                value={selectedSiteFilter}
                onChange={(e) => setSelectedSiteFilter(e.target.value)}
                className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer"
              >
                <option value="TOUS" className="bg-slate-900">Tous les sites</option>
                {SITES_SICDA.map((s) => (
                  <option key={s} value={s} className="bg-slate-900">{s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 text-[11px]">Inspecteur :</span>
              <select
                value={selectedInspecteur}
                onChange={(e) => setSelectedInspecteur(e.target.value)}
                className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer"
              >
                {INSPECTEURS_HSE.map((ins) => (
                  <option key={ins} value={ins} className="bg-slate-900">{ins}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
              title="Télécharger la synthèse complète sous format CSV Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Exporter CSV
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-colors"
              title="Imprimer ou enregistrer en PDF via la boîte de dialogue système"
            >
              <Printer className="w-4 h-4" />
              Imprimer / Enregistrer PDF
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="p-6 sm:p-10 space-y-8 print:p-4 print:space-y-6 text-slate-800 bg-white">
          {/* Official Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                {/* Logo Groupe */}
                <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl shadow-xs" title="Logo du Groupe">
                  <GroupeLogo className="w-12 h-12" />
                </div>

                {/* Vertical Divider */}
                <div className="h-12 w-px bg-slate-200 hidden sm:block" />

                {/* Logo Société SICDA */}
                <div>
                  <div className="flex items-center gap-2">
                    <SicdaLogo className="h-9 w-auto" />
                  </div>
                  <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider mt-0.5">
                    Direction QHSE &bull; Service Prévention & Hygiène-Sécurité-Environnement
                  </div>
                </div>
              </div>

              <div className="text-right text-xs">
                <div className="font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-block mb-1">
                  RÉF : RAP-MEN-HSE-{selectedMois.replace('-', '')}
                </div>
                <div className="text-slate-500">Date d'édition : {new Date().toLocaleDateString('fr-FR')}</div>
                <div className="text-[10px] text-slate-400">Filiale SICDA &bull; Groupe Industriel</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 uppercase">
                Rapport Mensuel de Performance HSE & Conformité des Prestataires
              </h1>
              <div className="text-xs font-bold text-slate-700 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
                Mois : <span className="capitalize text-orange-800">{moisNom}</span> &bull; Site : {selectedSiteFilter}
              </div>
            </div>

            <div className="mt-2 text-xs text-slate-600 flex flex-wrap gap-4">
              <div><strong>Inspecteur HSE référent :</strong> {selectedInspecteur}</div>
              <div><strong>Responsable HSE (RHSE) :</strong> RHSE ELMAGHRAOUI Ilyass</div>
              <div><strong>Manager QHSE :</strong> AMAL JAAFARI</div>
              <div><strong>Directeur Général :</strong> LOULIDI ADIL</div>
              <div><strong>Périmètre :</strong> Ensemble des Ateliers, Chantiers et Locaux industriels</div>
            </div>
          </div>

          {/* Section 1: Tableau des Indicateurs Clés de Performance (KPIs) */}
          <div>
            <h2 className="text-xs font-black tracking-wider uppercase text-slate-500 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              1. Synthèse Exécutive & Indicateurs Clés de Performance
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Taux de Conformité Global</div>
                <div className={`text-2xl font-black ${globalComplianceRate >= 80 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {globalComplianceRate}%
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Cible groupe : &ge; 95%</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Prestataires Conformes</div>
                <div className="text-2xl font-black text-emerald-600">{conformes} / {totalPrest}</div>
                <div className="text-[10px] text-slate-400 mt-1">Accès site autorisé</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Accès Bloqués / NC</div>
                <div className="text-2xl font-black text-rose-600">{nonConformes}</div>
                <div className="text-[10px] text-slate-400 mt-1">{derogations} en dérogation active</div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Rondes & Sécurité</div>
                <div className="text-2xl font-black text-slate-900">{totalPointsControles} pts</div>
                <div className="text-[10px] text-slate-400 mt-1">{totalPointsNC} NC &bull; {ncCloturees} clôturés</div>
              </div>
            </div>
          </div>

          {/* Section 2: Matrice de Conformité Prestataires */}
          <div>
            <h2 className="text-xs font-black tracking-wider uppercase text-slate-500 mb-3 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-orange-500" />
              2. Matrice de Conformité Réglementaire des Entreprises Extérieures
            </h2>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="p-2.5">Prestataire & ICE</th>
                    <th className="p-2.5">Site</th>
                    <th className="p-2.5">Prestation</th>
                    <th className="p-2.5 text-center">Taux</th>
                    <th className="p-2.5 text-center">Statut Accès</th>
                    <th className="p-2.5 text-center">Assurance AT</th>
                    <th className="p-2.5 text-center">Assurance RC</th>
                    <th className="p-2.5 text-center">CNSS</th>
                    <th className="p-2.5 text-center">APR</th>
                    <th className="p-2.5 text-center">Intervenants</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPrestataires.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{p.nomEntreprise}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ICE: {p.ice}</div>
                      </td>
                      <td className="p-2.5 font-medium">{p.siteConcerne}</td>
                      <td className="p-2.5 max-w-xs truncate">{p.typePrestation}</td>
                      <td className="p-2.5 text-center font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          p.tauxConformite >= 90
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.tauxConformite >= 70
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.tauxConformite}%
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.statutFinal === 'CONFORME'
                            ? 'bg-emerald-500 text-white'
                            : p.statutFinal === 'CONFORME_SOUS_RESERVE'
                            ? 'bg-amber-500 text-white'
                            : p.derogation?.active
                            ? 'bg-indigo-600 text-white'
                            : 'bg-rose-600 text-white'
                        }`}>
                          {p.statutFinal === 'CONFORME'
                            ? 'AUTORISÉ'
                            : p.statutFinal === 'CONFORME_SOUS_RESERVE'
                            ? 'SOUS RÉSERVE'
                            : p.derogation?.active
                            ? 'DÉROGATION'
                            : 'REFUSÉ'}
                        </span>
                      </td>
                      <td className="p-2.5 text-center text-[10px] font-medium">
                        {p.documents.assuranceAT.status === 'VALIDE' ? '✅ Valide' : '❌ Exp/Manq'}
                      </td>
                      <td className="p-2.5 text-center text-[10px] font-medium">
                        {p.documents.assuranceRC.status === 'VALIDE' ? '✅ Valide' : '❌ Exp/Manq'}
                      </td>
                      <td className="p-2.5 text-center text-[10px] font-medium">
                        {p.documents.bordereauCNSS.status === 'VALIDE' ? '✅ Valide' : '❌ Exp/Manq'}
                      </td>
                      <td className="p-2.5 text-center text-[10px] font-medium">
                        {p.documents.analyseRisques.status === 'VALIDE' ? '✅ Valide' : '❌ Exp/Manq'}
                      </td>
                      <td className="p-2.5 text-center font-bold text-[11px]">
                        {p.intervenants.length} pers.
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Suivi des Chantiers & Délais */}
          <div>
            <h2 className="text-xs font-black tracking-wider uppercase text-slate-500 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-500" />
              3. Avancement des Chantiers & Respect des Délais Contractuels
            </h2>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="p-2.5">Intervention</th>
                    <th className="p-2.5">Prestataire</th>
                    <th className="p-2.5">Site</th>
                    <th className="p-2.5">Période Prévue</th>
                    <th className="p-2.5 text-center">Avancement</th>
                    <th className="p-2.5 text-center">Statut</th>
                    <th className="p-2.5">Pilote Interne</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredInterventions.map((i) => {
                    const prest = prestataires.find((p) => p.id === i.prestataireId);
                    return (
                      <tr key={i.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{i.prestationTitre}</td>
                        <td className="p-2.5 text-slate-600">{prest?.nomEntreprise || '—'}</td>
                        <td className="p-2.5">{i.site}</td>
                        <td className="p-2.5 text-[11px] text-slate-500">
                          {formatDateFr(i.dateDebutPrevue)} au {formatDateFr(i.dateFinPrevue)}
                        </td>
                        <td className="p-2.5 text-center font-bold">
                          <div className="flex items-center justify-center gap-2">
                            <span>{i.tauxAvancement}%</span>
                            <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full ${i.statut === 'EN_RETARD' ? 'bg-rose-500' : 'bg-orange-500'}`}
                                style={{ width: `${i.tauxAvancement}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-2.5 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            i.statut === 'TERMINEE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : i.statut === 'EN_RETARD'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {i.statut.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600">{i.responsableInterne}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Bilan des Rondes HSE */}
          <div>
            <h2 className="text-xs font-black tracking-wider uppercase text-slate-500 mb-3 flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-orange-500" />
              4. Bilan des Rondes HSE Journalières & Constats Sécurité (Ateliers & Locaux)
            </h2>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs mb-3 space-y-1">
              <div className="font-bold text-slate-800">
                Périmètre couvert : Ensemble des 12 ateliers et locaux industriels (Atelier Électrique, Outillage, Mélange, Broyage, Production, Magasin PR, Administration, Stockages, Laboratoire, etc.)
              </div>
              <div className="text-slate-600">
                Mode opératoire : Une tournée d'inspection journalière avec fiche de constat immédiate (Réf. 021F.Ps.POT.02) pour toute déviation.
              </div>
            </div>

            {/* List of non-conformities found in rondes */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px]">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Site / Inspecteur</th>
                    <th className="p-2.5">Atelier / Local</th>
                    <th className="p-2.5">Preuve Photo</th>
                    <th className="p-2.5">Point Contrôlé & Constat</th>
                    <th className="p-2.5">Cause & Action Corrective</th>
                    <th className="p-2.5">Pilote</th>
                    <th className="p-2.5 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(() => {
                    const allNCs: any[] = [];
                    filteredRondes.forEach((r) => {
                      Object.keys(r.ateliers).forEach((at) => {
                        r.ateliers[at].items.forEach((it) => {
                          if (it.t1 === 'bad' || it.t2 === 'bad') {
                            allNCs.push({
                              date: r.date,
                              site: r.site,
                              inspecteur: r.inspecteur,
                              atelier: at,
                              item: it.name,
                              photos: it.detail?.photos || [],
                              detail: it.detail || {
                                description: it.observation || 'Non-conformité relevée',
                                cause: '—',
                                action: '—',
                                pilote: 'HSE',
                                statut: 'Ouvert',
                                photos: [],
                              },
                            });
                          }
                        });
                      });
                    });

                    if (allNCs.length === 0) {
                      return (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-slate-500 italic">
                            Aucune non-conformité relevée sur la période sélectionnée.
                          </td>
                        </tr>
                      );
                    }

                    return allNCs.map((nc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 whitespace-nowrap font-medium">{formatDateFr(nc.date)}</td>
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">{nc.site}</div>
                          <div className="text-[10px] text-slate-500">{nc.inspecteur}</div>
                        </td>
                        <td className="p-2.5 font-bold text-slate-700">{nc.atelier}</td>
                        <td className="p-2.5 whitespace-nowrap">
                          {nc.photos && nc.photos.length > 0 ? (
                            <div
                              onClick={() =>
                                setSelectedZoomPhoto({
                                  url: nc.photos[0].dataUrl,
                                  title: `${nc.atelier} — ${nc.item}`,
                                  desc: nc.detail.description,
                                })
                              }
                              className="flex items-center gap-1.5 cursor-pointer group"
                              title="Cliquer pour afficher la photo en grand"
                            >
                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-300 bg-slate-900 flex-shrink-0 relative group-hover:border-orange-500 shadow-sm">
                                <img
                                  src={nc.photos[0].dataUrl}
                                  alt="Preuve constat"
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              {nc.photos.length > 1 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">
                                  +{nc.photos.length - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[10px] italic">Sans photo</span>
                          )}
                        </td>
                        <td className="p-2.5 max-w-xs">
                          <div className="font-bold text-rose-700">{nc.item}</div>
                          <div className="text-[10px] text-slate-600">{nc.detail.description}</div>
                        </td>
                        <td className="p-2.5 max-w-xs text-[10px] text-slate-600">
                          <div><strong>Cause :</strong> {nc.detail.cause || '—'}</div>
                          <div><strong>Action :</strong> {nc.detail.action || '—'}</div>
                        </td>
                        <td className="p-2.5 text-slate-700 font-medium">{nc.detail.pilote}</td>
                        <td className="p-2.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            nc.detail.statut === 'Clôturé'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {nc.detail.statut}
                          </span>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Cartouche de Validation & Signatures */}
          <div className="border-t-2 border-slate-900 pt-6 mt-6">
            <h2 className="text-xs font-black tracking-wider uppercase text-slate-500 mb-4">
              5. Cartouche d'Approbation & Visas Officiels
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 border border-slate-300 rounded-xl flex flex-col justify-between h-32 bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">Établi par l'Inspecteur HSE :</div>
                  <div className="text-orange-600 font-bold">{selectedInspecteur}</div>
                  <div className="text-[10px] text-slate-500">Inspection & Contrôle Terrain</div>
                </div>
                <div className="border-t border-slate-300 pt-2 text-[10px] text-slate-400">
                  Signature & Date
                </div>
              </div>

              <div className="p-3 border border-slate-300 rounded-xl flex flex-col justify-between h-32 bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">Vérifié par le RHSE :</div>
                  <div className="text-orange-600 font-bold">RHSE ELMAGHRAOUI Ilyass</div>
                  <div className="text-[10px] text-slate-500">Responsable HSE SICDA</div>
                </div>
                <div className="border-t border-slate-300 pt-2 text-[10px] text-slate-400">
                  Visa RHSE & Date
                </div>
              </div>

              <div className="p-3 border border-slate-300 rounded-xl flex flex-col justify-between h-32 bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">Validé par le Manager QHSE :</div>
                  <div className="text-orange-600 font-bold">AMAL JAAFARI</div>
                  <div className="text-[10px] text-slate-500">Manager QHSE Groupe SICDA</div>
                </div>
                <div className="border-t border-slate-300 pt-2 text-[10px] text-slate-400">
                  Visa QHSE & Date
                </div>
              </div>

              <div className="p-3 border border-slate-300 rounded-xl flex flex-col justify-between h-32 bg-slate-50">
                <div>
                  <div className="font-bold text-slate-900">Approuvé par la Direction :</div>
                  <div className="text-slate-900 font-bold">LOULIDI ADIL</div>
                  <div className="text-[10px] text-slate-500">Directeur Général Groupe SICDA</div>
                </div>
                <div className="border-t border-slate-300 pt-2 text-[10px] text-slate-400">
                  Bon pour application & Archivage
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom Photo Modal */}
      {selectedZoomPhoto && (
        <div
          onClick={() => setSelectedZoomPhoto(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl"
          >
            <div className="p-3 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                  📸
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{selectedZoomPhoto.title}</h4>
                  {selectedZoomPhoto.desc && (
                    <p className="text-[10px] text-slate-400">{selectedZoomPhoto.desc}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedZoomPhoto(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 bg-black/60 flex-1 overflow-auto flex items-center justify-center">
              <img
                src={selectedZoomPhoto.url}
                alt={selectedZoomPhoto.title}
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
