
export enum UserRole {
  SYSTEM_OWNER = 'SUPER_ADMIN',              // Super Admin Technique (Infrastructure)
  INSTITUTION_MANAGER = 'ADMIN',             // Admin Université (Gouvernance Locale)
  RECTOR = 'RECTOR',                         // Recteur d'Université
  DEAN = 'DEAN',                            // Doyen de Faculté
  DIRECTOR = 'DIRECTOR',                    // Directeur d'École/Institut
  ACADEMIC_OPERATOR = 'ACADEMIC_OPERATOR',   // Admin Faculté (Préparation des données)
  OFFICIAL_SIGNATORY = 'SIGNER',             // Autorité de Signature (Scellement)
  SOVEREIGN_AUDITOR = 'VALIDATOR',           // Inspection (Lecture Seule)
  VERIFIER = 'VIEWER'                        // Agent de vérification public
}

export interface SignatureInfo {
  signerId: string;
  signerName: string;
  signerTitle: string;
  signedAt: string;
  signatureImg?: string;
  stampImg?: string;
}

export enum AcademicCycle {
  LICENCE = 'LICENCE',
  MASTER = 'MASTER',
  DOCTORAT = 'DOCTORAT'
}

export interface SecurityGraphicConfig {
  guillocheIntensity: number;
  noiseSeed: string;
  theme: 'renaissance' | 'modern-art' | 'official-prestige' | 'monumental';
  watermarkOpacity: number;
  chromaticShift: boolean;
  protectionLayer?: string;
  securityLevel?: number;
}

export interface LMDRuleSet {
  cycle: AcademicCycle;
  requiredCredits: number;
  minPassingGrade: number;
  compensationAllowed: boolean;
  eliminationGrade: number;
  calculationMethod: 'WEIGHTED_AVERAGE' | 'SIMPLE_AVERAGE' | 'CREDIT_SUM';
  ccWeight: number;
  snWeight: number;
  requiresAdmissionProof: boolean;
}

export interface SemanticMapping {
  concept: string;
  sourceTable: string;
  sourceColumn: string;
  transformation?: string;
}

export interface SignatureWorkflow {
  id: string;
  tenantId: string;
  name: string;
  requiredSignatures: number;
  signatoryRoles: UserRole[];
  isActive: boolean;
  createdAt: string;
}

export interface SignatoryProfile {
  userId: string;
  tenantId: string;
  isActive: boolean;
  signatureImg?: string;
  stampImg?: string;
  officialTitle: string;
  authorizedBy: string;
  authorizedAt: string;
  permissions: {
    canSignDiplomas: boolean;
    canSignCertificates: boolean;
    maxSignaturesPerDay?: number;
  };
}

export interface VerificationResult {
  id: string;
  isAuthentic: boolean;
  studentName: string;
  studentMatricule: string;
  program: string;
  session: string;
  status: DiplomaStatus;
  data: {
    id: string;
    studentName: string;
    studentMatricule: string;
    program: string;
    session: string;
    status: DiplomaStatus;
    metadata: {
      promotion_id?: string;
      replacement_info?: {
        replaces_id?: string;
        replaced_by?: string;
        correction_reason?: string;
      };
      blockchain_anchor?: {
        txId: string;
      };
    };
  };
  message?: string;
}

export interface PKICertificate {
  serialNumber: string;
  issuer: string;
  subject: string;
  validFrom: string;
  validTo: string;
  publicKeyFingerprint: string;
  status: 'VALID' | 'REVOKED' | 'EXPIRED';
}

export interface TutelleAgreement {
  id: string;
  parentUniversityId: string;
  parentUniversityName: string;
  ipesId: string;
  ipesName: string;
  programName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED';
  expiryDate: string;
}

export interface DBConnection {
  tenantId: string;
  type: 'POSTGRES' | 'MYSQL' | 'ORACLE' | 'MSSQL' | 'SQLITE';
  url: string;
  status: 'CONNECTED' | 'DISCONNECTED';
}

