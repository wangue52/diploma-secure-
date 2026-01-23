
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class UserRole(str, Enum):
    SUPER_ADMIN = 'SUPER_ADMIN'
    RECTOR = 'RECTOR'
    DIRECTOR = 'DIRECTOR'
    HEAD_OF_DEPT = 'HEAD_OF_DEPT'
    ADMIN_SCHOOL = 'ADMIN_SCHOOL'
    ADMIN_TUTELLE = 'ADMIN_TUTELLE' 
    VERIFIER = 'VERIFIER'

class LegalStatus(str, Enum):
    PUBLIC = 'PUBLIC'
    PRIVATE_IPES = 'PRIVATE_IPES'

class InstitutionType(str, Enum):
    MINISTRY = 'MINISTRY'
    UNIVERSITY = 'UNIVERSITY'
    FACULTY = 'FACULTY'
    IPES = 'IPES'
    DEPARTMENT = 'DEPARTMENT'

class TutelleAgreementSchema(BaseModel):
    id: str
    parentUniversityId: str
    parentUniversityName: str
    ipesId: str
    ipesName: str
    programName: str
    status: str
    expiryDate: str

class BlockchainAnchorSchema(BaseModel):
    txId: str
    network: str
    timestamp: float
    blockNumber: int
    status: str

class PublicVerificationRequest(BaseModel):
    hash: str
    verifierEntity: str
    verifierPurpose: str

class DiplomaRecordSchema(BaseModel):
    id: str
    studentMatricule: str
    studentName: str
    program: str
    mention: str
    department: str
    faculty: str
    session: str
    timestamp: float
    tenantId: str
    status: str
    birthDate: Optional[str] = None
    birthPlace: Optional[str] = None
    metadata: Dict[str, Any]

class PublicVerificationResponse(BaseModel):
    isAuthentic: bool
    data: Optional[DiplomaRecordSchema] = None
    eGovMatch: bool = False
    blockchainProof: Optional[BlockchainAnchorSchema] = None
    message: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class BatchRequestSchema(BaseModel):
    promotion_id: str
    department: str
    students: List[Dict[str, Any]]
