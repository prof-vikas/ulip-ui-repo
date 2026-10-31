import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, timeout } from 'rxjs';
import { environment } from '../../environments/environment';

/** Envelope every ULIP data API returns (errors come back with HTTP 200 and a code in the body). */
export interface ApiEnvelope<T = unknown> {
  error: string | boolean;
  code: string;
  message: string;
  response?: T | null;
}

export interface ApiResult<T> {
  ok: boolean;
  code: string;
  message: string;
  body: ApiEnvelope<T> | null;
}

const CALL_TIMEOUT_MS = 60_000;

/** POSTs to a ULIP data endpoint (environment.endpoints[key]) and folds HTTP and body errors into one result. */
export function callDataApi<T>(http: HttpClient, endpointKey: string, payload: unknown): Observable<ApiResult<T>> {
  const path = (environment.endpoints as Record<string, string>)[endpointKey];
  return http.post<ApiEnvelope<T>>(`${environment.apiBaseUrl}${path}`, payload).pipe(
    timeout(CALL_TIMEOUT_MS),
    map(body => ({
      ok: String(body?.error) === 'false' && String(body?.code) === '200',
      code: String(body?.code ?? ''),
      message: body?.message || '',
      body
    })),
    catchError(err => of({
      ok: false,
      code: err?.name === 'TimeoutError' ? 'TIMEOUT' : String(err?.status ?? 'ERR'),
      message: err?.name === 'TimeoutError'
        ? 'The provider did not answer within 60 seconds. Try again.'
        : err?.status === 0
          ? 'Unable to reach the server. Check your connection.'
          : err?.error?.message || `HTTP ${err?.status} ${err?.statusText ?? ''}`.trim(),
      body: null
    }))
  );
}

/** Friendly hint for the codes the ULIP services return in the body. */
export function codeHint(code: string): string {
  switch (code) {
    case '400': return 'A required field is missing.';
    case '401': return 'Your session is not accepted by the API. Sign in again.';
    case '403': return 'This API is not enabled for your account. Request access in the API catalog.';
    case '404': return 'No quota is assigned to you for this API. Ask your administrator.';
    case '429': return 'Your quota for this API is used up. Ask your administrator for more.';
    case '599': return 'The operator has switched this provider off for now. Try again later.';
    case '500': return 'The provider failed to answer. Try again in a few minutes.';
    default: return '';
  }
}

/** Treats empty strings and the literal "null" some providers send as missing. */
export function present(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  const s = String(value).trim();
  return s !== '' && s.toLowerCase() !== 'null';
}

/** Google Maps link for "lat,long" or separate lat/long values, when they look valid. */
export function mapsLink(lat: unknown, lng?: unknown): string | null {
  let la: number;
  let lo: number;
  if (lng === undefined) {
    const parts = String(lat ?? '').split(',').map(p => parseFloat(p));
    [la, lo] = parts;
  } else {
    la = parseFloat(String(lat));
    lo = parseFloat(String(lng));
  }
  if (!isFinite(la) || !isFinite(lo) || (la === 0 && lo === 0)) {
    return null;
  }
  return `https://www.google.com/maps?q=${la},${lo}`;
}
