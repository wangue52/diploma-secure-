# 🎓 DiplomaSecure Pro Enterprise

**DiplomaSecure Pro** est une plateforme souveraine de certification académique multi-établissements conçue pour sécuriser le cycle de vie des diplômes, de l'extraction des données ERP à la vérification publique par QR Code.

## 🚀 Fonctionnalités Implémentées

### 🏗️ Architecture Multi-Tenant & Gouvernance
- **Gestion Multi-Niveaux** : Prise en charge des hiérarchies académiques (Ministère > Université > Faculté > Département).
- **Contrôle d'Accès (RBAC)** : Rôles spécifiques (Super Admin, Recteur, Directeur, Admin École) avec permissions différenciées.
- **Gestion des Utilisateurs** : CRUD complet des administrateurs, suivi des dernières connexions et suspension de comptes.

### 🔗 Intégration ERP & "Sovereign Identity"
- **Pont de Données Universel** : Connecteur vers bases de données distantes (PostgreSQL, MySQL, Oracle, SQL Server).
- **Mappage Dynamique** : EXCEL, CSV, JSON, XML, etc.
- **Identifiant Unique (Matricule)** : Centralisation du matricule étudiant comme clé primaire de scellement.
- **État Civil Complet** : Capture enrichie incluant le lieu de naissance pour une identification sans ambiguïté.

### 🛡️ Sécurisation & Scellement
- **Scellement Cryptographique** : Génération de hachages SHA-256 uniques basés sur le matricule, l'institution et l'horodatage.
- **Génération de Batch** : Signature massive de promotions entières après extraction sécurisée.
- **Journal d'Audit Immuable** : Traçabilité de chaque action (connexion, signature, archivage) avec preuve de hash.

### 📄 Édition & Impression Prestige
- **Studio de Design** : Personnalisation artistique des modèles de diplômes (Renaissance, Moderne, Prestige).
- **Moteur PDF (jsPDF)** : Rendu haute définition incluant filigranes, micro-données et signatures officielles.
- **Impression Groupée** : Génération de carnets d'impression PDF pour des cohortes entières.

### 🔍 Vérification Publique
- **Scanner QR Intégré** : Validation instantanée via caméra ou saisie manuelle du hash.
- **Certificat de Vérification** : Génération d'une preuve d'authenticité PDF pour les tiers (employeurs, ambassades).

## 🛠️ Stack Technique

- **Backend** : FastAPI (Python 3.10+), SQLAlchemy, SQLite (Core DB), Argon2 (Chiffrement).
- **Frontend** : React 19, Tailwind CSS, Axios, jsPDF, Lucide/FontAwesome.
- **Sécurité** : JWT (JSON Web Tokens), Hashing SHA-256, Isolation des pools de connexion par Tenant.

## ⚙️ Configuration & Installation

### 1. Backend (FastAPI)
```bash
# Installation des dépendances
pip install -r requirements.txt

# Lancement du serveur (Port 8000)
python main.py
```

### 2. Identifiants par Défaut
- **Email** : `admin.rectorat@minesup.cm`
- **Mot de passe** : `minesup2024`

### 3. Configuration du Connecteur ERP
1. Naviguez vers **"DB Connect"**.
2. Renseignez l'URI de votre base de données locale (ex: `postgresql://user:pass@localhost:5432/ma_base`).
3. Testez la liaison réseau.
4. Effectuez le mappage des colonnes (Table Étudiants, Table Résultats).

## 📝 Mises à jour Récentes (Patch "Sovereign Identity")
- **Refonte du Moteur PDF** : Intégration du matricule dans un bloc de sécurité dédié.
- **Persistence Totale** : Les paramètres d'institution (Logos, Signataires) sont désormais sauvegardés en base de données système.
- **Validation IA** : Assistant Gemini intégré pour aider au mappage des schémas SQL complexes.

---
*Développé pour la souveraineté numérique des institutions académiques.*
