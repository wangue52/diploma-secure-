
import axios from 'axios';
import { DiplomaRecord, AuditLog, User, Tenant, LMDRuleSet, SemanticMapping, TutelleAgreement, AcademicCampaign } from '../types';

const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      if (!window.location.pathname.includes('/login')) {
         window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const campaignService = {
  getCampaigns: async (tenantId: string): Promise<AcademicCampaign[]> => {
    const response = await apiClient.get(`/api/v1/tenants/${tenantId}/campaigns`);
    return response.data;
  },
  createCampaign: async (tenantId: string, data: Partial<AcademicCampaign>): Promise<AcademicCampaign> => {
    const response = await apiClient.post(`/api/v1/tenants/${tenantId}/campaigns`, data);
    return response.data;
  },
  freezeCampaign: async (tenantId: string, year: string): Promise<AcademicCampaign> => {
    const response = await apiClient.post(`/api/v1/tenants/${tenantId}/campaigns/freeze?year=${year}`);
    return response.data;
  }
};

export const diplomaService = {
  fetchRemoteStudents: async (tenantId: string): Promise<any[]> => {
    const response = await apiClient.get(`/api/v1/tenants/${tenantId}/erp/students`);
    return response.data;
  },

  generateBatch: async (tenantId: string, department: string, students: any[]): Promise<any> => {
    const response = await apiClient.post(`/api/v1/tenants/${tenantId}/diplomas/batch`, {
      promotion_id: `PROMO-${new Date().getFullYear()}`,
      department: department,
      students: students
    });
    return response.data;
  },

  searchDiplomas: async (tenantId: string, filters: any): Promise<DiplomaRecord[]> => {
    const response = await apiClient.get(`/api/v1/tenants/${tenantId}/diplomas`, { params: filters });
    return Array.isArray(response.data) ? response.data : (response.data.diplomas || []);
  },

  getPendingSignature: async (tenantId: string, userId: string): Promise<any[]> => {
    const response = await apiClient.get(`/api/v1/diplomas/pending-signature`, { params: { tenant_id: tenantId, user_id: userId } });
    console.log('[API] getPendingSignature response:', response.data);
    return Array.isArray(response.data) ? response.data : [];
  },

  signDiploma: async (diplomaId: string, signData: any): Promise<any> => {
    const response = await apiClient.post(`/api/v1/diplomas/${diplomaId}/sign`, signData);
    return response.data;
  },

  replaceDiploma: async (diplomaId: string, data: any): Promise<any> => {
    const response = await apiClient.post(`/api/v1/diplomas/${diplomaId}/replace`, data);
    return response.data;
  },

  getStats: async (tenantId: string) => {
    const response = await apiClient.get(`/api/v1/tenants/${tenantId}/stats`);
    return response.data;
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    const response = await apiClient.get('/api/v1/audit/logs');
    return response.data;
  },

  logVerification: async (data: any) => {
    try {
      const response = await apiClient.post('/api/v1/audit/verification', data);
      return response.data;
    } catch (err) {
      console.error('Error logging verification:', err);
      // Don't throw - verification should succeed even if logging fails
      return { logged: false };
    }
  },
  
  anchorBlockchain: async (diplomaId: string) => {
    const response = await apiClient.post(`/api/v1/diplomas/${diplomaId}/anchor`);
    return response.data;
  }
};

export const userService = {
  getUsers: async (tenantId?: string): Promise<User[]> => {
    const saved = localStorage.getItem('auth_user');
    const user = saved ? JSON.parse(saved) : null;
    const id = tenantId || user?.tenantId;
    const response = await apiClient.get(`/api/v1/tenants/${id}/users`);
    return Array.isArray(response.data) ? response.data : (response.data.users || []);
  },
  setupSignature: async (data: any): Promise<void> => {
    await apiClient.post('/api/v1/users/me/signature', data);
  },
  createUser: async (user: any): Promise<User> => {
    const response = await apiClient.post('/api/v1/users', user);
    return response.data;
  },
  updateUser: async (userId: string, data: any): Promise<User> => {
    const response = await apiClient.put(`/api/v1/users/${userId}`, data);
    return response.data;
  },
  toggleStatus: async (userId: string): Promise<void> => {
    await apiClient.post(`/api/v1/users/${userId}/toggle-status`);
  }
};

export const tenantService = {
  getTenant: async (tenant_id: string): Promise<Tenant> => {
    return (await apiClient.get(`/api/v1/tenants/${tenant_id}`)).data;
  },
  getTenants: async (): Promise<Tenant[]> => {
    const response = await apiClient.get('/api/v1/tenants');
    return Array.isArray(response.data) ? response.data : [];
  },
  
  createTenant: async (data: any): Promise<Tenant> => {
    return (await apiClient.post('/api/v1/tenants', data)).data;
  },
  
  updateTenant: async (tenantId: string, data: any): Promise<Tenant> => {
    return (await apiClient.put(`/api/v1/tenants/${tenantId}`, data)).data;
  },
  
  deleteTenant: async (tenantId: string): Promise<void> => {
    await apiClient.delete(`/api/v1/tenants/${tenantId}`);
  },
  
  getTenantStats: async (tenantId: string): Promise<any> => {
    return (await apiClient.get(`/api/v1/tenants/${tenantId}/stats`)).data;
  },
  
  getSigners: async (tenantId: string): Promise<any[]> => {
    const response = await apiClient.get(`/api/v1/tenants/${tenantId}/signers`);
    return Array.isArray(response.data) ? response.data : [];
  },
  
  saveLMDRules: async (tenantId: string, rules: LMDRuleSet[]) => {
    return (await apiClient.post(`/api/v1/tenants/${tenantId}/rules`, { lmdRules: rules }));
  },
  testDbPool: async (tenantId: string, config: any): Promise<any> => {
    return (await apiClient.post(`/api/v1/tenants/${tenantId}/db/test`, config)).data;
  }
};

export const aiService = {
  analyzeExcelMapping: async (tenantId: string, excelHeaders: string[]): Promise<any> => {
    return (await apiClient.post(`/api/v1/tenants/${tenantId}/ai/analyze-mapping`, { headers: excelHeaders })).data;
  },
  suggestValidationRules: async (tenantId: string, data: any[]): Promise<any> => {
    return (await apiClient.post(`/api/v1/tenants/${tenantId}/ai/validation-rules`, { data })).data;
  },
  suggestMappings: async (excelHeaders: string[], fieldMappings: any[]): Promise<any> => {
    return (await apiClient.post('/api/v1/ai/suggest-mappings', { headers: excelHeaders, mappings: fieldMappings })).data;
  },
  autoMapColumns: async (headers: string[], semanticFields: any[], sampleRows: any[]): Promise<any> => {
    return (await apiClient.post('/api/v1/ai/auto-map-columns', { headers, semanticFields, sampleRows })).data;
  }
};

export const excelService = {
  validateExcelFile: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return (await apiClient.post('/api/v1/excel/validate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })).data;
  },
  parseExcelFile: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    return (await apiClient.post('/api/v1/excel/parse', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })).data;
  },
  importMappedData: async (tenantId: string, mappedData: any): Promise<any> => {
    return (await apiClient.post(`/api/v1/tenants/${tenantId}/excel/import`, mappedData)).data;
  }
};

export const validationService = {
  validateStudentData: async (tenantId: string, data: any[]): Promise<any> => {
    return (await apiClient.post(`/api/v1/tenants/${tenantId}/validation/students`, { data })).data;
  },
  validateDiplomaData: async (tenantId: string, data: any[]): Promise<any> => {
    return (await apiClient.post(`/api/v1/tenants/${tenantId}/validation/diplomas`, { data })).data;
  },
  validateExcelData: async (rows: any[], headers: string[]): Promise<any> => {
    return (await apiClient.post('/api/v1/validation/excel-data', { rows, headers })).data;
  },
  validateMappedData: async (data: any[], fieldMappings: any[]): Promise<any> => {
    return (await apiClient.post('/api/v1/validation/mapped-data', { data, fieldMappings })).data;
  }
};

export default apiClient;
