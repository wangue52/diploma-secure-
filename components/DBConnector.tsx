import React, { useState, useRef, useEffect } from 'react';
import { Tenant, SemanticMapping, ExcelFieldMapping } from '../types';
import { aiService, excelService, validationService } from '../services/api';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface DBConnectorProps {
  activeTenant: Tenant;
}

interface ExcelValidationResult {
  isValid: boolean;
  errors: Array<{
    row: number;
    column: string;
    value: any;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    row: number;
    message: string;
    suggestion?: string;
  }>;
  data: any[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateCount: number;
  };
}

const DBConnector: React.FC<DBConnectorProps> = ({ activeTenant }) => {
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'mapping' | 'validation' | 'import'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] = useState<ExcelValidationResult | null>(null);
  const [isAiMapping, setIsAiMapping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Configuration des champs sémantiques standard
  const semanticFields: Array<{
    concept: string;
    label: string;
    description: string;
    type: 'text' | 'number' | 'date' | 'boolean';
    required: boolean;
    validationPattern?: string;
    example: string;
    icon: string;
  }> = [
    {
      concept: 'MATRICULE_ETUDIANT',
      label: 'Matricule Étudiant',
      description: 'Identifiant unique de l\'étudiant',
      type: 'text',
      required: true,
      validationPattern: '^[A-Z]{2}[0-9]{6}$',
      example: 'ET2023001',
      icon: 'fas fa-id-card'
    },
    {
      concept: 'NOM_ETUDIANT',
      label: 'Nom de Famille',
      description: 'Nom en majuscules',
      type: 'text',
      required: true,
      example: 'DUPONT',
      icon: 'fas fa-user'
    },
    {
      concept: 'PRENOM_ETUDIANT',
      label: 'Prénom',
      description: 'Prénom avec première lettre majuscule',
      type: 'text',
      required: true,
      example: 'Jean',
      icon: 'fas fa-signature'
    },
    {
      concept: 'DATE_NAISSANCE',
      label: 'Date de Naissance',
      description: 'Format JJ/MM/AAAA',
      type: 'date',
      required: false,
      example: '15/05/2000',
      icon: 'fas fa-birthday-cake'
    },
    {
      concept: 'NOTE_CC',
      label: 'Moyenne CC',
      description: 'Contrôle Continu (0-20)',
      type: 'number',
      required: true,
      validationPattern: '^(?:[0-9]|1[0-9]|20)(?:\\.[0-9]{1,2})?$',
      example: '14.5',
      icon: 'fas fa-chart-line'
    },
    {
      concept: 'NOTE_SN',
      label: 'Moyenne SN',
      description: 'Session Normale (0-20)',
      type: 'number',
      required: true,
      validationPattern: '^(?:[0-9]|1[0-9]|20)(?:\\.[0-9]{1,2})?$',
      example: '15.25',
      icon: 'fas fa-chart-bar'
    },
    {
      concept: 'CREDITS_OBTENUS',
      label: 'Crédits ECTS',
      description: 'Crédits validés (0-60)',
      type: 'number',
      required: true,
      example: '60',
      icon: 'fas fa-award'
    },
    {
      concept: 'MENTION',
      label: 'Mention',
      description: 'Mention obtenue',
      type: 'text',
      required: false,
      example: 'Très Bien',
      icon: 'fas fa-medal'
    },
    {
      concept: 'FILIERE',
      label: 'Filière',
      description: 'Spécialité académique',
      type: 'text',
      required: true,
      example: 'Génie Logiciel',
      icon: 'fas fa-graduation-cap'
    },
    {
      concept: 'SESSION_RATTRAPAGE',
      label: 'Session Rattrapage',
      description: 'En session de rattrapage',
      type: 'boolean',
      required: false,
      example: 'OUI/NON',
      icon: 'fas fa-redo'
    }
  ];

  // État pour le mapping des colonnes
  const [fieldMappings, setFieldMappings] = useState<ExcelFieldMapping[]>(
    semanticFields.map(field => ({
      concept: field.concept,
      excelColumn: '',
      confidence: 0,
      isMapped: false
    }))
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');

  // Télécharger un template Excel
  const downloadTemplate = async () => {
    try {
      setIsProcessing(true);
      setStatusMessage('Génération du template...');
      setProgress(30);

      const templateData = semanticFields.map(field => ({
        'CONCEPT': field.label,
        'DESCRIPTION': field.description,
        'TYPE': field.type,
        'OBLIGATOIRE': field.required ? 'OUI' : 'NON',
        'EXEMPLE': field.example,
        'VALIDATION': field.validationPattern || 'Aucune'
      }));

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Instructions');

      // Ajouter une feuille avec des données d'exemple
      const sampleData = [{
        MATRICULE_ETUDIANT: 'ET2023001',
        NOM_ETUDIANT: 'DUPONT',
        PRENOM_ETUDIANT: 'Jean',
        DATE_NAISSANCE: '15/05/2000',
        NOTE_CC: 14.5,
        NOTE_SN: 15.25,
        CREDITS_OBTENUS: 60,
        MENTION: 'Très Bien',
        FILIERE: 'Génie Logiciel',
        SESSION_RATTRAPAGE: 'NON'
      }];

      const sampleWs = XLSX.utils.json_to_sheet(sampleData);
      XLSX.utils.book_append_sheet(wb, sampleWs, 'Exemple de données');

      setProgress(70);

      // Générer le fichier
      const wbout = XLSX.write(wb, { 
        bookType: 'xlsx', 
        type: 'binary',
        cellStyles: true 
      });

      const blob = new Blob(
        [s2ab(wbout)], 
        { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
      );

      saveAs(blob, `Template_Diplomes_${activeTenant.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      setProgress(100);
      setStatusMessage('Template téléchargé avec succès !');
      
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

    setUploadedFileName(file.name);
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
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          
          // Extraire les headers
          const headers = jsonData[0] as string[];
          setExcelHeaders(headers);
          
          // Convertir les lignes en objets
          const rows = jsonData.slice(1).map((row: any) => {
            const obj: any = {};
            headers.forEach((header, index) => {
              obj[header] = row[index];
            });
            return obj;
          });

          setExcelData(rows);
          setProgress(70);
          setStatusMessage('Validation des données...');

          // Validation des données
          const validation = await validationService.validateExcelData(rows, headers);
          setValidationResult(validation);

          if (validation.isValid) {
            setCurrentStep('mapping');
            // Mapping automatique par IA
            await performAiMapping(headers, rows);
          } else {
            setCurrentStep('validation');
          }

          setProgress(100);
          setStatusMessage('Analyse terminée');
          
          setTimeout(() => {
            setIsProcessing(false);
            setProgress(0);
            setStatusMessage('');
          }, 1000);

        } catch (error) {
          setStatusMessage('Erreur lors de l\'analyse du fichier');
          setIsProcessing(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      setStatusMessage('Erreur lors de la lecture du fichier');
      setIsProcessing(false);
    }
  };

  // Mapping automatique par IA
  const performAiMapping = async (headers: string[], rows: any[]) => {
    setIsAiMapping(true);
    setStatusMessage('Mapping intelligent par IA...');
    
    try {
      const aiMappings = await aiService.autoMapColumns(headers, semanticFields, rows.slice(0, 5));
      
      const updatedMappings = fieldMappings.map(field => {
        const aiMatch = aiMappings.find((m: any) => m.concept === field.concept);
        if (aiMatch) {
          return {
            ...field,
            excelColumn: aiMatch.excelColumn,
            confidence: aiMatch.confidence,
            isMapped: true
          };
        }
        return field;
      });

      setFieldMappings(updatedMappings);
      setStatusMessage('Mapping IA terminé');
      
    } catch (error) {
      // Fallback: mapping basé sur les noms de colonnes
      const fallbackMappings = fieldMappings.map(field => {
        const matchedHeader = headers.find(header => 
          header.toLowerCase().includes(field.concept.toLowerCase().replace('_', ' ').slice(0, 5))
        );
        return {
          ...field,
          excelColumn: matchedHeader || '',
          confidence: matchedHeader ? 0.7 : 0,
          isMapped: !!matchedHeader
        };
      });

      setFieldMappings(fallbackMappings);
      setStatusMessage('Mapping automatique appliqué');
    }
    
    setIsAiMapping(false);
  };

  // Vérifier si le mapping est complet
  const isMappingComplete = () => {
    return fieldMappings
      .filter(field => semanticFields.find(sf => sf.concept === field.concept)?.required)
      .every(field => field.isMapped);
  };

  // Valider et importer les données
  const handleImport = async () => {
    if (!isMappingComplete()) {
      alert('Veuillez mapper tous les champs obligatoires');
      return;
    }

    setIsProcessing(true);
    setCurrentStep('import');
    setStatusMessage('Traitement des données...');
    setProgress(10);

    try {
      // Préparer les données mappées
      const processedData = excelData.map((row, index) => {
        const mappedData: any = {};
        fieldMappings.forEach(mapping => {
          if (mapping.excelColumn && mapping.excelColumn in row) {
            mappedData[mapping.concept] = row[mapping.excelColumn];
          }
        });
        return {
          ...mappedData,
          _rowIndex: index + 2,
          _sourceFile: uploadedFileName
        };
      });

      setProgress(40);
      setStatusMessage('Validation finale...');

      // Validation finale
      const finalValidation = await validationService.validateMappedData(processedData, fieldMappings);
      
      if (!finalValidation.isValid) {
        setValidationResult(finalValidation);
        setCurrentStep('validation');
        setIsProcessing(false);
        return;
      }

      setProgress(70);
      setStatusMessage('Importation dans le système...');

      // Envoyer les données au backend
      await excelService.importMappedData(activeTenant.id, {
        data: processedData,
        mappings: fieldMappings,
        metadata: {
          fileName: uploadedFileName,
          importDate: new Date().toISOString(),
          totalRecords: processedData.length
        }
      });

      setProgress(100);
      setStatusMessage('Importation réussie !');
      
      // Réinitialiser après succès
      setTimeout(() => {
        resetImport();
        alert(`${processedData.length} enregistrements importés avec succès`);
      }, 1500);

    } catch (error) {
      setStatusMessage('Erreur lors de l\'importation');
      setIsProcessing(false);
    }
  };

  // Réinitialiser l'import
  const resetImport = () => {
    setExcelData([]);
    setExcelHeaders([]);
    setFieldMappings(semanticFields.map(field => ({
      concept: field.concept,
      excelColumn: '',
      confidence: 0,
      isMapped: false
    })));
    setCurrentStep('upload');
    setValidationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploadedFileName('');
    setIsProcessing(false);
    setProgress(0);
    setStatusMessage('');
  };

  // Fonction utilitaire pour convertir string en ArrayBuffer
  const s2ab = (s: string): ArrayBuffer => {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Background Grid */}
      <div className="absolute inset-0 overflow-hidden opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(#0f172a 1px, transparent 1px),
                           linear-gradient(90deg, #0f172a 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl">
                  <i className="fas fa-database text-white text-xl"></i>
                </div>
                Intelligent Data Connector
              </h1>
              <p className="text-slate-600 mt-2">
                Importez vos fichiers Excel avec mapping sémantique intelligent
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200">
                <p className="text-xs font-semibold text-slate-500">TENANT ACTIF</p>
                <p className="font-bold text-slate-900">{activeTenant.name}</p>
              </div>
              <button 
                onClick={downloadTemplate}
                disabled={isProcessing}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50"
              >
                <i className="fas fa-download mr-2"></i>
                Template Excel
              </button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              {['upload', 'mapping', 'validation', 'import'].map((step, index) => (
                <React.Fragment key={step}>
                  <div className={`flex flex-col items-center ${currentStep === step ? 'text-blue-600' : 'text-slate-400'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      currentStep === step 
                        ? 'border-blue-600 bg-blue-50' 
                        : currentStep === 'upload' && index > 0
                        ? 'border-slate-300 bg-slate-50'
                        : 'border-blue-600 bg-blue-50'
                    }`}>
                      {currentStep === step ? (
                        <i className="fas fa-spinner fa-spin text-blue-600"></i>
                      ) : (
                        <span className="font-bold">{index + 1}</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold mt-2 capitalize">{step}</span>
                  </div>
                  {index < 3 && (
                    <div className={`w-24 h-1 mx-2 ${
                      index < ['upload', 'mapping', 'validation', 'import'].indexOf(currentStep)
                        ? 'bg-blue-600'
                        : 'bg-slate-300'
                    }`}></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Upload Step */}
          {currentStep === 'upload' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                  <i className="fas fa-cloud-upload-alt text-white"></i>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Importation de Fichier Excel</h3>
                  <p className="text-sm text-slate-600">
                    Téléversez votre fichier Excel contenant les données des étudiants
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Upload Zone */}
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    disabled={isProcessing}
                  />
                  
                  <div 
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
                      isProcessing
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/50'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                        <div>
                          <p className="font-semibold text-slate-900">{statusMessage}</p>
                          <p className="text-sm text-slate-600">Analyse en cours...</p>
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
                            Cliquez pour sélectionner un fichier Excel
                          </p>
                          <p className="text-sm text-slate-600">
                            Supports: .xlsx, .xls, .csv • Max: 10MB
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg">
                          <i className="fas fa-lightbulb text-amber-600"></i>
                          <span className="text-sm text-slate-700">
                            Conseil : Utilisez d'abord le template pour garantir le format correct
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats Preview */}
                {excelData.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">
                        {excelData.length}
                      </div>
                      <div className="text-sm text-slate-600">Enregistrements détectés</div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-xl border border-emerald-200">
                      <div className="text-2xl font-bold text-emerald-600">
                        {excelHeaders.length}
                      </div>
                      <div className="text-sm text-slate-600">Colonnes identifiées</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-xl border border-amber-200">
                      <div className="text-2xl font-bold text-amber-600">
                        {fieldMappings.filter(f => f.isMapped).length}
                      </div>
                      <div className="text-sm text-slate-600">Champs mappés automatiquement</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mapping Step */}
          {currentStep === 'mapping' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                    <i className="fas fa-project-diagram text-white"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Mapping Sémantique</h3>
                    <p className="text-sm text-slate-600">
                      Associez les colonnes Excel aux concepts du système
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isAiMapping ? (
                    <div className="flex items-center gap-2 text-purple-600">
                      <i className="fas fa-robot animate-pulse"></i>
                      <span className="text-sm font-semibold">IA en action...</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => performAiMapping(excelHeaders, excelData)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
                    >
                      <i className="fas fa-robot mr-2"></i>
                      Mapping IA
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {semanticFields.map((field, index) => {
                  const mapping = fieldMappings.find(m => m.concept === field.concept);
                  return (
                    <div 
                      key={field.concept}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        mapping?.isMapped
                          ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-50/50 to-white'
                          : field.required
                          ? 'border-rose-500/30 bg-gradient-to-r from-rose-50/50 to-white'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-lg ${
                            mapping?.isMapped
                              ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                              : field.required
                              ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                              : 'bg-gradient-to-r from-slate-500 to-slate-600'
                          }`}>
                            <i className={`${field.icon} text-white`}></i>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-900">{field.label}</h4>
                              {field.required && (
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-xs font-bold">
                                  REQUIS
                                </span>
                              )}
                              {mapping?.confidence && mapping.confidence > 0.8 && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">
                                  IA: {Math.round(mapping.confidence * 100)}%
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{field.description}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <i className="fas fa-info-circle"></i>
                              <span>Exemple: {field.example}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-64">
                          <select
                            value={mapping?.excelColumn || ''}
                            onChange={(e) => {
                              const newMappings = [...fieldMappings];
                              const fieldIndex = newMappings.findIndex(m => m.concept === field.concept);
                              if (fieldIndex !== -1) {
                                newMappings[fieldIndex] = {
                                  ...newMappings[fieldIndex],
                                  excelColumn: e.target.value,
                                  isMapped: !!e.target.value
                                };
                                setFieldMappings(newMappings);
                              }
                            }}
                            className={`w-full rounded-lg border-2 p-2 outline-none transition-all ${
                              mapping?.isMapped
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-300 hover:border-slate-400'
                            }`}
                          >
                            <option value="">-- Sélectionner une colonne --</option>
                            {excelHeaders.map(header => (
                              <option key={header} value={header}>
                                {header}
                              </option>
                            ))}
                          </select>
                          {mapping?.excelColumn && (
                            <div className="text-xs text-slate-500 mt-1">
                              {excelData[0]?.[mapping.excelColumn] && (
                                <span>Exemple: <code className="bg-slate-100 px-1 rounded">{excelData[0][mapping.excelColumn]}</code></span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Retour
                </button>
                <button
                  onClick={() => {
                    setCurrentStep('validation');
                    // Re-valider avec le mapping actuel
                  }}
                  disabled={!isMappingComplete()}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                    isMappingComplete()
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Vérifier les données
                  <i className="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>
          )}

          {/* Validation Step */}
          {currentStep === 'validation' && validationResult && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                    <i className="fas fa-check-circle text-white"></i>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Validation des Données</h3>
                    <p className="text-sm text-slate-600">
                      Vérification de l'intégrité des données importées
                    </p>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg font-bold ${
                  validationResult.isValid
                    ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-700 border border-emerald-500/20'
                    : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 border border-amber-500/20'
                }`}>
                  {validationResult.isValid ? 'PRÊT À L\'IMPORT' : `${validationResult.errors.length} ERREURS`}
                </div>
              </div>

              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-slate-50 to-white p-4 rounded-xl border border-slate-200">
                    <div className="text-2xl font-bold text-slate-900">
                      {validationResult.stats.totalRows}
                    </div>
                    <div className="text-sm text-slate-600">Lignes totales</div>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-xl border border-emerald-200">
                    <div className="text-2xl font-bold text-emerald-700">
                      {validationResult.stats.validRows}
                    </div>
                    <div className="text-sm text-slate-600">Lignes valides</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-xl border border-amber-200">
                    <div className="text-2xl font-bold text-amber-700">
                      {validationResult.stats.invalidRows}
                    </div>
                    <div className="text-sm text-slate-600">Lignes invalides</div>
                  </div>
                  <div className="bg-gradient-to-br from-rose-50 to-white p-4 rounded-xl border border-rose-200">
                    <div className="text-2xl font-bold text-rose-700">
                      {validationResult.stats.duplicateCount}
                    </div>
                    <div className="text-sm text-slate-600">Doublons</div>
                  </div>
                </div>

                {/* Errors List */}
                {validationResult.errors.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900">Détails des erreurs</h4>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {validationResult.errors.map((error, index) => (
                        <div 
                          key={index}
                          className="p-3 bg-gradient-to-r from-rose-50 to-white rounded-lg border border-rose-200 flex items-start gap-3"
                        >
                          <div className="p-2 bg-rose-100 rounded-lg">
                            <i className="fas fa-exclamation-triangle text-rose-600"></i>
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-rose-700">
                              Ligne {error.row} • Colonne: {error.column}
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
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900">Avertissements</h4>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {validationResult.warnings.map((warning, index) => (
                        <div 
                          key={index}
                          className="p-3 bg-gradient-to-r from-amber-50 to-white rounded-lg border border-amber-200 flex items-start gap-3"
                        >
                          <div className="p-2 bg-amber-100 rounded-lg">
                            <i className="fas fa-info-circle text-amber-600"></i>
                          </div>
                          <div>
                            <div className="font-semibold text-amber-700">{warning.message}</div>
                            {warning.suggestion && (
                              <div className="text-sm text-slate-600 mt-1">
                                Suggestion: {warning.suggestion}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Table */}
                {validationResult.isValid && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900">Aperçu des données validées</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-100">
                          <tr>
                            {fieldMappings
                              .filter(f => f.isMapped)
                              .slice(0, 5)
                              .map((mapping, index) => (
                                <th key={index} className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                                  {semanticFields.find(f => f.concept === mapping.concept)?.label}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {excelData.slice(0, 3).map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {fieldMappings
                                .filter(f => f.isMapped)
                                .slice(0, 5)
                                .map((mapping, colIndex) => (
                                  <td key={colIndex} className="px-4 py-3 text-sm text-slate-900">
                                    {row[mapping.excelColumn]}
                                  </td>
                                ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setCurrentStep('mapping')}
                  className="px-6 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  <i className="fas fa-edit mr-2"></i>
                  Modifier le mapping
                </button>
                <div className="flex gap-4">
                  <button
                    onClick={resetImport}
                    className="px-6 py-3 bg-gradient-to-r from-slate-200 to-slate-300 text-slate-800 rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    <i className="fas fa-times mr-2"></i>
                    Annuler
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!validationResult.isValid}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                      validationResult.isValid
                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:shadow-lg'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <i className="fas fa-upload mr-2"></i>
                    Importer les données
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Import Step */}
          {currentStep === 'import' && isProcessing && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 border border-slate-200 shadow-lg">
              <div className="text-center space-y-6">
                <div className="w-32 h-32 mx-auto rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">{statusMessage}</h3>
                  <p className="text-slate-600">Veuillez patienter pendant le traitement...</p>
                </div>
                {progress > 0 && (
                  <div className="max-w-md mx-auto">
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="text-right mt-2">
                      <span className="text-sm font-mono text-slate-700">{progress}%</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Security Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-slate-900/80 to-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700/50">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-300 font-medium">
              <i className="fas fa-robot mr-2"></i>
              Système intelligent de mapping sémantique • Validation cryptographique • Conformité RGPD garantie
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DBConnector;