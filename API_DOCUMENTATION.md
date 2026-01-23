# TENANT MANAGEMENT API - COMPLETE REFERENCE

## BASE URL
```
http://localhost:8000/api/v1
```

## AUTHENTICATION
All endpoints require JWT Bearer token:
```
Authorization: Bearer <jwt_token>
```

Get JWT token by logging in:
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "admin.rectorat@minesup.cm",
  "password": "minesup2024"
}

Response:
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "admin.rectorat@minesup.cm",
    "fullName": "Administrator",
    "role": "SYSTEM_OWNER",
    "tenantId": "t-minesup"
  }
}
```

---

## ENDPOINT 1: LIST TENANTS

### Request
```http
GET /tenants?skip=0&limit=10&status=ACTIVE&type=UNIVERSITY
Authorization: Bearer <token>
```

### Query Parameters
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| skip | integer | No | 0 | Pagination offset |
| limit | integer | No | 100 | Number of results |
| status | string | No | - | Filter: ACTIVE, INACTIVE, SUSPENDED |
| type | string | No | - | Filter: MAIN, UNIVERSITY, FACULTY, DEPARTMENT, INSTITUTION |

### Response (200 OK)
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Université de Yaoundé I",
    "slug": "uy1",
    "type": "UNIVERSITY",
    "description": "First university of Yaoundé",
    "logo_url": "https://uy1.cm/logo.png",
    "contact_email": "info@uy1.cm",
    "contact_phone": "+237 123 456 789",
    "legal_status": "PUBLIC",
    "registration_number": "REG-2024-001",
    "parent_id": "123e4567-e89b-12d3-a456-426614174001",
    "max_users": 200,
    "max_diplomas": 20000,
    "storage_quota_mb": 5000,
    "status": "ACTIVE",
    "is_active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  },
  {
    ...
  }
]
```

### Error Responses
- **401 Unauthorized**: Missing or invalid JWT token
- **403 Forbidden**: User lacks permission
- **500 Internal Server Error**: Database error

---

## ENDPOINT 2: CREATE TENANT

### Request
```http
POST /tenants
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body (Required: SUPER_ADMIN/SYSTEM_OWNER only)
```json
{
  "name": "Université de Buea",
  "slug": "ub",
  "type": "UNIVERSITY",
  "description": "University located in Buea, capital of South West Region",
  "logo_url": "https://ub.cm/logo.png",
  "contact_email": "info@ub.cm",
  "contact_phone": "+237 987 654 321",
  "legal_status": "PUBLIC",
  "registration_number": "REG-2024-002",
  "parent_id": "123e4567-e89b-12d3-a456-426614174001",
  "max_users": 150,
  "max_diplomas": 15000,
  "storage_quota_mb": 3000,
  "security_config": {
    "tsa_enabled": true,
    "blockchain_enabled": true,
    "zero_trust_mode": true,
    "egov_link_active": true
  }
}
```

### Field Validation Rules
| Field | Type | Min | Max | Pattern | Required |
|-------|------|-----|-----|---------|----------|
| name | string | 3 | 255 | - | Yes |
| slug | string | - | - | ^[a-z0-9-]+$ | Yes |
| type | enum | - | - | MAIN,UNIVERSITY,FACULTY,DEPARTMENT,INSTITUTION | Yes |
| description | string | 0 | 1000 | - | No |
| logo_url | url | - | - | Valid HTTP(S) URL | No |
| contact_email | email | - | - | Valid email format | Yes |
| contact_phone | string | 5 | 20 | - | No |
| legal_status | enum | - | - | PUBLIC,PRIVATE_IPES | Yes |
| registration_number | string | 0 | 50 | - | No |
| parent_id | uuid | - | - | Valid UUID | No |
| max_users | integer | 10 | 10000 | - | Yes |
| max_diplomas | integer | 10 | 10000 | - | Yes |
| storage_quota_mb | integer | 100 | 100000 | - | Yes |

### Response (201 Created)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174002",
  "name": "Université de Buea",
  "slug": "ub",
  "type": "UNIVERSITY",
  "description": "University located in Buea",
  "logo_url": "https://ub.cm/logo.png",
  "contact_email": "info@ub.cm",
  "contact_phone": "+237 987 654 321",
  "legal_status": "PUBLIC",
  "registration_number": "REG-2024-002",
  "parent_id": "123e4567-e89b-12d3-a456-426614174001",
  "max_users": 150,
  "max_diplomas": 15000,
  "storage_quota_mb": 3000,
  "status": "ACTIVE",
  "is_active": true,
  "created_at": "2024-01-15T11:00:00Z",
  "updated_at": "2024-01-15T11:00:00Z"
}
```

### Error Responses
- **400 Bad Request**: Invalid input or validation failed
  ```json
  {
    "detail": "Slug 'ub' already exists"
  }
  ```
- **403 Forbidden**: Only SUPER_ADMIN can create tenants
- **404 Not Found**: Parent tenant doesn't exist

---

## ENDPOINT 3: GET TENANT

### Request
```http
GET /tenants/{tenant_id}
Authorization: Bearer <token>
```

### Path Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| tenant_id | UUID | Tenant identifier |

### Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Université de Yaoundé I",
  "slug": "uy1",
  "type": "UNIVERSITY",
  "description": "First university of Yaoundé",
  "logo_url": "https://uy1.cm/logo.png",
  "contact_email": "info@uy1.cm",
  "contact_phone": "+237 123 456 789",
  "legal_status": "PUBLIC",
  "registration_number": "REG-2024-001",
  "parent_id": "123e4567-e89b-12d3-a456-426614174001",
  "max_users": 200,
  "max_diplomas": 20000,
  "storage_quota_mb": 5000,
  "status": "ACTIVE",
  "is_active": true,
  "security_config": {
    "tsa_enabled": true,
    "blockchain_enabled": true,
    "zero_trust_mode": true,
    "egov_link_active": true
  },
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### Error Responses
- **404 Not Found**: Tenant not found
- **403 Forbidden**: Access denied to this tenant

---

## ENDPOINT 4: UPDATE TENANT

### Request
```http
PUT /tenants/{tenant_id}
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body (Partial update - all fields optional)
```json
{
  "name": "Université de Yaoundé 1 - Revised",
  "description": "Updated description",
  "max_users": 250,
  "max_diplomas": 25000,
  "storage_quota_mb": 6000,
  "contact_email": "admin@uy1.cm",
  "status": "ACTIVE"
}
```

### Response (200 OK)
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Université de Yaoundé 1 - Revised",
  "slug": "uy1",
  "type": "UNIVERSITY",
  "description": "Updated description",
  "max_users": 250,
  "max_diplomas": 25000,
  "storage_quota_mb": 6000,
  "status": "ACTIVE",
  "is_active": true,
  "updated_at": "2024-01-15T12:00:00Z",
  ...
}
```

### Error Responses
- **400 Bad Request**: Validation failed
- **403 Forbidden**: Not authorized to update
- **404 Not Found**: Tenant not found

---

## ENDPOINT 5: DELETE TENANT

### Request
```http
DELETE /tenants/{tenant_id}
Authorization: Bearer <token>
```

### Response (204 No Content)
```
[empty body]
```

### Notes
- **Soft Delete**: Tenant marked as INACTIVE, data preserved
- **Requires**: SUPER_ADMIN role
- **Audit Trail**: Deletion logged with timestamp and user
- **Child Tenants**: Remain in database (not cascade deleted)

### Error Responses
- **403 Forbidden**: Only SUPER_ADMIN can delete
- **404 Not Found**: Tenant not found

---

## ENDPOINT 6: GET TENANT STATISTICS

### Request
```http
GET /tenants/{tenant_id}/stats
Authorization: Bearer <token>
```

### Response (200 OK)
```json
{
  "tenant_id": "123e4567-e89b-12d3-a456-426614174000",
  "total_users": 45,
  "max_users": 200,
  "users_percentage": 22.5,
  "total_diplomas": 1230,
  "max_diplomas": 20000,
  "diplomas_percentage": 6.15,
  "storage_used_mb": 250,
  "storage_quota_mb": 5000,
  "storage_percentage": 5.0,
  "user_count_by_role": {
    "SYSTEM_OWNER": 1,
    "INSTITUTION_ADMIN": 3,
    "USER_MANAGER": 5,
    "OFFICIAL_SIGNATORY": 30,
    "USER": 6
  },
  "diploma_count_by_status": {
    "DRAFT": 50,
    "SIGNED": 1000,
    "VERIFIED": 150,
    "ARCHIVED": 30
  },
  "last_diploma_created": "2024-01-15T09:45:00Z",
  "last_user_added": "2024-01-14T15:30:00Z"
}
```

