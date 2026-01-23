
import React, { useState } from 'react';
import { Tenant, User, UserRole } from '../types';

interface HeaderProps {
  user: User;
  activeTenant: Tenant;
  onTenantChange: (tenant: Tenant) => void;
  onToggleMenu?: () => void;
  onNavigateAccount: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, activeTenant, onTenantChange, onToggleMenu, onNavigateAccount }) => {
  const [lang, setLang] = useState('FR');
  
  // Default settings to avoid type errors in mock tenants
  const defaultSettings = {
    primaryColor: '#1e293b',
    zeroTrustMode: true,
    tsaEnabled: true,
    blockchainEnabled: true,
    eGovLinkActive: true,
    lmdRules: [],
    semanticMappings: [],
    officials: [],
    /* Added signatureRequired to fix Property 'signatureRequired' is missing errors */
    signatureRequired: 1
  };

  const tenants: Tenant[] = [
    { id: 't-minesup', name: 'MINESUP - État du Cameroun', type: 'MINISTRY', settings: defaultSettings },
    { id: 't-uy1', name: 'Université de Yaoundé I', type: 'UNIVERSITY', parentId: 't-minesup', settings: defaultSettings },
    { id: 't-poly', name: 'École Polytechnique (ENSPY)', type: 'FACULTY', parentId: 't-uy1', settings: defaultSettings },
    { id: 't-udm', name: 'Université des Montagnes (IPES)', type: 'IPES', parentId: 't-minesup', settings: defaultSettings },
    { id: 't-gl', name: 'Dpt Génie Logiciel', type: 'DEPARTMENT', parentId: 't-poly', settings: defaultSettings },
  ];

  /* @fix: replaced UserRole.SUPER_ADMIN with UserRole.SYSTEM_OWNER */
  const filteredTenants = user.role === UserRole.SYSTEM_OWNER 
    ? tenants 
    : tenants.filter(t => t.id === user.tenantId || t.parentId === user.tenantId);

  const getEmoji = (type: string) => {
    switch(type) {
      case 'MINISTRY': return '🌍';
      case 'UNIVERSITY': return '🏛️';
      case 'FACULTY': return '🎓';
      case 'IPES': return '🏫';
      case 'DEPARTMENT': return '📁';
      default: return '📍';
    }
  };

  return (
    <header className="h-24 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-10 sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
      <div className="flex items-center gap-6">
        <button onClick={onToggleMenu} className="p-3 bg-slate-100 rounded-2xl md:hidden text-slate-600 hover:bg-slate-200 transition-all">
          <i className="fas fa-bars-staggered"></i>
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-1.5">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Périmètre Institutionnel</span>
             <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase border border-blue-100">{activeTenant.type}</span>
          </div>
          <div className="relative group">
            <select 
              className="appearance-none bg-slate-900 border-none rounded-2xl pl-12 pr-12 py-3 text-xs font-black text-white outline-none cursor-pointer min-w-[320px] shadow-2xl shadow-slate-200"
              value={activeTenant.id}
              onChange={(e) => {
                const found = tenants.find(t => t.id === e.target.value);
                if (found) onTenantChange(found);
              }}
            >
              {filteredTenants.map(t => (
                <option key={t.id} value={t.id} className="bg-slate-800 text-white p-4">
                  {getEmoji(t.type)} {t.name}
                </option>
              ))}
            </select>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-400">
               <i className="fas fa-building-columns text-sm"></i>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
               <i className="fas fa-chevron-down text-[10px]"></i>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="hidden lg:flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
           {['FR', 'EN', 'AR'].map(l => (
             <button 
              key={l}
              onClick={() => setLang(l)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${lang === l ? 'bg-white text-slate-900 shadow-md border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {l}
             </button>
           ))}
        </div>

        <div className="hidden xl:flex items-center gap-4 px-6 py-3 bg-slate-900 rounded-[20px] border border-slate-800">
           <div className="text-right">
              <p className="text-[9px] font-black text-slate-500 uppercase leading-none mb-1">Status de Session</p>
              <p className="text-[10px] font-bold text-green-400 uppercase tracking-tighter">Sceau Prêt</p>
           </div>
           <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_15px_#22c55e]"></div>
        </div>
        
        <div className="flex items-center gap-4 cursor-pointer group" onClick={onNavigateAccount}>
          <div className="text-right hidden sm:block">
             <p className="text-xs font-black text-slate-900 leading-none mb-1">{user.fullName}</p>
             <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{user.role}</p>
          </div>
          <div className="w-12 h-12 rounded-[20px] bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-white font-black border-2 border-white shadow-xl group-hover:scale-110 transition-all duration-300">
            {user.fullName.substring(0, 1).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
