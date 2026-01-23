
import React, { useState, useEffect } from 'react';
import { DiplomaRecord, Tenant, DiplomaStatus, UserRole, User } from '../types';
import apiClient, { diplomaService } from '../services/api';
import { jsPDF } from 'jspdf';

interface DiplomaRegistryProps {
  activeTenant: Tenant;
}

const DiplomaRegistry: React.FC<DiplomaRegistryProps> = ({ activeTenant }) => {
  const [results, setResults] = useState<DiplomaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [selectedForCorrection, setSelectedForCorrection] = useState<DiplomaRecord | null>(null);
  const [correctionForm, setCorrectionForm] = useState({
    studentName: '',
    studentMatricule: '',
    errorType: 'ORTHOGRAPHE',
    reason: '',
    refDocument: ''
  });

  const errorTypes = [
    { id: 'ORTHOGRAPHE', label: "Erreur d'orthographe (Nom/Prénom)" },
    { id: 'INVERSION', label: "Inversion Nom/Prénom" },
    { id: 'BIRTH_DATE', label: "Date de naissance incorrecte" },
    { id: 'BIRTH_PLACE', label: "Lieu de naissance incorrect" },
    { id: 'FILIERE', label: "Libellé de filière erroné" },
    { id: 'MENTION', label: "Omission ou erreur de mention" },
  ];

  useEffect(() => {
    const saved = localStorage.getItem('auth_user');
    if (saved) setCurrentUser(JSON.parse(saved));
    fetchResults();
  }, [activeTenant.id]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const data = await diplomaService.searchDiplomas(activeTenant.id, {});
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  const drawDiplomaOnDoc = async (doc: jsPDF, record: DiplomaRecord, addPage: boolean = false) => {
    if (addPage) doc.addPage();
    const pageWidth = 210;
    const pageHeight = 297;
    
    doc.setFillColor(252, 251, 247);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(1);
    doc.rect(5, 5, pageWidth - 10, pageHeight - 10);

    if (record.metadata.replacement_info?.replaces_id) {
      doc.setFontSize(8);
      doc.setTextColor(59, 130, 246);
      doc.text("RÉÉDITION OFFICIELLE - REMPLACE DIPLÔME N°" + record.metadata.replacement_info.replaces_id.substring(0,8).toUpperCase(), pageWidth - 10, 15, { align: 'right' });
    }

    doc.setTextColor(30, 41, 59);
    doc.setFont("times", "bold");
    doc.setFontSize(28);
    doc.text(record.academicLevel.toUpperCase(), pageWidth / 2, 60, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text("Certifie que l'étudiant(e) :", pageWidth / 2, 85, { align: 'center' });
    doc.setFontSize(24);
    doc.setFont("times", "bold");
    doc.text(record.studentName.toUpperCase(), pageWidth / 2, 105, { align: 'center' });

    const signatures = record.metadata.signatures || [];
    const count = signatures.length;
    const startY = pageHeight - 90;
    const colWidth = (pageWidth - 20) / (count > 2 ? 2 : count || 1);

    signatures.forEach((sig, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const x = 10 + (col * colWidth);
      const y = startY + (row * 40);

      if (sig.stampImg) doc.addImage(sig.stampImg, 'PNG', x + 5, y, 25, 25);
      if (sig.signatureImg) doc.addImage(sig.signatureImg, 'PNG', x + colWidth - 35, y + 5, 30, 15);

      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(sig.signerTitle || "Autorité", x + (colWidth / 2), y + 30, { align: 'center' });
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.text(sig.signerName || "", x + (colWidth / 2), y + 35, { align: 'center' });
    });

    // QR Code local via canvas ou API souveraine
    // Note: Pour la prod, on génère le QR code en local via une lib comme qrcode.js
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.origin + '/verify/' + record.id)}`;
    doc.addImage(qrUrl, 'PNG', 10, pageHeight - 35, 25, 25);
    
    doc.setFontSize(6);
    doc.text(`ID UNIQUE : ${record.id}`, 10, pageHeight - 8);
    if (record.status === DiplomaStatus.CANCELLED) {
      doc.setTextColor(239, 68, 68);
      doc.setFontSize(40);
      doc.text("ANNULÉ", pageWidth / 2, pageHeight / 2, { align: 'center', angle: 45 });
    }
  };

  const handlePrint = async (record: DiplomaRecord) => {
    const doc = new jsPDF('p', 'mm', 'a4');
    await drawDiplomaOnDoc(doc, record);
    doc.save(`Diplome_${record.studentMatricule}.pdf`);
  };

  const handleOpenCorrection = (record: DiplomaRecord) => {
    setSelectedForCorrection(record);
    setCorrectionForm({
      studentName: record.studentName,
      studentMatricule: record.studentMatricule,
      errorType: 'ORTHOGRAPHE',
      reason: '',
      refDocument: ''
    });
    setShowCorrectionModal(true);
  };

  const executeCorrection = async () => {
    if (!selectedForCorrection || !currentUser) return;
    try {
      await diplomaService.replaceDiploma(selectedForCorrection.id, {
        ...correctionForm,
        authority_id: currentUser.id
      });
      alert("Correction validée.");
      setShowCorrectionModal(false);
      fetchResults();
    } catch (e) {
      alert("Erreur de correction.");
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-32">
       <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5">
             <i className="fas fa-file-signature text-8xl text-slate-900"></i>
          </div>
          <div className="relative z-10">
             <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Registre National Souverain</h1>
             <p className="text-slate-500 font-medium italic">Traçabilité des diplômes émis et corrigés.</p>
          </div>
       </div>

       <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black tracking-widest border-b border-slate-100">
                <tr>
                   <th className="px-8 py-6">Titulaire / Matricule</th>
                   <th className="px-8 py-6">Quorum de Scellement</th>
                   <th className="px-8 py-6">Statut Légal</th>
                   <th className="px-8 py-6 text-right">Contrôle</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-50">
                {results.map(r => (
                   <tr key={r.id} className={`hover:bg-slate-50/50 transition-all ${r.status === DiplomaStatus.CANCELLED ? 'opacity-50' : ''}`}>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-4">
                            <div>
                               <p className="font-black text-slate-800 text-sm uppercase">{r.studentName}</p>
                               <p className="text-[9px] text-blue-600 font-black font-mono">{r.studentMatricule}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">
                               {r.metadata.signatures.length} / {activeTenant.settings.signatureRequired}
                            </span>
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border tracking-widest ${
                           r.status === DiplomaStatus.SIGNED ? 'bg-green-50 text-green-600 border-green-200' : 
                           r.status === DiplomaStatus.CANCELLED ? 'bg-red-50 text-red-600 border-red-200' : 'bg-blue-50 text-blue-600 border-blue-200'
                         }`}>
                            {r.status}
                         </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                         <div className="flex justify-end gap-3">
                            {currentUser?.role === UserRole.SYSTEM_OWNER && r.status === DiplomaStatus.SIGNED && (
                               <button onClick={() => handleOpenCorrection(r)} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg">Corriger</button>
                            )}
                            <button onClick={() => handlePrint(r)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase shadow-lg">Imprimer</button>
                         </div>
                      </td>
                   </tr>
                ))}
             </tbody>
          </table>
       </div>

       {showCorrectionModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-2xl rounded-[50px] p-12 shadow-2xl space-y-10 relative overflow-hidden">
               <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Réédition Officielle</h2>
               <div className="space-y-6">
                  <input value={correctionForm.studentName} onChange={e => setCorrectionForm({...correctionForm, studentName: e.target.value})} placeholder="Nouveau Nom" className="w-full bg-slate-50 border-2 rounded-2xl p-4 text-xs font-bold" />
                  <textarea value={correctionForm.reason} onChange={e => setCorrectionForm({...correctionForm, reason: e.target.value})} placeholder="Motif de la correction" className="w-full bg-slate-50 border-2 rounded-2xl p-4 text-xs font-bold h-32" />
               </div>
               <div className="flex gap-4">
                  <button onClick={() => setShowCorrectionModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[11px] uppercase">Annuler</button>
                  <button onClick={executeCorrection} className="flex-1 py-5 bg-amber-500 text-white rounded-2xl font-black text-[11px] uppercase shadow-xl hover:bg-amber-600">Valider</button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default DiplomaRegistry;
