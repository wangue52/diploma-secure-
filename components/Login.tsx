
import React, { useState } from 'react';
import apiClient from '../services/api';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('admin.rectorat@minesup.cm');
  const [password, setPassword] = useState('minesup2024');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Utilisation de l'apiClient pré-configuré
      const response = await apiClient.post('/api/v1/auth/login', {
        email,
        password
      });
      const { access_token, user } = response.data;
      localStorage.setItem('auth_token', access_token);
      onLoginSuccess(user);
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'ERR_NETWORK') {
        setError("Le serveur backend est injoignable (Vérifiez qu'il tourne sur le port 8000).");
      } else if (err.response?.status === 422) {
        setError("Données invalides. Vérifiez l'email et le mot de passe (min 8 caractères).");
      } else if (err.response?.status === 401) {
        setError("Identifiant ou mot de passe incorrect.");
      } else {
        setError("Échec d'authentification. Vérifiez vos identifiants.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl p-10 rounded-[40px] border border-white/10 shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-900/50 border border-blue-400/30">
            <i className="fas fa-shield-halved text-3xl text-white"></i>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight italic uppercase">DiplomaSecure Core</h1>
          <p className="text-slate-500 text-[10px] mt-2 font-black uppercase tracking-[0.2em]">Souveraineté Numérique Académique</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Identifiant Rectorat</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500 transition-all font-bold"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mot de Passe</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white outline-none focus:border-blue-500 transition-all font-bold"
            />
          </div>

          {error && <p className="text-red-400 text-[10px] font-black uppercase text-center bg-red-900/20 p-3 rounded-xl">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-2xl shadow-blue-900/40 transition-all uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-4"
          >
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-lock"></i>}
            Initialiser la Session
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
