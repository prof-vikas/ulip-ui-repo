import { ApiDoc } from './doc.model';
import { HTTP_200_NOTE, envelopeFields, quotaNote, standardCodes } from './doc.common';

/**
 * FASTag references, documented from ulip-rest FastagServiceImpl:
 *  01 — POST /api/ulip/getFastagDetails     (ApiEnum.API_FAST_TAG = 1)
 *  02 — POST /api/ulip/getFastagTwoDetails  (ApiEnum.API_FAST_TAG_TWO = 8)
 * Sample values are fictitious.
 */

export const FASTAG_01_DOC: ApiDoc = {
  slug: 'fastag-01',
  title: 'FASTag 01 — Toll Plaza Crossings',
  apiId: 1,
  category: 'Vehicle tracking',
  portalPath: '/fastag/01',
  summary: 'Recent toll-plaza crossings of a vehicle, read from its FASTag: which plaza, when, and in which direction.',
  overview: [
    'Given a vehicle registration number, returns the FASTag reads recorded at toll plazas for that vehicle: plaza name and geo-location, lane direction, read time and the vehicle class charged.',
    'Typical uses are trip tracking and ETA estimation for trucks, verifying that a consignment actually travelled the declared route, and dispute checks on toll charges.',
    'The list contains the reads the provider returns for the vehicle (a recent window, not the full history). An empty list means no reads were found, not that the vehicle has no tag — use FASTag 02 to check the tag itself.'
  ],
  method: 'POST',
  path: '/api/ulip/getFastagDetails',
  request: {
    description: 'JSON body, Content-Type: application/json.',
    fields: [
      {
        name: 'vehiclenumber', type: 'string', required: true,
        description: 'Vehicle registration number without spaces or hyphens. Case-insensitive (it is upper-cased).',
        example: 'MH12AB1234'
      }
    ],
    example: { vehiclenumber: 'MH12AB1234' }
  },
  recordPath: ['response', 0, 'response', 'vehicle', 'vehltxnList', 'txn'],
  printField: [0, 'tollPlazaName'],
  recordNote: 'The toll reads are the list at response[0].response.vehicle.vehltxnList.txn.',
  envelope: [
    ...envelopeFields('response[0].response', 'Provider answer: result, respCode, ts and the vehicle block below.'),
    { name: 'response[0].response.result', type: 'string', description: 'Provider result, e.g. "SUCCESS" or "FAILURE".' },
    { name: 'response[0].response.respCode', type: 'string', description: 'Provider response code; "000" means success.' },
    { name: 'response[0].response.ts', type: 'string (date-time)', description: 'Time the provider produced the answer.' },
    { name: 'response[0].response.vehicle.errCode', type: 'string', description: 'Vehicle-level code; "000" when reads were found.' }
  ],
  fieldGroups: [
    {
      title: 'Read list (vehltxnList)',
      path: 'response[0].response.vehicle.vehltxnList',
      description: 'Counters describing the list. Large results may be split across messages.',
      fields: [
        { name: 'totalTagsInresponse', type: 'string (number)', description: 'Number of reads in this response.', example: '3' },
        { name: 'totalTagsInMsg', type: 'string (number)', description: 'Number of reads in this message.' },
        { name: 'msgNum / totalMsg', type: 'string (number)', description: 'This message\'s number and the total number of messages.', example: '1 / 1' },
        { name: 'txn', type: 'array', description: 'The reads, see below.' }
      ]
    },
    {
      title: 'Toll read (txn[])',
      path: 'response[0].response.vehicle.vehltxnList.txn[]',
      description: 'One entry per time the tag was read at a toll lane.',
      fields: [
        { name: 'readerReadTime', type: 'string (date-time)', description: 'When the toll reader read the tag.', example: '2026-10-30 21:47:12.0' },
        { name: 'tollPlazaName', type: 'string', description: 'Toll plaza name.', example: 'KHED SHIVAPUR' },
        { name: 'tollPlazaGeocode', type: 'string', description: 'Plaza location as "latitude,longitude".', example: '18.3456,73.8521' },
        { name: 'laneDirection', type: 'string', description: 'Direction of the lane the vehicle used (as reported by the plaza, e.g. N, S, E, W).', example: 'N' },
        { name: 'vehicleType', type: 'string', description: 'Vehicle class the plaza charged (NHAI class code).', example: 'VC10' },
        { name: 'vehicleRegNo', type: 'string', description: 'Registration number linked to the tag.', example: 'MH12AB1234' },
        { name: 'seqNo', type: 'string', description: 'Sequence number of the read in the provider\'s list.', example: '1' }
      ]
    }
  ],
  statusCodes: standardCodes({
    missingInput: 'Vehicle number is required',
    notMapped: 'Fast Tag service not avaiable to this user',
    exhausted: 'Limit exceed for fastTag service'
  }),
  notes: [
    HTTP_200_NOTE,
    quotaNote(),
    {
      title: 'Reading the result',
      body: [
        'Sort txn by readerReadTime to rebuild the route; the provider does not promise an order.',
        'Use tollPlazaGeocode for maps and ETA. Plaza names are not unique across states.'
      ]
    },
    {
      title: 'Personal data',
      tone: 'warning',
      body: ['Toll reads reveal where a vehicle has been. Use them only for the purpose stated in your access request and keep them no longer than needed.']
    }
  ],
  sampleResponse: {
    error: 'false',
    code: '200',
    message: 'Success',
    response: [
      {
        responseStatus: 'SUCCESS',
        response: {
          result: 'SUCCESS',
          respCode: '000',
          ts: '2026-10-31T10:15:04',
          vehicle: {
            errCode: '000',
            vehltxnList: {
              totalTagsInresponse: '2',
              totalTagsInMsg: '2',
              msgNum: '1',
              totalMsg: '1',
              txn: [
                {
                  seqNo: '1',
                  readerReadTime: '2026-10-30 21:47:12.0',
                  tollPlazaName: 'KHED SHIVAPUR',
                  tollPlazaGeocode: '18.3456,73.8521',
                  laneDirection: 'N',
                  vehicleType: 'VC10',
                  vehicleRegNo: 'MH12AB1234'
                },
                {
                  seqNo: '2',
                  readerReadTime: '2026-10-30 19:02:40.0',
                  tollPlazaName: 'ANEWADI',
                  tollPlazaGeocode: '17.7712,74.0011',
                  laneDirection: 'N',
                  vehicleType: 'VC10',
                  vehicleRegNo: 'MH12AB1234'
                }
              ]
            }
          }
        }
      }
    ]
  },
  errorSample: { error: 'true', code: '400', message: 'Vehicle number is required', response: null }
};

