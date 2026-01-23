import React, { useState, useEffect } from 'react';
import { Tenant, User, UserRole } from '../types';
import { tenantService } from '../services/api';

interface TenantManagementProps {
  user: User;
}

const TenantManagement: React.FC<TenantManagementProps> = ({ user }) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [filter, setFilter] = useState<'ACTIVE' | 'ALL'>('ACTIVE');
  const [stats, setStats] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    type: 'UNIVERSITY' as const,
    contactEmail: '',
    contactPhone: '',
    legalStatus: 'PUBLIC' as const,
    maxUsers: 100,
    maxDiplomas: 10000,
  });

  useEffect(() => {
    fetchTenants();
  }, [filter]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const data = await tenantService.getTenants();
      const filtered = filter === 'ACTIVE' ? data.filter((t: any) => t.status === 'ACTIVE') : data;
      setTenants(filtered);
    } catch (e) {
      console.error('Erreur chargement tenants:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTenant = await tenantService.createTenant({
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        type: formData.type,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        legal_status: formData.legalStatus,
        max_users: formData.maxUsers,
        max_diplomas: formData.maxDiplomas,
      });
      setTenants([newTenant, ...tenants]);
      setShowAddModal(false);
      resetForm();
    } catch (e) {
      console.error('Erreur création tenant:', e);
      alert('Erreur lors de la création du tenant');
    }
  };

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    try {
      const updated = await tenantService.updateTenant(editingTenant.id, {
        name: formData.name,
        description: formData.description,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        legal_status: formData.legalStatus,
      });
      setTenants(tenants.map(t => t.id === updated.id ? updated : t));
      setEditingTenant(null);
      resetForm();
    } catch (e) {
      console.error('Erreur mise à jour tenant:', e);
      alert('Erreur lors de la mise à jour du tenant');
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!window.confirm('⚠️ Supprimer ce tenant? Cette action désactivera tous les utilisateurs et diplômes associés.')) return;
    try {
      await tenantService.deleteTenant(tenantId);
      setTenants(tenants.filter(t => t.id !== tenantId));
    } catch (e) {
      console.error('Erreur suppression tenant:', e);
      alert('Erreur lors de la suppression du tenant');
    }
  };

  const handleEditClick = (tenant: Tenant) => {
    setFormData({
      name: tenant.name,
      slug: tenant.slug || '',
      description: tenant.description || '',
      type: (tenant.type as any) || 'UNIVERSITY',
      contactEmail: tenant.contact_email || '',
      contactPhone: tenant.contact_phone || '',
      legalStatus: (tenant.legal_status as any) || 'PUBLIC',
      maxUsers: tenant.max_users || 100,
      maxDiplomas: tenant.max_diplomas || 10000,
    });
    setEditingTenant(tenant);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      type: 'UNIVERSITY',
      contactEmail: '',
      contactPhone: '',
      legalStatus: 'PUBLIC',
      maxUsers: 100,
      maxDiplomas: 10000,
    });
    setEditingTenant(null);
  };

  const tenantTypeLabels: Record<string, string> = {
    MINISTRY: '🌍 Ministère',
    UNIVERSITY: '🏛️ Université',
    FACULTY: '🎓 Faculté',
    IPES: '🏫 IPES',
    DEPARTMENT: '📁 Département',
  };

  const isAdmin = user.role === UserRole.SYSTEM_OWNER;

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-32 px-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-12 rounded-[50px] text-white shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4">
            <div className="inline-flex px-4 py-1.5 bg-blue-500/20 text-blue-200 rounded-full border border-blue-400/30 text-[10px] font-black uppercase tracking-[0.3em]">
              Administration
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">Gestion des Tenants</h1>
            <p className="text-slate-300 max-w-2xl text-lg font-medium">
              Gérez les organisations, universités et institutions autorisées dans le système de certification.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="px-10 py-5 bg-white text-slate-900 hover:bg-blue-50 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3"
            >
              <i className="fas fa-plus"></i> Nouveau Tenant
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
            filter === 'ACTIVE'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <i className="fas fa-check mr-2"></i> Actifs ({tenants.length})
        </button>
        <button
          onClick={() => setFilter('ALL')}
          className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
            filter === 'ALL'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <i className="fas fa-list mr-2"></i> Tous
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="py-32 text-center">
          <div className="w-16 h-16 border-8 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Chargement des tenants...</p>
        </div>
      ) : tenants.length === 0 ? (
        <div className="py-32 text-center bg-slate-50 rounded-[40px] border border-slate-200">
          <i className="fas fa-building text-6xl text-slate-300 mb-6"></i>
          <p className="text-lg font-black uppercase text-slate-400">Aucun tenant trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="bg-white rounded-[40px] p-10 border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
              <div className="flex items-center justify-between mb-6">
                <div className="text-4xl">{tenantTypeLabels[tenant.type]?.split(' ')[0] || '📍'}</div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                  tenant.status === 'ACTIVE'
                    ? 'bg-green-50 text-green-600 border-green-100'
                    : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                  {tenant.status}
                </span>
              </div>

              <div className="space-y-4 mb-6 border-b border-slate-100 pb-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nom</p>
                  <h3 className="font-black text-slate-800 text-lg">{tenant.name}</h3>
                </div>
                {tenant.description && (
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
                    <p className="text-xs text-slate-600">{tenant.description}</p>
                  </div>
                )}
                <div className="flex gap-4 text-[10px]">
                  <div>
                    <span className="font-black text-slate-400 uppercase">Type:</span>
                    <span className="text-slate-800 ml-2">{tenantTypeLabels[tenant.type]}</span>
                  </div>
                  {tenant.legal_status && (
                    <div>
                      <span className="font-black text-slate-400 uppercase">Statut:</span>
                      <span className="text-slate-800 ml-2">{tenant.legal_status}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-6 text-[10px]">
                {tenant.contact_email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <i className="fas fa-envelope text-blue-600"></i>
                    <a href={`mailto:${tenant.contact_email}`} className="hover:text-blue-600">{tenant.contact_email}</a>
                  </div>
                )}
                {tenant.contact_phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <i className="fas fa-phone text-blue-600"></i>
                    {tenant.contact_phone}
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditClick(tenant)}
                    className="flex-1 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    <i className="fas fa-edit mr-1"></i> Éditer
                  </button>
                  <button
                    onClick={() => handleDeleteTenant(tenant.id)}
                    className="flex-1 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all"
                  >
                    <i className="fas fa-trash mr-1"></i> Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit */}
      {(showAddModal || editingTenant) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase tracking-tight">
                {editingTenant ? '✏️ Éditer Tenant' : '➕ Nouveau Tenant'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingTenant(null);
                  resetForm();
                }}
                className="text-2xl text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={editingTenant ? handleUpdateTenant : handleAddTenant} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-600"
                    required
                  />
                </div>

                {!editingTenant && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                      Slug *
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      placeholder="ex: uy1-yaounde"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-600"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-600"
                  >
                    <option value="MINISTRY">Ministère</option>
                    <option value="UNIVERSITY">Université</option>
                    <option value="FACULTY">Faculté</option>
                    <option value="IPES">IPES</option>
                    <option value="DEPARTMENT">Département</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                    Email de Contact
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                    Téléphone de Contact
                  </label>
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                    Statut Légal
                  </label>
                  <select
                    value={formData.legalStatus}
                    onChange={(e) => setFormData({ ...formData, legalStatus: e.target.value as any })}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-600"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="PRIVATE_IPES">IPES Privée</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                >
                  {editingTenant ? '✓ Mettre à jour' : '✓ Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTenant(null);
                    resetForm();
                  }}
                  className="flex-1 py-4 bg-slate-200 text-slate-700 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagement;
