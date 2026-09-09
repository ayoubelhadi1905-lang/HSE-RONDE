import React, { useState } from 'react';
import { PrestataireDossier, RoleType, ConformiteStatus } from '../types';
import { formatDateFr } from '../utils/dates';
import {
  Search,
  Plus,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Building,
  Calendar,
  ChevronRight,
  Printer,
  Ban,
  FileText,
  Users,
} from 'lucide-react';
import { SITES_SICDA, TYPES_PRESTATIONS } from '../data/initialData';

interface PrestatairesViewProps {
  prestataires: PrestataireDossier[];
  currentUserRole: RoleType;
  onSelectPrestataire: (dossier: PrestataireDossier) => void;
  onCreatePrestataire: (newDossier: PrestataireDossier) => void;
  onOpenFichePdf: (dossier: PrestataireDossier) => void;
}

export const PrestatairesView: React.FC<PrestatairesViewProps> = ({
  prestataires,
  currentUserRole,
  onSelectPrestataire,
  onCreatePrestataire,
  onOpenFichePdf,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState<string>('Tous');
  const [prestationFilter, setPrestationFilter] = useState('Tous');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const filtered = prestataires.filter((p) => {
    const matchesSearch =
      p.nomEntreprise.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ice.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.contactNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.typePrestation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSite = siteFilter === 'Tous' || p.siteConcerne === siteFilter;
    const matchesStatus = statusFilter === 'Tous' || p.statutFinal === statusFilter;
    const matchesPrestation = prestationFilter === 'Tous' || p.typePrestation === prestationFilter;

    return matchesSearch && matchesSite && matchesStatus && matchesPrestation;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Gestion & Conformité HSE des Prestataires
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Validation préalable obligatoire des dossiers, assurances, habilitations et analyses des risques avant accès aux sites SICDA.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nouveau Dossier Prestataire
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher entreprise, ICE, contact..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Site filter */}
          <div>
            <select
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500 bg-white"
            >
              <option value="Tous">Tous les sites SICDA</option>
              {SITES_SICDA.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500 bg-white"
            >
              <option value="Tous">Tous les statuts de conformité</option>
              <option value="CONFORME">🟢 Conforme (100%)</option>
              <option value="CONFORME_SOUS_RESERVE">🟠 Conforme sous réserve</option>
              <option value="NON_CONFORME">🔴 Non conforme (Bloquant)</option>
            </select>
          </div>

          {/* Prestation filter */}
          <div>
            <select
              value={prestationFilter}
              onChange={(e) => setPrestationFilter(e.target.value)}
              className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-orange-500 bg-white"
            >
              <option value="Tous">Tous types de prestation</option>
              {TYPES_PRESTATIONS.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>{filtered.length} prestataire(s) trouvé(s)</span>
          {(searchTerm || siteFilter !== 'Tous' || statusFilter !== 'Tous' || prestationFilter !== 'Tous') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSiteFilter('Tous');
                setStatusFilter('Tous');
                setPrestationFilter('Tous');
              }}
              className="text-orange-600 hover:text-orange-700 font-semibold"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* Contractor Cards List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-6">
            <Building className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-800 text-sm">Aucun dossier correspondant aux critères</p>
            <p className="text-xs text-slate-500 mt-1">Modifiez vos filtres ou créez un nouveau dossier prestataire.</p>
          </div>
        ) : (
          filtered.map((dossier) => {
            const isBlocked = dossier.statutFinal === 'NON_CONFORME' && !dossier.derogation?.active;

            return (
              <div
                key={dossier.id}
                className={`p-5 bg-white border rounded-2xl shadow-sm transition-all hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  isBlocked
                    ? 'border-rose-200 hover:border-rose-300 bg-gradient-to-r from-rose-50/30 to-white'
                    : dossier.derogation?.active
                    ? 'border-amber-200 hover:border-amber-300 bg-gradient-to-r from-amber-50/30 to-white'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Left info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                      {dossier.siteConcerne}
                    </span>
                    <h3 className="font-black text-slate-900 text-base">{dossier.nomEntreprise}</h3>
                    <span className="text-xs text-slate-400 font-mono">ICE : {dossier.ice || '—'}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                    <span className="font-semibold text-slate-800">{dossier.typePrestation}</span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      Intervention prévue :{' '}
                      <strong className="text-slate-900">{formatDateFr(dossier.datePrevueIntervention)}</strong>
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {dossier.intervenants.length} intervenant(s)
                    </span>
                    <span className="text-slate-300">&bull;</span>
                    <span className="text-slate-500">Resp : {dossier.responsableInterneSicda}</span>
                  </div>

                  {/* Reasons banner if non compliant */}
                  {isBlocked && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-rose-800 font-bold bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200">
                      <Ban className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>
                        Accès non autorisé &bull; {dossier.motifsNonConformite.length} motif(s) :{' '}
                        {dossier.motifsNonConformite.slice(0, 2).join(' &bull; ')}
                      </span>
                    </div>
                  )}

                  {/* Derogation active */}
                  {dossier.derogation?.active && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-amber-900 font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>
                        Autorisé sous dérogation exceptionnelle &bull; {dossier.derogation.motif} (jusqu'au{' '}
                        {formatDateFr(dossier.derogation.dateFin)})
                      </span>
                    </div>
                  )}
                </div>

                {/* Right KPIs & Action */}
                <div className="flex items-center gap-4 self-end lg:self-center">
                  {/* Conformity score */}
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Conformité</div>
                    <div className="text-lg font-black text-slate-900">{dossier.tauxConformite}%</div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {dossier.derogation?.active ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Dérogation
                      </span>
                    ) : dossier.statutFinal === 'CONFORME' ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Conforme
                      </span>
                    ) : dossier.statutFinal === 'CONFORME_SOUS_RESERVE' ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Sous Réserve
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-black bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Non Conforme
                      </span>
                    )}
                  </div>

                  {/* Print preview button */}
                  <button
                    onClick={() => onOpenFichePdf(dossier)}
                    className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                    title="Imprimer / Télécharger la Fiche de Conformité"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {/* Open details modal button */}
                  <button
                    onClick={() => onSelectPrestataire(dossier)}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-transform active:scale-95"
                  >
                    Ouvrir Dossier
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Create New Prestataire */}
      {showCreateModal && (
        <CreatePrestataireModal
          onClose={() => setShowCreateModal(false)}
          onCreate={(created) => {
            onCreatePrestataire(created);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

// Sub-component for creating new contractor dossier
const CreatePrestataireModal: React.FC<{
  onClose: () => void;
  onCreate: (dossier: PrestataireDossier) => void;
}> = ({ onClose, onCreate }) => {
  const today = new Date().toISOString().slice(0, 10);
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [ice, setIce] = useState('');
  const [rc, setRc] = useState('');
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [contactNom, setContactNom] = useState('');
  const [typePrestation, setTypePrestation] = useState(TYPES_PRESTATIONS[0] as string);
  const [siteConcerne, setSiteConcerne] = useState(SITES_SICDA[0] as string);
  const [datePrevue, setDatePrevue] = useState(today);
  const [dateDebut, setDateDebut] = useState(today);
  const [dateFin, setDateFin] = useState(today);
  const [respSicda, setRespSicda] = useState('AMAL JAAFARI (Manager QHSE)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomEntreprise.trim()) {
      alert("Veuillez renseigner le nom de l'entreprise.");
      return;
    }

    const newId = `prest-${Date.now()}`;
    const newDossier: PrestataireDossier = {
      id: newId,
      nomEntreprise: nomEntreprise.trim(),
      ice: ice.trim(),
      rc: rc.trim(),
      adresse: adresse.trim(),
      telephone: telephone.trim(),
      email: email.trim(),
      contactNom: contactNom.trim(),
      typePrestation,
      siteConcerne,
      datePrevueIntervention: datePrevue,
      dateDebutPrestation: dateDebut,
      dateFinPrevue: dateFin,
      responsableInterneSicda: respSicda,
      documents: {
        assuranceAT: {
          id: `doc-at-${newId}`,
          type: 'assurance_at',
          label: 'Assurance Accident du Travail (AT)',
          status: 'MANQUANT',
          isBloquant: true,
        },
        assuranceRC: {
          id: `doc-rc-${newId}`,
          type: 'assurance_rc',
          label: 'Assurance Responsabilité Civile (RC)',
          status: 'MANQUANT',
          isBloquant: true,
        },
        bordereauCNSS: {
          id: `doc-cnss-${newId}`,
          type: 'bordereau_cnss',
          label: 'Bordereau CNSS',
          status: 'MANQUANT',
          isBloquant: true,
        },
        analyseRisques: {
          id: `doc-apr-${newId}`,
          type: 'analyse_risques',
          label: 'Analyse des Risques (Plan de Prévention)',
          status: 'MANQUANT',
          isBloquant: true,
        },
        attestationConformite: {
          id: `doc-att-${newId}`,
          type: 'attestation_conformite',
          label: 'Attestation de conformité',
          status: 'MANQUANT',
        },
        fds: {
          id: `doc-fds-${newId}`,
          type: 'fds',
          label: 'Fiche de Données de Sécurité (FDS)',
          status: 'NON_APPLICABLE',
          isNonApplicable: true,
          justificationNA: 'Aucun produit chimique utilisé initialement déclaré.',
        },
      },
      intervenants: [],
      statutFinal: 'NON_CONFORME',
      tauxConformite: 0,
      motifsNonConformite: [
        'Assurance AT manquante',
        'Assurance RC manquante',
        'Bordereau CNSS manquant',
        'Analyse des Risques manquante',
        'Aucun intervenant déclaré sur la fiche',
      ],
      documentsBloquants: [
        'Assurance Accident du Travail (AT)',
        'Assurance Responsabilité Civile (RC)',
        'Bordereau CNSS',
        'Analyse des Risques',
        'Liste des intervenants',
      ],
      historique: [
        {
          id: `h-${Date.now()}`,
          date: new Date().toISOString(),
          utilisateur: 'Service HSE SICDA',
          role: 'hse',
          action: 'Création initiale de la fiche prestataire',
          commentaire: 'En attente du téléversement des documents obligatoires et de la liste du personnel.',
          ancienStatut: 'NON_CONFORME',
          nouveauStatut: 'NON_CONFORME',
        },
      ],
      creeLe: new Date().toISOString(),
      misAJourLe: new Date().toISOString(),
    };

    onCreate(newDossier);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <h2 className="text-base font-black tracking-tight">Nouveau Dossier Prestataire SICDA</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nom de l'entreprise prestataire <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={nomEntreprise}
              onChange={(e) => setNomEntreprise(e.target.value)}
              placeholder="Ex : ELEC-TECH INDUSTRIE SARL"
              className="w-full border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Identifiant Commun (ICE)</label>
              <input
                type="text"
                value={ice}
                onChange={(e) => setIce(e.target.value)}
                placeholder="Ex : 001892345000078"
                className="w-full border border-slate-300 rounded-xl p-2.5 font-mono text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Registre du Commerce (RC)</label>
              <input
                type="text"
                value={rc}
                onChange={(e) => setRc(e.target.value)}
                placeholder="Ex : 45892 Casablanca"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Téléphone</label>
              <input
                type="text"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex : +212 5 22 00 00 00"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex : contact@prestataire.ma"
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Responsable / Contact Prestataire</label>
            <input
              type="text"
              value={contactNom}
              onChange={(e) => setContactNom(e.target.value)}
              placeholder="Nom, prénom et fonction du contact"
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Site concerné</label>
              <select
                value={siteConcerne}
                onChange={(e) => setSiteConcerne(e.target.value)}
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Type de prestation</label>
              <select
                value={typePrestation}
                onChange={(e) => setTypePrestation(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
              >
                {TYPES_PRESTATIONS.map((tp) => (
                  <option key={tp} value={tp}>
                    {tp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date prévue</label>
              <input
                type="date"
                value={datePrevue}
                onChange={(e) => setDatePrevue(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date de début</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Date de fin</label>
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
              value={respSicda}
              onChange={(e) => setRespSicda(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 text-xs sm:text-sm"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow"
            >
              Créer le Dossier Prestataire
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
