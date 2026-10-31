// Shapes returned by ulip-rbac (/api/rbac/v1). Dates arrive as ISO-8601 strings.

export type Environment = 'SANDBOX' | 'PRODUCTION';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REVOKED' | 'EXPIRED';

export interface Me {
  userId: number;
  username: string;
  name: string;
  email?: string;
  clientId?: number;
  organisation?: string;
  role: string;
  permissions: string[];
  phone?: string;
  emailVerified?: boolean;
  lastLoginAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: Me;
}

export interface MessageResponse {
  message: string;
}

export interface MenuNode {
  code: string;
  label: string;
  path?: string;
  icon?: string;
  children?: MenuNode[];
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
}

export interface ApiAccess {
  apiId: number;
  apiName: string;
  /** Portal page that calls this API, relative to /dashboard (e.g. '/sarathi'). */
  portalPath?: string;
  sandboxStatus?: RequestStatus;
  sandboxCreditsLeft?: number;
  productionStatus?: RequestStatus;
  productionQuotaAssigned?: number;
  productionQuotaRemaining?: number;
  productionValidUntil?: string;
  productionDecisionNote?: string;
}

export interface AccountSummary {
  apis: ApiAccess[];
  activeSandboxKeys: number;
  activeProductionKeys: number;
}

export interface CatalogItem {
  apiId: number;
  name: string;
  category?: string;
  description?: string;
  docsUrl?: string;
  sandboxAvailable: boolean;
  sandboxFreeCredits: number;
  creditCostPerCall: number;
  productionNeedsApproval: boolean;
  portalPath?: string;
}

export interface AccessRequest {
  id: number;
  userId: number;
  username: string;
  organisation?: string;
  apiId: number;
  apiName: string;
  environment: Environment;
  status: RequestStatus;
  useCase?: string;
  requestedQuota?: number;
  approvedQuota?: number;
  validUntil?: string;
  decisionNote?: string;
  decidedAt?: string;
  createdAt: string;
}

export interface AccessRequestHistory {
  id: number;
  requestId: number;
  fromStatus?: string;
  toStatus: string;
  actorUserId?: number;
  note?: string;
  createdAt: string;
}

export interface ApiKey {
  id: number;
  name: string;
  environment: Environment;
  prefix: string;
  status: string;
  ipAllowlist?: string;
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
  revokedAt?: string;
}

export interface ApiKeyCreated {
  key: ApiKey;
  apiKey: string;
  warning: string;
}

export interface Wallet {
  apiId: number;
  apiName: string;
  balance: number;
  totalGranted: number;
  updatedAt?: string;
}

export interface CreditLedger {
  id: number;
  userId: number;
  apiId: number;
  delta: number;
  balanceAfter: number;
  reason: string;
  reference?: string;
  actorUserId?: number;
  createdAt: string;
}

export interface UserRow {
  id: number;
  username: string;
  name: string;
  email?: string;
  organisation?: string;
  roleId: number;
  role: string;
  active: boolean;
}

export interface Role {
  id: number;
  name: string;
  permissions: string[];
}

export interface Permission {
  code: string;
  name: string;
  module: string;
  description?: string;
}

export interface MenuRow {
  id: number;
  code: string;
  label: string;
  path?: string;
  icon?: string;
  parentId?: number;
  sortOrder: number;
  permissionCode?: string;
  active: boolean;
}

export interface CatalogConfig {
  apiId: number;
  displayName: string;
  category?: string;
  description?: string;
  docsUrl?: string;
  publicApi: boolean;
  sandboxEnabled: boolean;
  sandboxAutoApprove: boolean;
  sandboxDefaultCredits: number;
  creditCost: number;
  prodDefaultQuota: number;
  requiresProdApproval: boolean;
  sortOrder: number;
  portalPath?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: number;
  actorUserId?: number;
  actorName?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  detail?: string;
  ip?: string;
  createdAt: string;
}

/** ULIP token for the portal's API pages (POST /me/api-token); same shape as /oauth/token. */
export interface ApiToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  environment: Environment;
}

export interface NotificationItem {
  id: string;
  /** APPROVAL (to act on), PENDING (own request waiting), DECISION (own request decided). */
  kind: 'APPROVAL' | 'PENDING' | 'DECISION';
  tone: 'success' | 'error' | 'warning' | 'info';
  title: string;
  text?: string;
  /** Portal path relative to /dashboard. */
  link?: string;
  count?: number;
  createdAt?: string;
}

export interface Notifications {
  approvalsPending: number;
  myPending: number;
  items: NotificationItem[];
}

/** Error body every ulip-rbac endpoint returns. */
export interface ApiError {
  status: number;
  code: string;
  message: string;
  details?: Record<string, string>;
}
