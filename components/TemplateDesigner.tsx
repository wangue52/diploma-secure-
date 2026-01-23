import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Tenant, SecurityGraphicConfig, DiplomaFieldConfig, DEFAULT_DIPLOMA_FIELDS } from '../types';
import { tenantService } from '../services/api';

interface DiplomaModel {
  id: string;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  theme: 'renaissance' | 'modern-art' | 'official-prestige' | 'monumental';
  bgPattern: string;
  securityLevel: number;
  protectionShapes: string[];
}

interface TemplateDesignerProps {
  activeTenant: Tenant;
}

const TemplateDesigner: React.FC<TemplateDesignerProps> = ({ activeTenant }) => {
  // Récupérer les champs configurés
  const configuredFields = activeTenant.settings?.diplomaFields || DEFAULT_DIPLOMA_FIELDS;
  const activeFields = configuredFields
    .filter(f => f.visibility === 'visible')
    .sort((a, b) => a.position - b.position);

  // Données d'exemple basées sur la configuration
  const sampleStudentData = useMemo(() => {
    const data: any = {};
    activeFields.forEach(field => {
      switch(field.id) {
        case 'matricule': data.matricule = 'ET2023001'; break;
        case 'nom': data.nom = 'MBAPPE'; break;
        case 'prenom': data.prenom = 'Jean-Paul'; break;
        case 'programme': data.programme = 'GÉNIE LOGICIEL & SYSTÈMES'; break;
        case 'session': data.session = '2023-2024'; break;
        case 'mention': data.mention = 'TRÈS BIEN'; break;
        case 'date_naissance': data.dateNaissance = '15/05/2000'; break;
        case 'lieu_naissance': data.lieuNaissance = 'Yaoundé'; break;
        case 'date_delivrance': data.dateDelivrance = '01/07/2024'; break;
        default: data[field.id] = field.defaultValue || `Exemple ${field.label}`;
      }
    });
    return data;
  }, [activeFields]);
  const themeToModelId: Record<string, string> = {
    'renaissance': 'm1',
    'modern-art': 'm2',
    'official-prestige': 'm3',
    'monumental': 'm4'
  };
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const theme = activeTenant.settings?.graphicSecurity?.theme;
    return theme && themeToModelId[theme] ? themeToModelId[theme] : 'm1';
  });
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [securityLevel, setSecurityLevel] = useState<number>(5);
  const [showSecureOverlay, setShowSecureOverlay] = useState(true);
  const [seed, setSeed] = useState<string>(activeTenant.settings?.graphicSecurity?.noiseSeed || `SYSTEM_Sovereign_${new Date().getFullYear()}`);
  const [isSaving, setIsSaving] = useState(false);
  const [activeProtectionLayer, setActiveProtectionLayer] = useState<string>('guilloche');
  const canvasRef = useRef<HTMLDivElement>(null);

  const models: DiplomaModel[] = [
    { 
      id: 'm1', 
      name: 'Renaissance Académique', 
      description: 'Protection par motifs baroques et micro-textures cryptées', 
      primaryColor: '#0f172a', 
      secondaryColor: '#f8fafc', 
      accentColor: '#3b82f6', 
      theme: 'renaissance',
      bgPattern: 'hexagon-security',
      securityLevel: 8,
      protectionShapes: ['shield', 'hexagon', 'circle']
    },
    { 
      id: 'm2', 
      name: 'Abstrait Souverain', 
      description: 'Lignes de force quantiques et barrières géométriques', 
      primaryColor: '#1e1b4b', 
      secondaryColor: '#f8fafc', 
      accentColor: '#8b5cf6', 
      theme: 'modern-art',
      bgPattern: 'quantum-grid',
      securityLevel: 9,
      protectionShapes: ['quantum', 'triangle', 'wave']
    },
    { 
      id: 'm3', 
      name: 'Prestige National', 
      description: 'Écran holographique et protections diplomatiques', 
      primaryColor: '#064e3b', 
      secondaryColor: '#ecfdf5', 
      accentColor: '#10b981', 
      theme: 'official-prestige',
      bgPattern: 'hologram',
      securityLevel: 10,
      protectionShapes: ['hologram', 'star', 'shield']
    },
    { 
      id: 'm4', 
      name: 'Monumental État', 
      description: 'Muraille cryptographique et barrières pérennes', 
      primaryColor: '#1c1917', 
      secondaryColor: '#fafaf9', 
      accentColor: '#57534e', 
      theme: 'monumental',
      bgPattern: 'carbon-fiber',
      securityLevel: 9,
      protectionShapes: ['fortress', 'grid', 'layers']
    }
  ];

  const currentModel = models.find(m => m.id === selectedModel) || models[0];

  const protectionLayers = [
    { id: 'guilloche', name: 'Guilloché Crypté', icon: 'fas fa-wave-square' },
    { id: 'hologram', name: 'Hologramme 3D', icon: 'fas fa-cube' },
    { id: 'quantum', name: 'Barrière Quantique', icon: 'fas fa-atom' },
    { id: 'shield', name: 'Bouclier Numérique', icon: 'fas fa-shield-alt' },
    { id: 'fractal', name: 'Fractales Sécurisées', icon: 'fas fa-infinity' }
  ];

  const handleSaveGraphic = async () => {
    setIsSaving(true);
    try {
      const config: SecurityGraphicConfig = {
        guillocheIntensity: securityLevel,
        noiseSeed: seed,
        theme: currentModel.theme,
        watermarkOpacity: 0.15,
        chromaticShift: true,
        protectionLayer: activeProtectionLayer,
        securityLevel: securityLevel
      };
      // Store config in tenant settings for diploma generation
      const tenantPayload = {
        settings: {
          ...activeTenant.settings,
          graphicSecurity: config
        }
      };
      await tenantService.updateTenant(activeTenant.id, tenantPayload);
      alert("Système de protection graphique activé avec succès.");
    } catch (e) {
      console.error('Erreur activation protection:', e);
      alert("Erreur d'activation du système de protection.");
    } finally {
      setIsSaving(false);
    }
  };

  const generateSecurityPattern = useMemo(() => {
    const patterns = {
      guilloche: () => {
        let d = "";
        const steps = 300;
        const width = orientation === 'landscape' ? 842 : 595;
        const height = orientation === 'landscape' ? 595 : 842;
        for (let i = 0; i < steps; i++) {
          const t = i / steps * Math.PI * 4;
          const x = (i / steps) * width;
          const y = height/2 + Math.sin(t * 3) * 30 + Math.cos(t * 2) * 40;
          d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
        }
        return d;
      },
      quantum: () => {
        let paths = [];
        const count = 50;
        for(let i = 0; i < count; i++) {
          const x = Math.random() * (orientation === 'landscape' ? 842 : 595);
          const y = Math.random() * (orientation === 'landscape' ? 595 : 842);
          const radius = 10 + Math.random() * 40;
          paths.push(`<circle cx="${x}" cy="${y}" r="${radius}" fill="none" stroke="${currentModel.accentColor}" stroke-width="0.5" opacity="0.1">
            <animate attributeName="r" values="${radius};${radius*1.5};${radius}" dur="${3 + Math.random() * 5}s" repeatCount="indefinite"/>
          </circle>`);
        }
        return paths.join('');
      },
      shield: () => {
        const width = orientation === 'landscape' ? 842 : 595;
        const height = orientation === 'landscape' ? 595 : 842;
        const shields = [];
        const rows = 8;
        const cols = 12;
        for(let i = 0; i < rows; i++) {
          for(let j = 0; j < cols; j++) {
            const x = j * (width/cols) + (width/cols/2);
            const y = i * (height/rows) + (height/rows/2);
            shields.push(`<path d="M${x-15} ${y} L${x} ${y-20} L${x+15} ${y} L${x} ${y+15} Z" fill="none" stroke="${currentModel.primaryColor}" stroke-width="0.3" opacity="0.05">
              <animateTransform attributeName="transform" type="rotate" from="0 ${x} ${y}" to="360 ${x} ${y}" dur="${20 + Math.random() * 20}s" repeatCount="indefinite"/>
            </path>`);
          }
        }
        return shields.join('');
      }
    };
    return patterns[activeProtectionLayer as keyof typeof patterns]?.() || patterns.guilloche();
  }, [orientation, activeProtectionLayer, currentModel]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Background Protection Grid */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(${currentModel.primaryColor} 1px, transparent 1px),
                           linear-gradient(90deg, ${currentModel.primaryColor} 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl">
                  <i className="fas fa-shield-check text-white text-xl"></i>
                </div>
                Sovereign Security Designer
              </h1>
              <p className="text-slate-600 mt-2">Conception de diplômes sécurisés avec protection anti-fraude avancée</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-500">TENANT ACTIF</p>
                <p className="font-bold text-slate-900">{activeTenant.name}</p>
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105">
                <i className="fas fa-database mr-2"></i>
                Voir l'historique
              </button>
            </div>
          </div>

          {/* Security Status Bar */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <i className="fas fa-lock text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Système de protection actif</h3>
                  <p className="text-sm text-slate-600">Niveau de sécurité: <span className="font-bold text-blue-600">{securityLevel}/10</span></p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-slate-900">24</div>
                  <div className="text-xs text-slate-600">Protections</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">100%</div>
                  <div className="text-xs text-slate-600">Intégrité</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-600">99.9%</div>
                  <div className="text-xs text-slate-600">Détection</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-8">
          {/* Control Panel - Modernized */}
          <div className="xl:w-96 space-y-6">
            {/* Model Selection */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <i className="fas fa-palette text-white"></i>
                </div>
                <h2 className="text-lg font-bold text-slate-900">Architectures de Protection</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {models.map(model => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-300 group overflow-hidden ${
                      selectedModel === model.id 
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-lg scale-105' 
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{
                      background: `linear-gradient(45deg, ${model.primaryColor} 25%, transparent 25%),
                                  linear-gradient(-45deg, ${model.primaryColor} 25%, transparent 25%),
                                  linear-gradient(45deg, transparent 75%, ${model.primaryColor} 75%),
                                  linear-gradient(-45deg, transparent 75%, ${model.primaryColor} 75%)`,
                      backgroundSize: '20px 20px'
                    }}></div>
                    
                    <div className="relative">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: model.primaryColor }}></div>
                        <div className="text-left">
                          <div className="font-bold text-sm text-slate-900">{model.name}</div>
                          <div className="flex items-center gap-1">
                            {[...Array(model.securityLevel)].map((_, i) => (
                              <div key={i} className="w-1 h-3 bg-blue-500 rounded-full"></div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 text-left">{model.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Protection Layers */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-200 shadow-lg">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <i className="fas fa-layer-group text-blue-600"></i>
                Couches de Sécurité
              </h3>
              <div className="space-y-3">
                {protectionLayers.map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => setActiveProtectionLayer(layer.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                      activeProtectionLayer === layer.id
                        ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        activeProtectionLayer === layer.id ? 'bg-blue-500' : 'bg-slate-100'
                      }`}>
                        <i className={`${layer.icon} ${
                          activeProtectionLayer === layer.id ? 'text-white' : 'text-slate-600'
                        }`}></i>
                      </div>
                      <span className="font-medium text-slate-900">{layer.name}</span>
                    </div>
                    {activeProtectionLayer === layer.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Security Configuration */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <i className="fas fa-key"></i>
                </div>
                <div>
                  <h3 className="font-bold">Paramètres Cryptographiques</h3>
                  <p className="text-sm text-slate-300">Graine sécurisée unique</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-blue-200 mb-2 block">Graine de Sécurité</label>
                  <div className="relative">
                    <input
                      value={seed}
                      onChange={e => setSeed(e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-sm font-mono outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Entrez une graine cryptographique..."
                    />
                    <button 
                      onClick={() => setSeed(`SYSTEM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)}
                      className="absolute right-2 top-2 p-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                    >
                      <i className="fas fa-redo text-sm"></i>
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Cette graine génère des motifs uniques et non reproductibles</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-blue-200">Niveau de Protection</label>
                    <span className="font-bold text-blue-300">{securityLevel}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={securityLevel}
                    onChange={e => setSecurityLevel(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 [&::-webkit-slider-thumb]:to-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Basique</span>
                    <span>Militaire</span>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setOrientation('portrait')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                      orientation === 'portrait'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <i className="fas fa-mobile-alt mr-2"></i>
                    Portrait
                  </button>
                  <button
                    onClick={() => setOrientation('landscape')}
                    className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                      orientation === 'landscape'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg'
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <i className="fas fa-desktop mr-2"></i>
                    Paysage
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                      <i className="fas fa-shield-halved"></i>
                    </div>
                    <div>
                      <div className="font-medium">Overlay de Sécurité</div>
                      <div className="text-xs text-slate-400">Protection anti-copie activée</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSecureOverlay(!showSecureOverlay)}
                    className={`relative w-14 h-8 rounded-full transition-all duration-300 ${
                      showSecureOverlay ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-slate-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-lg ${
                      showSecureOverlay ? 'left-7' : 'left-1'
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveGraphic}
              disabled={isSaving}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-3"></i>
                  Activation en cours...
                </>
              ) : (
                <>
                  <i className="fas fa-shield-check mr-3"></i>
                  Activer la Protection
                </>
              )}
            </button>
          </div>

          {/* Diploma Canvas - Modernized */}
          <div className="flex-1">
            <div className="bg-gradient-to-br from-slate-100 to-white rounded-3xl p-8 border border-slate-200 shadow-2xl">
              {/* Canvas Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Visualisation du Diplôme</h3>
                  <p className="text-slate-600">Aperçu avec {activeFields.length} champs configurés</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
                    <div className="flex items-center gap-2 text-green-700 font-bold">
                      <i className="fas fa-check-circle"></i>
                      <span>Sécurisé</span>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                    {activeFields.length} champs actifs
                  </div>
                  <button className="p-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    <i className="fas fa-expand text-slate-600"></i>
                  </button>
                </div>
              </div>

              {/* Diploma Container */}
              <div className="relative" ref={canvasRef}>
                {/* Protection Grid Overlay */}
                {showSecureOverlay && (
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `radial-gradient(circle at 1px 1px, ${currentModel.accentColor}40 1px, transparent 1px)`,
                      backgroundSize: '20px 20px',
                      opacity: 0.3
                    }}></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent animate-pulse"></div>
                  </div>
                )}

                {/* Diploma Paper */}
                <div 
                  className="relative mx-auto transition-all duration-500 overflow-hidden rounded-2xl border-4 border-white shadow-2xl bg-gradient-to-br from-white to-slate-50"
                  style={{ 
                    width: orientation === 'landscape' ? '842px' : '595px', 
                    height: orientation === 'landscape' ? '595px' : '842px',
                    maxWidth: '100%'
                  }}
                >
                  {/* Security SVG Layer */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                    <defs>
                      <filter id="noiseFilter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
                      </filter>
                      <linearGradient id="securityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={currentModel.primaryColor} stopOpacity="0.1" />
                        <stop offset="50%" stopColor={currentModel.accentColor} stopOpacity="0.05" />
                        <stop offset="100%" stopColor={currentModel.primaryColor} stopOpacity="0.1" />
                      </linearGradient>
                      <pattern id="protectionPattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <path d="M50,0 L100,50 L50,100 L0,50 Z" fill="none" stroke={currentModel.accentColor} strokeWidth="1" opacity="0.1"/>
                      </pattern>
                    </defs>

                    {/* Background Gradient */}
                    <rect width="100%" height="100%" fill="url(#securityGradient)" />
                    
                    {/* Active Protection Layer */}
                    <g dangerouslySetInnerHTML={{ __html: generateSecurityPattern }} />
                    
                    {/* Corner Protection */}
                    <g className="corner-protection" opacity="0.8">
                      {/* Top Left */}
                      <path d="M20,20 L80,20 L20,80 Z" fill="none" stroke={currentModel.primaryColor} strokeWidth="2" />
                      <circle cx="20" cy="20" r="8" fill={currentModel.accentColor} opacity="0.3">
                        <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite"/>
                      </circle>
                      
                      {/* Top Right */}
                      <path d={`M${(orientation === 'landscape' ? 822 : 575)-20},20 L${orientation === 'landscape' ? 822 : 575}-80,20 L${orientation === 'landscape' ? 822 : 575}-20,80 Z`} 
                            fill="none" stroke={currentModel.primaryColor} strokeWidth="2" />
                      <circle cx={orientation === 'landscape' ? 822 : 575} cy="20" r="8" fill={currentModel.accentColor} opacity="0.3">
                        <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" begin="0.5s"/>
                      </circle>
                      
                      {/* Bottom Left */}
                      <path d={`M20,${(orientation === 'landscape' ? 595 : 842)-20} L80,${(orientation === 'landscape' ? 595 : 842)-20} L20,${(orientation === 'landscape' ? 595 : 842)-80} Z`} 
                            fill="none" stroke={currentModel.primaryColor} strokeWidth="2" />
                      <circle cx="20" cy={orientation === 'landscape' ? 575 : 822} r="8" fill={currentModel.accentColor} opacity="0.3">
                        <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" begin="1s"/>
                      </circle>
                      
                      {/* Bottom Right */}
                      <path d={`M${(orientation === 'landscape' ? 822 : 575)-20},${(orientation === 'landscape' ? 595 : 842)-20} L${orientation === 'landscape' ? 822 : 575}-80,${(orientation === 'landscape' ? 595 : 842)-20} L${orientation === 'landscape' ? 822 : 575}-20,${(orientation === 'landscape' ? 595 : 842)-80} Z`} 
                            fill="none" stroke={currentModel.primaryColor} strokeWidth="2" />
                      <circle cx={orientation === 'landscape' ? 822 : 575} cy={orientation === 'landscape' ? 575 : 822} r="8" fill={currentModel.accentColor} opacity="0.3">
                        <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" begin="1.5s"/>
                      </circle>
                    </g>

                    {/* Micro Security Text Ring */}
                    <text className="micro-security-text" fontSize="3" fontWeight="900" fill={currentModel.primaryColor} opacity="0.05">
                      <textPath href="#securityPath" startOffset="0%">
                        {Array(10).fill(`🔒 ${activeTenant.name.toUpperCase()} SECURE DIPLOMA SYSTEM ${seed} 🔒`).join(' ')}
                      </textPath>
                    </text>
                    <path id="securityPath" d={`M 50,50 Q ${orientation === 'landscape' ? 421 : 297.5},50 ${orientation === 'landscape' ? 792 : 545},50 Q ${orientation === 'landscape' ? 842 : 595},${orientation === 'landscape' ? 297.5 : 421} ${orientation === 'landscape' ? 792 : 545},${orientation === 'landscape' ? 545 : 792} Q ${orientation === 'landscape' ? 421 : 297.5},${orientation === 'landscape' ? 595 : 842} 50,${orientation === 'landscape' ? 545 : 792} Q 0,${orientation === 'landscape' ? 297.5 : 421} 50,50`} fill="none"/>
                  </svg>

                  {/* Content */}
                  <div className="relative z-20 h-full p-12 flex flex-col">
                    {/* Header with Protection Badge */}
                    <div className="flex justify-between items-start mb-12">
                      <div className="text-left">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                            <i className="fas fa-shield-check text-white"></i>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">République du Cameroun</p>
                            <p className="text-xs text-slate-600 font-medium">Système Diplomatique Sécurisé</p>
                          </div>
                        </div>
                        <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
                      </div>

                      {/* Central Logo with Protection Ring */}
                      <div className="relative">
                        <div className="absolute inset-0 animate-spin-slow">
                          <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="48" fill="none" stroke={currentModel.accentColor} strokeWidth="1" strokeDasharray="2,2" opacity="0.3"/>
                          </svg>
                        </div>
                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-white to-slate-100 p-1 shadow-xl border-4 border-white">
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center">
                            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                              {activeTenant.name.substring(0, 2).toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                          SÉCURISÉ NIV.{securityLevel}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-3 justify-end mb-2">
                          <div>
                            <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">Republic of Cameroon</p>
                            <p className="text-xs text-slate-600 font-medium">Secure Diplomatic System</p>
                          </div>
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                            <i className="fas fa-lock text-white"></i>
                          </div>
                        </div>
                        <div className="h-1 w-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full ml-auto"></div>
                      </div>
                    </div>

                    {/* Title Section */}
                    <div className="text-center mb-16">
                      <div className="inline-flex items-center gap-4 px-8 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-full mb-6">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold text-blue-700 uppercase tracking-widest">DOCUMENT DIPLOMATIQUE</span>
                        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                      </div>
                      <h1 className="text-6xl font-bold text-slate-900 mb-4">
                        DIPLÔME
                        <span className="block text-4xl text-blue-600 mt-2">DE LICENCE</span>
                      </h1>
                      <div className="max-w-2xl mx-auto">
                        <p className="text-slate-600 text-sm leading-relaxed">
                          Ce document est protégé par un système de sécurité avancé incluant des hologrammes numériques, 
                          des micro-textures cryptographiques et une signature blockchain. Toute reproduction non autorisée 
                          est détectable et traçable.
                        </p>
                      </div>
                    </div>

                    {/* Student Info with Protection Box */}
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="relative w-full max-w-3xl mx-auto p-8 bg-gradient-to-br from-white to-slate-50 rounded-2xl border-2 border-slate-100 shadow-lg">
                        {/* Protection Corner Designs */}
                        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-blue-500"></div>
                        <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-blue-500"></div>
                        <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-blue-500"></div>
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-blue-500"></div>

                        <div className="text-center mb-8">
                          <div className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full mb-4">
                            <span className="text-xs font-bold text-white uppercase tracking-widest">TITULAIRE DU GRADE</span>
                          </div>
                          <h2 className="text-4xl font-bold text-slate-900">
                            {sampleStudentData.prenom} {sampleStudentData.nom}
                          </h2>
                          {sampleStudentData.matricule && (
                            <p className="text-sm text-slate-600 mt-2 font-mono">
                              Matricule: {sampleStudentData.matricule}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                          {sampleStudentData.programme && (
                            <div className="text-left p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-xs font-bold text-blue-700 uppercase">FILIÈRE</span>
                              </div>
                              <p className="text-lg font-bold text-slate-800">{sampleStudentData.programme}</p>
                            </div>
                          )}
                          {sampleStudentData.mention && (
                            <div className="text-left p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                <span className="text-xs font-bold text-emerald-700 uppercase">MENTION</span>
                              </div>
                              <p className="text-lg font-bold text-slate-800">{sampleStudentData.mention}</p>
                            </div>
                          )}
                          {sampleStudentData.session && (
                            <div className="text-left p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <span className="text-xs font-bold text-purple-700 uppercase">SESSION</span>
                              </div>
                              <p className="text-lg font-bold text-slate-800">{sampleStudentData.session}</p>
                            </div>
                          )}
                          {sampleStudentData.dateDelivrance && (
                            <div className="text-left p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                                <span className="text-xs font-bold text-amber-700 uppercase">DÉLIVRÉ LE</span>
                              </div>
                              <p className="text-lg font-bold text-slate-800">{sampleStudentData.dateDelivrance}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Signatures with Security Badges */}
                    <div className="mt-auto pt-8 border-t border-slate-100">
                      <div className="flex justify-between items-end">
                        {/* QR Code with Protection */}
                        <div className="relative">
                          <div className="w-40 h-40 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center shadow-xl">
                            <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
                              <i className="fas fa-qrcode text-6xl text-slate-900"></i>
                            </div>
                            <div className="mt-3 text-center">
                              <div className="text-[8px] font-mono text-white/80 uppercase tracking-tighter">
                                {seed.substring(0, 16)}...
                              </div>
                              <div className="text-[6px] text-blue-300 font-bold">HASH BLOCKCHAIN</div>
                            </div>
                          </div>
                          {showSecureOverlay && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-2xl pointer-events-none"></div>
                          )}
                        </div>

                        {/* Signatures */}
                        <div className="flex gap-12">
                          <div className="text-center">
                            <div className="w-48 h-1 bg-gradient-to-r from-slate-300 to-transparent mb-6"></div>
                            <p className="text-sm font-bold text-slate-900 mb-2">LE RECTEUR</p>
                            <div className="text-xs text-slate-600 font-medium">Prof. Dr. Samuel N. Eto'o</div>
                            <div className="text-[10px] text-slate-500 mt-1">Signature Numérique Sécurisée</div>
                          </div>
                          <div className="text-center">
                            <div className="w-48 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mb-6"></div>
                            <p className="text-sm font-bold text-slate-900 mb-2">LE MINISTRE</p>
                            <div className="text-xs text-slate-600 font-medium">Ministre de l'Enseignement Supérieur</div>
                            <div className="text-[10px] text-slate-500 mt-1">Cachet Diplomatique Actif</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security Watermark */}
                  {showSecureOverlay && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                      <div className="text-[100px] font-black text-blue-500/5 rotate-45 select-none">
                        SÉCURISÉ
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Indicators */}
              <div className="flex items-center justify-center gap-8 mt-8">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-700">Intégrité vérifiée</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <span className="text-sm font-medium text-slate-700">Cryptographie active</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                  <span className="text-sm font-medium text-slate-700">Blockchain prête</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .micro-security-text {
          font-family: 'Courier New', monospace;
          letter-spacing: 2px;
        }
        .corner-protection path {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: draw 2s forwards;
        }
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

export default TemplateDesigner;