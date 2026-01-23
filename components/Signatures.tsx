
import React, { useState, useEffect } from 'react';
import { Tenant, User, DiplomaStatus } from '../types';
import { diplomaService, userService } from '../services/api';
import DiplomaExporter from './DiplomaExporter';

interface SignaturesProps {
  activeTenant: Tenant;
}

const Signatures: React.FC<SignaturesProps> = ({ activeTenant }) => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'queue' | 'setup' | 'manage'>('queue');
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [signatories, setSignatories] = useState<any[]>([]);
  
  // Signature Setup State
  const [sigImg, setSigImg] = useState<string | null>(null);
  const [stampImg, setStampImg] = useState<string | null>(null);
  const [officialTitle, setOfficialTitle] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setSigImg(parsed.signatureImg || null);
      setStampImg(parsed.stampImg || null);
      setOfficialTitle(parsed.officialTitle || '');
      
      // Vérifier si l'utilisateur est autorisé à signer (inclut les autorités académiques)
      const canSign = ['ADMIN', 'SIGNER', 'SUPER_ADMIN', 'RECTOR', 'DEAN', 'DIRECTOR'].includes(parsed.role);
      setIsAuthorized(canSign);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchPending();
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'RECTOR') {
        fetchSignatories();
      }
    }
  }, [activeTenant.id, user]);

  const fetchSignatories = async () => {
    try {
      // Récupérer les utilisateurs du tenant avec rôle de signature
      const response = await userService.getUsers(activeTenant.id);
      const users = Array.isArray(response) ? response : [];
      
      const authorizedSignatories = users
        .filter(u => ['ADMIN', 'SIGNER', 'SUPER_ADMIN', 'RECTOR', 'DEAN', 'DIRECTOR'].includes(u.role))
        .map(u => ({
          id: u.id,
          userId: u.id,
          name: u.fullName,
          email: u.email,
          role: u.role,
          title: u.officialTitle || 'Signataire autorisé',
          isActive: u.status === 'ACTIVE',
          hasSignature: !!u.signatureImg,
          hasStamp: !!u.stampImg,
          lastLogin: u.lastLogin
        }));
      
      setSignatories(authorizedSignatories);
    } catch (error) {
      console.error('Erreur lors de la récupération des signataires:', error);
      // Fallback avec l'utilisateur actuel
      if (user) {
        setSignatories([{
          id: user.id,
          userId: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role,
          title: officialTitle || 'Signataire autorisé',
          isActive: true,
          hasSignature: !!sigImg,
          hasStamp: !!stampImg,
          lastLogin: null
        }]);
      }
    }
  };

  const toggleSignatoryStatus = async (signatoryId: string, currentStatus: boolean) => {
    try {
      await userService.updateUser(signatoryId, {
        status: currentStatus ? 'INACTIVE' : 'ACTIVE'
      });
      fetchSignatories();
      alert(`Signataire ${currentStatus ? 'désactivé' : 'activé'} avec succès`);
    } catch (error) {
      alert('Erreur lors de la mise à jour du statut');
    }
  };

  const fetchPending = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Récupérer les diplômes depuis l'API
      const apiData = await diplomaService.getPendingSignature(activeTenant.id, user.id);
      
      // Récupérer les diplômes générés localement
      const localDiplomas = JSON.parse(localStorage.getItem(`generated_diplomas_${activeTenant.id}`) || '[]');
      
      // Filtrer les diplômes non encore signés par cet utilisateur
      const pendingLocal = localDiplomas.filter((diploma: any) => {
        const signatures = diploma.metadata?.signatures || [];
        return !signatures.some((sig: any) => sig.signerId === user.id);
      });
      
      // Combiner les données API et locales
      const combinedPending = [
        ...Array.isArray(apiData) ? apiData : [],
        ...pendingLocal.map((diploma: any) => ({
          id: diploma.id,
          studentName: diploma.studentName,
          studentMatricule: diploma.studentMatricule,
          program: diploma.program,
          session: diploma.session,
          status: diploma.status || 'VALIDATED',
          currentSignatures: diploma.metadata?.signatures?.length || 0,
          metadata: diploma.metadata
        }))
      ];
      
      setPending(combinedPending);
    } catch (e) {
      console.error("Failed to fetch pending signatures", e);
      // Fallback aux diplômes locaux uniquement
      const localDiplomas = JSON.parse(localStorage.getItem(`generated_diplomas_${activeTenant.id}`) || '[]');
      const pendingLocal = localDiplomas.filter((diploma: any) => {
        const signatures = diploma.metadata?.signatures || [];
        return !signatures.some((sig: any) => sig.signerId === user.id);
      }).map((diploma: any) => ({
        id: diploma.id,
        studentName: diploma.studentName,
        studentMatricule: diploma.studentMatricule,
        program: diploma.program,
        session: diploma.session,
        status: 'VALIDATED',
        currentSignatures: diploma.metadata?.signatures?.length || 0
      }));
      setPending(pendingLocal);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'sig' | 'stamp') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'sig') setSigImg(reader.result as string);
        else setStampImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSetup = async () => {
    if (!user) return;
    try {
      await userService.setupSignature({
        userId: user.id,
        signatureImg: sigImg,
        stampImg: stampImg,
        officialTitle: officialTitle
      });
      const updatedUser = { ...user, signatureImg: sigImg, stampImg: stampImg, officialTitle: officialTitle };
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      alert("Votre profil de signature est scellé.");
      setView('queue');
    } catch (e) {
      alert("Erreur de sauvegarde.");
    }
  };

  const executeBulkSign = async () => {
    if (!isAuthorized) {
      alert("Vous n'êtes pas autorisé à signer des diplômes.");
      return;
    }

    if (!sigImg || !stampImg) {
      alert("Configurez votre tampon et signature avant de procéder.");
      setView('setup');
      return;
    }

    setIsSigning(true);
    setProgress(0);
    const step = 100 / selectedIds.length;

    try {
      const signatureData = {
        signerId: user?.id,
        signerName: user?.fullName,
        signerTitle: officialTitle,
        signatureImg: sigImg,
        stampImg: stampImg,
        signedAt: new Date().toISOString()
      };

      // Récupérer les diplômes locaux
      const localDiplomas = JSON.parse(localStorage.getItem(`generated_diplomas_${activeTenant.id}`) || '[]');
      let updatedDiplomas = [...localDiplomas];
      let signedCount = 0;

      for (let i = 0; i < selectedIds.length; i++) {
        const diplomaId = selectedIds[i];
        
        try {
          // Essayer de signer via l'API
          await diplomaService.signDiploma(diplomaId, signatureData);
        } catch (apiError) {
          console.log('API signature failed, updating locally:', apiError);
        }
        
        // Mettre à jour localement dans tous les cas
        const diplomaIndex = updatedDiplomas.findIndex((d: any) => d.id === diplomaId);
        
        if (diplomaIndex !== -1) {
          if (!updatedDiplomas[diplomaIndex].metadata) {
            updatedDiplomas[diplomaIndex].metadata = {};
          }
          if (!updatedDiplomas[diplomaIndex].metadata.signatures) {
            updatedDiplomas[diplomaIndex].metadata.signatures = [];
          }
          
          // Vérifier si déjà signé par cet utilisateur
          const alreadySigned = updatedDiplomas[diplomaIndex].metadata.signatures.some(
            (sig: any) => sig.signerId === user?.id
          );
          
          if (!alreadySigned) {
            updatedDiplomas[diplomaIndex].metadata.signatures.push(signatureData);
            updatedDiplomas[diplomaIndex].status = 'PARTIALLY_SIGNED';
            signedCount++;
          }
        }
        
        setProgress(prev => prev + step);
      }
      
      // Sauvegarder les diplômes mis à jour
      localStorage.setItem(`generated_diplomas_${activeTenant.id}`, JSON.stringify(updatedDiplomas));
      
      alert(`Scellement de ${signedCount} diplômes terminé.`);
      setSelectedIds([]);
      
      // Rafraîchir sans recharger la page
      await fetchPending();
      
    } catch (e) {
      console.error('Erreur signature:', e);
      alert("Le processus de signature a échoué.");
    } finally {
      setIsSigning(false);
      setProgress(0);
    }
  };

  if (view === 'manage' && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'RECTOR')) {
    return (
      <div className="max-w-6xl mx-auto animate-fadeIn pb-32 space-y-8">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gestion des Signataires</h2>
              <p className="text-slate-500 mt-1">Autorisez et gérez les signataires pour {activeTenant.name}</p>
            </div>
            <button 
              onClick={() => setView('queue')}
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase"
            >
              Retour
            </button>
          </div>

          <div className="mb-6">
            <button 
              onClick={() => {
                const email = prompt('Email du nouveau signataire:');
                const fullName = prompt('Nom complet:');
                const role = prompt('Rôle (RECTOR/DEAN/DIRECTOR/SIGNER):', 'SIGNER');
                const officialTitle = prompt('Titre officiel:', role === 'RECTOR' ? 'Recteur' : role === 'DEAN' ? 'Doyen' : role === 'DIRECTOR' ? 'Directeur' : 'Signataire');
                if (email && fullName && ['RECTOR', 'DEAN', 'DIRECTOR', 'SIGNER'].includes(role)) {
                  userService.createUser({
                    email, fullName, officialTitle,
                    tenantId: activeTenant.id, role, password: 'temp123'
                  }).then(() => { fetchSignatories(); alert('Signataire ajouté'); });
                }
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase transition-all"
            >
              <i className="fas fa-plus mr-2"></i>
              Ajouter Signataire
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {signatories.map((signatory) => (
              <div key={signatory.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    signatory.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    <i className={`fas ${
                      signatory.isActive ? 'fa-user-check' : 'fa-user-times'
                    }`}></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{signatory.name}</h3>
                    <p className="text-xs text-slate-500 uppercase">{signatory.role}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Titre:</span>
                    <span className="font-medium">{signatory.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Signature:</span>
                    <span className={signatory.hasSignature ? 'text-green-600' : 'text-red-600'}>
                      {signatory.hasSignature ? '✓ Configurée' : '✗ Manquante'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sceau:</span>
                    <span className={signatory.hasStamp ? 'text-green-600' : 'text-red-600'}>
                      {signatory.hasStamp ? '✓ Configuré' : '✗ Manquant'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200">
                  <button 
                    onClick={() => toggleSignatoryStatus(signatory.userId, signatory.isActive)}
                    className={`w-full py-2 px-4 rounded-lg text-xs font-bold uppercase ${
                      signatory.isActive 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    } transition-colors`}
                  >
                    {signatory.isActive ? 'Désactiver' : 'Activer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'setup') {
    return (
      <div className="max-w-4xl mx-auto animate-fadeIn pb-32">
        <div className="bg-white p-12 rounded-[50px] shadow-2xl border border-slate-100 space-y-12">
          <div className="text-center">
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight">Autorité Souveraine</h1>
            <p className="text-slate-500 font-medium mt-2">Votre signature sera apposée en tant que signataire officiel.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Signature (PNG)</label>
              <div className="h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center relative overflow-hidden group">
                {sigImg ? <img src={sigImg} className="h-full object-contain p-4" /> : <i className="fas fa-pen-nib text-slate-200 text-4xl"></i>}
                <input type="file" onChange={(e) => handleFileChange(e, 'sig')} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Cachet Officiel (PNG)</label>
              <div className="h-48 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center relative overflow-hidden group">
                {stampImg ? <img src={stampImg} className="h-full object-contain p-4" /> : <i className="fas fa-stamp text-slate-200 text-4xl"></i>}
                <input type="file" onChange={(e) => handleFileChange(e, 'stamp')} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Votre Titre Officiel</label>
            <input 
              value={officialTitle}
              onChange={e => setOfficialTitle(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-sm font-bold outline-none focus:border-blue-600 transition-all"
              placeholder="Ex: Le Recteur de l'Université de Douala"
            />
          </div>

          <div className="flex gap-4 pt-6">
            <button onClick={() => setView('queue')} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase">Retour</button>
            <button onClick={handleSaveSetup} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-blue-600 transition-all">Enregistrer l'Autorité</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-32">
      <div className="flex justify-between items-center bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center shadow-xl">
             <i className="fas fa-shield-check text-blue-400 text-2xl"></i>
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Vault de Signature</h1>
            <p className="text-slate-500 font-medium italic">En attente de VOTRE signature pour validation du quorum.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'RECTOR') && (
            <button 
              onClick={() => setView('manage')}
              className="px-6 py-3 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Gérer Signataires
            </button>
          )}
          <button 
            onClick={() => setView('setup')}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            Modifier mes Sceaux
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
        {!isAuthorized ? (
          <div className="py-32 flex flex-col items-center justify-center text-slate-400 gap-4">
            <i className="fas fa-user-slash text-6xl"></i>
            <div className="text-center">
              <p className="font-black uppercase text-xs tracking-widest">Accès non autorisé</p>
              <p className="text-sm mt-2">Vous n'êtes pas autorisé à signer des diplômes.</p>
              <p className="text-xs mt-1">Contactez votre administrateur pour obtenir les permissions nécessaires.</p>
            </div>
          </div>
        ) : loading ? (
           <div className="py-32 text-center text-slate-300 animate-pulse font-black uppercase text-[10px]">Interrogation de la file sécurisée...</div>
        ) : pending.length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-slate-200 gap-4">
             <i className="fas fa-check-double text-6xl"></i>
             <p className="font-black uppercase text-xs tracking-widest text-slate-400">Aucun diplôme en attente de votre signature</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-100">
               <tr>
                 <th className="px-8 py-6 w-12"><input type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? pending.map(p => p.id) : [])} /></th>
                 <th className="px-8 py-6">Titulaire</th>
                 <th className="px-8 py-6">Filière</th>
                 <th className="px-8 py-6">Quorum actuel</th>
                 <th className="px-8 py-6">Statut Workflow</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
               {pending.map((d) => (
                 <tr key={d.id} className="hover:bg-slate-50 transition-all group">
                   <td className="px-8 py-5">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(d.id)}
                        onChange={() => setSelectedIds(prev => prev.includes(d.id) ? prev.filter(id => id !== d.id) : [...prev, d.id])}
                      />
                   </td>
                   <td className="px-8 py-5">
                      <p className="font-black text-slate-800 text-sm uppercase">{d.studentName}</p>
                      <p className="text-[9px] text-blue-600 font-black font-mono">{d.studentMatricule}</p>
                   </td>
                   <td className="px-8 py-5 text-xs font-bold text-slate-600">{d.program}</td>
                   <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                         <div className="flex -space-x-2">
                            {Array.from({ length: d.currentSigs }).map((_, i) => (
                               <div key={i} className="w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                                  <i className="fas fa-check text-[8px] text-white"></i>
                               </div>
                            ))}
                            <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center">
                               <i className="fas fa-pen text-[8px] text-blue-500"></i>
                            </div>
                         </div>
                         <span className="text-[10px] font-black text-slate-400 uppercase">{d.currentSigs} apposée(s)</span>
                      </div>
                   </td>
                   <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${d.status === 'PARTIALLY_SIGNED' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                        {d.status === 'PARTIALLY_SIGNED' ? 'Partiel' : 'En attente'}
                      </span>
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Export des diplômes signés */}
      {pending.length > 0 && (
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase">Export PDF</h3>
              <p className="text-sm text-slate-600">{pending.length} diplômes disponibles</p>
            </div>
            <button
              onClick={async () => {
                const localDiplomas = JSON.parse(localStorage.getItem(`generated_diplomas_${activeTenant.id}`) || '[]');
                if (localDiplomas.length === 0) {
                  alert('Aucun diplôme à exporter');
                  return;
                }
                
                // Import dynamique de jsPDF
                const { jsPDF } = await import('jspdf');
                
                for (let i = 0; i < localDiplomas.length; i++) {
                  const diploma = localDiplomas[i];
                  const doc = new jsPDF('landscape', 'mm', 'a4');
                  
                  // Génération PDF simple
                  doc.setFillColor(236, 253, 245);
                  doc.rect(0, 0, 297, 210, 'F');
                  
                  doc.setFontSize(16);
                  doc.text('RÉPUBLIQUE DU CAMEROUN', 148.5, 25, { align: 'center' });
                  doc.text(activeTenant.name.toUpperCase(), 148.5, 35, { align: 'center' });
                  
                  doc.setFontSize(32);
                  doc.text('DIPLÔME', 148.5, 55, { align: 'center' });
                  
                  doc.setFontSize(24);
                  doc.text(diploma.studentName.toUpperCase(), 148.5, 85, { align: 'center' });
                  
                  doc.setFontSize(16);
                  doc.text(`Programme: ${diploma.program}`, 148.5, 105, { align: 'center' });
                  doc.text(`Session: ${diploma.session}`, 148.5, 120, { align: 'center' });
                  doc.text(`Matricule: ${diploma.studentMatricule}`, 148.5, 135, { align: 'center' });
                  
                  // Signatures
                  const signatures = diploma.metadata?.signatures || [];
                  signatures.forEach((sig: any, index: number) => {
                    const x = 60 + (index * 90);
                    doc.setFontSize(10);
                    doc.text(sig.signerTitle, x, 170, { align: 'center' });
                    doc.text(`Signé le: ${new Date(sig.signedAt).toLocaleDateString('fr-FR')}`, x, 180, { align: 'center' });
                  });
                  
                  doc.setFontSize(6);
                  doc.text(`ID: ${diploma.id}`, 10, 200);
                  doc.text(`Exporté le: ${new Date().toLocaleDateString('fr-FR')}`, 10, 205);
                  
                  // Télécharger
                  doc.save(`Diplome_${diploma.studentMatricule}_${diploma.studentName.replace(/\s+/g, '_')}.pdf`);
                  
                  // Pause entre les téléchargements
                  await new Promise(resolve => setTimeout(resolve, 500));
                }
                
                alert(`${localDiplomas.length} diplômes exportés avec succès`);
              }}
              className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-green-600 text-white hover:bg-green-700 shadow-xl transition-all"
            >
              <i className="fas fa-file-pdf mr-2"></i>
              Exporter {JSON.parse(localStorage.getItem(`generated_diplomas_${activeTenant.id}`) || '[]').length} PDF
            </button>
          </div>
        </div>
      )}

      {selectedIds.length > 0 && !isSigning && isAuthorized && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-10 py-6 rounded-[32px] shadow-2xl flex items-center gap-8 border border-white/10 animate-slideUp">
           <div className="flex items-center gap-4 pr-8 border-r border-white/10">
              <i className="fas fa-stamp text-amber-400"></i>
              <span className="text-xs font-black uppercase tracking-widest">{selectedIds.length} Diplômes à sceller</span>
           </div>
           <button 
            onClick={executeBulkSign}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all"
           >
             Apposer ma Signature & Sceau
           </button>
        </div>
      )}
    </div>
  );
};

export default Signatures;
