import {
  PrestataireDossier,
  DocumentRecord,
  ConformiteStatus,
  DocStatus,
} from '../types';
import { checkDateExpiration } from './dates';

export interface EvaluationItem {
  key: string;
  label: string;
  applicable: boolean;
  status: DocStatus;
  isBloquant: boolean;
  message: string;
}

export interface ComplianceEvaluation {
  items: EvaluationItem[];
  totalApplicables: number;
  totalConformes: number;
  tauxConformite: number;
  statutFinal: ConformiteStatus;
  motifsNonConformite: string[];
  documentsBloquants: string[];
  elementsSousReserve: string[];
}

export function evaluateDocument(doc: DocumentRecord): EvaluationItem {
  if (doc.isNonApplicable) {
    return {
      key: doc.type,
      label: doc.label,
      applicable: false,
      status: 'NON_APPLICABLE',
      isBloquant: false,
      message: `Non applicable : ${doc.justificationNA || 'Justifié par le prestataire'}`,
    };
  }

  // Check if file is uploaded
  if (!doc.fileName && !doc.fileData) {
    return {
      key: doc.type,
      label: doc.label,
      applicable: true,
      status: 'MANQUANT',
      isBloquant: true,
      message: `${doc.label} manquant(e)`,
    };
  }

  // Check HSE refusal
  if (doc.validationHseStatus === 'REFUSEE') {
    return {
      key: doc.type,
      label: doc.label,
      applicable: true,
      status: 'REFUSE',
      isBloquant: true,
      message: `${doc.label} refusé(e) par le HSE : ${doc.commentairesHse || 'Non conforme'}`,
    };
  }

  // Check expiration if dateExpiration exists
  if (doc.dateExpiration) {
    const exp = checkDateExpiration(doc.dateExpiration);
    if (exp.status === 'EXPIRE') {
      return {
        key: doc.type,
        label: doc.label,
        applicable: true,
        status: 'EXPIRE',
        isBloquant: true,
        message: `${doc.label} expiré(e) (${exp.label})`,
      };
    }
    if (exp.status === 'EXPIRATION_PROCHE') {
      return {
        key: doc.type,
        label: doc.label,
        applicable: true,
        status: 'EXPIRATION_PROCHE',
        isBloquant: false,
        message: `${doc.label} : ${exp.label}`,
      };
    }
  }

  // Check if HSE validation is pending for qualitative documents (Analyse des risques, etc.)
  if (doc.type === 'analyse_risques' || doc.type === 'attestation_conformite' || doc.type === 'fds') {
    if (doc.validationHseStatus === 'A_VERIFIER' || !doc.validationHseStatus) {
      return {
        key: doc.type,
        label: doc.label,
        applicable: true,
        status: 'A_VERIFIER',
        isBloquant: doc.type === 'analyse_risques', // Analyse des risques must be validated before intervention
        message: `${doc.label} en attente de validation HSE`,
      };
    }
  }

  return {
    key: doc.type,
    label: doc.label,
    applicable: true,
    status: 'VALIDE',
    isBloquant: false,
    message: `${doc.label} présent(e) et valide`,
  };
}

