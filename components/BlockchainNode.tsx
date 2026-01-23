
import React, { useState, useEffect } from 'react';
import { Tenant, DiplomaRecord } from '../types';
import { diplomaService } from '../services/api';

interface BlockchainNodeProps {
  activeTenant: Tenant;
}

const BlockchainNode: React.FC<BlockchainNodeProps> = ({ activeTenant }) => {
  const [diplomas, setDiplomas] = useState<DiplomaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchoringId, setAnchoringId] = useState<string | null>(null);

  const fetchDiplomas = async () => {
    setLoading(true);
    try {
      const data = await diplomaService.searchDiplomas(activeTenant.id, {});
      setDiplomas(data.filter(d => d.status === 'SIGNED' || d.status === 'PARTIALLY_SIGNED'));
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchDiplomas(); }, [activeTenant.id]);

  const handleAnchor = async (id: string) => {
    setAnchoringId(id);
    try {
      await diplomaService.anchorBlockchain(id);
      fetchDiplomas();
    } catch (e) {
      alert("Erreur lors de l'ancrage Blockchain.");
    } finally { setAnchoringId(null); }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-32">
      <div className="bg-slate-900 p-10 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 scale-150"><i className="fas fa-link text-[200px]"></i></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-black uppercase tracking-tight italic">Ancrage Immuable Blockchain</h1>
            <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
              Sécurisez l'existence de vos diplômes sur une infrastructure décentralisée. L'ancrage crée une preuve mathématique universelle impossible à falsifier.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center min-w-[160px]">
              <p className="text-[10px] font-black uppercase text-blue-400 mb-2">Noeud Actif</p>
              <p className="text-xl font-black">MainNet Node</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-8 py-6">Titulaire</th>
              <th className="px-8 py-6">Hash SHA-256</th>
              <th className="px-8 py-6">Statut Blockchain</th>
              <th className="px-8 py-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={4} className="py-20 text-center animate-pulse text-[10px] font-black uppercase text-slate-400 tracking-widest">Synchronisation...</td></tr>
            ) : diplomas.length === 0 ? (
              <tr><td colSpan={4} className="py-20 text-center text-slate-300 italic">Aucun diplôme signé prêt pour l'ancrage.</td></tr>
            ) : diplomas.map(d => (
              <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex flex-col">
                    <span className="font-black text-slate-800 text-sm">{d.studentName}</span>
                    <span className="text-[9px] text-slate-400 uppercase font-bold">{d.studentMatricule}</span>
                  </div>
                </td>
                <td className="px-8 py-5 font-mono text-[10px] text-slate-400">{d.id.substring(0, 16)}...</td>
                <td className="px-8 py-5">
                  {d.metadata.blockchain_anchor ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <i className="fas fa-check-double text-xs"></i>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase">Ancré (Block #{d.metadata.blockchain_anchor.blockNumber})</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[9px] font-black uppercase text-slate-400 italic">En attente d'ancrage</span>
                  )}
                </td>
                <td className="px-8 py-5 text-right">
                  {!d.metadata.blockchain_anchor && (
                    <button 
                      onClick={() => handleAnchor(d.id)}
                      disabled={anchoringId === d.id}
                      className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all disabled:opacity-50"
                    >
                      {anchoringId === d.id ? <i className="fas fa-cog fa-spin"></i> : <i className="fas fa-anchor mr-2"></i>}
                      Ancrer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BlockchainNode;
