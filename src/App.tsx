import React, { useState, useEffect } from 'react';
import {
  PrestataireDossier,
  Intervention,
  RondeInspection,
  RoleType,
  NotificationItem,
} from './types';
import {
  INITIAL_PRESTATAIRES,
  INITIAL_INTERVENTIONS,
  INITIAL_RONDES,
  INITIAL_NOTIFICATIONS,
  SITES_SICDA,
} from './data/initialData';
import { DashboardView } from './components/DashboardView';
import { PrestatairesView } from './components/PrestatairesView';
import { InterventionsTracker } from './components/InterventionsTracker';
import { RondesView } from './components/RondesView';
import { PrestataireDetailModal } from './components/PrestataireDetailModal';
import { DerogationModal } from './components/DerogationModal';
import { FicheConformiteModal } from './components/FicheConformiteModal';
import { DualBrandHeader } from './components/Logos';
import { applyComplianceToDossier } from './utils/complianceEngine';
import {
  ShieldCheck,
  Building,
  Clock,
  Footprints,
  LayoutDashboard,
  Bell,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prestataires' | 'interventions' | 'rondes'>('dashboard');

  // Role simulation
  const [currentUserRole, setCurrentUserRole] = useState<RoleType>('hse');
  const [currentUserName, setCurrentUserName] = useState<string>('EL HADI Ayoub');

  // State with LocalStorage persistence
  const [prestataires, setPrestataires] = useState<PrestataireDossier[]>(() => {
    try {
      const saved = localStorage.getItem('sicda_prestataires');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRESTATAIRES;
  });

  const [interventions, setInterventions] = useState<Intervention[]>(() => {
    try {
      const saved = localStorage.getItem('sicda_interventions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_INTERVENTIONS;
  });

  const [rondes, setRondes] = useState<RondeInspection[]>(() => {
    try {
      const saved = localStorage.getItem('sicda_rondes');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_RONDES;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('sicda_notifications');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  // Modal states
  const [selectedPrestataire, setSelectedPrestataire] = useState<PrestataireDossier | null>(null);
  const [derogationTarget, setDerogationTarget] = useState<PrestataireDossier | null>(null);
  const [fichePdfTarget, setFichePdfTarget] = useState<PrestataireDossier | null>(null);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sicda_prestataires', JSON.stringify(prestataires));
    } catch (e) {
      console.error(e);
    }
  }, [prestataires]);

  useEffect(() => {
    try {
      localStorage.setItem('sicda_interventions', JSON.stringify(interventions));
    } catch (e) {
      console.error(e);
    }
  }, [interventions]);

  useEffect(() => {
    try {
      localStorage.setItem('sicda_rondes', JSON.stringify(rondes));
    } catch (e) {
      console.error(e);
    }
  }, [rondes]);

  // Handlers for Prestataire
  const handleUpdatePrestataire = (updated: PrestataireDossier) => {
    // Re-evaluate compliance automatically
    const evaluated = applyComplianceToDossier(updated);
    setPrestataires((prev) => prev.map((p) => (p.id === evaluated.id ? evaluated : p)));
    if (selectedPrestataire?.id === evaluated.id) {
      setSelectedPrestataire(evaluated);
    }
  };

  const handleCreatePrestataire = (newDossier: PrestataireDossier) => {
    const evaluated = applyComplianceToDossier(newDossier);
    setPrestataires((prev) => [evaluated, ...prev]);
    setSelectedPrestataire(evaluated);
  };

  const handleGrantDerogation = (dossierId: string, derogation: any) => {
    const target = prestataires.find((p) => p.id === dossierId);
    if (!target) return;

    const updated = {
      ...target,
      derogation: { ...derogation, active: true },
      historique: [
        {
          id: `hist-derog-${Date.now()}`,
          date: new Date().toISOString(),
          utilisateur: currentUserName,
          role: currentUserRole,
          action: 'Octroi d’une dérogation exceptionnelle',
          commentaire: `Motif : ${derogation.motif}. Valable jusqu'au ${derogation.dateFin}`,
          ancienStatut: target.statutFinal,
          nouveauStatut: target.statutFinal,
        },
        ...target.historique,
      ],
    };

    handleUpdatePrestataire(updated);
    setDerogationTarget(null);
  };

  const handleRevokeDerogation = (dossierId: string) => {
    const target = prestataires.find((p) => p.id === dossierId);
    if (!target) return;

    const updated = {
      ...target,
      derogation: target.derogation ? { ...target.derogation, active: false } : undefined,
      historique: [
        {
          id: `hist-rev-${Date.now()}`,
          date: new Date().toISOString(),
          utilisateur: currentUserName,
          role: currentUserRole,
          action: 'Révocation de la dérogation exceptionnelle',
          commentaire: 'La dérogation a été annulée par le service HSE.',
          ancienStatut: target.statutFinal,
          nouveauStatut: target.statutFinal,
        },
        ...target.historique,
      ],
    };

    handleUpdatePrestataire(updated);
    setDerogationTarget(null);
  };

  // Handlers for Interventions
  const handleUpdateIntervention = (updated: Intervention) => {
    setInterventions((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  const handleCreateIntervention = (newIntervention: Intervention) => {
    setInterventions((prev) => [newIntervention, ...prev]);
  };

  // Handlers for Rondes
  const handleSaveRonde = (newRonde: RondeInspection) => {
    setRondes((prev) => [newRonde, ...prev]);
  };

  const handleDeleteRonde = (id: string) => {
    if (confirm('Confirmer la suppression de cette ronde HSE ?')) {
      setRondes((prev) => prev.filter((r) => r.id !== id));
    }
  };

  // Quick navigation helper
  const handleOpenPrestataireFromId = (id: string) => {
    const found = prestataires.find((p) => p.id === id);
    if (found) {
      setSelectedPrestataire(found);
    }
  };

  const unreadAlertsCount = notifications.filter((n) => !n.lu).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Main Navigation Bar */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <DualBrandHeader size="sm" inverted={true} showTagline={false} />
            <div className="hidden lg:flex items-center gap-2 border-l border-slate-800 pl-3">
              <span className="px-2 py-0.5 rounded-md bg-slate-800 text-orange-400 text-[10px] font-bold uppercase tracking-wider border border-slate-700">
                Sites 1 à 5
              </span>
              <span className="text-[11px] text-slate-400">
                Portail QHSE &bull; Hygiène, Sécurité, Environnement
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'dashboard'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Tableau de Bord
            </button>

            <button
              onClick={() => setActiveTab('prestataires')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'prestataires'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Building className="w-4 h-4" />
              Gestion Prestataires
            </button>

            <button
              onClick={() => setActiveTab('interventions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'interventions'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              Délais & Chantiers
            </button>

            <button
              onClick={() => setActiveTab('rondes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'rondes'
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Footprints className="w-4 h-4" />
              Rondes HSE
            </button>
          </nav>

          {/* User Role Switcher & Notifications */}
          <div className="flex items-center gap-3">
            {/* Notifications Bell */}
            <button
              onClick={() => setShowNotificationsDrawer(!showNotificationsDrawer)}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
              title="Alertes et notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadAlertsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                  {unreadAlertsCount}
                </span>
              )}
            </button>

            {/* Role Switcher Pill */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="text-right">
                <div className="text-xs font-bold text-white leading-tight">{currentUserName}</div>
                <div className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">
                  {currentUserRole === 'hse'
                    ? 'Service HSE'
                    : currentUserRole === 'admin'
                    ? 'Administrateur'
                    : currentUserRole === 'interne'
                    ? 'Demandeur Interne'
                    : 'Prestataire Ext.'}
                </div>
              </div>

              <select
                value={`${currentUserRole}:${currentUserName}`}
                onChange={(e) => {
                  const [role, name] = e.target.value.split(':') as [RoleType, string];
                  setCurrentUserRole(role);
                  setCurrentUserName(name);
                }}
                className="text-[11px] bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                <optgroup label="Inspecteurs HSE & RHSE">
                  <option value="hse:EL HADI Ayoub">EL HADI Ayoub (Inspecteur HSE)</option>
                  <option value="hse:ABIDI Soufiane">ABIDI Soufiane (Inspecteur HSE)</option>
                  <option value="hse:GUENDOUZ Hamza">GUENDOUZ Hamza (Inspecteur HSE)</option>
                  <option value="hse:RHSE ELMAGHRAOUI Ilyass">RHSE ELMAGHRAOUI Ilyass (RHSE)</option>
                </optgroup>
                <optgroup label="Management QHSE & Direction">
                  <option value="hse:AMAL JAAFARI">AMAL JAAFARI (Manager QHSE)</option>
                  <option value="admin:LOULIDI ADIL">LOULIDI ADIL (Directeur Général)</option>
                  <option value="responsable_interne:Adil Tazi">Adil Tazi (Resp. Interne)</option>
                  <option value="prestataire:Hassan El Fassi (Prestataire)">Hassan El Fassi (Prestataire)</option>
                </optgroup>
              </select>
            </div>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-300 hover:text-white rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 py-3 bg-slate-800 border-t border-slate-700 space-y-2">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                activeTab === 'dashboard' ? 'bg-orange-500 text-white' : 'text-slate-300'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Tableau de Bord
            </button>
            <button
              onClick={() => {
                setActiveTab('prestataires');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                activeTab === 'prestataires' ? 'bg-orange-500 text-white' : 'text-slate-300'
              }`}
            >
              <Building className="w-4 h-4" /> Gestion Prestataires
            </button>
            <button
              onClick={() => {
                setActiveTab('interventions');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                activeTab === 'interventions' ? 'bg-orange-500 text-white' : 'text-slate-300'
              }`}
            >
              <Clock className="w-4 h-4" /> Délais & Chantiers
            </button>
            <button
              onClick={() => {
                setActiveTab('rondes');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                activeTab === 'rondes' ? 'bg-orange-500 text-white' : 'text-slate-300'
              }`}
            >
              <Footprints className="w-4 h-4" /> Rondes HSE
            </button>
          </div>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            prestataires={prestataires}
            interventions={interventions}
            rondes={rondes}
            currentUserRole={currentUserRole}
            currentUserName={currentUserName}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            onSelectPrestataire={(dossier) => setSelectedPrestataire(dossier)}
          />
        )}

        {activeTab === 'prestataires' && (
          <PrestatairesView
            prestataires={prestataires}
            currentUserRole={currentUserRole}
            onSelectPrestataire={(dossier) => setSelectedPrestataire(dossier)}
            onCreatePrestataire={handleCreatePrestataire}
            onOpenFichePdf={(dossier) => setFichePdfTarget(dossier)}
          />
        )}

        {activeTab === 'interventions' && (
          <InterventionsTracker
            interventions={interventions}
            prestataires={prestataires}
            currentUserRole={currentUserRole}
            onUpdateIntervention={handleUpdateIntervention}
            onCreateIntervention={handleCreateIntervention}
            onOpenPrestataire={handleOpenPrestataireFromId}
          />
        )}

        {activeTab === 'rondes' && (
          <RondesView
            rondes={rondes}
            currentUserName={currentUserName}
            onSaveRonde={handleSaveRonde}
            onDeleteRonde={handleDeleteRonde}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Système Intégré de Sécurité & Conformité Industrielle &bull; <strong>SICDA HSE v2.4</strong>
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            Réf. 019F.Pr.PQSE.02 (Rondes) &bull; 021F.Ps.POT.02 (Constats)
          </span>
        </div>
      </footer>

      {/* Notifications Drawer */}
      {showNotificationsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-500" />
                <h3 className="font-black text-slate-900 text-sm">Notifications & Alertes HSE</h3>
              </div>
              <button
                onClick={() => setShowNotificationsDrawer(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">Aucune notification</div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      notif.type === 'BLOCAGE'
                        ? 'bg-rose-50 border-rose-200'
                        : notif.type === 'DEROGATION'
                        ? 'bg-amber-50 border-amber-200'
                        : notif.type === 'EXPIRATION'
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="font-bold text-slate-900">{notif.titre}</div>
                    <p className="text-slate-600">{notif.message}</p>
                    <div className="text-[10px] text-slate-400">
                      {new Date(notif.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
                setShowNotificationsDrawer(false);
              }}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
            >
              Tout marquer comme lu
            </button>
          </div>
        </div>
      )}

      {/* Modal 1: Contractor Dossier Detail */}
      {selectedPrestataire && (
        <PrestataireDetailModal
          dossier={selectedPrestataire}
          currentUserRole={currentUserRole}
          onClose={() => setSelectedPrestataire(null)}
          onUpdateDossier={handleUpdatePrestataire}
          onRequestDerogation={(dossier) => setDerogationTarget(dossier)}
          onOpenFichePdf={(dossier) => setFichePdfTarget(dossier)}
        />
      )}

      {/* Modal 2: Derogation Exception Request */}
      {derogationTarget && (
        <DerogationModal
          dossier={derogationTarget}
          currentUserName={currentUserName}
          currentUserRole={currentUserRole}
          onClose={() => setDerogationTarget(null)}
          onGrantDerogation={handleGrantDerogation}
          onRevokeDerogation={handleRevokeDerogation}
        />
      )}

      {/* Modal 3: Printable Certificate & QR Code */}
      {fichePdfTarget && (
        <FicheConformiteModal
          dossier={fichePdfTarget}
          onClose={() => setFichePdfTarget(null)}
        />
      )}
    </div>
  );
}