### Error Responses
- **404 Not Found**: Tenant not found
- **403 Forbidden**: Access denied

---

## ERROR CODES & MESSAGES

### 400 Bad Request
```json
{
  "detail": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "String should have at least 3 characters"
    },
    {
      "field": "slug",
      "message": "String should match pattern '^[a-z0-9-]+$'"
    },
    {
      "field": "max_users",
      "message": "Input should be greater than or equal to 10"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Tenant not found"
}
```

### 409 Conflict
```json
{
  "detail": "Slug 'ub' already exists"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## RATE LIMITING

- No rate limiting in development
- Production: 1000 requests/hour per API key

---

## PAGINATION EXAMPLE

### Request
```http
GET /tenants?skip=10&limit=5
```

Returns tenants 10-14 (items at positions 10,11,12,13,14)

### Response
```json
[
  {
    "id": "...",
    "name": "Tenant 11",
    ...
  },
  {
    "id": "...",
    "name": "Tenant 12",
    ...
  },
  ...
]
```

---

## FILTERING EXAMPLES

### Get all active universities under MINESUP
```http
GET /tenants?status=ACTIVE&type=UNIVERSITY&parent_id=t-minesup-uuid
```

### Get inactive tenants
```http
GET /tenants?status=INACTIVE
```

### Get all main tenants
```http
GET /tenants?type=MAIN
```

---

## COMMON USE CASES

### 1. Create Hierarchical Structure
```bash
# 1. Create ministry (MAIN)
POST /tenants
{
  "name": "Ministry of Higher Education",
  "slug": "minesup",
  "type": "MAIN"
}

# 2. Create university under ministry
POST /tenants
{
  "name": "University of Yaoundé I",
  "slug": "uy1",
  "type": "UNIVERSITY",
  "parent_id": "<ministry-id>"
}

# 3. Create faculty under university
POST /tenants
{
  "name": "Faculty of Science",
  "slug": "fos-uy1",
  "type": "FACULTY",
  "parent_id": "<university-id>"
}
```

### 2. Monitor Tenant Quotas
```bash
GET /tenants/{tenant_id}/stats

# Response shows:
# - Users used: 45/200 (22.5%)
# - Diplomas issued: 1230/20000 (6.15%)
# - Storage: 250MB/5000MB (5%)
```

### 3. Manage Inactive Tenants
```bash
# Get all inactive tenants
GET /tenants?status=INACTIVE

# Reactivate tenant
PUT /tenants/{tenant_id}
{
  "status": "ACTIVE"
}
```

### 4. Bulk Operations
```bash
# Get all ACTIVE tenants (paginated)
GET /tenants?status=ACTIVE&limit=100
GET /tenants?status=ACTIVE&limit=100&skip=100
```

---

## INTEGRATION EXAMPLES

### Python (requests)
```python
import requests

headers = {"Authorization": f"Bearer {token}"}
response = requests.get("http://localhost:8000/api/v1/tenants", headers=headers)
tenants = response.json()
```

### JavaScript (fetch)
```javascript
const response = await fetch('/api/v1/tenants', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const tenants = await response.json();
```

### cURL
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/v1/tenants
```

### Postman
1. Set up collection variable: `token` = JWT token
2. In request header: `Authorization: Bearer {{token}}`
3. Use variables: `{{base_url}}/api/v1/tenants`

---

## WEBHOOKS (Future)

```json
{
  "event": "tenant.created",
  "timestamp": "2024-01-15T11:00:00Z",
  "data": {
    "tenant_id": "uuid",
    "name": "New Tenant",
    "created_by": "user-id"
  }
}
```

Events:
- tenant.created
- tenant.updated
- tenant.deleted (soft-delete)
- tenant.quota_exceeded

---

## VERSIONING

Current API Version: **v1**

Future versions will be at `/api/v2`, `/api/v3`, etc.

---

## SUPPORT

For API issues:
1. Check error messages and HTTP status codes
2. Review logs at `logs/api.log`
3. Verify JWT token validity
4. Ensure user role has required permissions

---

**Last Updated**: 2024
**API Status**: Production Ready ✅
