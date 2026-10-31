import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AccessRequest, AccessRequestHistory, AccountSummary, ApiKey, ApiToken, Notifications, ApiKeyCreated, AuditLog, CatalogConfig,
  CatalogItem, CreditLedger, Environment, LoginResponse, Me, MenuNode, MenuRow, MessageResponse, Page,
  Permission, RequestStatus, Role, UserRow, Wallet
} from './rbac.models';

/** Every ulip-rbac endpoint the portal uses, in one place. */
@Injectable({ providedIn: 'root' })
export class RbacApiService {
  private readonly base = (environment as { rbacApiUrl?: string }).rbacApiUrl ?? '/api/rbac/v1';

  constructor(private http: HttpClient) {}

  private url(path: string): string {
    return `${this.base}${path}`;
  }

  private params(values: Record<string, string | number | undefined | null>): HttpParams {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(values)) {
      if (v !== undefined && v !== null && v !== '') {
        p = p.set(k, String(v));
      }
    }
    return p;
  }

  // ---- Auth (public) ----
  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.url('/auth/login'), { username, password });
  }

  signup(body: {
    name: string; email: string; organisation: string; phone?: string; password: string;
    acceptTerms: boolean; captchaToken?: string;
  }): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.url('/auth/signup'), body);
  }

  verifyEmail(email: string, otp: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.url('/auth/verify-email'), { email, otp });
  }

  resendOtp(email: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.url('/auth/resend-otp'), { email });
  }

  forgotPassword(email: string, captchaToken?: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.url('/auth/forgot-password'), { email, captchaToken });
  }

  resetPassword(email: string, otp: string, newPassword: string): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(this.url('/auth/reset-password'), { email, otp, newPassword });
  }

  // ---- Me ----
  me(): Observable<Me> {
    return this.http.get<Me>(this.url('/me'));
  }

  navigation(): Observable<MenuNode[]> {
    return this.http.get<MenuNode[]>(this.url('/me/navigation'));
  }

  accountSummary(): Observable<AccountSummary> {
    return this.http.get<AccountSummary>(this.url('/me/account-summary'));
  }

  notifications(): Observable<Notifications> {
    return this.http.get<Notifications>(this.url('/me/notifications'));
  }

  apiToken(environment: Environment): Observable<ApiToken> {
    return this.http.post<ApiToken>(this.url('/me/api-token'), { environment });
  }

  updateProfile(body: { name?: string; phone?: string; designation?: string }): Observable<Me> {
    return this.http.put<Me>(this.url('/me'), body);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<MessageResponse> {
    return this.http.put<MessageResponse>(this.url('/me/password'), { currentPassword, newPassword });
  }

  // ---- Catalog ----
  catalog(): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(this.url('/catalog'));
  }

  // ---- Access requests (own) ----
  myAccessRequests(): Observable<AccessRequest[]> {
    return this.http.get<AccessRequest[]>(this.url('/access-requests'));
  }

  createAccessRequest(body: {
    apiId: number; environment: Environment; useCase?: string; requestedQuota?: number;
  }): Observable<AccessRequest> {
    return this.http.post<AccessRequest>(this.url('/access-requests'), body);
  }

  cancelAccessRequest(id: number): Observable<AccessRequest> {
    return this.http.post<AccessRequest>(this.url(`/access-requests/${id}/cancel`), {});
  }

  // ---- API keys ----
  apiKeys(): Observable<ApiKey[]> {
    return this.http.get<ApiKey[]>(this.url('/api-keys'));
  }

  createApiKey(body: {
    name: string; environment: Environment; ipAllowlist?: string; expiresAt?: string;
  }): Observable<ApiKeyCreated> {
    return this.http.post<ApiKeyCreated>(this.url('/api-keys'), body);
  }

  rotateApiKey(id: number): Observable<ApiKeyCreated> {
    return this.http.post<ApiKeyCreated>(this.url(`/api-keys/${id}/rotate`), {});
  }

  revokeApiKey(id: number): Observable<ApiKey> {
    return this.http.delete<ApiKey>(this.url(`/api-keys/${id}`));
  }

  // ---- Credits ----
  wallets(): Observable<Wallet[]> {
    return this.http.get<Wallet[]>(this.url('/credits'));
  }

  ledger(page = 0, size = 20): Observable<Page<CreditLedger>> {
    return this.http.get<Page<CreditLedger>>(this.url('/credits/ledger'), { params: this.params({ page, size }) });
  }

  // ---- Admin: access approvals ----
  adminAccessRequests(filter: {
    status?: RequestStatus | ''; environment?: Environment | ''; page?: number; size?: number;
  }): Observable<Page<AccessRequest>> {
    return this.http.get<Page<AccessRequest>>(this.url('/admin/access-requests'), {
      params: this.params(filter as Record<string, string | number | undefined>)
    });
  }

  accessRequestHistory(id: number): Observable<AccessRequestHistory[]> {
    return this.http.get<AccessRequestHistory[]>(this.url(`/admin/access-requests/${id}/history`));
  }

  approveAccessRequest(id: number, body: {
    quota?: number; credits?: number; validUntil?: string; note?: string;
  }): Observable<AccessRequest> {
    return this.http.post<AccessRequest>(this.url(`/admin/access-requests/${id}/approve`), body);
  }

  rejectAccessRequest(id: number, reason: string): Observable<AccessRequest> {
    return this.http.post<AccessRequest>(this.url(`/admin/access-requests/${id}/reject`), { reason });
  }

  revokeAccessRequest(id: number, reason: string): Observable<AccessRequest> {
    return this.http.post<AccessRequest>(this.url(`/admin/access-requests/${id}/revoke`), { reason });
  }

  // ---- Admin: users ----
  users(search: string, page = 0, size = 20): Observable<Page<UserRow>> {
    return this.http.get<Page<UserRow>>(this.url('/admin/users'), { params: this.params({ search, page, size }) });
  }

  changeUserRole(id: number, roleId: number): Observable<UserRow> {
    return this.http.put<UserRow>(this.url(`/admin/users/${id}/role`), { roleId });
  }

  changeUserStatus(id: number, active: boolean): Observable<UserRow> {
    return this.http.put<UserRow>(this.url(`/admin/users/${id}/status`), { active });
  }

  // ---- Admin: roles, permissions, menus ----
  roles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.url('/admin/roles'));
  }

  permissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>(this.url('/admin/permissions'));
  }

  createRole(name: string): Observable<Role> {
    return this.http.post<Role>(this.url('/admin/roles'), { name });
  }

  setRolePermissions(id: number, permissions: string[]): Observable<Role> {
    return this.http.put<Role>(this.url(`/admin/roles/${id}/permissions`), { permissions });
  }

  menus(): Observable<MenuRow[]> {
    return this.http.get<MenuRow[]>(this.url('/admin/menus'));
  }

  createMenu(body: Partial<MenuRow>): Observable<MenuRow> {
    return this.http.post<MenuRow>(this.url('/admin/menus'), body);
  }

  updateMenu(id: number, body: Partial<MenuRow>): Observable<MenuRow> {
    return this.http.put<MenuRow>(this.url(`/admin/menus/${id}`), body);
  }

  deleteMenu(id: number): Observable<void> {
    return this.http.delete<void>(this.url(`/admin/menus/${id}`));
  }

  // ---- Admin: catalog, credits, audit ----
  catalogConfig(): Observable<CatalogConfig[]> {
    return this.http.get<CatalogConfig[]>(this.url('/admin/catalog'));
  }

  updateCatalogConfig(apiId: number, body: Partial<CatalogConfig>): Observable<CatalogConfig> {
    return this.http.put<CatalogConfig>(this.url(`/admin/catalog/${apiId}`), body);
  }

  userWallets(userId: number): Observable<Wallet[]> {
    return this.http.get<Wallet[]>(this.url(`/admin/credits/users/${userId}`));
  }

  topUp(body: { userId: number; apiId: number; amount: number; note?: string }): Observable<Record<string, number>> {
    return this.http.post<Record<string, number>>(this.url('/admin/credits/top-up'), body);
  }

  auditLogs(filter: { action?: string; actorUserId?: number; page?: number; size?: number }): Observable<Page<AuditLog>> {
    return this.http.get<Page<AuditLog>>(this.url('/admin/audit-logs'), {
      params: this.params(filter as Record<string, string | number | undefined>)
    });
  }
}

/** Human message from an HttpErrorResponse carrying ulip-rbac's error body. */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = err as { status?: number; name?: string; error?: { message?: string; details?: Record<string, string> } };
  if (e?.name === 'TimeoutError') {
    return 'Request timed out. Please check your connection and try again.';
  }
  if (e?.status === 0) {
    return 'Unable to reach the server. Please check your connection.';
  }
  const details = e?.error?.details;
  if (details && Object.keys(details).length) {
    return Object.entries(details).map(([field, msg]) => `${field} ${msg}`).join('; ');
  }
  return e?.error?.message || fallback;
}
