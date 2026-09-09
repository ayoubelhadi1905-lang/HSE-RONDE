import React from 'react';
import { PrestataireDossier, DocumentRecord } from '../types';
import { formatDateFr, formatDateTimeFr } from '../utils/dates';
import { generateQrSvg } from '../utils/qrCode';
import { GroupeLogo, SicdaLogo } from './Logos';
import { Printer, X, ShieldCheck, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface FicheConformiteModalProps {
  dossier: PrestataireDossier;
  onClose: () => void;
}

export const FicheConformiteModal: React.FC<FicheConformiteModalProps> = ({ dossier, onClose }) => {
  const qrSvg = generateQrSvg(`https://sicda-hse.ma/verify/${dossier.id}?statut=${dossier.statutFinal}`, 110);

  const handlePrint = () => {
    window.print();
  };

  const getStatusBanner = () => {
    if (dossier.derogation?.active) {
      return {
        bg: 'bg-amber-50 border-amber-300 text-amber-900',
        badge: 'bg-amber-600 text-white',
        text: 'AUTORISÉ SOUS DÉROGATION EXCEPTIONNELLE',
        desc: `Dérogation accordée par : ${dossier.derogation.autorite} jusqu'au ${formatDateFr(dossier.derogation.dateFin)}`,
      };
    }
    if (dossier.statutFinal === 'CONFORME') {
      return {
        bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
        badge: 'bg-emerald-700 text-white',
        text: 'CONFORME — ACCÈS AU SITE AUTORISÉ',
        desc: 'Tous les documents et habilitations sont vérifiés et valides.',
      };
    }
    if (dossier.statutFinal === 'CONFORME_SOUS_RESERVE') {
      return {
        bg: 'bg-amber-50 border-amber-300 text-amber-900',
        badge: 'bg-amber-600 text-white',
        text: 'CONFORME SOUS RÉSERVE',
        desc: 'Certains éléments requièrent un suivi ou un renouvellement proche.',
      };
    }
    return {
      bg: 'bg-rose-50 border-rose-300 text-rose-900',
      badge: 'bg-rose-700 text-white',
      text: 'NON CONFORME — ACCÈS AU SITE STRICTEMENT INTERDIT',
      desc: 'Documents obligatoires manquants, refusés ou expirés.',
    };
  };

  const banner = getStatusBanner();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-400" />
            <span className="font-semibold text-sm tracking-wide">Fiche Officielle de Conformité HSE — SICDA</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-lg shadow transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimer / Enregistrer en PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-8 print:p-6 bg-white text-slate-900 font-sans text-xs sm:text-sm">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-slate-900 gap-4">
            <div className="flex items-center gap-4">
              {/* Logo Groupe */}
              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl shadow-xs" title="Logo du Groupe">
                <GroupeLogo className="w-12 h-12" />
              </div>

              {/* Vertical Divider */}
              <div className="h-12 w-px bg-slate-200 hidden sm:block" />

              {/* Logo Société SICDA & Titles */}
              <div>
                <div className="flex items-center gap-2">
                  <SicdaLogo className="h-8 w-auto" />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-orange-600 mt-0.5">
                  CMGP &bull; GROUPE SICDA &bull; SERVICE QHSE
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  FICHE DE CONFORMITÉ HSE PRESTATAIRE
                </h1>
                <div className="text-[11px] text-slate-500">
                  Réf. Formulaire : 024F.Pr.PQSE.04 — Autorisation préalable d'intervention
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div
                dangerouslySetInnerHTML={{ __html: qrSvg }}
                className="border border-slate-200 p-1 rounded-lg"
              />
              <span className="text-[10px] text-slate-400 font-mono mt-1">Dossier ID: {dossier.id}</span>
            </div>
          </div>

          {/* Status Banner */}
          <div className={`mt-5 p-4 rounded-xl border-2 ${banner.bg} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${banner.badge}`}>
                  {banner.text}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  Taux de conformité : <span className="font-extrabold text-sm">{dossier.tauxConformite}%</span>
                </span>
              </div>
              <p className="text-xs mt-1.5 opacity-90">{banner.desc}</p>
            </div>
            <div className="text-right sm:border-l sm:border-slate-300 sm:pl-4">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Vérifié par HSE</div>
              <div className="font-bold text-slate-900">{dossier.validateurHse || 'Service HSE SICDA'}</div>
              <div className="text-[10px] text-slate-500">{formatDateTimeFr(dossier.dateValidationHse || dossier.misAJourLe)}</div>
            </div>
          </div>

          {/* Grid Contractor & Prestation Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-200">
                1. Identification du Prestataire
              </h3>
              <dl className="grid grid-cols-3 gap-y-1.5 text-xs">
                <dt className="text-slate-500 font-medium">Entreprise :</dt>
                <dd className="col-span-2 font-bold text-slate-900">{dossier.nomEntreprise}</dd>
                <dt className="text-slate-500 font-medium">ICE :</dt>
                <dd className="col-span-2 font-mono text-slate-800">{dossier.ice || '—'}</dd>
                <dt className="text-slate-500 font-medium">RC :</dt>
                <dd className="col-span-2 text-slate-800">{dossier.rc || '—'}</dd>
                <dt className="text-slate-500 font-medium">Adresse :</dt>
                <dd className="col-span-2 text-slate-800">{dossier.adresse || '—'}</dd>
                <dt className="text-slate-500 font-medium">Contact / Resp :</dt>
                <dd className="col-span-2 font-semibold text-slate-900">{dossier.contactNom}</dd>
                <dt className="text-slate-500 font-medium">Téléphone :</dt>
                <dd className="col-span-2 text-slate-800">{dossier.telephone}</dd>
                <dt className="text-slate-500 font-medium">Email :</dt>
                <dd className="col-span-2 text-slate-800">{dossier.email}</dd>
              </dl>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2.5 pb-1 border-b border-slate-200">
                2. Détails de l'Intervention
              </h3>
              <dl className="grid grid-cols-3 gap-y-1.5 text-xs">
                <dt className="text-slate-500 font-medium">Site concerné :</dt>
                <dd className="col-span-2 font-black text-orange-600">{dossier.siteConcerne}</dd>
                <dt className="text-slate-500 font-medium">Prestation :</dt>
                <dd className="col-span-2 font-bold text-slate-900">{dossier.typePrestation}</dd>
                <dt className="text-slate-500 font-medium">Date prévue :</dt>
                <dd className="col-span-2 text-slate-800">{formatDateFr(dossier.datePrevueIntervention)}</dd>
                <dt className="text-slate-500 font-medium">Période :</dt>
                <dd className="col-span-2 text-slate-800">
                  Du {formatDateFr(dossier.dateDebutPrestation)} au {formatDateFr(dossier.dateFinPrevue)}
                </dd>
                <dt className="text-slate-500 font-medium">Resp. SICDA :</dt>
                <dd className="col-span-2 font-semibold text-slate-900">{dossier.responsableInterneSicda}</dd>
              </dl>
            </div>
          </div>

          {/* Controlled Documents Table */}
          <div className="mt-5">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
              3. Documents Obligatoires Contrôlés
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Document Obligatoire</th>
                    <th className="p-2.5">Réf. / Police / Version</th>
                    <th className="p-2.5">Date Validité / Fin</th>
                    <th className="p-2.5">Statut</th>
                    <th className="p-2.5">Observations HSE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(Object.values(dossier.documents) as DocumentRecord[]).map((doc) => {
                    const isOk = doc.status === 'VALIDE' || (doc.isNonApplicable && doc.validationHseStatus === 'VALIDEE');
                    const isExpiring = doc.status === 'EXPIRATION_PROCHE';
                    const isBad = doc.status === 'EXPIRE' || doc.status === 'MANQUANT' || doc.status === 'REFUSE';

                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/70">
                        <td className="p-2.5 font-semibold text-slate-900">{doc.label}</td>
                        <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                          {doc.numeroPolice || doc.periodeCnss || doc.nomProduitChimique || doc.fileName || (doc.isNonApplicable ? 'N/A' : '—')}
                        </td>
                        <td className="p-2.5 text-slate-600">
                          {doc.dateExpiration ? formatDateFr(doc.dateExpiration) : doc.dateEmission ? formatDateFr(doc.dateEmission) : '—'}
                        </td>
                        <td className="p-2.5">
                          {doc.isNonApplicable ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                              ⚪ Non applicable
                            </span>
                          ) : isOk ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              🟢 Conforme
                            </span>
                          ) : isExpiring ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              🟡 Exp. Proche
                            </span>
                          ) : isBad ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                              🔴 Non conforme
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                              🔵 À vérifier
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-slate-600 text-[11px]">
                          {doc.commentairesHse || (doc.isNonApplicable ? doc.justificationNA : '—')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Intervenants & Habilitations List */}
          <div className="mt-5">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2 pb-1 border-b border-slate-200">
              4. Personnel Intervenant & Habilitations ({dossier.intervenants.length} personne{dossier.intervenants.length > 1 ? 's' : ''})
            </h3>
            {dossier.intervenants.length === 0 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                ⚠️ Aucun intervenant déclaré. Présence sur site interdite.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Nom & Prénom</th>
                      <th className="p-2.5">CIN</th>
                      <th className="p-2.5">Fonction / Société</th>
                      <th className="p-2.5">Habilitations & Validités</th>
                      <th className="p-2.5">Form. HSE</th>
                      <th className="p-2.5">Aptitude Médicale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {dossier.intervenants.map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50/70">
                        <td className="p-2.5 font-bold text-slate-900">{i.nomPrenom}</td>
                        <td className="p-2.5 font-mono text-slate-700">{i.cin}</td>
                        <td className="p-2.5 text-slate-600">
                          {i.fonction} ({i.societe})
                        </td>
                        <td className="p-2.5">
                          <div className="flex flex-wrap gap-1">
                            {i.habilitations.map((h, idx) => (
                              <span key={idx} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-800">
                                {h}
                              </span>
                            ))}
                          </div>
                          {i.dateValiditeHabilitation && (
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Échéance : {formatDateFr(i.dateValiditeHabilitation)}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-center">
                          {i.formationHse ? <span className="text-emerald-600 font-bold">✓ Oui</span> : <span className="text-rose-600 font-bold">✗ Non</span>}
                        </td>
                        <td className="p-2.5 text-center">
                          {i.aptitudeMedicale ? <span className="text-emerald-600 font-bold">✓ Apte</span> : <span className="text-rose-600 font-bold">✗ Non</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Derogation notice if active */}
          {dossier.derogation?.active && (
            <div className="mt-5 p-3.5 bg-amber-50 border-2 border-dashed border-amber-400 rounded-xl text-xs">
              <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                DÉROGATION EXCEPTIONNELLE TRACÉE (Autorisation N° {dossier.derogation.id})
              </div>
              <p className="mt-1 text-slate-800">
                <span className="font-semibold">Motif :</span> {dossier.derogation.motif}
              </p>
              <p className="text-slate-700 mt-0.5">
                <span className="font-semibold">Autorité :</span> {dossier.derogation.autorite} &bull;{' '}
                <span className="font-semibold">Période :</span> du {formatDateFr(dossier.derogation.dateDebut)} au {formatDateFr(dossier.derogation.dateFin)}
              </p>
            </div>
          )}

          {/* Signatures & Footer */}
          <div className="mt-8 pt-6 border-t-2 border-slate-900 grid grid-cols-2 gap-8">
            <div className="border border-slate-300 rounded-xl p-4 min-h-[110px] flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Visa du Responsable Interne SICDA
                </div>
                <div className="text-xs text-slate-500 mt-1">{dossier.responsableInterneSicda}</div>
              </div>
              <div className="text-[11px] text-slate-400 italic">Signature & Date :</div>
            </div>

            <div className="border border-slate-300 rounded-xl p-4 min-h-[110px] flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Visa & Cachet Service QHSE SICDA
                </div>
                <div className="text-xs text-slate-500 mt-1">{dossier.validateurHse || 'AMAL JAAFARI (Manager QHSE)'}</div>
              </div>
              <div className="text-[11px] text-slate-400 italic">Cachet & Signature électronique :</div>
            </div>
          </div>

          <div className="mt-6 text-center text-[10px] text-slate-400 print:block">
            Document généré électroniquement par le système HSE SICDA le {new Date().toLocaleDateString('fr-FR')} &bull; Toute falsification expose aux sanctions prévues par la politique de sécurité du Groupe SICDA.
          </div>
        </div>
      </div>
    </div>
  );
};