export interface TenantSettings {
  primaryColor: string;
  zeroTrustMode: boolean;
  tsaEnabled: boolean;
  blockchainEnabled: boolean;
  eGovLinkActive: boolean;
  lmdRules: LMDRuleSet[];
  semanticMappings: SemanticMapping[];
  officials: SignatoryProfile[];
  signatureWorkflow?: SignatureWorkflow;
  pkiCertificate?: PKICertificate;
  signatureRequired: number;
  graphicSecurity?: SecurityGraphicConfig;
  tutelleAgreements?: TutelleAgreement[];
  diplomaFields?: DiplomaFieldConfig[];
}

export interface Tenant {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  type: TenantType;
  parentId?: string;
  parent_id?: string;
  logo?: string;
  logo_url?: string;
  motto?: string;
  contact_email?: string;
  contactEmail?: string;
  contact_phone?: string;
  contactPhone?: string;
  legalStatus?: 'PUBLIC' | 'PRIVATE_IPES';
  legal_status?: 'PUBLIC' | 'PRIVATE_IPES';
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  is_active?: boolean;
  max_users?: number;
  maxUsers?: number;
  max_diplomas?: number;
  maxDiplomas?: number;
  storage_quota_mb?: number;
  storageQuotaMb?: number;
  created_at?: string;
  updated_at?: string;
  settings?: TenantSettings;
}

export type TenantType = 'MINISTRY' | 'UNIVERSITY' | 'FACULTY' | 'IPES' | 'DEPARTMENT' | 'PROGRAM' | 'MAIN' | 'TUTELLE';

export enum DiplomaStatus {
  DRAFT = 'DRAFT',
  PENDING_ELIGIBILITY = 'PENDING_ELIGIBILITY',
  PENDING_FACULTY = 'PENDING_FACULTY',
  PENDING_RECTOR = 'PENDING_RECTOR',
  PENDING_TUTELLE = 'PENDING_TUTELLE',
  VALIDATED = 'VALIDATED',
  PARTIALLY_SIGNED = 'PARTIALLY_SIGNED',
  SIGNED = 'SIGNED',
  ISSUED = 'ISSUED',
  ARCHIVED = 'ARCHIVED',
  CANCELLED = 'CANCELLED' // Nouveau statut pour les diplômes remplacés
}

export interface DiplomaRecord {
  id: string; 
  studentMatricule: string;
  studentName: string;
  gender?: 'M' | 'F';
  program: string;
  session: string; 
  academicLevel: string;
  status: DiplomaStatus;
  timestamp: number;
  metadata: {
    totalCredits: number;
    gpa: number;
    lmd_compliance_hash: string;
    audit_chain: any[];
    blockchain_anchor?: any;
    pki_signature?: string;
    graphic_seed?: string;
    signatures: SignatureInfo[];
    admission_proof?: {
        mode: string;
        reference: string;
        date: string;
    };
    replacement_info?: {
      replaced_by?: string;      // ID du nouveau diplôme
      replaces_id?: string;     // ID de l'ancien diplôme
      correction_reason?: string;
      authority_id?: string;
      date: string;
    };
  };
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  tenantId: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  lastLogin?: number;
  signatureImg?: string;
  stampImg?: string;
  officialTitle?: string;
}

export interface StudentData {
  matricule: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  birthPlace?: string;
  program: string;
  academicLevel?: string;
  session: string;
  mention: string;
  faculty?: string;
  department?: string;
  creditsObtained?: number;
  gpa?: number;
  grades_summary?: {
    cc_avg: number;
    sn_avg: number;
    sr_active: boolean;
    redoublant: boolean;
  };
}

export interface AuditLog {
  id: string;
  date: string;
  user: string;
  action: string;
  details: string;
  hash: string;
}

export interface AcademicCampaign {
  id: string;
  year: string;
  status: 'OPEN' | 'FROZEN' | 'ARCHIVED';
  totalDiplomas: number;
  validatedDiplomas: number;
  startDate: string;
  freezeDate?: string;
  tenantId: string;
  name: string;
  description?: string;
}

