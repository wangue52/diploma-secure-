
import React, { useState, useEffect } from 'react';
import { User, UserRole, Tenant } from '../types';
import { userService } from '../services/api';

interface UserManagementProps {
  currentUser: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newUser, setNewUser] = useState({ 
    fullName: '', 
    email: '', 
    role: UserRole.ACADEMIC_OPERATOR, 
    tenantId: currentUser.tenantId 
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      // Filtrage par périmètre institutionnel : un admin local ne voit que les siens
      const filtered = currentUser.role === UserRole.SYSTEM_OWNER 
        ? data 
        : data.filter(u => u.tenantId === currentUser.tenantId);
      setUsers(filtered);
    } catch (err) {
      console.error("Failed to load users");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleStatus = async (user: User) => {
    const action = user.status === 'ACTIVE' ? 'SUSPENDRE' : 'RÉACTIVER';
    if (!window.confirm(`Voulez-vous vraiment ${action} le compte de ${user.fullName} ? Sa session sera immédiatement invalidée.`)) return;
    
    try {
      await userService.toggleStatus(user.id);
      fetchUsers();
    } catch (err) {
      alert("Erreur lors du changement de statut.");
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userService.createUser(newUser);
      setShowAddModal(false);
      fetchUsers();
      setNewUser({ ...newUser, fullName: '', email: '' });
    } catch (err) {
      alert("Erreur lors de la création de l'utilisateur.");
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SYSTEM_OWNER: return 'bg-purple-50 text-purple-700 border-purple-200';
      case UserRole.INSTITUTION_MANAGER: return 'bg-blue-50 text-blue-700 border-blue-200';
      case UserRole.OFFICIAL_SIGNATORY: return 'bg-amber-50 text-amber-700 border-amber-200';
      case UserRole.ACADEMIC_OPERATOR: return 'bg-green-50 text-green-700 border-green-200';
      case UserRole.SOVEREIGN_AUDITOR: return 'bg-slate-50 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-32">
      <div className="bg-white p-10 rounded-[50px] shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
           <i className="fas fa-users-cog text-[150px] text-slate-900"></i>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="space-y-3">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Gouvernance des Accès</h1>
            <p className="text-slate-500 font-medium max-w-xl">
               Gestion souveraine des responsabilités. Le périmètre actuel est restreint à <span className="text-blue-600 font-bold">{currentUser.tenantId}</span>.
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-8 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-2xl transition-all flex items-center gap-4"
          >
            <i className="fas fa-plus"></i> Mandater une Autorité
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Administrateurs', count: users.length, icon: 'fa-user-shield', color: 'blue' },
           { label: 'Autorités de Signature', count: users.filter(u => u.role === UserRole.OFFICIAL_SIGNATORY).length, icon: 'fa-pen-nib', color: 'amber' },
           { label: 'Comptes Actifs', count: users.filter(u => u.status === 'ACTIVE').length, icon: 'fa-circle-check', color: 'green' },
           { label: 'Sessions Suspendues', count: users.filter(u => u.status === 'SUSPENDED').length, icon: 'fa-user-slash', color: 'red' },
         ].map((stat, i) => (
           <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
             <div className={`w-10 h-10 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center mb-4`}>
                <i className={`fas ${stat.icon}`}></i>
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
             <p className="text-2xl font-black text-slate-900 mt-1">{stat.count}</p>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/30">
          <div className="relative w-full md:w-96">
             <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
             <input 
               type="text"
               placeholder="Rechercher une autorité (Nom, Email)..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-white border-2 border-slate-100 rounded-2xl py-3 pl-14 pr-6 text-xs font-bold outline-none focus:border-blue-600 transition-all"
             />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registre Permanent des Acteurs du Système</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white text-slate-400 uppercase text-[10px] font-black tracking-widest border-b border-slate-50">
              <tr>
                <th className="px-8 py-6">Identité</th>
                <th className="px-8 py-6">Rôle & Responsabilité</th>
                <th className="px-8 py-6">Périmètre</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Contrôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                 <tr><td colSpan={5} className="py-20 text-center text-slate-400 font-black uppercase text-[10px] animate-pulse">Consultation du grand livre des accès...</td></tr>
              ) : users.filter(u => u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl ${user.role === UserRole.OFFICIAL_SIGNATORY ? 'bg-amber-600' : 'bg-slate-900'}`}>
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm tracking-tight uppercase italic">{user.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-widest ${getRoleBadgeColor(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                       <i className="fas fa-building-columns text-slate-300 text-[10px]"></i>
                       <span className="text-[10px] text-slate-500 font-black uppercase">{user.tenantId}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase border ${
                      user.status === 'ACTIVE' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                        onClick={() => handleToggleStatus(user)}
                        title={user.status === 'ACTIVE' ? 'Suspendre' : 'Réactiver'}
                        className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center shadow-sm ${
                          user.status === 'ACTIVE' ? 'bg-red-50 text-red-400 hover:bg-red-600 hover:text-white' : 'bg-green-50 text-green-400 hover:bg-green-600 hover:text-white'
                        }`}
                       >
                         <i className={`fas ${user.status === 'ACTIVE' ? 'fa-user-lock' : 'fa-user-check'}`}></i>
                       </button>
                       <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white flex items-center justify-center shadow-sm transition-all">
                          <i className="fas fa-history"></i>
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-[50px] p-12 shadow-2xl space-y-10 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-slate-900"></div>
             <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Attribution de Mandat</h2>
                <p className="text-slate-500 font-medium text-sm mt-1">Nouveaux privilèges d'accès au système souverain.</p>
             </div>

             <form onSubmit={handleAddUser} className="space-y-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nom complet & Prénoms</label>
                   <input type="text" required value={newUser.fullName} onChange={e => setNewUser({...newUser, fullName: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-sm font-bold outline-none focus:border-blue-600 transition-all" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Institutionnel (@minesup.cm / .edu)</label>
                   <input type="email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-sm font-bold outline-none focus:border-blue-600 transition-all" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Fonction Rénalienne (Rôle)</label>
                   <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})} className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-sm font-bold outline-none focus:border-blue-600 transition-all">
                      <option value={UserRole.ACADEMIC_OPERATOR}>Opérateur Académique (Faculté)</option>
                      <option value={UserRole.INSTITUTION_MANAGER}>Gestionnaire Institution (Université)</option>
                      <option value={UserRole.OFFICIAL_SIGNATORY}>Autorité de Signature (Rectorat/Ministère)</option>
                      <option value={UserRole.SOVEREIGN_AUDITOR}>Auditeur / Inspecteur d'État</option>
                      {currentUser.role === UserRole.SYSTEM_OWNER && <option value={UserRole.SYSTEM_OWNER}>System Owner (Technique)</option>}
                   </select>
                </div>

                <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                   <p className="text-[10px] text-amber-800 leading-relaxed font-bold italic">
                     "Toute création de compte est auditée. Le titulaire recevra ses identifiants temporaires par canal sécurisé."
                   </p>
                </div>

                <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest">Annuler</button>
                   <button type="submit" className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">Activer le Mandat</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
