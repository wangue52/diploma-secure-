import React, { useState, useEffect } from 'react';
import { SavedImport, Tenant } from '../types';

interface SavedImportsManagerProps {
  activeTenant: Tenant;
  onLoadImport: (savedImport: SavedImport) => void;
  onClose: () => void;
}

const SavedImportsManager: React.FC<SavedImportsManagerProps> = ({ 
  activeTenant, 
  onLoadImport, 
  onClose 
}) => {
  const [savedImports, setSavedImports] = useState<SavedImport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'records'>('date');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const savedData = localStorage.getItem(`savedImports_${activeTenant.id}`);
    if (savedData) {
      setSavedImports(JSON.parse(savedData));
    }
  }, [activeTenant.id]);

  const deleteImport = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet import ?')) {
      const updatedImports = savedImports.filter(imp => imp.id !== id);
      setSavedImports(updatedImports);
      localStorage.setItem(`savedImports_${activeTenant.id}`, JSON.stringify(updatedImports));
    }
  };

  const duplicateImport = (importToDuplicate: SavedImport) => {
    const duplicatedImport: SavedImport = {
      ...importToDuplicate,
      id: Date.now().toString(),
      importName: `${importToDuplicate.importName} (Copie)`,
      uploadedAt: new Date().toISOString(),
      createdBy: 'duplicate'
    };

    const updatedImports = [...savedImports, duplicatedImport];
    setSavedImports(updatedImports);
    localStorage.setItem(`savedImports_${activeTenant.id}`, JSON.stringify(updatedImports));
  };

  const exportImportData = (savedImport: SavedImport) => {
    const dataStr = JSON.stringify(savedImport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${savedImport.importName.replace(/[^a-z0-9]/gi, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredImports = savedImports
    .filter(imp => {
      const matchesSearch = imp.importName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           imp.academicYear.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || imp.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.importName.localeCompare(b.importName);
        case 'records':
          return b.validRecords - a.validRecords;
        case 'date':
        default:
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
    });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Gestionnaire d'Imports</h2>
              <p className="text-blue-100">{savedImports.length} imports sauvegardés</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-all"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="Rechercher par nom ou année..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'records')}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Trier par date</option>
                <option value="name">Trier par nom</option>
                <option value="records">Trier par nb. enregistrements</option>
              </select>
            </div>
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="validated">Validés</option>
                <option value="generated">Générés</option>
                <option value="exported">Exportés</option>
              </select>
            </div>
          </div>
        </div>

        {/* Imports List */}
        <div className="p-6 overflow-y-auto max-h-96">
          {filteredImports.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-inbox text-6xl text-slate-300 mb-4"></i>
              <p className="text-slate-500 text-lg">Aucun import trouvé</p>
              {searchTerm && (
                <p className="text-slate-400 text-sm mt-2">
                  Essayez de modifier vos critères de recherche
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredImports.map((imp) => (
                <div
                  key={imp.id}
                  className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg mb-1">
                        {imp.importName}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {new Date(imp.uploadedAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Année: {imp.academicYear} • Par: {imp.createdBy}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      imp.status === 'generated' ? 'bg-green-100 text-green-700' :
                      imp.status === 'exported' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {imp.status === 'validated' ? 'Validé' :
                       imp.status === 'generated' ? 'Généré' :
                       imp.status === 'exported' ? 'Exporté' : 'En attente'}
                    </span>
                  </div>

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center p-2 bg-slate-100 rounded-lg">
                      <p className="text-xs text-slate-600">Total</p>
                      <p className="font-bold text-slate-900">{imp.totalRecords}</p>
                    </div>
                    <div className="text-center p-2 bg-green-100 rounded-lg">
                      <p className="text-xs text-green-600">Valides</p>
                      <p className="font-bold text-green-700">{imp.validRecords}</p>
                    </div>
                    <div className="text-center p-2 bg-red-100 rounded-lg">
                      <p className="text-xs text-red-600">Erreurs</p>
                      <p className="font-bold text-red-700">{imp.errors}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onLoadImport(imp)}
                      className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all"
                    >
                      <i className="fas fa-upload mr-1"></i>
                      Charger
                    </button>
                    <button
                      onClick={() => duplicateImport(imp)}
                      className="px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 text-sm font-semibold rounded-lg transition-all"
                      title="Dupliquer"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                    <button
                      onClick={() => exportImportData(imp)}
                      className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-semibold rounded-lg transition-all"
                      title="Exporter les données"
                    >
                      <i className="fas fa-download"></i>
                    </button>
                    <button
                      onClick={() => deleteImport(imp.id)}
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-600 text-sm font-semibold rounded-lg transition-all"
                      title="Supprimer"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-600">
              {filteredImports.length} import(s) affiché(s) sur {savedImports.length} total
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedImportsManager;