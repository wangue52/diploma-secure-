
import React from 'react';
import { Tenant, User, UserRole } from '../types';

type View =
  | 'dashboard'
  | 'db-connector'
  | 'lmd-engine'
  | 'templates'
  | 'signatures'
  | 'batch-generator'
  | 'audit'
  | 'verify'
  | 'users'
  | 'account'
  | 'settings'
  | 'registry'
  | 'blockchain'
  | 'third-party'
  | 'campaigns'
  | 'tutelle'
  | 'tenants';

interface SidebarProps {
  user: User;
  activeTenant: Tenant;
  currentView: View;
  onNavigate: (view: View) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeTenant, currentView, onNavigate, isOpen, onClose }) => {
  const menuItems: { id: View; icon: string; label: string; roles?: UserRole[] }[] = [
    { id: 'dashboard', icon: 'fa-chart-line', label: 'Tableau de Bord' },
    { id: 'campaigns', icon: 'fa-calendar-check', label: 'Campagnes Officielles' },
    { id: 'db-connector', icon: 'fa-database', label: 'Tunnel ERP' },
    { id: 'lmd-engine', icon: 'fa-microchip', label: 'Moteur LMD' },
    { id: 'tutelle', icon: 'fa-handshake', label: 'Tutelle IPES' },
    { id: 'registry', icon: 'fa-box-archive', label: 'Registre National' },
    { id: 'signatures', icon: 'fa-pen-fancy', label: 'Signatures PKI' },
    { id: 'batch-generator', icon: 'fa-file-export', label: 'Batch Generator' },
    { id: 'blockchain', icon: 'fa-link', label: 'Noeud Blockchain' },
    { id: 'third-party', icon: 'fa-building-shield', label: 'Accès Tiers' },
    { id: 'audit', icon: 'fa-clipboard-list', label: 'Audit & Tracabilité' },
    { id: 'verify', icon: 'fa-shield-halved', label: 'Vérification' },
    { id: 'templates', icon: 'fa-palette', label: 'Modèles Diplômes' },
    { id: 'users', icon: 'fa-users-gear', label: 'Gouvernance Accès' },
    { id: 'settings', icon: 'fa-landmark', label: 'Paramètres Institution' },
    { id: 'tenants', icon: 'fa-sitemap', label: 'Gestion Tenants', roles: [UserRole.SYSTEM_OWNER] },
  ];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[60] md:hidden" onClick={onClose}></div>}
      <aside className={`fixed inset-y-0 left-0 z-[70] w-80 bg-slate-950 text-white flex flex-col shadow-2xl transition-all duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center transform hover:rotate-12 transition-transform">
              <i className="fas fa-graduation-cap text-2xl text-white"></i>
            </div>
            <div>
              <h1 className="font-black text-xl tracking-tighter text-white italic">DiplomaSecure</h1>
              <p className="text-[9px] text-blue-400 font-black uppercase tracking-[0.3em]">Sovereign Node</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-2 mt-6 overflow-y-auto custom-scrollbar">
          {menuItems.filter(item => !item.roles || item.roles.includes(user.role)).map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); if(onClose) onClose(); }}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${
                currentView === item.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' : 'text-slate-500 hover:bg-white/5 hover:text-slate-100'
              }`}
            >
              <i className={`fas ${item.icon} w-6 text-center text-lg transition-transform group-hover:scale-110`}></i>
              <span className="font-bold text-[10px] uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5">
           <div className="bg-white/5 p-4 rounded-3xl flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${user.role === UserRole.OFFICIAL_SIGNATORY ? 'bg-amber-600 text-white' : 'bg-slate-800 text-blue-400'}`}>
                {user.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                 <p className="text-[10px] font-black text-white truncate uppercase italic">{user.fullName}</p>
                 <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{user.role.replace('_', ' ')}</p>
              </div>
           </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
