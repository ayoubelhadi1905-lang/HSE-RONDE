export type RoleType = 'hse' | 'responsable_interne' | 'prestataire' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: RoleType;
  entity: string;
}

export type ConformiteStatus = 'CONFORME' | 'CONFORME_SOUS_RESERVE' | 'NON_CONFORME';

export type DocStatus =
  | 'VALIDE'
  | 'EXPIRATION_PROCHE' // < 30 ou < 60 jours
  | 'EXPIRE'
  | 'MANQUANT'
  | 'A_VERIFIER'
  | 'REFUSE'
  | 'NON_APPLICABLE';

export type ExpirationAlertLevel = 'rouge' | 'orange' | 'jaune' | 'vert' | 'neutre';

export interface DocumentRecord {
  id: string;
  type:
    | 'assurance_at'
    | 'assurance_rc'
    | 'bordereau_cnss'
    | 'analyse_risques'
    | 'attestation_conformite'
    | 'fds'
    | 'autre';
  label: string;
  fileName?: string;
  fileSize?: string;
  fileData?: string; // base64 / dummy data url
  numeroPolice?: string;
  dateDebut?: string;
  dateExpiration?: string;
  dateEmission?: string;
  // Specific fields
  periodeCnss?: string;
  nomProduitChimique?: string;
  fabricantFds?: string;
  versionFds?: string;
  classificationFds?: string;
  isNonApplicable?: boolean;
  justificationNA?: string;
  // HSE validation
  status: DocStatus;
  validationHseStatus?: 'A_VERIFIER' | 'VALIDEE' | 'REFUSEE';
  commentairesHse?: string;
  dateVerification?: string;
  verifiePar?: string;
  isBloquant?: boolean;
}

export interface Intervenant {
  id: string;
  nomPrenom: string;
  cin: string;
  cinFileUrl?: string;
  cinStatus: DocStatus;
  fonction: string;
  societe: string;
  qualification: string;
  habilitations: string[]; // e.g. ["Habilitation électrique B1V/BR", "Travail en hauteur"]
  dateValiditeHabilitation?: string;
  formationHse: boolean;
  aptitudeMedicale: boolean;
  statutConformite: 'VALIDE' | 'EXPIRE' | 'MANQUANT' | 'A_VERIFIER';
  remarques?: string;
}

export interface Derogation {
  id: string;
  active: boolean;
  motif: string;
  autorite: string;
  dateDebut: string;
  dateFin: string;
  commentaire: string;
  pieceJustificativeNom?: string;
  accordePar: string;
  dateAccord: string;
}

export interface HistoriqueAction {
  id: string;
  date: string; // ISO
  utilisateur: string;
  role: RoleType;
  action: string;
  commentaire?: string;
  ancienStatut?: ConformiteStatus;
  nouveauStatut?: ConformiteStatus;
}

export interface Intervention {
  id: string;
  prestataireId: string;
  prestationTitre: string;
  site: string;
  zone?: string;
  datePrevue: string;
  dateDebutPrevue: string;
  dateFinPrevue: string;
  dateDebutReelle?: string;
  dateFinReelle?: string;
  statut: 'PLANIFIEE' | 'EN_COURS' | 'TERMINEE' | 'EN_RETARD' | 'SUSPENDUE';
  delaiJoursMax: number;
  tauxAvancement: number; // 0 à 100%
  responsableInterne: string;
  contactPrestataire: string;
  remarques?: string;
}

export interface PrestataireDossier {
  id: string;
  nomEntreprise: string;
  ice: string;
  rc: string;
  adresse: string;
  telephone: string;
  email: string;
  contactNom: string;
  typePrestation: string;
  siteConcerne: string;
  datePrevueIntervention: string;
  dateDebutPrestation: string;
  dateFinPrevue: string;
  responsableInterneSicda: string;
  // Documents
  documents: {
    assuranceAT: DocumentRecord;
    assuranceRC: DocumentRecord;
    bordereauCNSS: DocumentRecord;
    analyseRisques: DocumentRecord;
    attestationConformite: DocumentRecord;
    fds: DocumentRecord;
  };
  // Intervenants
  intervenants: Intervenant[];
  // Compliance computation
  statutFinal: ConformiteStatus;
  tauxConformite: number; // 0-100
  motifsNonConformite: string[];
  documentsBloquants: string[];
  derogation?: Derogation;
  // Metadata
  validateurHse?: string;
  dateValidationHse?: string;
  historique: HistoriqueAction[];
  creeLe: string;
  misAJourLe: string;
}

export interface NotificationItem {
  id: string;
  prestataireId?: string;
  titre: string;
  message: string;
  type: 'EXPIRE' | 'EXPIRATION_PROCHE' | 'MANQUANT' | 'NOUVEAU' | 'REFUSE' | 'VALIDE' | 'RETARD';
  date: string;
  lu: boolean;
  niveau: 'critique' | 'attention' | 'info' | 'succes';
}

export interface ConstatPhoto {
  id?: string;
  dataUrl: string;
  name?: string;
  dateAjout?: string;
  commentaire?: string;
}

// Model for HSE Inspection Rounds (019F.Pr.PQSE.02)
export interface RondeConstatDetail {
  description: string;
  cause: string;
  action: string;
  pilote: string;
  statut: 'Ouvert' | 'En cours' | 'Clôturé';
  commentaire: string;
  datePrevue: string;
  dateRealisation: string;
  photos: ConstatPhoto[];
}

export interface RondeItem {
  name: string;
  t1: 'ok' | 'bad' | null;
  t2: 'ok' | 'bad' | null;
  observation: string;
  detail?: RondeConstatDetail | null;
}

export interface AtelierRonde {
  items: RondeItem[];
  custom?: RondeItem[];
}

export interface RondeInspection {
  id: string;
  date: string;
  site: string;
  zone: string; // 'Ensemble des Ateliers & Locaux' | 'Zone 01' | 'Zone 02'
  heure1: string; // Heure de la tournée
  heure2?: string; // Optionnel (pour compatibilité)
  inspecteur: string;
  createdAt: string;
  ateliers: Record<string, AtelierRonde>;
}