export function evaluateDossierCompliance(dossier: PrestataireDossier): ComplianceEvaluation {
  const items: EvaluationItem[] = [];
  const motifsNonConformite: string[] = [];
  const documentsBloquants: string[] = [];
  const elementsSousReserve: string[] = [];

  // 1. Evaluate standard documents
  const docList: DocumentRecord[] = [
    dossier.documents.assuranceAT,
    dossier.documents.assuranceRC,
    dossier.documents.bordereauCNSS,
    dossier.documents.analyseRisques,
    dossier.documents.attestationConformite,
    dossier.documents.fds,
  ];

  docList.forEach((doc) => {
    const evalResult = evaluateDocument(doc);
    items.push(evalResult);

    if (evalResult.applicable) {
      if (evalResult.status === 'MANQUANT' || evalResult.status === 'EXPIRE' || evalResult.status === 'REFUSE') {
        motifsNonConformite.push(evalResult.message);
        documentsBloquants.push(evalResult.label);
      } else if (evalResult.status === 'A_VERIFIER' && evalResult.isBloquant) {
        motifsNonConformite.push(evalResult.message);
        documentsBloquants.push(evalResult.label);
      } else if (evalResult.status === 'EXPIRATION_PROCHE' || evalResult.status === 'A_VERIFIER') {
        elementsSousReserve.push(evalResult.message);
      }
    }
  });

  // 2. Evaluate Intervenants & Habilitations
  if (!dossier.intervenants || dossier.intervenants.length === 0) {
    items.push({
      key: 'intervenants_liste',
      label: 'Liste des intervenants',
      applicable: true,
      status: 'MANQUANT',
      isBloquant: true,
      message: 'Aucun intervenant renseigné pour cette prestation',
    });
    motifsNonConformite.push('Aucun intervenant déclaré sur la fiche');
    documentsBloquants.push('Liste des intervenants');
  } else {
    dossier.intervenants.forEach((intervenant, idx) => {
      // Check CIN
      if (!intervenant.cin) {
        motifsNonConformite.push(`CIN manquante pour ${intervenant.nomPrenom || `intervenant #${idx + 1}`}`);
        documentsBloquants.push(`CIN (${intervenant.nomPrenom})`);
      }

      // Check Habilitations validity
      if (intervenant.dateValiditeHabilitation) {
        const exp = checkDateExpiration(intervenant.dateValiditeHabilitation);
        if (exp.status === 'EXPIRE') {
          motifsNonConformite.push(
            `Habilitation expirée pour ${intervenant.nomPrenom} (${intervenant.habilitations.join(', ') || 'Habilitation'})`,
          );
          documentsBloquants.push(`Habilitation de ${intervenant.nomPrenom}`);
        } else if (exp.status === 'EXPIRATION_PROCHE') {
          elementsSousReserve.push(
            `Habilitation proche de l'expiration pour ${intervenant.nomPrenom} (${exp.label})`,
          );
        }
      }

      // Check if qualifications / habilitations are provided
      if (!intervenant.habilitations || intervenant.habilitations.length === 0) {
        elementsSousReserve.push(`Aucune habilitation listée pour ${intervenant.nomPrenom} (à vérifier si requis)`);
      }

      // Check HSE training
      if (!intervenant.formationHse) {
        elementsSousReserve.push(`Formation HSE non complétée pour ${intervenant.nomPrenom}`);
      }
    });
  }

  // 3. Compute rates
  const applicables = items.filter((i) => i.applicable);
  const conformes = items.filter((i) => i.applicable && (i.status === 'VALIDE' || i.status === 'EXPIRATION_PROCHE'));

  const totalApplicables = applicables.length;
  const totalConformes = conformes.length;
  const tauxConformite = totalApplicables > 0 ? Math.round((totalConformes / totalApplicables) * 100) : 0;

  // 4. Determine final status
  let statutFinal: ConformiteStatus = 'CONFORME';

  if (motifsNonConformite.length > 0) {
    statutFinal = 'NON_CONFORME';
  } else if (elementsSousReserve.length > 0) {
    statutFinal = 'CONFORME_SOUS_RESERVE';
  } else {
    statutFinal = 'CONFORME';
  }

  return {
    items,
    totalApplicables,
    totalConformes,
    tauxConformite,
    statutFinal,
    motifsNonConformite,
    documentsBloquants,
    elementsSousReserve,
  };
}

export function applyComplianceToDossier(dossier: PrestataireDossier): PrestataireDossier {
  const evalResult = evaluateDossierCompliance(dossier);
  return {
    ...dossier,
    tauxConformite: evalResult.tauxConformite,
    statutFinal: evalResult.statutFinal,
    motifsNonConformite: evalResult.motifsNonConformite,
    documentsBloquants: evalResult.documentsBloquants,
    misAJourLe: new Date().toISOString(),
  };
}
