
import React, { useState } from 'react';
import { User } from '../types';

interface AccountSettingsProps {
  user: User;
  onLogout: () => void;
}

const AccountSettings: React.FC<AccountSettingsProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions'>('profile');

  return (
    <div className="max-w-4xl mx-auto animate-fadeIn pb-24">
      <div className="flex items-center gap-5 mb-10">
        <div className="w-20 h-20 rounded-[32px] bg-slate-900 flex items-center justify-center text-white text-3xl font-black shadow-2xl border-4 border-white">
          {user.fullName.substring(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none">{user.fullName}</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2">Identifiant Officiel : {user.email}</p>
        </div>
      </div>

      <div className="flex gap-2 p-1.5 bg-white rounded-2xl shadow-sm border border-slate-100 mb-8 w-fit">
        {[
          { id: 'profile', label: 'Mon Profil', icon: 'fa-user' },
          { id: 'security', label: 'Sécurité MFA', icon: 'fa-shield-halved' },
          { id: 'sessions', label: 'Sessions Actives', icon: 'fa-desktop' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-3 ${
              activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:bg-slate-50'
            }`}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[40px] shadow-xl border border-slate-100 relative overflow-hidden">
        {activeTab === 'profile' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nom Complet</label>
                <input type="text" defaultValue={user.fullName} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-blue-600 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Professionnel</label>
                <input type="email" defaultValue={user.email} disabled className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-400 outline-none cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Rôle Système</label>
                <input type="text" defaultValue={user.role} disabled className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-400 outline-none cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Institution Rattachée</label>
                <input type="text" defaultValue={user.tenantId} disabled className="w-full bg-slate-100 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-400 outline-none cursor-not-allowed" />
              </div>
            </div>
            <div className="pt-6 border-t border-slate-50 flex justify-end gap-3">
               <button onClick={onLogout} className="px-8 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all">
                  Déconnexion
               </button>
               <button className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
                  Mettre à jour le profil
               </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 flex items-center gap-6">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 text-2xl shadow-sm">
                 <i className="fas fa-shield-check"></i>
               </div>
               <div>
                 <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Double Authentification (MFA)</h3>
                 <p className="text-slate-500 text-xs mt-1">Votre compte est protégé par DiplomaSecure Auth. Ne partagez jamais vos codes.</p>
               </div>
               <div className="ml-auto">
                 <span className="px-4 py-2 bg-green-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-green-100">Activé</span>
               </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Changer le mot de passe</h4>
              <div className="grid grid-cols-1 gap-6">
                <input type="password" placeholder="Mot de passe actuel" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-blue-600 transition-all" />
                <input type="password" placeholder="Nouveau mot de passe" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700 outline-none focus:border-blue-600 transition-all" />
              </div>
              <button className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all">
                Mettre à jour la sécurité
              </button>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6 animate-fadeIn">
             <div className="space-y-4">
                {[
                  { device: 'MacBook Pro - Chrome', location: 'Yaoundé, CM', status: 'Actuelle', ip: '192.168.1.1' },
                  { device: 'iPhone 15 - Safari', location: 'Yaoundé, CM', status: 'Il y a 2h', ip: '10.0.0.5' }
                ].map((session, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors shadow-sm">
                        <i className={`fas ${session.device.includes('iPhone') ? 'fa-mobile-screen' : 'fa-laptop'}`}></i>
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm">{session.device}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{session.location} • {session.ip}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase">{session.status}</span>
                      {i > 0 && (
                        <button className="text-red-500 hover:text-red-700 p-2">
                           <i className="fas fa-sign-out-alt"></i>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
             </div>
             <button className="w-full py-4 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-50 rounded-2xl transition-all mt-4">
                Déconnecter tous les autres appareils
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
