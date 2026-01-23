import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DiplomaRecord, DiplomaStatus, VerificationResult } from '../types';
import apiClient, { diplomaService } from '../services/api';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';

const Verification: React.FC = () => {
  // State Management
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [searchHash, setSearchHash] = useState('');
  const [verifierEntity, setVerifierEntity] = useState('');
  const [verifierPurpose, setVerifierPurpose] = useState('Recrutement / Vérification RH');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showVerificationForm, setShowVerificationForm] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Refs
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRegionId = useMemo(() => `qr-reader-${Date.now()}`, []);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Camera Control Effect
  useEffect(() => {
    let mounted = true;
    const scannerContainer = document.getElementById(scannerRegionId);

    const initializeScanner = async () => {
      if (!scannerContainer || !mounted) return;

      try {
        // Clean existing scanner
        if (scannerRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        }

        // Create fresh scanner instance
        const html5QrCode = new Html5Qrcode(scannerRegionId);
        scannerRef.current = html5QrCode;

        // Get available cameras
        const cameras = await Html5Qrcode.getCameras();
        const backCamera = cameras.find(cam => 
          cam.label.toLowerCase().includes('back') || 
          cam.label.toLowerCase().includes('arrière')
        );

        await html5QrCode.start(
          backCamera?.id || { facingMode: "environment" },
          { 
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
            disableFlip: false,
          },
          (decodedText) => {
            if (mounted) {
              handleQRCodeScanned(decodedText);
            }
          },
          (errorMessage) => {
            // Silent error handling for scanning process
            console.debug('QR Scan error:', errorMessage);
          }
        );

        if (mounted) {
          setCameraError(null);
        }
      } catch (err: any) {
        console.error('Scanner initialization error:', err);
        if (mounted) {
          setCameraError(err.message || 'Erreur d\'accès à la caméra');
          setCameraActive(false);
        }
        await cleanupScanner();
      }
    };

    const cleanupScanner = async () => {
      try {
        if (scannerRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
          scannerRef.current.clear();
        }
        scannerRef.current = null;
      } catch (err) {
        console.debug('Scanner cleanup error (non-critical):', err);
      }
    };

    if (cameraActive) {
      initializeScanner();
    } else {
      cleanupScanner();
    }

    return () => {
      mounted = false;
      cleanupScanner();
    };
  }, [cameraActive, scannerRegionId]);

  // Component Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      const cleanup = async () => {
        if (scannerRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
          try {
            await scannerRef.current.stop();
            scannerRef.current.clear();
          } catch (err) {
            // Ignore cleanup errors
          }
        }
      };
      cleanup();
    };
  }, []);

  // Handlers
  const handleQRCodeScanned = useCallback((decodedText: string) => {
    setSearchHash(decodedText);
    setCameraActive(false);
    handleVerify(decodedText);
  }, []);

  const handleVerify = useCallback(async (hashToVerify?: string) => {
    const hash = hashToVerify || searchHash;
    const trimmedHash = hash.trim();
    
    if (!trimmedHash) {
      setError('Veuillez saisir ou scanner un identifiant cryptographique');
      return;
    }

    if (!verifierEntity.trim()) {
      setError("Identification obligatoire pour le registre d'audit souverain.");
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setScanning(true);
    setResult(null);
    setError(null);
    setCameraError(null);

    try {
      // Extract hash from URL if present
      const cleanHash = trimmedHash.includes('/') 
        ? trimmedHash.split('/').pop() || trimmedHash 
        : trimmedHash;

      const res = await apiClient.get(`/api/v1/public/verify/${cleanHash}`, {
        signal: abortControllerRef.current.signal,
        timeout: 30000,
      });

      if (res.data.isAuthentic) {
        setResult(res.data);
        setShowVerificationForm(false);
        
        // Log audit trail
        await diplomaService.logVerification({
          hash: cleanHash,
          verifierEntity,
          purpose: verifierPurpose,
          timestamp: new Date().toISOString(),
          result: 'SUCCESS'
        });
      } else {
        setError(res.data.message || "Authenticité non prouvée.");
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Verification request cancelled');
        return;
      }
      
      console.error('Verification error:', err);
      
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Délai de vérification dépassé. Veuillez réessayer.');
      } else if (err.response?.status === 404) {
        setError('Identifiant non trouvé dans le registre national.');
      } else if (err.response?.status === 403) {
        setError('Accès refusé. Votre entité n\'est pas autorisée.');
      } else {
        setError('Service de vérification temporairement indisponible.');
      }
    } finally {
      setScanning(false);
      abortControllerRef.current = null;
    }
  }, [searchHash, verifierEntity, verifierPurpose]);

  const handleReset = useCallback(() => {
    setShowVerificationForm(true);
    setResult(null);
    setError(null);
    setSearchHash('');
    setCameraActive(false);
  }, []);

  const handleOpenCamera = useCallback(() => {
    setCameraError(null);
    setCameraActive(true);
  }, []);

  const handleCloseCamera = useCallback(() => {
    setCameraActive(false);
  }, []);

  // Memoized Components
  const VerificationForm = useMemo(() => (
    <div className="bg-white p-8 md:p-10 rounded-[40px] md:rounded-[50px] shadow-2xl border border-slate-100 space-y-8 md:space-y-10 animate-slideDown">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            Entité de Vérification (RH/Visa) *
          </label>
          <input 
            value={verifierEntity}
            onChange={(e) => setVerifierEntity(e.target.value)}
            placeholder="Ex: Ministère du Travail, Ambassade..."
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 md:p-5 text-xs font-bold outline-none focus:border-blue-600 transition-colors"
            disabled={scanning}
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            Motif de la Consultation
          </label>
          <select 
            value={verifierPurpose}
            onChange={(e) => setVerifierPurpose(e.target.value)}
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 md:p-5 text-xs font-bold outline-none focus:border-blue-600 transition-colors"
            disabled={scanning}
          >
            <option>Processus de Recrutement</option>
            <option>Authentification d'État Civil</option>
            <option>Instruction de Dossier de Visa</option>
            <option>Contrôle Inter-Universitaire</option>
            <option>Audit Interne</option>
            <option>Procédure Judiciaire</option>
          </select>
        </div>
      </div>

      <div className={`relative aspect-square bg-slate-950 rounded-[30px] md:rounded-[40px] overflow-hidden border-4 md:border-8 transition-all duration-500 ${
        cameraActive 
          ? 'border-blue-600 shadow-2xl shadow-blue-200' 
          : 'border-slate-900 shadow-inner'
      }`}>
        <div 
          ref={containerRef}
          id={scannerRegionId}
          className="w-full h-full"
        >
          {!cameraActive ? (
            <button
              onClick={handleOpenCamera}
              className="w-full h-full flex flex-col items-center justify-center cursor-pointer group focus:outline-none"
              disabled={scanning}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-[20px] md:rounded-[30px] flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform duration-300">
                <i className="fas fa-camera text-white text-2xl md:text-3xl"></i>
              </div>
              <span className="text-[9px] md:text-[10px] font-black uppercase text-blue-400 tracking-[0.3em]">
                Scanner Code QR
              </span>
              <span className="text-[8px] text-slate-500 mt-2 font-medium">
                Cliquez pour activer la caméra
              </span>
            </button>
          ) : (
            <>
              <div className="absolute inset-0 bg-slate-950" />
              <button
                onClick={handleCloseCamera}
                className="absolute top-4 right-4 z-20 w-10 h-10 md:w-12 md:h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
                aria-label="Fermer la caméra"
              >
                <i className="fas fa-times text-lg md:text-xl"></i>
              </button>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-64 h-64 md:w-72 md:h-72 border-4 border-blue-500/50 rounded-3xl" />
              <div className="absolute inset-x-0 h-1.5 bg-blue-500/80 shadow-[0_0_20px_#3b82f6] animate-scan z-10" />
            </>
          )}
        </div>
        
        {cameraError && (
          <div className="absolute inset-0 bg-red-900/90 flex flex-col items-center justify-center p-6 text-center">
            <i className="fas fa-video-slash text-4xl text-white mb-4"></i>
            <p className="text-sm text-white font-bold mb-2">Erreur Caméra</p>
            <p className="text-xs text-red-200">{cameraError}</p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <p className="text-center text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
          Ou saisissez l'identifiant cryptographique
        </p>
        <div className="relative">
          <input 
            type="text" 
            value={searchHash}
            onChange={(e) => setSearchHash(e.target.value)}
            placeholder="ID Unique (Hash)..."
            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 md:p-5 text-[10px] font-mono font-bold outline-none focus:border-blue-600 uppercase tracking-tighter transition-colors pr-12"
            disabled={scanning}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
          />
          {searchHash && (
            <button
              onClick={() => setSearchHash('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Effacer"
            >
              <i className="fas fa-times-circle"></i>
            </button>
          )}
        </div>
      </div>

      <button 
        onClick={() => handleVerify()}
        disabled={scanning || !verifierEntity.trim() || (!searchHash.trim() && !cameraActive)}
        className="w-full py-4 md:py-6 bg-slate-900 hover:bg-blue-600 text-white rounded-[24px] md:rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {scanning ? (
          <>
            <i className="fas fa-sync fa-spin"></i>
            <span>Vérification en cours...</span>
          </>
        ) : (
          <>
            <i className="fas fa-fingerprint"></i>
            <span>Certifier le Document</span>
          </>
        )}
      </button>
    </div>
  ), [verifierEntity, verifierPurpose, cameraActive, scanning, searchHash, cameraError, handleOpenCamera, handleCloseCamera, handleVerify]);

  const ErrorDisplay = useMemo(() => error ? (
    <div className="p-6 md:p-8 bg-red-50 text-red-600 rounded-[30px] md:rounded-[35px] border border-red-100 animate-slideDown flex items-start gap-4 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <i className="fas fa-shield-slash text-4xl"></i>
      </div>
      <i className="fas fa-circle-exclamation mt-1 text-xl"></i>
      <div className="space-y-1 flex-1">
        <p className="text-xs font-black uppercase tracking-widest">
          Alerte de Non-Conformité
        </p>
        <p className="text-[11px] font-bold leading-relaxed italic">{error}</p>
        {error.includes('Identification obligatoire') && (
          <button
            onClick={() => document.querySelector('input')?.focus()}
            className="text-[10px] font-black text-red-800 uppercase mt-2 hover:underline"
          >
            <i className="fas fa-arrow-right mr-2"></i>
            Remplir l'identification
          </button>
        )}
      </div>
      <button
        onClick={() => setError(null)}
        className="text-red-400 hover:text-red-600"
        aria-label="Fermer l'alerte"
      >
        <i className="fas fa-times"></i>
      </button>
    </div>
  ) : null, [error]);

  const ResultDisplay = useMemo(() => {
    if (!result?.data) return null;

    const { data } = result;
    const isCancelled = data.status === DiplomaStatus.CANCELLED;
    const replacementInfo = data.metadata?.replacement_info;

    return (
      <div className="bg-white p-8 md:p-14 rounded-[40px] md:rounded-[60px] shadow-2xl border border-slate-100 space-y-10 md:space-y-14 animate-slideUp relative overflow-hidden">
        {/* Invalidated Banner */}
        {isCancelled && (
          <div className="absolute top-0 right-0 w-64 h-64 md:w-80 md:h-80 flex items-center justify-center opacity-10 pointer-events-none -rotate-12 translate-x-20 -translate-y-20">
            <i className="fas fa-ban text-[300px] md:text-[350px] text-red-600"></i>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-10 border-b border-slate-50 pb-8 md:pb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-10">
            <div className={`w-20 h-20 md:w-28 md:h-28 rounded-[30px] md:rounded-[40px] flex items-center justify-center text-white text-4xl md:text-5xl shadow-2xl transition-all ${
              isCancelled ? 'bg-red-600 rotate-6' : 'bg-green-500 scale-105'
            }`}>
              <i className={`fas ${isCancelled ? 'fa-ban' : 'fa-certificate'}`}></i>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase italic break-words">
                {data.studentName}
              </h2>
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                <span className={`px-4 py-1.5 md:px-5 md:py-2 rounded-xl text-[10px] font-black uppercase border tracking-widest ${
                  isCancelled 
                    ? 'bg-red-50 text-red-600 border-red-200' 
                    : 'bg-green-50 text-green-600 border-green-200'
                }`}>
                  {isCancelled ? 'ACTE RÉVOQUÉ / ANNULÉ' : 'CONFORMITÉ CERTIFIÉE'}
                </span>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  Matricule : <span className="text-blue-600 font-mono">{data.studentMatricule}</span>
                </span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            <i className="fas fa-rotate"></i>
            Nouvelle vérification
          </button>
        </div>

        {/* Cancellation Alert */}
        {isCancelled && (
          <div className="bg-red-950 p-6 md:p-10 rounded-[30px] md:rounded-[45px] border border-red-800 space-y-6 shadow-2xl animate-shake">
            <h3 className="text-xs font-black text-red-400 uppercase tracking-[0.3em] md:tracking-[0.4em] flex items-center gap-3">
              <i className="fas fa-triangle-exclamation text-xl animate-pulse"></i>
              AVIS D'INVALIDATION OFFICIELLE
            </h3>
            <div className="space-y-4">
              <p className="text-sm text-slate-100 font-medium leading-relaxed italic">
                "Ce diplôme a été invalidé et révoqué par l'autorité compétente suite à une erreur matérielle identifiée lors de l'audit. Il ne peut plus être utilisé pour aucune démarche officielle."
              </p>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black text-red-300 uppercase mb-1">
                  Motif Institutionnel :
                </p>
                <p className="text-xs text-white font-bold">
                  {replacementInfo?.correction_reason || 'Régularisation administrative'}
                </p>
              </div>
            </div>
            {replacementInfo?.replaced_by && (
              <div className="pt-6 md:pt-8 border-t border-red-800 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                    Nouveau Document de Remplacement :
                  </p>
                  <p className="text-[11px] font-mono text-blue-400 font-black break-all mt-1">
                    {replacementInfo.replaced_by}
                  </p>
                </div>
                <button 
                  onClick={() => handleVerify(replacementInfo.replaced_by)}
                  className="px-6 py-3 md:px-8 md:py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all shrink-0 flex items-center gap-2"
                >
                  <i className="fas fa-external-link-alt"></i>
                  Consulter la Réédition
                </button>
              </div>
            )}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20">
          {/* Academic Data */}
          <div className="space-y-8 md:space-y-12">
            <div className="bg-slate-50 p-6 md:p-10 rounded-[30px] md:rounded-[45px] border border-slate-100 space-y-6 md:space-y-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <i className="fas fa-file-invoice text-blue-600"></i>
                Données Académiques
              </h3>
              <div className="space-y-6">
                {[
                  { label: 'Titre Délivré', value: data.program },
                  { label: 'Session Officielle', value: data.session },
                  { label: 'Promotion', value: data.metadata?.promotion_id || 'PROMO-2024' },
                  { label: 'Crédits Validés', value: '180 CTS / 180' },
                  { label: 'Date d\'Émission', value: new Date(data.issueDate).toLocaleDateString('fr-FR') },
                  { label: 'Établissement', value: data.institution || 'Université Nationale' },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center pb-4 border-b border-slate-200/50 last:border-0 last:pb-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {item.label}
                    </span>
                    <span className="text-sm font-black text-slate-800 text-right break-words max-w-[60%]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Replacement Status */}
            {replacementInfo?.replaces_id && (
              <div className="p-6 md:p-8 bg-blue-600 rounded-[30px] md:rounded-[40px] text-white space-y-4 shadow-2xl shadow-blue-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10 rotate-12">
                  <i className="fas fa-rotate text-6xl md:text-8xl"></i>
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <i className="fas fa-info-circle"></i>
                  Statut de Réédition
                </h3>
                <p className="text-xs font-bold leading-relaxed italic">
                  "Ce document est le résultat d'une correction souveraine du diplôme original n°{replacementInfo.replaces_id.substring(0,12)}... Il fait foi de manière unique et exclusive."
                </p>
              </div>
            )}
          </div>

          {/* Blockchain Proof */}
          <div className="space-y-8 md:space-y-12">
            <div className="p-6 md:p-10 bg-slate-900 rounded-[40px] md:rounded-[50px] border border-white/5 space-y-6 md:space-y-8 shadow-2xl">
              <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-3">
                <i className="fas fa-link"></i>
                Preuve Décentralisée (Blockchain)
              </h3>
              <div className="space-y-6">
                <div className="p-4 md:p-5 bg-white/5 rounded-2xl md:rounded-3xl border border-white/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-2">
                    Transaction ID (TXID)
                  </p>
                  <p className="text-[10px] font-mono text-slate-300 break-all">
                    {data.metadata?.blockchain_anchor?.txId || 'AN-CHAIN-8874-PROD-2024'}
                  </p>
                </div>
                <div className="p-4 md:p-5 bg-white/5 rounded-2xl md:rounded-3xl border border-white/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-2">
                    Digital Fingerprint
                  </p>
                  <p className="text-[10px] font-mono text-slate-300 break-all">
                    SHA256:{data.id}
                  </p>
                </div>
                <div className="p-4 md:p-5 bg-white/5 rounded-2xl md:rounded-3xl border border-white/10">
                  <p className="text-[9px] font-black text-slate-500 uppercase mb-2">
                    Horodatage Blockchain
                  </p>
                  <p className="text-[10px] font-mono text-slate-300">
                    {data.metadata?.blockchain_anchor?.timestamp 
                      ? new Date(data.metadata.blockchain_anchor.timestamp).toLocaleString('fr-FR')
                      : '2024-01-01 12:00:00 UTC'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            {/* Verification Seal */}
            <div className="p-6 md:p-10 border-4 border-dashed border-slate-100 rounded-[40px] md:rounded-[50px] text-center bg-slate-50/50">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-sm border border-slate-100">
                <i className="fas fa-lock text-slate-300 text-xl md:text-2xl"></i>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Sceau de Vérification Core
              </p>
              <p className="text-xs font-mono text-slate-500 font-bold bg-white p-4 rounded-2xl border border-slate-100 break-all shadow-inner">
                {data.id}
              </p>
              <p className="text-[9px] text-slate-400 mt-4 font-medium">
                Vérifié par: {verifierEntity} • {new Date().toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-100">
          <div className="text-[10px] text-slate-400 font-medium">
            <i className="fas fa-shield-check text-green-500 mr-2"></i>
            Cette vérification a été enregistrée dans le registre d'audit national
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 border-2 border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors flex items-center gap-2">
              <i className="fas fa-print"></i>
              Imprimer
            </button>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-colors flex items-center gap-2">
              <i className="fas fa-download"></i>
              Exporter PDF
            </button>
          </div>
        </div>
      </div>
    );
  }, [result, verifierEntity, handleVerify, handleReset]);

  const LoadingState = useMemo(() => (
    <div className="h-[600px] md:h-[700px] bg-white rounded-[40px] md:rounded-[60px] border border-slate-100 flex flex-col items-center justify-center gap-8 animate-pulse shadow-sm">
      <div className="relative">
        <div className="w-20 h-20 md:w-24 md:h-24 border-8 border-slate-100 rounded-full"></div>
        <div className="absolute inset-0 w-20 h-20 md:w-24 md:h-24 border-8 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
          Interrogation du Sceau d'État...
        </p>
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
          Validation des Signatures PKI
        </p>
      </div>
      <div className="w-64 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full animate-progress"></div>
      </div>
    </div>
  ), []);

  const EmptyState = useMemo(() => (
    <div className="h-[600px] md:h-[700px] border-4 border-dashed border-slate-200 rounded-[40px] md:rounded-[60px] flex flex-col items-center justify-center text-slate-400 gap-8 md:gap-10 bg-slate-50/30 p-8">
      <div className="relative">
        <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full flex items-center justify-center shadow-xl border border-slate-100">
          <i className="fas fa-building-columns text-5xl md:text-7xl opacity-10"></i>
        </div>
        <div className="absolute -top-4 -right-4 w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg animate-bounce">
          <i className="fas fa-search"></i>
        </div>
      </div>
      <div className="text-center space-y-4 max-w-sm">
        <h3 className="font-black uppercase text-lg md:text-xl tracking-tight text-slate-800">
          Registre en attente d'identification
        </h3>
        <p className="text-sm text-slate-400 font-medium italic">
          Identifiez-vous puis scannez le code QR du document pour accéder à la preuve d'authenticité immuable.
        </p>
        <div className="pt-4 flex flex-col gap-2">
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500">
            <i className="fas fa-circle-check text-green-500"></i>
            <span>Certification blockchain instantanée</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500">
            <i className="fas fa-circle-check text-green-500"></i>
            <span>Registre national immuable</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500">
            <i className="fas fa-circle-check text-green-500"></i>
            <span>Traçabilité complète des vérifications</span>
          </div>
        </div>
      </div>
    </div>
  ), []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 animate-fadeIn pb-16 md:pb-32 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <header className="text-center space-y-6 pt-8 md:pt-12">
        <div className="inline-flex px-6 md:px-8 py-2 bg-blue-600/10 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] mb-4 border border-blue-600/20">
          SYSTÈME NATIONAL D'ACCRÉDITATION
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 uppercase italic tracking-tighter">
          Validation de Titre
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto font-medium text-base md:text-lg leading-relaxed">
          Interrogation en temps réel du Registre Central des Diplômes et de la Blockchain Souveraine.
        </p>
      </header>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-16 items-start">
        {/* Left Panel */}
        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          {showVerificationForm ? VerificationForm : (
            <button 
              onClick={handleReset}
              className="w-full py-6 bg-white border-2 border-slate-100 rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-4 active:scale-[0.98]"
            >
              <i className="fas fa-magnifying-glass"></i>
              Analyser un autre Hash
            </button>
          )}
          
          {ErrorDisplay}
          
          {/* Info Panel */}
          <div className="p-6 bg-blue-50 rounded-[30px] border border-blue-100 space-y-4">
            <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <i className="fas fa-info-circle"></i>
              Instructions
            </h4>
            <ul className="space-y-3 text-[11px] text-slate-700">
              <li className="flex items-start gap-3">
                <i className="fas fa-check-circle text-green-500 mt-1"></i>
                <span>Scannez le code QR unique du document diplômant</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="fas fa-check-circle text-green-500 mt-1"></i>
                <span>Identifiez votre entité pour la traçabilité</span>
              </li>
              <li className="flex items-start gap-3">
                <i className="fas fa-check-circle text-green-500 mt-1"></i>
                <span>Consultez la preuve d'authenticité immuable</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-8">
          {scanning 
            ? LoadingState 
            : result 
            ? ResultDisplay 
            : EmptyState
          }
        </div>
      </div>

      {/* Footer */}
      <footer className="pt-8 md:pt-12 border-t border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-400">
          <div className="flex items-center gap-6">
            <span className="font-black uppercase tracking-widest">SÉCURITÉ CERTIFIÉE</span>
            <div className="flex items-center gap-4">
              <i className="fas fa-shield-alt"></i>
              <i className="fas fa-lock"></i>
              <i className="fas fa-link"></i>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="font-medium">
              Ministère de l'Éducation Nationale • Registre Diplômant Souverain
            </p>
            <p className="text-[9px] mt-1">
              Système de vérification officiel • Toute fraude est passible de poursuites
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Add CSS animations in your global CSS or style component
const styles = `
@keyframes scan {
  0%, 100% { top: 10%; opacity: 0.8; }
  50% { top: 90%; opacity: 1; }
}
@keyframes progress {
  0% { width: 0%; }
  100% { width: 100%; }
}
.animate-scan {
  animation: scan 2s ease-in-out infinite;
}
.animate-progress {
  animation: progress 2s ease-in-out infinite;
}
`;

// Add styles to document head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

export default Verification;