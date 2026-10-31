import { ApiDoc } from './doc.model';

/**
 * Sarathi (driving licence) reference. Behaviour documented from ulip-rest's SarathiServiceImpl:
 * POST /api/ulip/getSarathiDetails, ApiEnum.API_SARATHI = 2. Sample values are fictitious.
 */
export const SARATHI_DOC: ApiDoc = {
  slug: 'sarathi',
  title: 'Sarathi — Driving Licence Details',
  apiId: 2,
  category: 'Driver',
  portalPath: '/sarathi',
  summary: 'Look up a driving licence in the Parivahan Sarathi database by licence number and the holder\'s date of birth.',
  overview: [
    'Returns the licence record (status, issuing RTO, validity for transport and non-transport classes), the holder\'s personal details and address, the photograph and signature, the vehicle classes the licence covers and its transaction history.',
    'Both the licence number and the date of birth must match the Sarathi record. Typical uses are driver onboarding, KYC for transport operators and periodic licence-validity checks.',
    'The response passes through the Sarathi structure largely unchanged, so most fields keep their Sarathi names (dlLicno, bioFullName …). The tables below describe the fields that are useful in practice; others are present but usually empty or internal.'
  ],
  method: 'POST',
  path: '/api/ulip/getSarathiDetails',
  request: {
    description: 'JSON body, Content-Type: application/json.',
    fields: [
      {
        name: 'dlnumber', type: 'string', required: true,
        description: 'Driving licence number as printed on the licence. Case-insensitive (it is upper-cased); remove spaces and hyphens.',
        example: 'MH0120190012345'
      },
      {
        name: 'dob', type: 'string (date)', required: true,
        description: 'Licence holder\'s date of birth in ISO format yyyy-MM-dd. Any other format is rejected.',
        example: '1990-04-15'
      }
    ],
    example: { dlnumber: 'MH0120190012345', dob: '1990-04-15' }
  },
  recordPath: ['response', 0, 'response', 'dldetobj', 0],
  printField: ['dlobj', 'dlStatus'],
  recordNote: 'The licence record sits at response[0].response.dldetobj[0].',
  envelope: [
    { name: 'error', type: 'string', description: '"false" on success, "true" on failure. Compare as a string.' },
    { name: 'code', type: 'string', description: 'Result code — see Status codes. "200" means a record was returned.' },
    { name: 'message', type: 'string', description: 'Human-readable result, e.g. "Success" or "Data fetch from cache service".' },
    { name: 'response', type: 'array', description: 'Present on success. Usually one item; the licence record is at response[0].response.dldetobj[0].' },
    { name: 'response[0].responseStatus', type: 'string', description: 'Provider status for the lookup, e.g. "SUCCESS".' },
    { name: 'response[0].response.dldetobj', type: 'array', description: 'Licence records. Empty when the licence/DOB pair is not found.' }
  ],
  fieldGroups: [
    {
      title: 'Licence (dlobj)',
      path: 'response[0].response.dldetobj[0].dlobj',
      description: 'Status, issuing office and validity of the licence.',
      fields: [
        { name: 'dlLicno', type: 'string', description: 'Licence number.', example: 'MH0120190012345' },
        { name: 'dlOldLicno', type: 'string', description: 'Previous licence number if the licence was re-numbered.' },
        { name: 'dlStatus', type: 'string', description: 'Current licence status, e.g. "Active", "Suspended", "Expired".', example: 'Active' },
        { name: 'dlIssuedt', type: 'string (date)', description: 'Date the licence was first issued.', example: '2019-06-21' },
        { name: 'dlNtValdfrDt / dlNtValdtoDt', type: 'string (date)', description: 'Non-transport (private vehicles) validity from / to.', example: '2039-04-14' },
        { name: 'dlTrValdfrDt / dlTrValdtoDt', type: 'string (date)', description: 'Transport (commercial vehicles) validity from / to. Empty if the licence has no transport class.' },
        { name: 'dlHzValdtoDt', type: 'string (date)', description: 'Hazardous-goods endorsement validity, if any.' },
        { name: 'dlHlValdtoDt', type: 'string (date)', description: 'Hill-area endorsement validity, if any.' },
        { name: 'omRtoFullname', type: 'string', description: 'Issuing RTO office.', example: 'RTO MUMBAI (CENTRAL)' },
        { name: 'dlRtoCode', type: 'string', description: 'RTO code.', example: 'MH01' },
        { name: 'stateName / statecd', type: 'string', description: 'Issuing state name and code.', example: 'Maharashtra / MH' },
        { name: 'dlEndorseno / dlEndorsedt', type: 'string', description: 'Latest endorsement number and date.' },
        { name: 'dlIssueauth', type: 'string', description: 'Issuing authority.' },
        { name: 'dlRemarks', type: 'string', description: 'Remarks recorded by the RTO (e.g. suspension reason).' }
      ]
    },
    {
      title: 'Holder (bioObj)',
      path: 'response[0].response.dldetobj[0].bioObj',
      description: 'Personal details of the licence holder. Treat as personal data.',
      fields: [
        { name: 'bioFullName', type: 'string', description: 'Full name of the holder.', example: 'RAHUL SHARMA' },
        { name: 'bioFirstName / bioLastName', type: 'string', description: 'Name parts as recorded.' },
        { name: 'bioDob', type: 'string (date)', description: 'Date of birth on record.', example: '1990-04-15' },
        { name: 'bioGenderDesc', type: 'string', description: 'Gender description (bioGender holds the code).', example: 'Male' },
        { name: 'bioBloodGroupname', type: 'string', description: 'Blood group.', example: 'B+' },
        { name: 'bioCitiZen', type: 'string', description: 'Citizenship.', example: 'INDIA' },
        { name: 'bioSwdFullName', type: 'string', description: 'Father\'s / spouse\'s name (son/wife/daughter of).' },
        { name: 'bioDependentRelation', type: 'string', description: 'Relation of bioSwdFullName to the holder.' },
        { name: 'bioPermAdd1..3, bioPermVillTownName, bioPermSdName, bioPermDistName, bioPermPin', type: 'string', description: 'Permanent address lines, town, sub-district, district and PIN.' },
        { name: 'bioTempAdd1..3, bioTempVillTownName, bioTempSdName, bioTempDistName, bioTempPin', type: 'string', description: 'Present (temporary) address, same layout.' },
        { name: 'bioMobileNo / bioAltMobileNo', type: 'string', description: 'Mobile numbers if recorded; often masked or empty.' },
        { name: 'bioIdentityMark1 / bioIdentityMark2', type: 'string', description: 'Identification marks.' },
        { name: 'bioOrganDonor', type: 'string', description: 'Organ-donor flag, if recorded.' }
      ]
    },
    {
      title: 'Photo and signature (bioImgObj)',
      path: 'response[0].response.dldetobj[0].bioImgObj',
      fields: [
        { name: 'biPhoto', type: 'string (base64 JPEG)', description: 'Holder\'s photograph. Render with a data:image/jpeg;base64, prefix.' },
        { name: 'biSignature', type: 'string (base64 JPEG)', description: 'Holder\'s signature image.' }
      ]
    },
    {
      title: 'Vehicle classes (dlcovs[])',
      path: 'response[0].response.dldetobj[0].dlcovs',
      description: 'One entry per class of vehicle the licence authorises.',
      fields: [
        { name: 'covabbrv', type: 'string', description: 'Class abbreviation.', example: 'LMV' },
        { name: 'covdesc', type: 'string', description: 'Class description.', example: 'LIGHT MOTOR VEHICLE' },
        { name: 'vecatg', type: 'string', description: 'Category: NT (non-transport) or TR (transport).', example: 'NT' },
        { name: 'dcCovStatus', type: 'string', description: 'Status of this class on the licence.' },
        { name: 'dcIssuedt', type: 'string (date)', description: 'Date this class was added.' },
        { name: 'dcEndorsedt / dcEndorseNo', type: 'string', description: 'Endorsement date and number for this class.' },
        { name: 'olaName', type: 'string', description: 'Licensing office that endorsed the class.' }
      ]
    },
    {
      title: 'Transactions (transReqObj[])',
      path: 'response[0].response.dldetobj[0].transReqObj',
      description: 'History of applications on the licence (renewals, address change, duplicate …).',
      fields: [
        { name: 'trEntrydt', type: 'string (date)', description: 'Date of the transaction.' },
        { name: 'trName', type: 'string', description: 'Transaction type.', example: 'RENEWAL OF DL' },
        { name: 'olaOffName', type: 'string', description: 'Office that processed it.' }
      ]
    }
  ],
  statusCodes: [
    { code: '200', meaning: 'Record found (live, or served from cache).', action: 'Read response[0].response.dldetobj[0].', quota: 'Live call: 1. Cache: 0.' },
    { code: '400', meaning: 'dlnumber or dob missing.', action: 'Send both fields; dob as yyyy-MM-dd.', quota: 'None' },
    { code: '401', meaning: 'Token missing, invalid or expired, or user not found.', action: 'Get a new token from /oauth/token and retry.', quota: 'None' },
    { code: '403', meaning: 'Sarathi is not enabled for your account.', action: 'Request production access in the API catalog.', quota: 'None' },
    { code: '404', meaning: 'No quota assigned for Sarathi.', action: 'Ask your administrator to assign a quota.', quota: 'None' },
    { code: '429', meaning: 'Quota used up.', action: 'Ask your administrator to top up the quota.', quota: 'None' },
    { code: '500', meaning: 'Upstream or internal error, and no earlier result to fall back on.', action: 'Retry later with back-off; quote the time to support.', quota: '1 if Sarathi answered with an error, 0 if it could not be reached' },
    { code: '599', meaning: 'Sarathi calls are switched off temporarily by the operator.', action: 'Retry later.', quota: 'None' }
  ],
  notes: [
    {
      title: 'HTTP status is always 200',
      tone: 'warning',
      body: [
        'Errors are reported in the body, not the HTTP status: always check error === "false" and code === "200" before reading the record.',
        'Network-level failures (gateway timeout, TLS) still surface as HTTP errors and should be retried with back-off.'
      ]
    },
    {
      title: 'Quota and caching',
      body: [
        'Each live lookup uses one call from your Sarathi quota. Successful results are cached per licence number until the earliest validity end date on the licence (transport, non-transport, hazardous or hill), at most 30 days. Cached answers do not use quota. Licences that have already expired are not cached.',
        'The cache is keyed by licence number only, so a repeat lookup within the cache window returns the cached record.',
        'If Sarathi is unavailable, the last successful result for the licence may be returned with message "Data fetch from cache service". Treat it as possibly stale.',
        'In the sandbox, calls use sandbox credits instead of quota (see Usage & Credits).'
      ]
    },
    {
      title: 'Partial records',
      body: [
        'Sarathi sometimes answers with a reduced record (licence number, name, status, validity, issuing authority only). It is converted to the same structure, so the same fields are filled and the rest are empty. These answers are never cached.'
      ]
    },
    {
      title: 'Personal data',
      tone: 'warning',
      body: [
        'The response contains personal data (name, address, photo, signature). Request it only for the purpose stated in your access request, store the minimum you need, and never log the photo or signature.'
      ]
    }
  ],
  sampleResponse: {
    error: 'false',
    code: '200',
    message: 'Success',
    response: [
      {
        responseStatus: 'SUCCESS',
        message: null,
        response: {
          dldetobj: [
            {
              dlobj: {
                dlLicno: 'MH0120190012345',
                dlStatus: 'Active',
                dlIssuedt: '2019-06-21',
                dlNtValdfrDt: '2019-06-21',
                dlNtValdtoDt: '2039-04-14',
                dlTrValdtoDt: null,
                omRtoFullname: 'RTO MUMBAI (CENTRAL)',
                dlRtoCode: 'MH01',
                stateName: 'Maharashtra',
                statecd: 'MH'
              },
              bioObj: {
                bioFullName: 'RAHUL SHARMA',
                bioDob: '1990-04-15',
                bioGenderDesc: 'Male',
                bioBloodGroupname: 'B+',
                bioSwdFullName: 'SURESH SHARMA',
                bioPermAdd1: '12, SAMPLE HOUSING SOCIETY',
                bioPermDistName: 'MUMBAI',
                bioPermPin: '400001'
              },
              bioImgObj: { biPhoto: '/9j/4AAQSkZJRgABAQ…', biSignature: '/9j/4AAQSkZJRgABAQ…' },
              dlcovs: [
                { covabbrv: 'LMV', covdesc: 'LIGHT MOTOR VEHICLE', vecatg: 'NT', dcIssuedt: '2019-06-21' },
                { covabbrv: 'MCWG', covdesc: 'MOTOR CYCLE WITH GEAR', vecatg: 'NT', dcIssuedt: '2019-06-21' }
              ],
              transReqObj: [
                { trEntrydt: '2019-06-21', trName: 'ISSUE OF DRIVING LICENCE', olaOffName: 'RTO MUMBAI (CENTRAL)' }
              ]
            }
          ]
        }
      }
    ]
  },
  errorSample: {
    response: null,
    error: 'true',
    code: '429',
    message: 'Limit exceeded for Sarathi service'
  }
};
