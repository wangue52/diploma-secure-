import React, { useState, useRef, useEffect } from 'react';
import { Tenant, DiplomaFieldConfig, DEFAULT_DIPLOMA_FIELDS, AcademicYear, SavedImport } from '../types';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import AcademicYearManager from './AcademicYearManager';
import DiplomaExporter from './DiplomaExporter';
import SavedImportsManager from './SavedImportsManager';
import { tenantService } from '../services/api';

interface BatchGeneratorProps {
  activeTenant: Tenant;
}

interface ValidationError {
  row: number;
  column: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

const BatchGenerator: React.FC<BatchGeneratorProps> = ({ activeTenant }) => {
  const [excelData, setExcelData] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'validation'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [validStudents, setValidStudents] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [importedDiplomas, setImportedDiplomas] = useState<any[]>([]);
  const [showExporter, setShowExporter] = useState(false);
  const [savedImports, setSavedImports] = useState<SavedImport[]>([]);
  const [showSavedImports, setShowSavedImports] = useState(false);
  const [showImportsManager, setShowImportsManager] = useState(false);
  const [importName, setImportName] = useState<string>('');
  const [additionalFields, setAdditionalFields] = useState({
    filiere: '',
    faculte: '',
    niveau_etude: 'LICENCE'
  });
  const [availableSigners, setAvailableSigners] = useState<any[]>([]);
  const [selectedSigners, setSelectedSigners] = useState<string[]>([]);
  const [isLoadingSigners, setIsLoadingSigners] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les imports sauvegardés au montage
  useEffect(() => {
    const savedData = localStorage.getItem(`savedImports_${activeTenant.id}`);
    if (savedData) {
      setSavedImports(JSON.parse(savedData));
    }
  }, [activeTenant.id]);

  // Charger les signataires disponibles
  useEffect(() => {
    const loadSigners = async () => {
      try {
        setIsLoadingSigners(true);
        const signers = await tenantService.getSigners(activeTenant.id);
        setAvailableSigners(signers);
      } catch (error) {
        console.error('Erreur chargement signataires:', error);
      } finally {
        setIsLoadingSigners(false);
      }
    };
    loadSigners();
  }, [activeTenant.id]);
  
  // Récupérer les champs configurés pour ce tenant
  const configuredFields = activeTenant.settings?.diplomaFields || DEFAULT_DIPLOMA_FIELDS;
  const activeFields = configuredFields
    .filter(f => f.visibility === 'visible')
    .sort((a, b) => a.position - b.position);
  const requiredFields = activeFields.filter(f => f.required);

  // Télécharger un template Excel basé sur la configuration
  const downloadTemplate = async () => {
    try {
      setIsProcessing(true);
      setStatusMessage('Génération du template personnalisé...');
      setProgress(30);

      // Créer les headers basés sur les champs actifs configurés
      const templateHeaders = activeFields.map(field => field.label);
      
      // Créer une ligne d'exemple avec des données réalistes
      const exampleData = {};
      activeFields.forEach(field => {
        switch(field.id) {
          case 'matricule':
            exampleData[field.label] = 'ET2024001';
            break;
          case 'nom':
            exampleData[field.label] = 'TCHOFFO';
            break;
          case 'prenom':
            exampleData[field.label] = 'Abel';
            break;
          case 'date_naissance':
            exampleData[field.label] = '15/03/1998';
            break;
          case 'lieu_naissance':
            exampleData[field.label] = 'Yaoundé';
            break;
          case 'programme':
            exampleData[field.label] = 'Génie Logiciel';
            break;
          case 'faculte':
            exampleData[field.label] = 'Faculté des Sciences';
            break;
          case 'session':
            exampleData[field.label] = '2023-2024';
            break;
          case 'mention':
            exampleData[field.label] = field.validation?.options?.[0] || 'Bien';
            break;
          case 'date_delivrance':
            exampleData[field.label] = '15/07/2024';
            break;
          case 'niveau_etude':
            exampleData[field.label] = field.validation?.options?.[0] || 'BAC+3';
            break;
          default:
            if (field.type === 'date') {
              exampleData[field.label] = '01/01/2024';
            } else if (field.type === 'number') {
              exampleData[field.label] = '15.5';
            } else if (field.type === 'select' && field.validation?.options) {
              exampleData[field.label] = field.validation.options[0];
            } else if (field.type === 'boolean') {
              exampleData[field.label] = 'Oui';
            } else {
              exampleData[field.label] = field.defaultValue || `Exemple ${field.label}`;
            }
        }
      });

      const sampleData = [exampleData];
      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Étudiants');

      // Ajouter une feuille d'instructions personnalisée
      const instructions = [
        [`TEMPLATE PERSONNALISÉ - ${activeTenant.name.toUpperCase()}`],
        [''],
        ['CHAMPS CONFIGURÉS POUR VOTRE ÉTABLISSEMENT:'],
        ...activeFields.map(field => [
          `• ${field.label}${field.required ? ' (OBLIGATOIRE)' : ' (optionnel)'}`,
          field.helpText || `Type: ${field.type}${field.validation?.options ? ` - Options: ${field.validation.options.join(', ')}` : ''}`
        ]),
        [''],
        ['INSTRUCTIONS:'],
        ['1. Ne modifiez pas les noms des colonnes'],
        ['2. Remplissez uniquement les colonnes configurées'],
        ['3. Respectez les formats indiqués'],
        ['4. Les champs marqués (OBLIGATOIRE) sont requis'],
        ['5. Supprimez la ligne d\'exemple avant import'],
        [''],
        ['VALIDATION AUTOMATIQUE:'],
        ...requiredFields.map(field => [
          `• ${field.label}: ${field.validation?.pattern ? `Format ${field.validation.pattern}` : 'Requis'}`
        ])
      ];
      
      const instructionWs = XLSX.utils.aoa_to_sheet(instructions);
      XLSX.utils.book_append_sheet(wb, instructionWs, 'Instructions');

      setProgress(70);

      const wbout = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'binary',
        cellStyles: true 
      });

      const blob = new Blob(
        [s2ab(wbout)], 
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );

      saveAs(blob, `Template_${activeTenant.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setProgress(100);
      setStatusMessage('Template personnalisé téléchargé !');
      
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
        setStatusMessage('');
      }, 2000);

    } catch (error) {
      setStatusMessage('Erreur lors de la génération du template');
      setIsProcessing(false);
    }
  };

  // Gérer l'upload du fichier Excel
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage('Lecture du fichier Excel...');
    setProgress(10);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          setProgress(30);
          setStatusMessage('Analyse des données...');
          
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          
          const range = XLSX.utils.decode_range(firstSheet['!ref'] || 'A1');
          const headers: string[] = [];
          for (let C = range.s.c; C <= range.e.c; ++C) {
            const cell = firstSheet[XLSX.utils.encode_cell({r: range.s.r, c: C})];
            headers.push(cell ? cell.v : `Colonne ${C + 1}`);
          }
          
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          setExcelData(jsonData);
          
          setProgress(70);
          setStatusMessage('Validation des données...');

          validateData(jsonData, headers);

        } catch (error) {
          console.error('Error processing Excel file:', error);
          setStatusMessage('Erreur lors du traitement du fichier Excel');
          setIsProcessing(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('File upload error:', error);
      setStatusMessage('Erreur lors de la lecture du fichier');
      setIsProcessing(false);
    }
  };

  // Valider les données selon la configuration
  const validateData = (data: any[], headers: string[]) => {
    const errors: ValidationError[] = [];
    const validRows: any[] = [];
    const seenMatricules = new Set<string>();

    console.log('Headers détectés:', headers);
    console.log('Données brutes:', data.slice(0, 2));

    // Vérifier que tous les champs requis sont présents dans les headers
    const missingHeaders = requiredFields.filter(field => 
      !headers.some(header => 
        header.toLowerCase().includes(field.label.toLowerCase()) ||
        field.label.toLowerCase().includes(header.toLowerCase())
      )
    );

    if (missingHeaders.length > 0) {
      console.warn('Colonnes manquantes:', missingHeaders.map(f => f.label));
    }

    // Valider chaque ligne
    data.forEach((row, index) => {
      // Ignorer les lignes vides
      const hasData = Object.values(row).some(val => val && val.toString().trim() !== '');
      if (!hasData) {
        console.log(`Ligne ${index + 2} ignorée (vide)`);
        return;
      }

      // Vérifier si c'est une ligne d'exemple
      const isExampleRow = Object.values(row).some(val => 
        val && val.toString().startsWith('Exemple ')
      );
      
      if (isExampleRow) {
        console.log(`Ligne ${index + 2} ignorée (exemple)`);
        return;
      }

      let isValidRow = true;
      const processedRow: any = {};

      // Mapper les champs avec correspondance flexible
      activeFields.forEach(field => {
        let value = null;
        
        // Chercher la valeur dans les différentes colonnes possibles
        const possibleKeys = Object.keys(row).filter(key => 
          key.toLowerCase().includes(field.label.toLowerCase()) ||
          field.label.toLowerCase().includes(key.toLowerCase()) ||
          (field.id === 'matricule' && key.toLowerCase().includes('matricule')) ||
          (field.id === 'nom' && key.toLowerCase().includes('nom')) ||
          (field.id === 'prenom' && key.toLowerCase().includes('prénom')) ||
          (field.id === 'programme' && (key.toLowerCase().includes('programme') || key.toLowerCase().includes('filière'))) ||
          (field.id === 'session' && key.toLowerCase().includes('session'))
        );
        
        if (possibleKeys.length > 0) {
          value = row[possibleKeys[0]];
        }
        
        // Vérifier les champs obligatoires
        if (field.required && (!value || value.toString().trim() === '')) {
          errors.push({
            row: index + 2,
            column: field.label,
            value: value,
            message: 'Champ obligatoire manquant',
            severity: 'error'
          });
          isValidRow = false;
        }

        // Vérification spéciale pour les matricules
        if (field.id === 'matricule' && value) {
          const matricule = value.toString().trim().toUpperCase();
          if (seenMatricules.has(matricule)) {
            errors.push({
              row: index + 2,
              column: field.label,
              value: value,
              message: 'Matricule en double dans le fichier',
              severity: 'error'
            });
            isValidRow = false;
          } else {
            seenMatricules.add(matricule);
          }
        }

        processedRow[field.id] = value;
      });

      if (isValidRow) {
        validRows.push(processedRow);
        console.log(`Ligne ${index + 2} validée:`, processedRow);
      } else {
        console.log(`Ligne ${index + 2} invalide`);
      }
    });

    console.log(`Validation terminée: ${validRows.length} lignes valides, ${errors.length} erreurs`);

    setValidationErrors(errors);
    setValidStudents(validRows);
    setCurrentStep('validation');
    setProgress(100);
    
    // Auto-save the validated import
    if (validRows.length > 0) {
      autoSaveImport(validRows, errors);
    }
    
    if (errors.length === 0) {
      setStatusMessage(`✅ ${validRows.length} enregistrements valides (sauvegardé automatiquement)`);
    } else {
      setStatusMessage(`⚠️ ${errors.length} erreurs détectées, ${validRows.length} enregistrements valides (sauvegardé automatiquement)`);
    }

    setTimeout(() => {
      setIsProcessing(false);
      setProgress(0);
    }, 1000);
  };

  // Sauvegarder automatiquement l'import validé
  const autoSaveImport = (students: any[], errors: ValidationError[]) => {
    const autoSaveName = `Import_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}_${new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}`;
    
    const autoSavedImport: SavedImport = {
      id: Date.now().toString(),
      tenantId: activeTenant.id,
      importName: autoSaveName,
      uploadedAt: new Date().toISOString(),
      academicYear: selectedYear?.year || 'Non spécifiée',
      totalRecords: excelData.length,
      validRecords: students.length,
      errors: errors.length,
      data: students,
      status: 'validated',
      createdBy: 'auto-save'
    };

    const updatedSavedImports = [...savedImports, autoSavedImport];
    setSavedImports(updatedSavedImports);
    localStorage.setItem(`savedImports_${activeTenant.id}`, JSON.stringify(updatedSavedImports));
    
    setImportName(autoSaveName);
  };

  // Sauvegarder l'import validé
  const saveImport = () => {
    if (!importName.trim()) {
      alert('Veuillez entrer un nom pour cet import');
      return;
    }

    if (validStudents.length === 0) {
      alert('Aucun enregistrement valide à sauvegarder');
      return;
    }

    // Vérifier si le nom existe déjà
    const existingImport = savedImports.find(imp => imp.importName === importName.trim());
    if (existingImport) {
      if (!confirm('Un import avec ce nom existe déjà. Voulez-vous le remplacer ?')) {
        return;
      }
      // Supprimer l'ancien import
      const updatedImports = savedImports.filter(imp => imp.id !== existingImport.id);
      setSavedImports(updatedImports);
    }

    const newSavedImport: SavedImport = {
      id: Date.now().toString(),
      tenantId: activeTenant.id,
      importName: importName.trim(),
      uploadedAt: new Date().toISOString(),
      academicYear: selectedYear?.year || 'Non spécifiée',
      totalRecords: excelData.length,
      validRecords: validStudents.length,
      errors: validationErrors.length,
      data: validStudents,
      status: 'validated',
      createdBy: 'manual-save'
    };

    const updatedSavedImports = [...savedImports.filter(imp => imp.importName !== importName.trim()), newSavedImport];
    setSavedImports(updatedSavedImports);
    localStorage.setItem(`savedImports_${activeTenant.id}`, JSON.stringify(updatedSavedImports));
    
    alert(`Import "${importName}" sauvegardé avec succès !`);
  };

  // Charger un import sauvegardé
  const loadSavedImport = (savedImport: SavedImport) => {
    setValidStudents(savedImport.data);
    const year: AcademicYear = {
      id: Date.now().toString(),
      year: savedImport.academicYear,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      status: 'active'
    };
    setSelectedYear(year);
    setImportName(savedImport.importName);
    setCurrentStep('validation');
    alert(`Import "${savedImport.importName}" chargé avec ${savedImport.validRecords} enregistrements`);
  };

  // Supprimer un import sauvegardé
  const deleteSavedImport = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet import ?')) {
      const updatedSavedImports = savedImports.filter(imp => imp.id !== id);
      setSavedImports(updatedSavedImports);
      localStorage.setItem(`savedImports_${activeTenant.id}`, JSON.stringify(updatedSavedImports));
    }
  };

  // Générer les diplômes
  const generateDiplomas = async () => {
    if (validStudents.length === 0 || !selectedYear) {
      alert('Veuillez sélectionner une année académique');
      return;
    }

    setIsProcessing(true);
    setStatusMessage(`Génération des diplômes pour l'année ${selectedYear.year}...`);
    setProgress(20);

    try {
      console.log('Génération de', validStudents.length, 'diplômes pour l\'année', selectedYear.year);
      console.log('Champs configurés:', activeFields.map(f => f.id));
      
      setProgress(40);
      
      // Transformer les données pour le format DiplomaRecord
      const diplomasWithYear = validStudents.map((student, index) => {
        const studentName = `${student.prenom || student.firstName || ''} ${student.nom || student.lastName || ''}`.trim();
        const matricule = student.matricule || student.studentMatricule || `TEMP${Date.now()}${index}`;
        const program = additionalFields.filiere || student.programme || student.program || student.filiere || 'Programme Non Spécifié';
        
        return {
          id: `diploma_${matricule}_${Date.now()}_${index}`,
          studentName: studentName,
          studentMatricule: matricule,
          program: program,
          session: selectedYear.year,
          academicLevel: additionalFields.niveau_etude || student.niveau_etude || student.academicLevel || 'LICENCE',
          status: 'VALIDATED' as const,
          timestamp: Date.now(),
          metadata: {
            totalCredits: student.creditsObtained || 180,
            gpa: student.gpa || 0,
            lmd_compliance_hash: '',
            audit_chain: [{
              action: 'BATCH_GENERATED',
              user: 'current_user',
              date: new Date().toISOString()
            }],
            signatures: [],
            academicYear: selectedYear.year,
            yearId: selectedYear.id,
            faculte: additionalFields.faculte || student.faculte || student.faculty || '',
            mention: student.mention || '',
            date_delivrance: student.date_delivrance || new Date().toLocaleDateString('fr-FR'),
            lieu_naissance: student.lieu_naissance || student.birthPlace || '',
            date_naissance: student.date_naissance || student.birthDate || ''
          }
        };
      });
      
      setProgress(80);
      setStatusMessage(`✅ ${validStudents.length} diplômes générés pour ${selectedYear.year} !`);
      
      // Sauvegarder les diplômes générés dans localStorage pour les signataires
      const savedDiplomas = JSON.parse(localStorage.getItem(`generated_diplomas_${activeTenant.id}`) || '[]');
      const newDiplomas = [...savedDiplomas, ...diplomasWithYear];
      localStorage.setItem(`generated_diplomas_${activeTenant.id}`, JSON.stringify(newDiplomas));
      
      // Store imported diplomas for export
      setImportedDiplomas(diplomasWithYear);
      setShowExporter(true);
      
      setProgress(100);
      
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 1500);
    } catch (error) {
      console.error('Erreur génération diplômes:', error);
      setStatusMessage('Erreur lors de la génération des diplômes');
      setIsProcessing(false);
    }
  };

  const resetImport = () => {
    setExcelData([]);
    setCurrentStep('upload');
    setValidationErrors([]);
    setValidStudents([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsProcessing(false);
    setProgress(0);
    setStatusMessage('');
  };

  const s2ab = (s: string): ArrayBuffer => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-32">
      {/* Header */}
      <div className="bg-slate-900 p-12 rounded-[50px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10">
          <i className="fas fa-file-export text-[180px]"></i>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter">Batch Generator</h1>
            <p className="text-slate-400 max-w-xl font-medium">
              Importez vos données Excel selon la configuration personnalisée de {activeTenant.name}.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full">
                {activeFields.length} champs configurés
              </span>
              <span className="px-3 py-1 bg-red-600/20 text-red-300 rounded-full">
                {requiredFields.length} obligatoires
              </span>
            </div>
          </div>
          <button 
            onClick={downloadTemplate}
            disabled={isProcessing}
            className="px-10 py-5 bg-blue-600 hover:bg-blue-500 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all disabled:opacity-50"
          >
            <i className="fas fa-download mr-2"></i>
            Template Personnalisé
          </button>
        </div>
      </div>

      {/* Upload Step */}
      {currentStep === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Academic Year Selection */}
          <div className="lg:col-span-1">
            <AcademicYearManager 
              activeTenant={activeTenant}
              onYearChange={setSelectedYear}
            />
          </div>
          
          {/* Upload Area */}
          <div className="lg:col-span-2">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
              <div className="space-y-8">
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    disabled={isProcessing || !selectedYear}
                  />
                  
                  <div 
                    onClick={() => selectedYear && !isProcessing && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
                      !selectedYear
                        ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                        : isProcessing
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                        <div>
                          <p className="font-semibold text-slate-900">{statusMessage}</p>
                          <p className="text-sm text-slate-600">Traitement en cours...</p>
                        </div>
                        {progress > 0 && (
                          <div className="max-w-md mx-auto">
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                            <div className="text-right mt-1">
                              <span className="text-xs font-mono text-slate-700">{progress}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center">
                          <i className="fas fa-file-excel text-white text-3xl"></i>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            Cliquez pour sélectionner votre fichier Excel
                          </p>
                          <p className="text-sm text-slate-600">
                            Utilisez le template personnalisé pour {activeTenant.name}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Configuration Preview */}
                <div className="bg-slate-50 p-6 rounded-2xl">
                  <h4 className="font-bold text-slate-900 mb-4">Configuration Active</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {activeFields.slice(0, 8).map((field) => (
                      <div key={field.id} className={`p-3 rounded-lg border ${
                        field.required ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="text-xs font-bold text-slate-900">{field.label}</div>
                        <div className={`text-xs ${
                          field.required ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {field.required ? 'Obligatoire' : 'Optionnel'}
                        </div>
                      </div>
                    ))}
                    {activeFields.length > 8 && (
                      <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <span className="text-xs text-slate-600">+{activeFields.length - 8} autres</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Saved Imports Column */}
          {savedImports.length > 0 && (
            <div className="lg:col-span-3">
              <div className="bg-white p-6 rounded-[40px] shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <i className="fas fa-history text-slate-600 text-lg"></i>
                  <h3 className="text-lg font-black text-slate-900">Imports précédents</h3>
                  <span className="px-2 py-1 bg-slate-100 text-xs font-bold rounded-full text-slate-600">
                    {savedImports.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedImports.map((imp) => (
                    <div 
                      key={imp.id}
                      className="p-4 bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-all">
                            {imp.importName}
                          </h4>
                          <p className="text-xs text-slate-600">
                            {new Date(imp.uploadedAt).toLocaleDateString('fr-FR', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
                          imp.status === 'generated' ? 'bg-green-100 text-green-700' :
                          imp.status === 'exported' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {imp.status === 'validated' ? 'Validé' :
                           imp.status === 'generated' ? 'Généré' :
                           imp.status === 'exported' ? 'Exporté' : 'En attente'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                        <div>
                          <p className="text-xs text-slate-600">Total</p>
                          <p className="font-bold text-slate-900">{imp.totalRecords}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Valides</p>
                          <p className="font-bold text-green-600">{imp.validRecords}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-600">Erreurs</p>
                          <p className="font-bold text-red-600">{imp.errors}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => loadSavedImport(imp)}
                          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all"
                        >
                          <i className="fas fa-upload mr-1"></i>
                          Charger
                        </button>
                        <button
                          onClick={() => deleteSavedImport(imp.id)}
                          className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 text-xs font-bold rounded-lg transition-all"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Step */}
      {currentStep === 'validation' && (
        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-xl border border-slate-200">
                <div className="text-2xl font-bold text-slate-900">
                  {excelData.length}
                </div>
                <div className="text-sm text-slate-600">Lignes totales</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-xl border border-emerald-200">
                <div className="text-2xl font-bold text-emerald-700">
                  {validStudents.length}
                </div>
                <div className="text-sm text-slate-600">Lignes valides</div>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-xl border border-red-200">
                <div className="text-2xl font-bold text-red-700">
                  {validationErrors.length}
                </div>
                <div className="text-sm text-slate-600">Erreurs</div>
              </div>
            </div>

            {/* Errors */}
            {validationErrors.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900">Erreurs détectées</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {validationErrors.slice(0, 10).map((error, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-gradient-to-r from-red-50 to-white rounded-lg border border-red-200 flex items-start gap-3"
                    >
                      <div className="p-2 bg-red-100 rounded-lg">
                        <i className="fas fa-exclamation-triangle text-red-600"></i>
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-red-700">
                          Ligne {error.row} • {error.column}
                        </div>
                        <div className="text-sm text-slate-600">{error.message}</div>
                        {error.value && (
                          <div className="text-xs text-slate-500 mt-1">
                            Valeur: <code className="bg-slate-100 px-1 rounded">{error.value}</code>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {validationErrors.length > 10 && (
                    <div className="text-center py-2 text-sm text-slate-500">
                      ... et {validationErrors.length - 10} autres erreurs
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save Import Section - Améliorée */}
            {validStudents.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <div className="flex items-center gap-4 mb-4">
                  <i className="fas fa-check-circle text-green-600 text-xl"></i>
                  <div>
                    <h4 className="font-bold text-slate-900">Import validé et sauvegardé</h4>
                    <p className="text-sm text-green-700">Cet import a été automatiquement sauvegardé</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={importName}
                    onChange={(e) => setImportName(e.target.value)}
                    placeholder="Renommer cet import (optionnel)"
                    className="flex-1 px-4 py-2 border border-green-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    onClick={saveImport}
                    disabled={!importName.trim() || isProcessing}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                  >
                    <i className="fas fa-save mr-2"></i>
                    Renommer
                  </button>
                </div>
              </div>
            )}

            {/* Saved Imports */}
            {savedImports.length > 0 && (
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-history text-slate-600 text-lg"></i>
                    <h4 className="font-bold text-slate-900">Imports sauvegardés ({savedImports.length})</h4>
                  </div>
                  <button
                    onClick={() => setShowImportsManager(true)}
                    className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold"
                  >
                    <i className="fas fa-folder-open mr-2"></i>
                    Gestionnaire ({savedImports.length})
                  </button>
                </div>
                {showSavedImports && (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {savedImports.map((imp) => (
                      <div key={imp.id} className="p-4 bg-white rounded-lg border border-slate-200 flex items-center justify-between hover:border-blue-300 transition-all">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900">{imp.importName}</div>
                          <div className="text-xs text-slate-600">
                            {imp.validRecords} enregistrements • {imp.academicYear} • {new Date(imp.uploadedAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadSavedImport(imp)}
                            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-all"
                            title="Charger cet import"
                          >
                            <i className="fas fa-download mr-1"></i>
                            Charger
                          </button>
                          <button
                            onClick={() => deleteSavedImport(imp.id)}
                            className="px-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200 transition-all"
                            title="Supprimer cet import"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Champs supplémentaires après validation */}
            {validStudents.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3 mb-4">
                  <i className="fas fa-plus-circle text-blue-600 text-xl"></i>
                  <h4 className="font-bold text-slate-900">Informations complémentaires</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Filière / Programme
                    </label>
                    <input
                      type="text"
                      value={additionalFields.filiere}
                      onChange={(e) => setAdditionalFields(prev => ({...prev, filiere: e.target.value}))}
                      placeholder="Ex: Génie Logiciel"
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Faculté / École
                    </label>
                    <input
                      type="text"
                      value={additionalFields.faculte}
                      onChange={(e) => setAdditionalFields(prev => ({...prev, faculte: e.target.value}))}
                      placeholder="Ex: Faculté des Sciences"
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Niveau d'étude
                    </label>
                    <select
                      value={additionalFields.niveau_etude}
                      onChange={(e) => setAdditionalFields(prev => ({...prev, niveau_etude: e.target.value}))}
                      className="w-full px-4 py-2 border border-blue-200 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="LICENCE">Licence (BAC+3)</option>
                      <option value="MASTER">Master (BAC+5)</option>
                      <option value="DOCTORAT">Doctorat (BAC+8)</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <i className="fas fa-info-circle mr-2"></i>
                    Ces informations seront appliquées à tous les diplômes de ce lot.
                  </p>
                </div>
              </div>
            )}

            {/* Sélection des signataires */}
            {validStudents.length > 0 && availableSigners.length > 0 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <i className="fas fa-pen-fancy text-purple-600 text-xl"></i>
                  <h4 className="font-bold text-slate-900">Sélectionner les signataires</h4>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Choisissez qui signera ces {validStudents.length} diplômes
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableSigners.map((signer) => (
                    <div
                      key={signer.id}
                      onClick={() => {
                        setSelectedSigners(prev =>
                          prev.includes(signer.id)
                            ? prev.filter(id => id !== signer.id)
                            : [...prev, signer.id]
                        );
                      }}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedSigners.includes(signer.id)
                          ? 'border-purple-600 bg-purple-100'
                          : 'border-slate-200 bg-white hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                          selectedSigners.includes(signer.id)
                            ? 'border-purple-600 bg-purple-600'
                            : 'border-slate-300'
                        }`}>
                          {selectedSigners.includes(signer.id) && (
                            <i className="fas fa-check text-white text-xs"></i>
                          )}
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-slate-900">{signer.fullName}</h5>
                          <p className="text-xs text-slate-600">{signer.officialTitle}</p>
                          <div className="flex gap-2 mt-2">
                            {signer.hasSignature && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-bold">
                                <i className="fas fa-check-circle mr-1"></i>Signature
                              </span>
                            )}
                            {signer.hasStamp && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded font-bold">
                                <i className="fas fa-stamp mr-1"></i>Sceau
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {selectedSigners.length > 0 && (
                  <div className="mt-4 p-3 bg-purple-100 rounded-lg">
                    <p className="text-sm text-purple-800 font-semibold">
                      <i className="fas fa-info-circle mr-2"></i>
                      {selectedSigners.length} signataire(s) sélectionné(s) pour signer ces diplômes
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between">
              <button
                onClick={resetImport}
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Recommencer
              </button>
              <button
                onClick={generateDiplomas}
                disabled={validStudents.length === 0 || !selectedYear || isProcessing}
                className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                  validStudents.length > 0 && selectedYear && !isProcessing
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:shadow-lg'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {isProcessing ? (
                  <><i className="fas fa-spinner fa-spin mr-2"></i>Génération...</>
                ) : (
                  <><i className="fas fa-certificate mr-2"></i>Générer {validStudents.length} Diplômes {selectedYear ? `(${selectedYear.year})` : ''}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Exporter */}
      {showExporter && importedDiplomas.length > 0 && (
        <DiplomaExporter 
          activeTenant={activeTenant}
          diplomas={importedDiplomas}
          onExportComplete={() => {
            setShowExporter(false);
            resetImport();
          }}
        />
      )}

      {/* Gestionnaire d'imports sauvegardés */}
      {showImportsManager && (
        <SavedImportsManager
          activeTenant={activeTenant}
          onLoadImport={(savedImport) => {
            loadSavedImport(savedImport);
            setShowImportsManager(false);
          }}
          onClose={() => setShowImportsManager(false)}
        />
      )}
    </div>
  );
};

export default BatchGenerator;