import React, { useState } from 'react';
import { Derogation, PrestataireDossier } from '../types';
import { getTodayIso, formatDateFr } from '../utils/dates';
import { AlertOctagon, X, Check, ShieldAlert, FileText } from 'lucide-react';

interface DerogationModalProps {
  dossier: PrestataireDossier;
  currentUser: string;
  onClose: () => void;
  onSaveDerogation: (derogation: Derogation) => void;
}

export const DerogationModal: React.FC<DerogationModalProps> = ({
  dossier,
  currentUser,
  onClose,
  onSaveDerogation,
}) => {
  const today = getTodayIso();
  const [motif, setMotif] = useState('');
  const [autorite, setAutorite] = useState("Directeur Général LOULIDI ADIL & Manager QHSE AMAL JAAFARI");
  const [dateDebut, setDateDebut] = useState(dossier.dateDebutPrestation || today);
  const [dateFin, setDateFin] = useState(dossier.dateFinPrevue || today);
  const [commentaire, setCommentaire] = useState('');
  const [pieceNom, setPieceNom] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!motif.trim()) {
      setError('Veuillez préciser le motif précis de la dérogation.');
      return;
    }
    if (!autorite.trim()) {
      setError("Veuillez indiquer l'autorité ayant formellement approuvé cette dérogation.");
      return;
    }
    if (!dateDebut || !dateFin || dateFin < dateDebut) {
      setError('Veuillez vérifier les dates de validité de la dérogation.');
      return;
    }

    const newDerogation: Derogation = {
      id: `DEROG-${Date.now().toString().slice(-6)}`,
      active: true,
      motif: motif.trim(),
      autorite: autorite.trim(),
      dateDebut,
      dateFin,
      commentaire: commentaire.trim(),
      pieceJustificativeNom: pieceNom.trim() || 'Engagement_Direction_Signe.pdf',
      accordePar: currentUser,
      dateAccord: new Date().toISOString(),
    };

    onSaveDerogation(newDerogation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-amber-300 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-amber-500 text-slate-950 border-b border-amber-400">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-950 text-amber-400 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                Autorisation Exceptionnelle sous Dérogation
              </h2>
              <p className="text-xs text-slate-900 font-medium">
                {dossier.nomEntreprise} &bull; {dossier.siteConcerne}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-900 hover:bg-amber-400 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning banner */}
        <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <p className="font-bold">Attention : Procédure formelle de dérogation HSE</p>
            <p className="mt-0.5 text-amber-800">
              L'autorisation sous dérogation permet un accès temporaire malgré des non-conformités bloquantes.
              Cet acte est <span className="font-bold underline">strictement consigné dans l'historique d'audit</span> et engage la responsabilité de l'autorité signataire.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 font-semibold text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Motif de la dérogation <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex : Attestation de police AT en cours de renouvellement, attestation provisoire tamponnée reçue..."
              className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-slate-900 text-xs sm:text-sm min-h-[70px]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Autorité ayant approuvé <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={autorite}
              onChange={(e) => setAutorite(e.target.value)}
              placeholder="Ex : Directeur de Site, Directeur Général, Responsable QHSE Groupe"
              className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-slate-900 text-xs sm:text-sm font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Date de début de validité <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-amber-500 text-slate-900 text-xs sm:text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Date de fin de validité <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:border-amber-500 text-slate-900 text-xs sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Mesures compensatoires & Commentaire de sécurité
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Ex : Surveillance continue obligatoire par l'animateur HSE SICDA, interdiction d'accès aux zones ATEX..."
              className="w-full border border-slate-300 rounded-xl p-3 focus:outline-none focus:border-amber-500 text-slate-900 text-xs sm:text-sm min-h-[60px]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Pièce justificative (Nom ou fichier joint)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={pieceNom}
                onChange={(e) => setPieceNom(e.target.value)}
                placeholder="Ex : Accord_Direction_Signe_SICDA.pdf"
                className="flex-1 border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
              />
              <label className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors">
                <FileText className="w-4 h-4 text-slate-600" />
                Charger
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPieceNom(file.name);
                  }}
                />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-2 transition-colors"
            >
              <Check className="w-4 h-4" />
              Valider la Dérogation & Accorder l'Accès
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
