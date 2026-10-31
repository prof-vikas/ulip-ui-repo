import { DocField, DocNote, DocStatusCode } from './doc.model';

/**
 * Behaviour shared by the ULIP data APIs in ulip-rest (*ServiceImpl): user check, input check,
 * operator kill switch, API mapping, quota, then one upstream call that uses one unit of quota.
 */

export function envelopeFields(recordPath: string, recordDescription: string): DocField[] {
  return [
    { name: 'error', type: 'string', description: '"false" on success, "true" on failure. Compare as a string.' },
    { name: 'code', type: 'string', description: 'Result code — see Status codes. "200" means data was returned.' },
    { name: 'message', type: 'string', description: 'Human-readable result, e.g. "Success" or the reason for a failure.' },
    { name: 'response', type: 'array', description: 'Present on success, usually one item; null on failure.' },
    { name: 'response[0].responseStatus', type: 'string', description: 'Provider status for the lookup, e.g. "SUCCESS".' },
    { name: recordPath, type: 'object / array', description: recordDescription }
  ];
}

/**
 * Status codes every data API returns in the body. `messages` are the service-specific texts.
 * Pass killSwitch=false for services that skip the operator's "ULIP disabled" check.
 */
export function standardCodes(opts: {
  missingInput: string;
  notMapped: string;
  exhausted: string;
  killSwitch?: boolean;
}): DocStatusCode[] {
  const codes: DocStatusCode[] = [
    { code: '200', meaning: 'Data returned by the provider.', action: 'Read the record (see Response).', quota: '1' },
    { code: '400', meaning: `Required input missing — "${opts.missingInput}".`, action: 'Send every required field.', quota: 'None' },
    { code: '401', meaning: 'Token missing, invalid or expired, or user not found.', action: 'Get a new token from /oauth/token and retry.', quota: 'None' },
    { code: '403', meaning: `This API is not enabled for your account — "${opts.notMapped}".`, action: 'Request production access in the API catalog.', quota: 'None' },
    { code: '404', meaning: 'No quota assigned for this API — "No quota avaiable this user".', action: 'Ask your administrator to assign a quota.', quota: 'None' },
    { code: '429', meaning: `Quota used up — "${opts.exhausted}".`, action: 'Ask your administrator to top up the quota.', quota: 'None' },
    { code: '500', meaning: 'Upstream or internal error — "INTERNAL SERVER ERROR".', action: 'Retry later with back-off; quote the time to support.', quota: '0 if the provider could not be reached, otherwise 1' }
  ];
  if (opts.killSwitch !== false) {
    codes.push({ code: '599', meaning: 'Calls to this provider are switched off temporarily by the operator.', action: 'Retry later.', quota: 'None' });
  }
  return codes;
}

export const HTTP_200_NOTE: DocNote = {
  title: 'HTTP status is always 200',
  tone: 'warning',
  body: [
    'Errors are reported in the body, not the HTTP status: check error === "false" and code === "200" before reading the data.',
    'Network-level failures (gateway timeout, TLS) still surface as HTTP errors and should be retried with back-off.'
  ]
};

export function quotaNote(extra: string[] = []): DocNote {
  return {
    title: 'Quota',
    body: [
      'Every call that reaches the provider uses one unit of your quota for this API, whatever the provider answers (including "not found"). Calls rejected before that — missing input, no access, no quota — are free.',
      'Results are not cached: repeating a lookup calls the provider again and uses quota again, so cache results on your side when you can.',
      'In the sandbox, calls use sandbox credits instead of quota (see Usage & Credits).',
      ...extra
    ]
  };
}
