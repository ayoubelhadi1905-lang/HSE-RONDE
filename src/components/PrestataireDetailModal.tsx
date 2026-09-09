import React, { useState } from 'react';
import {
  PrestataireDossier,
  DocumentRecord,
  Intervenant,
  RoleType,
  Derogation,
  DocStatus,
} from '../types';
import { formatDateFr, formatDateTimeFr, checkDateExpiration, addYears, getTodayIso } from '../utils/dates';
import { evaluateDossierCompliance } from '../utils/complianceEngine';
import {
  X,
  FileCheck,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Users,
  Clock,
  Printer,
  History,
  Info,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  UserPlus,
  Trash2,
  AlertOctagon,
  Calendar,
  Building,
  Check,
  Ban,
} from 'lucide-react';
import { FicheConformiteModal } from './FicheConformiteModal';
import { DerogationModal } from './DerogationModal';

interface PrestataireDetailModalProps {
  dossier: PrestataireDossier;
  currentUserRole: RoleType;
  currentUserName: string;
  onClose: () => void;
  onUpdateDossier: (updated: PrestataireDossier) => void;
}

export const PrestataireDetailModal: React.FC<PrestataireDetailModalProps> = ({
  dossier,
  currentUserRole,
  currentUserName,
  onClose,
  onUpdateDossier,
}) => {
  const [activeTab, setActiveTab] = useState<'documents' | 'intervenants' | 'infos' | 'workflow' | 'historique'>('documents');
  const [dossierState, setDossierState] = useState<PrestataireDossier>(dossier);
  const [showFichePdf, setShowFichePdf] = useState(false);
  const [showDerogationModal, setShowDerogationModal] = useState(false);
  const [intervenantModal, setIntervenantModal] = useState<Partial<Intervenant> | null>(null);
  const [validationComment, setValidationComment] = useState('');

  const evaluation = evaluateDossierCompliance(dossierState);
  const canValidateHse = currentUserRole === 'hse' || currentUserRole === 'admin';

  // Helper to update specific document and trigger re-evaluation
  const handleUpdateDocument = (docKey: keyof PrestataireDossier['documents'], updates: Partial<DocumentRecord>) => {
    const updatedDocs = {
      ...dossierState.documents,
      [docKey]: {
        ...dossierState.documents[docKey],
        ...updates,
      },
    };

    const tempDossier = { ...dossierState, documents: updatedDocs };
    const newEval = evaluateDossierCompliance(tempDossier);

    const newDossier: PrestataireDossier = {
      ...tempDossier,
      statutFinal: newEval.statutFinal,
      tauxConformite: newEval.tauxConformite,
      motifsNonConformite: newEval.motifsNonConformite,
      documentsBloquants: newEval.documentsBloquants,
      misAJourLe: new Date().toISOString(),
    };

    setDossierState(newDossier);
    onUpdateDossier(newDossier);
  };

  // Add or edit Intervenant
  const handleSaveIntervenant = (intervenant: Intervenant) => {
    const exists = dossierState.intervenants.some((i) => i.id === intervenant.id);
    let updatedIntervenants: Intervenant[];

    if (exists) {
      updatedIntervenants = dossierState.intervenants.map((i) => (i.id === intervenant.id ? intervenant : i));
    } else {
      updatedIntervenants = [...dossierState.intervenants, intervenant];
    }

    const tempDossier = { ...dossierState, intervenants: updatedIntervenants };
    const newEval = evaluateDossierCompliance(tempDossier);

    const newDossier: PrestataireDossier = {
      ...tempDossier,
      statutFinal: newEval.statutFinal,
      tauxConformite: newEval.tauxConformite,
      motifsNonConformite: newEval.motifsNonConformite,
      documentsBloquants: newEval.documentsBloquants,
      misAJourLe: new Date().toISOString(),
      historique: [
        {
          id: `h-${Date.now()}`,
          date: new Date().toISOString(),
          utilisateur: currentUserName,
          role: currentUserRole,
          action: `${exists ? 'Modification' : 'Ajout'} de l'intervenant ${intervenant.nomPrenom}`,
        },
        ...dossierState.historique,
      ],
    };

    setDossierState(newDossier);
    onUpdateDossier(newDossier);
    setIntervenantModal(null);
  };

  const handleDeleteIntervenant = (id: string) => {
    const updated = dossierState.intervenants.filter((i) => i.id !== id);
    const tempDossier = { ...dossierState, intervenants: updated };
    const newEval = evaluateDossierCompliance(tempDossier);

    const newDossier: PrestataireDossier = {
      ...tempDossier,
      statutFinal: newEval.statutFinal,
      tauxConformite: newEval.tauxConformite,
      motifsNonConformite: newEval.motifsNonConformite,
      documentsBloquants: newEval.documentsBloquants,
      misAJourLe: new Date().toISOString(),
    };

    setDossierState(newDossier);
    onUpdateDossier(newDossier);
  };

  // HSE Decision action
  const handleHseDecision = (decision: 'CONFORME' | 'CONFORME_SOUS_RESERVE' | 'NON_CONFORME') => {
    const actionLabel =
      decision === 'CONFORME'
        ? 'Validation définitive du dossier HSE (Accès autorisé)'
        : decision === 'CONFORME_SOUS_RESERVE'
        ? 'Validation sous réserve'
        : 'Refus du dossier HSE (Non conforme)';

    const newDossier: PrestataireDossier = {
      ...dossierState,
      statutFinal: decision,
      validateurHse: currentUserName,
      dateValidationHse: new Date().toISOString(),
      misAJourLe: new Date().toISOString(),
      historique: [
        {
          id: `h-${Date.now()}`,
          date: new Date().toISOString(),
          utilisateur: currentUserName,
          role: currentUserRole,
          action: actionLabel,
          commentaire: validationComment || undefined,
          ancienStatut: dossierState.statutFinal,
          nouveauStatut: decision,
        },
        ...dossierState.historique,
      ],
    };

    setDossierState(newDossier);
    onUpdateDossier(newDossier);
    setValidationComment('');
  };

  // Grant derogation
  const handleSaveDerogation = (derogation: Derogation) => {
    const newDossier: PrestataireDossier = {
      ...dossierState,
      derogation,
      misAJourLe: new Date().toISOString(),
      historique: [
        {
          id: `h-${Date.now()}`,
          date: new Date().toISOString(),
          utilisateur: currentUserName,
          role: currentUserRole,
          action: `Dérogation exceptionnelle accordée (Réf ${derogation.id})`,
          commentaire: `Motif : ${derogation.motif}. Approuvé par ${derogation.autorite}`,
          ancienStatut: dossierState.statutFinal,
          nouveauStatut: dossierState.statutFinal,
        },
        ...dossierState.historique,
      ],
    };

    setDossierState(newDossier);
    onUpdateDossier(newDossier);
    setShowDerogationModal(false);
  };

  // Revoke derogation
  const handleRevokeDerogation = () => {
    if (!confirm('Êtes-vous sûr de vouloir révoquer cette dérogation ?')) return;
    const newDossier: PrestataireDossier = {
      ...dossierState,
      derogation: undefined,
      misAJourLe: new Date().toISOString(),
      historique: [
        {
          id: `h-${Date.now()}`,
          date: new Date().toISOString(),
          utilisateur: currentUserName,
          role: currentUserRole,
          action: 'Révocation de la dérogation exceptionnelle',
        },
        ...dossierState.historique,
      ],
    };
    setDossierState(newDossier);
    onUpdateDossier(newDossier);
  };

  const isBlocked = dossierState.statutFinal === 'NON_CONFORME' && !dossierState.derogation?.active;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 font-bold text-[11px] uppercase tracking-wider border border-orange-500/40">
                {dossierState.siteConcerne}
              </span>
              <span className="text-xs text-slate-400">ICE : {dossierState.ice || '—'}</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight mt-0.5 flex items-center gap-2">
              {dossierState.nomEntreprise}
            </h1>
            <p className="text-xs text-slate-300">{dossierState.typePrestation}</p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Compliance Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Conformité</div>
                <div className="text-sm font-black text-orange-400">{dossierState.tauxConformite}%</div>
              </div>
              <div className="h-7 w-[1px] bg-slate-700 mx-1" />
              {dossierState.derogation?.active ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Sous Dérogation
                </span>
              ) : dossierState.statutFinal === 'CONFORME' ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Conforme
                </span>
              ) : dossierState.statutFinal === 'CONFORME_SOUS_RESERVE' ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Sous Réserve
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  Non Conforme
                </span>
              )}
            </div>

            <button
              onClick={() => setShowFichePdf(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Générer et imprimer la fiche officielle de conformité"
            >
              <Printer className="w-4 h-4 text-orange-400" />
              Fiche PDF
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Blocking Warning Banner (Specification point 12) */}
        {isBlocked && (
          <div className="p-4 bg-rose-50 border-b border-rose-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-rose-600 text-white rounded-xl flex-shrink-0 mt-0.5">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-rose-900 tracking-tight flex items-center gap-2">
                  ACCÈS AU SITE STRICTEMENT INTERDIT
                  <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 text-[11px] font-bold">
                    {evaluation.motifsNonConformite.length} non-conformité(s) bloquante(s)
                  </span>
                </h3>
                <ul className="text-xs text-rose-800 mt-1 list-disc list-inside space-y-0.5 font-medium">
                  {evaluation.motifsNonConformite.map((motif, i) => (
                    <li key={i}>{motif}</li>
                  ))}
                </ul>
              </div>
            </div>

            {canValidateHse && (
              <button
                onClick={() => setShowDerogationModal(true)}
                className="self-start sm:self-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md flex items-center gap-2 transition-transform active:scale-95 flex-shrink-0"
              >
                <AlertTriangle className="w-4 h-4" />
                Autoriser exceptionnellement sous dérogation
              </button>
            )}
          </div>
        )}

        {/* Derogation Active Notice */}
        {dossierState.derogation?.active && (
          <div className="p-3.5 bg-amber-50 border-b border-amber-300 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5 text-xs text-amber-900 font-medium">
              <AlertOctagon className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <span className="font-extrabold text-amber-950">Accès exceptionnel accordé sous dérogation :</span>{' '}
                {dossierState.derogation.motif} (Approuvé par : {dossierState.derogation.autorite} jusqu'au{' '}
                {formatDateFr(dossierState.derogation.dateFin)})
              </div>
            </div>
            {canValidateHse && (
              <button
                onClick={handleRevokeDerogation}
                className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors flex-shrink-0"
              >
                Révoquer
              </button>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-slate-50 flex-shrink-0 overflow-x-auto text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'documents'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Documents Obligatoires (9)
          </button>
          <button
            onClick={() => setActiveTab('intervenants')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'intervenants'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            Intervenants & Habilitations ({dossierState.intervenants.length})
          </button>
          <button
            onClick={() => setActiveTab('infos')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'infos'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Info className="w-4 h-4" />
            Fiche Prestataire
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'workflow'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Contrôle & Validation HSE
          </button>
          <button
            onClick={() => setActiveTab('historique')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'historique'
                ? 'border-orange-500 text-orange-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            Historique ({dossierState.historique.length})
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800 text-xs sm:text-sm">
          {/* TAB 1: DOCUMENTS OBLIGATOIRES (Point 2 du prompt) */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Introduction bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="text-slate-600">
                  <span className="font-bold text-slate-900">Moteur de validation automatique :</span> Contrôle automatique des dates de validité (durée 1 an pour AT/RC), présence et cohérence.
                </div>
                <div className="flex items-center gap-2 font-semibold text-slate-700">
                  <span>🟢 Valide</span>
                  <span>🟠 &lt;30j</span>
                  <span>🟡 &lt;60j</span>
                  <span>🔴 Expiré/Manquant</span>
                </div>
              </div>

              {/* Document A: Assurance Accident du Travail (AT) */}
              <DocumentCard
                title="A. Assurance Accident du Travail (AT)"
                doc={dossierState.documents.assuranceAT}
                docKey="assuranceAT"
                canEdit={currentUserRole === 'prestataire' || canValidateHse}
                canValidate={canValidateHse}
                currentUserName={currentUserName}
                isAnnualInsurance
                onUpdate={(updates) => handleUpdateDocument('assuranceAT', updates)}
              />

              {/* Document B: Assurance Responsabilité Civile (RC) */}
              <DocumentCard
                title="B. Assurance Responsabilité Civile (RC)"
                doc={dossierState.documents.assuranceRC}
                docKey="assuranceRC"
                canEdit={currentUserRole === 'prestataire' || canValidateHse}
                canValidate={canValidateHse}
                currentUserName={currentUserName}
                isAnnualInsurance
                onUpdate={(updates) => handleUpdateDocument('assuranceRC', updates)}
              />

              {/* Document E: Bordereau CNSS */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-500" />
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">E. Bordereau CNSS</h3>
                  </div>
                  <DocStatusBadge status={dossierState.documents.bordereauCNSS.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Période concernée
                    </label>
                    <input
                      type="text"
                      value={dossierState.documents.bordereauCNSS.periodeCnss || ''}
                      onChange={(e) => handleUpdateDocument('bordereauCNSS', { periodeCnss: e.target.value })}
                      placeholder="Ex : Juin - Août 2026"
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Fichier Téléversé
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={dossierState.documents.bordereauCNSS.fileName || 'Aucun fichier'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 font-mono"
                      />
                      <label className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors flex-shrink-0">
                        <Upload className="w-3.5 h-3.5 inline mr-1" />
                        Upload
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              handleUpdateDocument('bordereauCNSS', {
                                fileName: f.name,
                                fileSize: `${(f.size / 1024).toFixed(0)} Ko`,
                                status: 'VALIDE',
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Cohérence avec intervenants
                    </label>
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                      {dossierState.intervenants.length} intervenant(s) déclaré(s) sur la fiche.
                    </div>
                  </div>
                </div>

                {canValidateHse && (
                  <HseDocValidationBlock
                    doc={dossierState.documents.bordereauCNSS}
                    currentUserName={currentUserName}
                    onUpdate={(up) => handleUpdateDocument('bordereauCNSS', up)}
                  />
                )}
              </div>

              {/* Document G: Analyse des Risques de la prestation */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">
                      G. Analyse des Risques de la Prestation (Plan de Prévention)
                    </h3>
                  </div>
                  <DocStatusBadge status={dossierState.documents.analyseRisques.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Prestation concernée
                    </label>
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 text-xs">
                      {dossierState.typePrestation} ({dossierState.siteConcerne})
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Document téléversé (APR / Plan)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={dossierState.documents.analyseRisques.fileName || 'Aucun document'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 font-mono"
                      />
                      <label className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors flex-shrink-0">
                        <Upload className="w-3.5 h-3.5 inline mr-1" />
                        Upload
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              handleUpdateDocument('analyseRisques', {
                                fileName: f.name,
                                fileSize: `${(f.size / 1024).toFixed(0)} Ko`,
                                validationHseStatus: 'A_VERIFIER',
                                status: 'A_VERIFIER',
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {canValidateHse && (
                  <HseDocValidationBlock
                    doc={dossierState.documents.analyseRisques}
                    currentUserName={currentUserName}
                    onUpdate={(up) => handleUpdateDocument('analyseRisques', up)}
                  />
                )}
              </div>

              {/* Document H: Attestation de conformité légale */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-orange-500" />
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">H. Attestation de Conformité</h3>
                  </div>
                  <DocStatusBadge status={dossierState.documents.attestationConformite.status} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Date d'émission
                    </label>
                    <input
                      type="date"
                      value={dossierState.documents.attestationConformite.dateEmission || ''}
                      onChange={(e) => handleUpdateDocument('attestationConformite', { dateEmission: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Fichier joint
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={dossierState.documents.attestationConformite.fileName || 'Non déposé'}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 font-mono"
                      />
                      <label className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors flex-shrink-0">
                        <Upload className="w-3.5 h-3.5 inline mr-1" />
                        Upload
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              handleUpdateDocument('attestationConformite', {
                                fileName: f.name,
                                status: 'VALIDE',
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {canValidateHse && (
                  <HseDocValidationBlock
                    doc={dossierState.documents.attestationConformite}
                    currentUserName={currentUserName}
                    onUpdate={(up) => handleUpdateDocument('attestationConformite', up)}
                  />
                )}
              </div>

              {/* Document I: Fiche de Données de Sécurité (FDS) (Point 2.I) */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-500" />
                    <h3 className="font-black text-slate-900 text-sm sm:text-base">
                      I. Fiche de Données de Sécurité (FDS)
                    </h3>
                  </div>
                  <DocStatusBadge status={dossierState.documents.fds.status} />
                </div>

                {/* Chemical products applicability toggle */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-xs text-slate-900">
                      L'intervention implique-t-elle l'utilisation de produits chimiques ?
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Obligatoire pour les solvants, acides, gaz de soudage, lubrifiants, décapants.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateDocument('fds', {
                          isNonApplicable: false,
                          status: dossierState.documents.fds.fileName ? 'VALIDE' : 'MANQUANT',
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        !dossierState.documents.fds.isNonApplicable
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      Oui, Produits Chimiques
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateDocument('fds', {
                          isNonApplicable: true,
                          status: 'NON_APPLICABLE',
                          justificationNA:
                            dossierState.documents.fds.justificationNA ||
                            'Aucun produit chimique utilisé dans le cadre de cette prestation.',
                          validationHseStatus: 'VALIDEE',
                        })
                      }
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        dossierState.documents.fds.isNonApplicable
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      Non Applicable (Justifié)
                    </button>
                  </div>
                </div>

                {dossierState.documents.fds.isNonApplicable ? (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Justification obligatoire de non-applicabilité
                    </label>
                    <textarea
                      value={dossierState.documents.fds.justificationNA || ''}
                      onChange={(e) => handleUpdateDocument('fds', { justificationNA: e.target.value })}
                      placeholder="Préciser pourquoi aucun produit chimique n'est utilisé..."
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm min-h-[60px]"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Nom du produit chimique
                      </label>
                      <input
                        type="text"
                        value={dossierState.documents.fds.nomProduitChimique || ''}
                        onChange={(e) => handleUpdateDocument('fds', { nomProduitChimique: e.target.value })}
                        placeholder="Ex : Solvant Dégraissant SolvClean 400"
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Fabricant
                      </label>
                      <input
                        type="text"
                        value={dossierState.documents.fds.fabricantFds || ''}
                        onChange={(e) => handleUpdateDocument('fds', { fabricantFds: e.target.value })}
                        placeholder="Ex : TotalEnergies Fluids"
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Version / Date de la FDS
                      </label>
                      <input
                        type="text"
                        value={dossierState.documents.fds.versionFds || ''}
                        onChange={(e) => handleUpdateDocument('fds', { versionFds: e.target.value })}
                        placeholder="Ex : v4.2 - Mars 2026"
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Classification du produit (GHS / CLP)
                      </label>
                      <input
                        type="text"
                        value={dossierState.documents.fds.classificationFds || ''}
                        onChange={(e) => handleUpdateDocument('fds', { classificationFds: e.target.value })}
                        placeholder="Ex : Inflammable Cat 2, Corrosif C"
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                        Fichier FDS PDF
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={dossierState.documents.fds.fileName || 'Aucun fichier FDS téléversé'}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 font-mono"
                        />
                        <label className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors flex-shrink-0">
                          <Upload className="w-3.5 h-3.5 inline mr-1" />
                          Upload FDS
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                handleUpdateDocument('fds', {
                                  fileName: f.name,
                                  status: 'VALIDE',
                                  validationHseStatus: 'A_VERIFIER',
                                });
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {canValidateHse && !dossierState.documents.fds.isNonApplicable && (
                  <HseDocValidationBlock
                    doc={dossierState.documents.fds}
                    currentUserName={currentUserName}
                    onUpdate={(up) => handleUpdateDocument('fds', up)}
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INTERVENANTS & HABILITATIONS (Points C, D, F) */}
          {activeTab === 'intervenants' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 tracking-tight">
                    Liste des Intervenants & Contrôle des Habilitations
                  </h2>
                  <p className="text-xs text-slate-500">
                    Chaque intervenant doit obligatoirement avoir sa CIN téléversée, ses habilitations à jour et son aptitude validée.
                  </p>
                </div>
                <button
                  onClick={() =>
                    setIntervenantModal({
                      id: `int-${Date.now()}`,
                      nomPrenom: '',
                      cin: '',
                      fonction: '',
                      societe: dossierState.nomEntreprise,
                      qualification: '',
                      habilitations: [],
                      dateValiditeHabilitation: '',
                      formationHse: true,
                      aptitudeMedicale: true,
                      cinStatus: 'A_VERIFIER',
                      statutConformite: 'A_VERIFIER',
                    })
                  }
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Ajouter un intervenant
                </button>
              </div>

              {dossierState.intervenants.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-slate-50">
                  <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-800 text-sm">Aucun intervenant enregistré</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    La liste des intervenants sur site est obligatoire avant toute intervention.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Intervenant / CIN</th>
                        <th className="p-3">Fonction & Qualification</th>
                        <th className="p-3">Habilitations & Validités</th>
                        <th className="p-3 text-center">Form. HSE</th>
                        <th className="p-3 text-center">Aptitude</th>
                        <th className="p-3 text-center">Statut</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {dossierState.intervenants.map((intervenant) => {
                        const expCheck = intervenant.dateValiditeHabilitation
                          ? checkDateExpiration(intervenant.dateValiditeHabilitation)
                          : null;

                        return (
                          <tr key={intervenant.id} className="hover:bg-slate-50/70">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{intervenant.nomPrenom}</div>
                              <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                CIN : {intervenant.cin || <span className="text-rose-600 font-bold">MANQUANTE</span>}
                                {intervenant.cinFileUrl && <span className="text-[10px] text-emerald-600 font-bold">✓ Jointe</span>}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium text-slate-800">{intervenant.fonction || '—'}</div>
                              <div className="text-[11px] text-slate-500">{intervenant.qualification || intervenant.societe}</div>
                            </td>
                            <td className="p-3">
                              <div className="flex flex-wrap gap-1">
                                {intervenant.habilitations.length === 0 ? (
                                  <span className="text-rose-600 font-bold text-[11px]">Aucune habilitation</span>
                                ) : (
                                  intervenant.habilitations.map((h, i) => (
                                    <span
                                      key={i}
                                      className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold text-[10px]"
                                    >
                                      {h}
                                    </span>
                                  ))
                                )}
                              </div>
                              {expCheck && (
                                <div className="mt-1">
                                  {expCheck.status === 'EXPIRE' ? (
                                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                      🔴 Expiré ({expCheck.label})
                                    </span>
                                  ) : expCheck.status === 'EXPIRATION_PROCHE' ? (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      🟠 {expCheck.label}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-emerald-700 font-semibold">
                                      🟢 Valide jusqu'au {formatDateFr(intervenant.dateValiditeHabilitation)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {intervenant.formationHse ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  Oui
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                                  Non
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {intervenant.aptitudeMedicale ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                  Apte
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                                  Inapte
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              {intervenant.statutConformite === 'VALIDE' ? (
                                <span className="text-emerald-600 font-bold text-xs">🟢 Conforme</span>
                              ) : intervenant.statutConformite === 'EXPIRE' ? (
                                <span className="text-rose-600 font-bold text-xs">🔴 Expiré</span>
                              ) : (
                                <span className="text-amber-600 font-bold text-xs">🟠 À vérifier</span>
                              )}
                            </td>
                            <td className="p-3 text-right space-x-1">
                              <button
                                onClick={() => setIntervenantModal(intervenant)}
                                className="px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded font-semibold text-xs transition-colors"
                              >
                                Modifier
                              </button>
                              <button
                                onClick={() => handleDeleteIntervenant(intervenant.id)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FICHE PRESTATAIRE (Point 1 du prompt) */}
          {activeTab === 'infos' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                    <Building className="w-4 h-4 text-orange-500" />
                    Informations Générales de l'Entreprise
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Nom de l'entreprise</label>
                    <input
                      type="text"
                      value={dossierState.nomEntreprise}
                      onChange={(e) => setDossierState({ ...dossierState, nomEntreprise: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Identifiant Commun (ICE)</label>
                      <input
                        type="text"
                        value={dossierState.ice}
                        onChange={(e) => setDossierState({ ...dossierState, ice: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Registre du Commerce (RC)</label>
                      <input
                        type="text"
                        value={dossierState.rc}
                        onChange={(e) => setDossierState({ ...dossierState, rc: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Adresse complète</label>
                    <input
                      type="text"
                      value={dossierState.adresse}
                      onChange={(e) => setDossierState({ ...dossierState, adresse: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Téléphone</label>
                      <input
                        type="text"
                        value={dossierState.telephone}
                        onChange={(e) => setDossierState({ ...dossierState, telephone: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={dossierState.email}
                        onChange={(e) => setDossierState({ ...dossierState, email: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Responsable / Contact Prestataire</label>
                    <input
                      type="text"
                      value={dossierState.contactNom}
                      onChange={(e) => setDossierState({ ...dossierState, contactNom: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                    <Calendar className="w-4 h-4 text-orange-500" />
                    Intervention & Cadre SICDA
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Type de prestation</label>
                    <input
                      type="text"
                      value={dossierState.typePrestation}
                      onChange={(e) => setDossierState({ ...dossierState, typePrestation: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Site concerné</label>
                    <select
                      value={dossierState.siteConcerne}
                      onChange={(e) => setDossierState({ ...dossierState, siteConcerne: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-orange-600 text-xs sm:text-sm"
                    >
                      {['SICDA 1', 'SICDA 2', 'SICDA 3', 'SICDA 4', 'SICDA 5'].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Date prévue d'intervention</label>
                    <input
                      type="date"
                      value={dossierState.datePrevueIntervention}
                      onChange={(e) => setDossierState({ ...dossierState, datePrevueIntervention: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Date de début</label>
                      <input
                        type="date"
                        value={dossierState.dateDebutPrestation}
                        onChange={(e) => setDossierState({ ...dossierState, dateDebutPrestation: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Date de fin prévue</label>
                      <input
                        type="date"
                        value={dossierState.dateFinPrevue}
                        onChange={(e) => setDossierState({ ...dossierState, dateFinPrevue: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Responsable Interne SICDA</label>
                    <input
                      type="text"
                      value={dossierState.responsableInterneSicda}
                      onChange={(e) => setDossierState({ ...dossierState, responsableInterneSicda: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    const newDossier = {
                      ...dossierState,
                      misAJourLe: new Date().toISOString(),
                    };
                    onUpdateDossier(newDossier);
                    alert('Fiche prestataire mise à jour avec succès.');
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs sm:text-sm shadow transition-colors"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: CONTRÔLE & WORKFLOW HSE (Point 3, 5, 7) */}
          {activeTab === 'workflow' && (
            <div className="space-y-6">
              {/* Compliance Engine Summary */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900 text-base">Résultats du Moteur de Conformité</h3>
                    <p className="text-xs text-slate-500">
                      Formule : Documents conformes / Documents applicables × 100
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Taux calculé</div>
                      <div className="text-2xl font-black text-orange-600">{evaluation.tauxConformite}%</div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      evaluation.tauxConformite === 100
                        ? 'bg-emerald-500'
                        : evaluation.tauxConformite >= 75
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${evaluation.tauxConformite}%` }}
                  />
                </div>

                {/* Blocking elements breakdown */}
                {evaluation.motifsNonConformite.length > 0 && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-xs">
                    <div className="font-black text-rose-900 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Éléments bloquants constatés ({evaluation.motifsNonConformite.length}) :
                    </div>
                    <ul className="list-disc list-inside text-rose-800 space-y-0.5 font-medium pl-2">
                      {evaluation.motifsNonConformite.map((motif, i) => (
                        <li key={i}>{motif}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings (under reserve) */}
                {evaluation.elementsSousReserve.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1 text-xs">
                    <div className="font-black text-amber-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Points d'attention / Sous réserve ({evaluation.elementsSousReserve.length}) :
                    </div>
                    <ul className="list-disc list-inside text-amber-800 space-y-0.5 font-medium pl-2">
                      {evaluation.elementsSousReserve.map((el, i) => (
                        <li key={i}>{el}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* HSE Action Decision Box */}
              {canValidateHse ? (
                <div className="p-6 bg-white border-2 border-slate-900 rounded-2xl shadow-sm space-y-4">
                  <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-orange-500" />
                    Décision & Validation du Service HSE SICDA
                  </h3>
                  <p className="text-xs text-slate-600">
                    En tant que membre habilité HSE ou Administrateur, vous engagez la responsabilité de sécurité en statuant sur ce dossier.
                  </p>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Commentaire ou observation générale du visa HSE
                    </label>
                    <textarea
                      value={validationComment}
                      onChange={(e) => setValidationComment(e.target.value)}
                      placeholder="Commentaire officiel sur la décision prise..."
                      className="w-full border border-slate-300 rounded-xl p-3 text-xs sm:text-sm min-h-[70px]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <button
                      type="button"
                      disabled={evaluation.motifsNonConformite.length > 0}
                      onClick={() => handleHseDecision('CONFORME')}
                      className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs sm:text-sm shadow flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Valider 100% Conforme
                    </button>

                    <button
                      type="button"
                      onClick={() => handleHseDecision('CONFORME_SOUS_RESERVE')}
                      className="px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      Valider Sous Réserve
                    </button>

                    <button
                      type="button"
                      onClick={() => handleHseDecision('NON_CONFORME')}
                      className="px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs sm:text-sm shadow flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                      <XCircle className="w-4 h-4" />
                      Refuser (Non Conforme)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600">
                  ℹ️ Votre profil ({currentUserRole}) permet la consultation. Seul le Responsable HSE ou l'Administrateur peut apposer la décision finale.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: HISTORIQUE ET TRAÇABILITÉ (Point 7 du prompt) */}
          {activeTab === 'historique' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 text-sm sm:text-base">Journal d'Audit & Traçabilité Complète</h3>
                <span className="text-xs text-slate-500 font-mono">{dossierState.historique.length} événements</span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                {dossierState.historique.map((h) => (
                  <div key={h.id} className="p-4 hover:bg-slate-50/70 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded text-[11px] font-bold uppercase tracking-wider">
                          {h.role}
                        </span>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{h.utilisateur}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">{formatDateTimeFr(h.date)}</span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 mt-1">{h.action}</p>

                    {h.commentaire && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg mt-2 border border-slate-200 italic">
                        « {h.commentaire} »
                      </p>
                    )}

                    {(h.ancienStatut || h.nouveauStatut) && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-2 font-mono">
                        <span>{h.ancienStatut || '—'}</span>
                        <span>➔</span>
                        <span className="font-bold text-slate-900">{h.nouveauStatut}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 flex-shrink-0">
          <div>
            Dossier créé le : {formatDateFr(dossierState.creeLe)} &bull; Dernière mise à jour : {formatDateTimeFr(dossierState.misAJourLe)}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold hover:bg-slate-800 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>

      {/* Fiche Conformite Modal */}
      {showFichePdf && (
        <FicheConformiteModal
          dossier={dossierState}
          onClose={() => setShowFichePdf(false)}
        />
      )}

      {/* Derogation Modal */}
      {showDerogationModal && (
        <DerogationModal
          dossier={dossierState}
          currentUser={currentUserName}
          onClose={() => setShowDerogationModal(false)}
          onSaveDerogation={handleSaveDerogation}
        />
      )}

      {/* Intervenant Add/Edit Modal */}
      {intervenantModal && (
        <IntervenantEditModal
          intervenant={intervenantModal}
          onClose={() => setIntervenantModal(null)}
          onSave={handleSaveIntervenant}
        />
      )}
    </div>
  );
};

// Sub-component for Document cards (AT, RC, etc.)
interface DocumentCardProps {
  title: string;
  doc: DocumentRecord;
  docKey: string;
  canEdit: boolean;
  canValidate: boolean;
  currentUserName: string;
  isAnnualInsurance?: boolean;
  onUpdate: (updates: Partial<DocumentRecord>) => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({
  title,
  doc,
  canEdit,
  canValidate,
  currentUserName,
  isAnnualInsurance,
  onUpdate,
}) => {
  const expCheck = doc.dateExpiration ? checkDateExpiration(doc.dateExpiration) : null;

  return (
    <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-orange-500" />
          <h3 className="font-black text-slate-900 text-sm sm:text-base">{title}</h3>
          {isAnnualInsurance && (
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200">
              Validité 1 an attendue
            </span>
          )}
        </div>
        <DocStatusBadge status={doc.status} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Numéro de Police
          </label>
          <input
            type="text"
            value={doc.numeroPolice || ''}
            onChange={(e) => onUpdate({ numeroPolice: e.target.value })}
            placeholder="Ex : AT-984210"
            className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-xs sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Date Début de Validité
          </label>
          <input
            type="date"
            value={doc.dateDebut || ''}
            onChange={(e) => {
              const start = e.target.value;
              const updates: Partial<DocumentRecord> = { dateDebut: start };
              // Auto calculate 1 year if annual insurance
              if (isAnnualInsurance && start) {
                updates.dateExpiration = addYears(start, 1);
              }
              onUpdate(updates);
            }}
            className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Date d'Expiration
          </label>
          <input
            type="date"
            value={doc.dateExpiration || ''}
            onChange={(e) => {
              const exp = e.target.value;
              const check = checkDateExpiration(exp);
              onUpdate({
                dateExpiration: exp,
                status: check.status,
              });
            }}
            className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Fichier Joint
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={doc.fileName || 'Non téléversé'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 font-mono"
            />
            <label className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-colors flex-shrink-0">
              <Upload className="w-3.5 h-3.5 inline mr-1" />
              Upload
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    onUpdate({
                      fileName: f.name,
                      fileSize: `${(f.size / (1024 * 1024)).toFixed(1)} Mo`,
                    });
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Automatic alert banner if expired or close to expiration */}
      {expCheck && (
        <div className="flex items-center gap-2 text-xs">
          {expCheck.status === 'EXPIRE' && (
            <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 font-bold flex items-center gap-2 w-full">
              <XCircle className="w-4 h-4 text-rose-600" />
              Document expiré ! {expCheck.label}. Une attestation de renouvellement valide est obligatoire.
            </div>
          )}
          {expCheck.status === 'EXPIRATION_PROCHE' && (
            <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-amber-800 font-bold flex items-center gap-2 w-full">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Attention : Expiration proche ! {expCheck.label}.
            </div>
          )}
        </div>
      )}

      {canValidate && (
        <HseDocValidationBlock doc={doc} currentUserName={currentUserName} onUpdate={onUpdate} />
      )}
    </div>
  );
};

// HSE Validation block inside document
const HseDocValidationBlock: React.FC<{
  doc: DocumentRecord;
  currentUserName: string;
  onUpdate: (up: Partial<DocumentRecord>) => void;
}> = ({ doc, currentUserName, onUpdate }) => {
  return (
    <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/50 p-3 rounded-xl">
      <div className="flex-1">
        <label className="block font-bold text-slate-600 mb-1">Commentaire HSE sur ce document :</label>
        <input
          type="text"
          value={doc.commentairesHse || ''}
          onChange={(e) => onUpdate({ commentairesHse: e.target.value })}
          placeholder="Ex : Police vérifiée auprès de l'assureur, conforme..."
          className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
        />
      </div>
      <div className="flex items-center gap-2 self-end sm:self-center">
        <button
          type="button"
          onClick={() =>
            onUpdate({
              validationHseStatus: 'VALIDEE',
              verifiePar: currentUserName,
              dateVerification: new Date().toISOString().slice(0, 10),
              status: 'VALIDE',
            })
          }
          className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors ${
            doc.validationHseStatus === 'VALIDEE'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          Valider
        </button>
        <button
          type="button"
          onClick={() =>
            onUpdate({
              validationHseStatus: 'REFUSEE',
              verifiePar: currentUserName,
              dateVerification: new Date().toISOString().slice(0, 10),
              status: 'REFUSE',
            })
          }
          className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors ${
            doc.validationHseStatus === 'REFUSEE'
              ? 'bg-rose-600 text-white'
              : 'bg-rose-50 text-rose-800 border border-rose-300 hover:bg-rose-100'
          }`}
        >
          <X className="w-3.5 h-3.5" />
          Refuser
        </button>
      </div>
    </div>
  );
};

const DocStatusBadge: React.FC<{ status: DocStatus }> = ({ status }) => {
  switch (status) {
    case 'VALIDE':
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Présent & Valide
        </span>
      );
    case 'EXPIRATION_PROCHE':
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" /> Expiration Proche
        </span>
      );
    case 'EXPIRE':
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" /> Expiré
        </span>
      );
    case 'MANQUANT':
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" /> Manquant
        </span>
      );
    case 'REFUSE':
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-200 text-rose-900 flex items-center gap-1">
          <Ban className="w-3.5 h-3.5" /> Refusé HSE
        </span>
      );
    case 'NON_APPLICABLE':
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
          ⚪ Non Applicable
        </span>
      );
    default:
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800">
          🔍 À Vérifier
        </span>
      );
  }
};

// Modal for Adding / Editing Intervenant
const IntervenantEditModal: React.FC<{
  intervenant: Partial<Intervenant>;
  onClose: () => void;
  onSave: (intervenant: Intervenant) => void;
}> = ({ intervenant, onClose, onSave }) => {
  const [nomPrenom, setNomPrenom] = useState(intervenant.nomPrenom || '');
  const [cin, setCin] = useState(intervenant.cin || '');
  const [fonction, setFonction] = useState(intervenant.fonction || '');
  const [societe, setSociete] = useState(intervenant.societe || '');
  const [qualification, setQualification] = useState(intervenant.qualification || '');
  const [habilitations, setHabilitations] = useState<string[]>(intervenant.habilitations || []);
  const [dateValidite, setDateValidite] = useState(intervenant.dateValiditeHabilitation || '');
  const [formationHse, setFormationHse] = useState(intervenant.formationHse ?? true);
  const [aptitudeMedicale, setAptitudeMedicale] = useState(intervenant.aptitudeMedicale ?? true);
  const [cinFileUrl, setCinFileUrl] = useState(intervenant.cinFileUrl || '');

  const availableHabilitations = [
    'Habilitation électrique B1V / B2V',
    'Habilitation électrique BR / BC',
    'Autorisation de conduite / CACES R486 (Nacelle)',
    'Autorisation de conduite / CACES R489 (Chariot)',
    'Travail en hauteur & Port du harnais',
    'Soudage / Travaux par point chaud (Permis de Feu)',
    'Montage / Démontage Échafaudage R408',
    'Intervention en Espaces Confinés',
    'Risque Chimique Niveau 1 ou 2',
    'Sauveteur Secouriste du Travail (SST)',
  ];

  const toggleHabilitation = (h: string) => {
    if (habilitations.includes(h)) {
      setHabilitations(habilitations.filter((x) => x !== h));
    } else {
      setHabilitations([...habilitations, h]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomPrenom.trim()) {
      alert('Veuillez renseigner le nom et prénom de l’intervenant.');
      return;
    }
    if (!cin.trim()) {
      alert('La CIN est obligatoire pour le contrôle d’accès.');
      return;
    }

    let statut: Intervenant['statutConformite'] = 'VALIDE';
    if (dateValidite) {
      const exp = checkDateExpiration(dateValidite);
      if (exp.status === 'EXPIRE') statut = 'EXPIRE';
    }

    const saved: Intervenant = {
      id: intervenant.id || `int-${Date.now()}`,
      nomPrenom: nomPrenom.trim(),
      cin: cin.trim(),
      cinFileUrl: cinFileUrl || 'cin_justificatif.pdf',
      cinStatus: 'VALIDE',
      fonction: fonction.trim(),
      societe: societe.trim(),
      qualification: qualification.trim(),
      habilitations,
      dateValiditeHabilitation: dateValidite,
      formationHse,
      aptitudeMedicale,
      statutConformite: statut,
    };

    onSave(saved);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <h3 className="font-bold text-base">Fiche Intervenant & Habilitations</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom & Prénom <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nomPrenom}
                onChange={(e) => setNomPrenom(e.target.value)}
                placeholder="Ex : Yassine Mansouri"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numéro CIN <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={cin}
                onChange={(e) => setCin(e.target.value)}
                placeholder="Ex : BE841029"
                className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Fonction</label>
              <input
                type="text"
                value={fonction}
                onChange={(e) => setFonction(e.target.value)}
                placeholder="Ex : Électricien Chef d'Équipe"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Société</label>
              <input
                type="text"
                value={societe}
                onChange={(e) => setSociete(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Qualification professionnelle</label>
            <input
              type="text"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="Ex : Technicien Spécialisé en Électromécanique"
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
            />
          </div>

          {/* Habilitations Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Qualifications & Habilitations requises (Sélectionner)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
              {availableHabilitations.map((h) => (
                <label key={h} className="flex items-center gap-2 text-xs text-slate-800 cursor-pointer p-1 rounded hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={habilitations.includes(h)}
                    onChange={() => toggleHabilitation(h)}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span>{h}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date de validité des habilitations
              </label>
              <input
                type="date"
                value={dateValidite}
                onChange={(e) => setDateValidite(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Copie de la CIN</label>
              <label className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">
                <Upload className="w-4 h-4 text-orange-500" />
                {cinFileUrl ? 'Fichier CIN sélectionné' : 'Téléverser la CIN (PDF/Image)'}
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setCinFileUrl(f.name);
                  }}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formationHse}
                onChange={(e) => setFormationHse(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              Formation HSE effectuée
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={aptitudeMedicale}
                onChange={(e) => setAptitudeMedicale(e.target.checked)}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              Aptitude Médicale au poste validée
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow"
            >
              Enregistrer l'Intervenant
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
