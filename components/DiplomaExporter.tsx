import React, { useState } from 'react';
import { Tenant, DiplomaRecord } from '../types';
import { diplomaService } from '../services/api';
import { jsPDF } from 'jspdf';

interface DiplomaExporterProps {
  activeTenant: Tenant;
  diplomas: any[]; // Format flexible pour BatchGenerator et Signatures
  onExportComplete: () => void;
}

const DiplomaExporter: React.FC<DiplomaExporterProps> = ({ activeTenant, diplomas, onExportComplete }) => {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateDiplomaPDF = (diploma: any): jsPDF => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Récupérer la configuration du template depuis le tenant
    const templateConfig = activeTenant.settings?.graphicSecurity || activeTenant.security;
    const theme = templateConfig?.theme || 'official-prestige';
    const securityLevel = templateConfig?.securityLevel || 5;
    
    // Couleurs selon le thème
    const themeColors = {
      'renaissance': { primary: '#0f172a', secondary: '#f8fafc', accent: '#3b82f6' },
      'modern-art': { primary: '#1e1b4b', secondary: '#f8fafc', accent: '#8b5cf6' },
      'official-prestige': { primary: '#064e3b', secondary: '#ecfdf5', accent: '#10b981' },
      'monumental': { primary: '#1c1917', secondary: '#fafaf9', accent: '#57534e' }
    };
    const colors = themeColors[theme as keyof typeof themeColors] || themeColors['official-prestige'];
    
    // Background selon le thème
    if (theme === 'renaissance') {
      doc.setFillColor(248, 250, 252); // Blanc cassé
    } else if (theme === 'modern-art') {
      doc.setFillColor(248, 250, 252);
    } else if (theme === 'official-prestige') {
      doc.setFillColor(236, 253, 245); // Vert très clair
    } else {
      doc.setFillColor(250, 250, 249); // Blanc pierre
    }
    doc.rect(0, 0, 297, 210, 'F');
    
    // Motifs de sécurité selon le niveau
    if (securityLevel >= 3) {
      // Ajouter des lignes de sécurité
      doc.setDrawColor(colors.accent);
      doc.setLineWidth(0.1);
      for (let i = 0; i < 297; i += 10) {
        doc.line(i, 0, i, 210);
      }
      for (let i = 0; i < 210; i += 10) {
        doc.line(0, i, 297, i);
      }
    }
    
    // Header avec logo institutionnel
    doc.setFontSize(16);
    doc.setFont("times", "bold");
    doc.setTextColor(colors.primary);
    doc.text("RÉPUBLIQUE DU CAMEROUN", 148.5, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont("times", "normal");
    doc.text(activeTenant.name.toUpperCase(), 148.5, 35, { align: 'center' });
    
    // Titre principal
    doc.setFontSize(32);
    doc.setFont("times", "bold");
    doc.setTextColor(colors.accent);
    doc.text("DIPLÔME", 148.5, 55, { align: 'center' });
    
    // Sous-titre
    doc.setFontSize(18);
    doc.setTextColor(colors.primary);
    doc.text("DE LICENCE", 148.5, 70, { align: 'center' });
    
    // Nom de l'étudiant
    doc.setFontSize(24);
    doc.setFont("times", "bold");
    doc.setTextColor(colors.primary);
    doc.text(diploma.studentName.toUpperCase(), 148.5, 95, { align: 'center' });
    
    // Matricule
    doc.setFontSize(10);
    doc.setFont("times", "normal");
    doc.text(`Matricule: ${diploma.studentMatricule}`, 148.5, 105, { align: 'center' });
    
    // Programme
    doc.setFontSize(16);
    doc.setFont("times", "bold");
    doc.text(`Programme: ${diploma.program}`, 148.5, 120, { align: 'center' });
    
    // Faculté si disponible
    if (diploma.metadata?.faculte) {
      doc.setFontSize(14);
      doc.text(`Faculté: ${diploma.metadata.faculte}`, 148.5, 130, { align: 'center' });
    }
    
    // Session et niveau
    doc.setFontSize(12);
    doc.text(`Session: ${diploma.session} - Niveau: ${diploma.academicLevel || 'LICENCE'}`, 148.5, 145, { align: 'center' });
    
    // Signatures avec design amélioré
    const signatures = diploma.metadata?.signatures || [];
    if (signatures.length > 0) {
      signatures.forEach((sig: any, index: number) => {
        const x = 60 + (index * 90);
        const y = 165;
        
        // Cadre pour signature
        doc.setDrawColor(colors.primary);
        doc.setLineWidth(0.5);
        doc.rect(x - 35, y - 5, 70, 25);
        
        if (sig.stampImg) {
          doc.addImage(sig.stampImg, 'PNG', x - 15, y, 15, 15);
        }
        if (sig.signatureImg) {
          doc.addImage(sig.signatureImg, 'PNG', x + 5, y + 2, 25, 10);
        }
        
        doc.setFontSize(8);
        doc.setTextColor(colors.primary);
        doc.text(sig.signerTitle || "Autorité", x, y + 22, { align: 'center' });
      });
    }
    
    // Footer avec informations de sécurité
    doc.setFontSize(6);
    doc.setTextColor(colors.primary);
    doc.text(`ID: ${diploma.id}`, 10, 200);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 10, 205);
    
    if (templateConfig?.noiseSeed) {
      doc.text(`Sécurité: ${templateConfig.noiseSeed.substring(0, 20)}...`, 200, 200);
    }
    doc.text(`Niveau: ${securityLevel}/10`, 200, 205);
    
    return doc;
  };

  const handleExportAll = async () => {
    const readyDiplomas = diplomas.filter(d => 
      d.metadata && d.metadata.signatures && d.metadata.signatures.length >= (activeTenant.settings?.signatureRequired || 0)
    );
    
    if (readyDiplomas.length === 0) {
      // Si aucun diplôme n'est signé, exporter tous les diplômes
      if (diplomas.length === 0) {
        alert('Aucun diplôme à exporter');
        return;
      }
      
      if (!confirm(`Exporter ${diplomas.length} diplômes (non signés) ?`)) {
        return;
      }
      
      await exportDiplomas(diplomas);
    } else {
      await exportDiplomas(readyDiplomas);
    }
  };

  const exportDiplomas = async (diplomasToExport: any[]) => {
    setExporting(true);
    setProgress(0);

    try {
      for (let i = 0; i < diplomasToExport.length; i++) {
        const diploma = diplomasToExport[i];
        const doc = generateDiplomaPDF(diploma);
        
        // Save individual PDF
        const fileName = `Diplome_${diploma.studentMatricule}_${diploma.studentName.replace(/\s+/g, '_')}.pdf`;
        doc.save(fileName);
        
        setProgress(((i + 1) / diplomasToExport.length) * 100);
        
        // Small delay to prevent browser freeze
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      alert(`${diplomasToExport.length} diplômes exportés avec succès`);
      onExportComplete();
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export des diplômes');
    } finally {
      setExporting(false);
      setProgress(0);
    }
  };

  const readyCount = diplomas.filter(d => 
    d.metadata && d.metadata.signatures && d.metadata.signatures.length >= (activeTenant.settings?.signatureRequired || 0)
  ).length;
  
  const totalCount = diplomas.length;

  return (
    <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 uppercase">Export PDF</h3>
          <p className="text-sm text-slate-600">{readyCount} diplômes signés / {totalCount} total</p>
        </div>
        <button
          onClick={handleExportAll}
          disabled={exporting || totalCount === 0}
          className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
            totalCount > 0 && !exporting
              ? 'bg-green-600 text-white hover:bg-green-700 shadow-xl'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {exporting ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Export en cours...
            </>
          ) : (
            <>
              <i className="fas fa-file-pdf mr-2"></i>
              Exporter {totalCount} PDF
            </>
          )}
        </button>
      </div>

      {exporting && (
        <div className="space-y-4">
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center text-sm text-slate-600">
            Génération des PDF... {Math.round(progress)}%
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-2xl">
        <p className="text-xs text-blue-800 font-medium">
          <i className="fas fa-info-circle mr-2"></i>
          {readyCount > 0 
            ? `${readyCount} diplômes signés seront exportés en priorité.`
            : `${totalCount} diplômes seront exportés (non signés).`
          }
        </p>
      </div>
    </div>
  );
};

export default DiplomaExporter;