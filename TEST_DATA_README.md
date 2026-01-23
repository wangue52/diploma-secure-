# 📊 Fichiers de Test DiplomaSecure

## Fichiers Créés

### 1. `DiplomaSecure_Test_Data_2024.csv`
Fichier CSV prêt à l'emploi avec 10 étudiants de test.

### 2. `test-data-generator.js`
Script JavaScript pour générer des données de test.

## 🚀 Utilisation

### Option 1: Fichier CSV Direct
1. Ouvrir `DiplomaSecure_Test_Data_2024.csv` dans Excel
2. Sauvegarder au format `.xlsx`
3. Importer dans DiplomaSecure

### Option 2: Conversion Excel
```bash
# Ouvrir le CSV dans Excel
# Fichier > Enregistrer sous > Format Excel (.xlsx)
```

### Option 3: Script JavaScript
```javascript
// Dans la console du navigateur
generateTestExcel();
```

## 📋 Données Incluses

**10 étudiants de test:**
- 8 Licences (BAC+3)
- 2 Masters (BAC+5)
- 4 filières: Génie Logiciel, Réseaux, IA, Cybersécurité
- 2 facultés: Sciences, Polytechnique
- Toutes les mentions: Très Bien, Bien, Assez Bien, Passable

**Colonnes conformes:**
- Matricule étudiant (ET/MA + année + numéro)
- Nom de famille
- Prénom
- Date de naissance (JJ/MM/AAAA)
- Lieu de naissance
- Programme / Filière
- Faculté / Département
- Session académique (2023-2024)
- Mention
- Date de délivrance
- Niveau d'étude

## ✅ Test de Validation

Ces données permettent de tester:
1. ✅ Import Excel fonctionnel
2. ✅ Validation des champs obligatoires
3. ✅ Mapping automatique des colonnes
4. ✅ Génération de diplômes
5. ✅ Export PDF
6. ✅ Sauvegarde automatique