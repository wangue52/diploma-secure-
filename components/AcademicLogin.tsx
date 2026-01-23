import React, { useState } from 'react';
import { diplomaService } from '../services/api';

interface AcademicLoginProps {
  onLogin: (user: any) => void;
}

const AcademicLogin: React.FC<AcademicLoginProps> = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulation de connexion pour les autorités académiques
      const mockUsers = [
        {
          id: 'rector_001',
          email: 'recteur@universite.cm',
          fullName: 'Prof. Jean MBARGA',
          role: 'RECTOR',
          tenantId: 't-uy1',
          officialTitle: 'Recteur de l\'Université de Yaoundé I',
          status: 'ACTIVE'
        },
        {
          id: 'dean_001', 
          email: 'doyen.sciences@universite.cm',
          fullName: 'Dr. Marie FOKOU',
          role: 'DEAN',
          tenantId: 't-uy1',
          officialTitle: 'Doyen de la Faculté des Sciences',
          status: 'ACTIVE'
        },
        {
          id: 'director_001',
          email: 'directeur.poly@universite.cm', 
          fullName: 'Ing. Paul TCHOFFO',
          role: 'DIRECTOR',
          tenantId: 't-poly',
          officialTitle: 'Directeur de l\'École Polytechnique',
          status: 'ACTIVE'
        }
      ];

      const user = mockUsers.find(u => u.email === credentials.email);
      
      if (user && credentials.password === 'academic2024') {
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('auth_token', 'mock_token_' + user.id);
        onLogin(user);
      } else {
        alert('Identifiants incorrects');
      }
    } catch (error) {
      alert('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-university text-white text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Autorités Académiques</h1>
          <p className="text-slate-600 text-sm mt-2">Signature des Diplômes</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Email Institutionnel
            </label>
            <input
              type="email"
              value={credentials.email}
              onChange={(e) => setCredentials(prev => ({...prev, email: e.target.value}))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="votre.email@universite.cm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({...prev, password: e.target.value}))}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Connexion...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt mr-2"></i>
                Se connecter
              </>
            )}
          </button>
        </form>

        <div className="mt-8 p-4 bg-blue-50 rounded-xl">
          <h3 className="font-bold text-blue-900 mb-2">Comptes de test :</h3>
          <div className="text-xs text-blue-700 space-y-1">
            <div>• <strong>Recteur:</strong> recteur@universite.cm</div>
            <div>• <strong>Doyen:</strong> doyen.sciences@universite.cm</div>
            <div>• <strong>Directeur:</strong> directeur.poly@universite.cm</div>
            <div className="mt-2"><strong>Mot de passe:</strong> academic2024</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AcademicLogin;