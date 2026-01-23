
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import DBConnector from './components/DBConnector';
import BatchGeneratorNew from './components/BatchGeneratorNew';
import TemplateDesigner from './components/TemplateDesigner';
import Verification from './components/Verification';
import AuditLogs from './components/AuditLogs';
import Signatures from './components/Signatures';
import UserManagement from './components/UserManagement';
import AccountSettings from './components/AccountSettings';
import InstitutionSettings from './components/InstitutionSettings';
import DiplomaRegistry from './components/DiplomaRegistry';
import BlockchainNode from './components/BlockchainNode';
import ThirdPartyLogs from './components/ThirdPartyLogs';
import AcademicCampaignManager from './components/AcademicCampaign';
import LMDDecisionEngine from './components/LMDDecisionEngine';
import TutelleManager from './components/TutelleManager';
import Login from './components/Login';
import TenantManagement from './components/TenantManagement';
import { Tenant, User, UserRole } from './types';

type View = 'dashboard' | 'db-connector' | 'lmd-engine' | 'templates' | 'signatures' | 'batch-generator' | 'audit' | 'verify' | 'users' | 'account' | 'settings' | 'registry' | 'blockchain' | 'third-party' | 'campaigns' | 'tutelle' | 'tenants';

const AppContent: React.FC<{ user: User, onLogout: () => void }> = ({ user, onLogout }) => {
  const [activeTenant, setActiveTenant] = useState<Tenant>({
    id: user.tenantId,
    /* @fix: replaced UserRole.SUPER_ADMIN with UserRole.SYSTEM_OWNER */
    name: user.role === UserRole.SYSTEM_OWNER ? 'MINESUP - Rectorat Central' : 'Institution Locale',
    /* @fix: replaced UserRole.SUPER_ADMIN with UserRole.SYSTEM_OWNER */
    type: user.role === UserRole.SYSTEM_OWNER ? 'MAIN' : 'UNIVERSITY',
    settings: {
      primaryColor: '#1e293b',
      officials: [],
      zeroTrustMode: true,
      tsaEnabled: true,
      blockchainEnabled: true,
      eGovLinkActive: true,
      lmdRules: [],
      semanticMappings: [],
      /* Added signatureRequired to satisfy TenantSettings requirement */
      signatureRequired: 1
    }
  });
  
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedTenant = localStorage.getItem(`tenant_config_${activeTenant.id}`);
    if (savedTenant) setActiveTenant(JSON.parse(savedTenant));
  }, [activeTenant.id]);

  const handleSaveLMDRules = (rules: any) => {
    const updated = { ...activeTenant, settings: { ...activeTenant.settings!, lmdRules: rules } };
    setActiveTenant(updated);
    localStorage.setItem(`tenant_config_${updated.id}`, JSON.stringify(updated));
    alert("Règles LMD scellées avec succès.");
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard activeTenant={activeTenant} />;
      case 'campaigns': return <AcademicCampaignManager activeTenant={activeTenant} />;
      case 'db-connector': return <DBConnector activeTenant={activeTenant} />;
      case 'lmd-engine': return <LMDDecisionEngine activeTenant={activeTenant} onSave={handleSaveLMDRules} />;
      case 'tutelle': return <TutelleManager activeTenant={activeTenant} />;
      case 'batch-generator': return <BatchGeneratorNew activeTenant={activeTenant} />;
      case 'templates': return <TemplateDesigner activeTenant={activeTenant} />;
      case 'signatures': return <Signatures activeTenant={activeTenant} />;
      case 'blockchain': return <BlockchainNode activeTenant={activeTenant} />;
      case 'third-party': return <ThirdPartyLogs />;
      case 'audit': return <AuditLogs activeTenant={activeTenant} />;
      case 'registry': return <DiplomaRegistry activeTenant={activeTenant} />;
      case 'users': return <UserManagement currentUser={user} />;
      case 'account': return <AccountSettings user={user} onLogout={onLogout} />;
      case 'settings': return <InstitutionSettings activeTenant={activeTenant} onUpdate={setActiveTenant} />;
      case 'verify': return <Verification />;
        case 'tenants': return user.role === UserRole.SYSTEM_OWNER ? <TenantManagement user={user} /> : <Dashboard activeTenant={activeTenant} />;
      default: return <Dashboard activeTenant={activeTenant} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter">
      <Sidebar 
        user={user} activeTenant={activeTenant} currentView={currentView}
        onNavigate={setCurrentView} isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} 
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header 
          user={user} activeTenant={activeTenant} onTenantChange={setActiveTenant} 
          onToggleMenu={() => setIsMobileMenuOpen(true)} onNavigateAccount={() => setCurrentView('account')}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-10 bg-slate-50/50">{renderView()}</main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  if (!user) return <Login onLoginSuccess={(u) => { setUser(u); localStorage.setItem('auth_user', JSON.stringify(u)); }} />;
  return <AppContent user={user} onLogout={() => { setUser(null); localStorage.removeItem('auth_user'); }} />;
};

export default App;