export const FASTAG_02_DOC: ApiDoc = {
  slug: 'fastag-02',
  title: 'FASTag 02 — Tag Details',
  apiId: 8,
  category: 'Vehicle tracking',
  portalPath: '/fastag/02',
  summary: 'Details of the FASTag issued to a vehicle — tag id, status, class and issuing bank — by registration number or tag id.',
  overview: [
    'Returns the FASTag record(s) for a vehicle: tag id, tag status (active, blacklisted …), vehicle class, issuing bank and related attributes.',
    'Use it to check that a vehicle has a working tag before dispatch, or to resolve a tag id seen elsewhere to a registration number.',
    'The details come back as a list of name/value pairs, so new attributes from the provider appear without a change on your side. Read them by name rather than by position.'
  ],
  method: 'POST',
  path: '/api/ulip/getFastagTwoDetails',
  request: {
    description: 'JSON body, Content-Type: application/json. Send vehiclenumber, tagid, or both — at least one is needed for a useful answer (the service does not reject an empty body itself, so the provider\'s answer will then be an error).',
    fields: [
      {
        name: 'vehiclenumber', type: 'string', required: false,
        description: 'Vehicle registration number without spaces or hyphens. Case-insensitive (it is upper-cased).',
        example: 'MH12AB1234'
      },
      {
        name: 'tagid', type: 'string', required: false,
        description: 'FASTag id (EPC / tag id printed on the tag). Case-insensitive (it is upper-cased).',
        example: '34161FA82032D4A40200C3E0'
      }
    ],
    example: { vehiclenumber: 'MH12AB1234' }
  },
  recordPath: ['response', 0, 'response', 'vehicle', 'vehicledetails', 0, 'detail'],
  printField: [0, 'value'],
  recordNote: 'Each tag is one entry of response[0].response.vehicle.vehicledetails; its attributes are the name/value list in detail.',
  envelope: [
    ...envelopeFields('response[0].response', 'Provider answer: result, counts and the vehicle block below.'),
    { name: 'response[0].message', type: 'string', description: 'Provider message for the item, if any.' },
    { name: 'response[0].response.result / respCode', type: 'string', description: 'Provider result and code; respCode "000" means success.' },
    { name: 'response[0].response.totReqCnt / successReqCnt', type: 'string (number)', description: 'Number of lookups in the request and how many succeeded.' },
    { name: 'response[0].response.vehicle.errCode', type: 'string', description: 'Vehicle-level code; "000" when a tag was found.' }
  ],
  fieldGroups: [
    {
      title: 'Tag attributes (vehicledetails[].detail[])',
      path: 'response[0].response.vehicle.vehicledetails[i].detail[]',
      description: 'Name/value pairs. The names below are the ones the provider usually sends; treat any name as optional.',
      fields: [
        { name: 'TAGID', type: 'string', description: 'FASTag id.', example: '34161FA82032D4A40200C3E0' },
        { name: 'REGNUMBER', type: 'string', description: 'Registration number linked to the tag.', example: 'MH12AB1234' },
        { name: 'TID', type: 'string', description: 'Tag hardware id.' },
        { name: 'VEHICLECLASS', type: 'string', description: 'NHAI vehicle class code.', example: 'VC10' },
        { name: 'TAGSTATUS', type: 'string', description: 'Tag status, e.g. A (active), B (blacklisted), C (closed).', example: 'A' },
        { name: 'ISSUEDATE', type: 'string (date)', description: 'Date the tag was issued.', example: '2022-03-15' },
        { name: 'EXCCODE', type: 'string', description: 'Exception code on the tag (e.g. low balance, blacklist reason); "00" when none.', example: '00' },
        { name: 'BANKID', type: 'string', description: 'Issuing bank.', example: 'ICICI Bank' },
        { name: 'COMVEHICLE', type: 'string', description: 'Commercial vehicle flag (T/F).', example: 'T' }
      ]
    }
  ],
  statusCodes: standardCodes({
    missingInput: 'not checked by this API — see Request',
    notMapped: 'Fast Tag Two service not avaiable to this user',
    exhausted: 'Limit exceed for fastTag service'
  }).filter(c => c.code !== '400'),
  notes: [
    HTTP_200_NOTE,
    quotaNote(),
    {
      title: 'Reading the result',
      body: [
        'Turn each detail list into a map: Object.fromEntries(detail.map(d => [d.name, d.value])).',
        'A vehicle can have more than one tag on record (old and new); check TAGSTATUS and ISSUEDATE to pick the current one.'
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
          result: 'SUCCESS',
          respCode: '000',
          ts: '2026-10-31T10:16:22',
          totReqCnt: '1',
          successReqCnt: '1',
          vehicle: {
            errCode: '000',
            vehicledetails: [
              {
                detail: [
                  { name: 'TAGID', value: '34161FA82032D4A40200C3E0' },
                  { name: 'REGNUMBER', value: 'MH12AB1234' },
                  { name: 'VEHICLECLASS', value: 'VC10' },
                  { name: 'TAGSTATUS', value: 'A' },
                  { name: 'ISSUEDATE', value: '2022-03-15' },
                  { name: 'EXCCODE', value: '00' },
                  { name: 'BANKID', value: 'ICICI Bank' },
                  { name: 'COMVEHICLE', value: 'T' }
                ]
              }
            ]
          }
        }
      }
    ]
  },
  errorSample: { error: 'true', code: '403', message: 'Fast Tag Two service not avaiable to this user', response: null }
};
