import React, { useState, useEffect } from 'react';
import { User, Tenant } from '../types';
import { diplomaService } from '../services/api';
import Signatures from './Signatures';

interface AcademicDashboardProps {
  user: User;
  tenant: Tenant;
  onLogout: () => void;
}

const AcademicDashboard: React.FC<AcademicDashboardProps> = ({ user, tenant, onLogout }) => {
  const [activeView, setActiveView] = useState<'overview' | 'signatures' | 'profile'>('overview');
  const [stats, setStats] = useState<any>({});
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchStats();
    fetchPendingSignatures();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await diplomaService.getStats(tenant.id);
      setStats(data);
    } catch (error) {
      console.error('Erreur stats:', error);
    }
  };

  const fetchPendingSignatures = async () => {
    try {
      const pending = await diplomaService.getPendingSignature(tenant.id, user.id);
      setPendingCount(Array.isArray(pending) ? pending.length : 0);
    } catch (error) {
      console.error('Erreur pending:', error);
    }
  };

  const getRoleTitle = (role: string) => {
    switch(role) {
      case 'RECTOR': return 'Recteur';
      case 'DEAN': return 'Doyen';
      case 'DIRECTOR': return 'Directeur';
      default: return 'Autorité Académique';
    }
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'RECTOR': return 'fa-crown';
      case 'DEAN': return 'fa-graduation-cap';
      case 'DIRECTOR': return 'fa-building';
      default: return 'fa-user-tie';
    }
  };

  if (activeView === 'signatures') {
    return (
      <div className="min-h-screen bg-slate-50">
        <nav className="bg-white shadow-sm border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveView('overview')}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
            >
              <i className="fas fa-arrow-left"></i>
              <span>Retour au tableau de bord</span>
            </button>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              Déconnexion
            </button>
          </div>
        </nav>
        <div className="p-6">
          <Signatures activeTenant={tenant} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center`}>
                <i className={`fas ${getRoleIcon(user.role)} text-white text-xl`}></i>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{user.fullName}</h1>
                <p className="text-sm text-slate-600">{user.officialTitle || getRoleTitle(user.role)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{tenant.name}</p>
                <p className="text-xs text-slate-500">Établissement</p>
              </div>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <i className="fas fa-sign-out-alt mr-2"></i>
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="px-6">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveView('overview')}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeView === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="fas fa-chart-line mr-2"></i>
              Vue d'ensemble
            </button>
            <button
              onClick={() => setActiveView('signatures')}
              className={`py-4 px-2 border-b-2 font-medium text-sm relative ${
                activeView === 'signatures'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <i className="fas fa-pen-fancy mr-2"></i>
              Signatures
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="p-6">
        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Diplômes Total</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-certificate text-blue-600"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Signés</p>
                    <p className="text-2xl font-bold text-green-600">{stats.signed || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-check-circle text-green-600"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">En Attente</p>
                    <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-clock text-orange-600"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Blockchain</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.anchored || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <i className="fas fa-link text-purple-600"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Actions Rapides</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setActiveView('signatures')}
                  className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 hover:border-blue-300 transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      <i className="fas fa-pen-fancy text-white"></i>
                    </div>
                    {pendingCount > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        {pendingCount} en attente
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-600">
                    Signer les Diplômes
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Apposer votre signature officielle sur les diplômes validés
                  </p>
                </button>

                <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-3">
                    <i className="fas fa-user-check text-white"></i>
                  </div>
                  <h3 className="font-bold text-slate-900">Profil de Signature</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    {user.signatureImg ? 'Signature configurée ✓' : 'Configurer votre signature'}
                  </p>
                </div>
              </div>
            </div>

            {/* Role Information */}
            <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white p-8 rounded-2xl">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center`}>
                  <i className={`fas ${getRoleIcon(user.role)} text-2xl`}></i>
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{getRoleTitle(user.role)}</h2>
                  <p className="text-blue-200">{tenant.name}</p>
                </div>
              </div>
              <p className="text-blue-100">
                En tant que {getRoleTitle(user.role).toLowerCase()}, vous avez l'autorité pour signer et valider 
                les diplômes de votre établissement. Votre signature électronique garantit l'authenticité 
                et la validité des diplômes délivrés.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AcademicDashboard;