export interface AcademicYear {
  id: string;
  year: string;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isCurrent: boolean;
}

export interface SecurityAnomaly {
  type: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface DiplomaFieldConfig {
  id: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'number' | 'boolean';
  required: boolean;
  position: number;
  visibility: 'visible' | 'hidden';
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    options?: string[];
    min?: number;
    max?: number;
  };
  defaultValue?: string;
  helpText?: string;
}

export const DEFAULT_DIPLOMA_FIELDS: DiplomaFieldConfig[] = [
  {
    id: "matricule",
    label: "Matricule étudiant",
    type: "text",
    required: true,
    position: 1,
    visibility: "visible",
    validation: {
      pattern: "^[A-Z]{2}[0-9]{6}$",
      minLength: 8,
      maxLength: 10
    },
    helpText: "Format: 2 lettres suivies de 6 chiffres (ex: ET2023001)"
  },
  {
    id: "nom",
    label: "Nom de famille",
    type: "text",
    required: true,
    position: 2,
    visibility: "visible",
    validation: {
      minLength: 2,
      maxLength: 50
    }
  },
  {
    id: "prenom",
    label: "Prénom",
    type: "text",
    required: true,
    position: 3,
    visibility: "visible",
    validation: {
      minLength: 2,
      maxLength: 50
    }
  },
  {
    id: "date_naissance",
    label: "Date de naissance",
    type: "date",
    required: false,
    position: 4,
    visibility: "visible",
    validation: {
      pattern: "^\\d{2}/\\d{2}/\\d{4}$"
    },
    helpText: "Format: JJ/MM/AAAA"
  },
  {
    id: "lieu_naissance",
    label: "Lieu de naissance",
    type: "text",
    required: false,
    position: 5,
    visibility: "visible",
    validation: {
      maxLength: 100
    }
  },
  {
    id: "programme",
    label: "Programme / Filière",
    type: "text",
    required: true,
    position: 6,
    visibility: "visible",
    validation: {
      minLength: 5,
      maxLength: 200
    }
  },
  {
    id: "faculte",
    label: "Faculté / Département",
    type: "text",
    required: false,
    position: 6.5,
    visibility: "visible",
    validation: {
      minLength: 3,
      maxLength: 200
    },
    helpText: "Faculté, Département ou École"
  },
  {
    id: "session",
    label: "Session académique",
    type: "text",
    required: true,
    position: 7,
    visibility: "visible",
    validation: {
      pattern: "^\\d{4}-\\d{4}$",
      minLength: 9,
      maxLength: 9
    },
    helpText: "Format: 2023-2024"
  },
  {
    id: "mention",
    label: "Mention",
    type: "select",
    required: false,
    position: 8,
    visibility: "visible",
    validation: {
      options: ["Très Bien", "Bien", "Assez Bien", "Passable"]
    }
  },
  {
    id: "date_delivrance",
    label: "Date de délivrance",
    type: "date",
    required: true,
    position: 9,
    visibility: "visible",
    defaultValue: "01/07/2024",
    validation: {
      pattern: "^\\d{2}/\\d{2}/\\d{4}$"
    }
  },
  {
    id: "niveau_etude",
    label: "Niveau d'étude",
    type: "select",
    required: false,
    position: 10,
    visibility: "visible",
    validation: {
      options: ["BAC+3", "BAC+5", "BAC+8"]
    },
    helpText: "Niveau académique du diplôme"
  }
];

export interface ExcelFieldMapping {
  excelColumn: string;
  semanticField: string;
  dataType: string;
  required: boolean;
  validationRule?: string;
}

export interface SavedImport {
  id: string;
  tenantId: string;
  importName: string;
  uploadedAt: string;
  academicYear: string;
  totalRecords: number;
  validRecords: number;
  errors: number;
  data: any[];
  status: 'pending' | 'validated' | 'generated' | 'exported';
  createdBy: string;
}
