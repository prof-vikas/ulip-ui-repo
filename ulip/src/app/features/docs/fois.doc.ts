import { ApiDoc } from './doc.model';
import { HTTP_200_NOTE, envelopeFields, quotaNote, standardCodes } from './doc.common';

/**
 * FOIS (Indian Railways freight) references, documented from ulip-rest FoisServiceImpl:
 *  01 — POST /api/ulip/getFoisDetails     (ApiEnum.API_FOIS = 4)       rake tracking by FNR
 *  02 — POST /api/ulip/getFoisDetails/02  (ApiEnum.API_FOIS_TWO = 6)   freight calculation
 * (/getFoisDetails/combined exists but returns nothing yet, so it is not documented.)
 * Sample values are fictitious.
 */

export const FOIS_01_DOC: ApiDoc = {
  slug: 'fois-01',
  title: 'FOIS 01 — Rake Tracking by FNR',
  apiId: 4,
  category: 'Rail freight',
  portalPath: '/fois/01',
  summary: 'Where a railway freight consignment is now: current status, last reported station, locomotive and ETA, by Forwarding Note Number (FNR).',
  overview: [
    'Returns the live position of a rake booked through Indian Railways FOIS: origin and destination station, commodity, current status, last reported location and time, locomotive number, coordinates and the expected arrival at destination.',
    'Use it for shipment tracking dashboards and to alert consignees before arrival.',
    'An FNR is issued when the consignment is booked; it appears on the Railway Receipt (RR).'
  ],
  method: 'POST',
  path: '/api/ulip/getFoisDetails',
  request: {
    description: 'JSON body, Content-Type: application/json.',
    fields: [
      { name: 'fnrnumber', type: 'string', required: true, description: 'Forwarding Note Number from the Railway Receipt.', example: '24211017345' }
    ],
    example: { fnrnumber: '24211017345' }
  },
  recordPath: ['response', 0, 'response', 0],
  printField: ['currentStatus'],
  recordNote: 'The tracking record is the first entry of the list at response[0].response.',
  envelope: envelopeFields('response[0].response', 'List of tracking records for the FNR (normally one).'),
  fieldGroups: [
    {
      title: 'Tracking record (response[0].response[])',
      path: 'response[0].response[0]',
      fields: [
        { name: 'fnrNo', type: 'string', description: 'FNR the record belongs to.', example: '24211017345' },
        { name: 'newFnr', type: 'string', description: 'Replacement FNR if the consignment was re-booked; otherwise empty.' },
        { name: 'stationFrom / stationTo', type: 'string', description: 'Origin and destination station codes.', example: 'JSG / BPQ' },
        { name: 'cmdt', type: 'string', description: 'Commodity carried.', example: 'COAL' },
        { name: 'currentStatus', type: 'string', description: 'Current movement status of the rake.', example: 'IN TRANSIT' },
        { name: 'lastRepLocn', type: 'string', description: 'Last station that reported the rake.', example: 'NAGPUR (NGP)' },
        { name: 'lastRepStts', type: 'string', description: 'Status reported at that station, with time.', example: 'DEPARTED 30-10-2026 22:15' },
        { name: 'locoNumb', type: 'string', description: 'Locomotive hauling the rake.', example: '41234' },
        { name: 'lttd / lgtd', type: 'string (decimal degrees)', description: 'Latitude and longitude of the last reported position.', example: '21.1458 / 79.0882' },
        { name: 'etaDstn', type: 'string (date-time)', description: 'Expected arrival at the destination.', example: '01-11-2026 14:30' }
      ]
    }
  ],
  statusCodes: standardCodes({
    missingInput: 'FRN number is required',
    notMapped: 'FOIS service not avaiable to this user',
    exhausted: 'Limit exceed for FOIS service'
  }),
  notes: [
    HTTP_200_NOTE,
    quotaNote(['Positions update only when the rake passes a reporting station, so polling more often than every 30–60 minutes rarely shows anything new.']),
    {
      title: 'Re-booked consignments',
      body: ['If newFnr is filled, the consignment continues under that FNR. Track the new number from then on.']
    }
  ],
  sampleResponse: {
    error: 'false',
    code: '200',
    message: 'Success',
    response: [
      {
        responseStatus: 'SUCCESS',
        response: [
          {
            fnrNo: '24211017345',
            newFnr: '',
            stationFrom: 'JSG',
            stationTo: 'BPQ',
            cmdt: 'COAL',
            currentStatus: 'IN TRANSIT',
            lastRepLocn: 'NAGPUR (NGP)',
            lastRepStts: 'DEPARTED 30-10-2026 22:15',
            locoNumb: '41234',
            lttd: '21.1458',
            lgtd: '79.0882',
            etaDstn: '01-11-2026 14:30'
          }
        ]
      }
    ]
  },
  errorSample: { error: 'true', code: '400', message: 'FRN number is required', response: null }
};

export const FOIS_02_DOC: ApiDoc = {
  slug: 'fois-02',
  title: 'FOIS 02 — Freight Calculation',
  apiId: 6,
  category: 'Rail freight',
  portalPath: '/fois/02',
  summary: 'Railway freight for a commodity between two stations in a given wagon type: distance, route, rate class, charges, GST and ETA.',
  overview: [
    'Calculates the freight Indian Railways would charge to move a commodity from one station to another, both for a full train load (fields starting with tran…) and for a single wagon (fields starting with wgon…).',
    'The answer includes the chargeable distance and route, the rate class, basic freight, surcharges, rebates, other charges, GST and the total, plus alternative routes and an estimated transit time.',
    'Use it for quoting, mode comparison (rail vs road) and budget checks before booking.'
  ],
  method: 'POST',
  path: '/api/ulip/getFoisDetails/02',
  request: {
    description: 'JSON body, Content-Type: application/json. All four fields are required; codes are Indian Railways (FOIS) codes.',
    fields: [
      { name: 'sttnfrom', type: 'string', required: true, description: 'Origin station code.', example: 'JSG' },
      { name: 'sttnto', type: 'string', required: true, description: 'Destination station code.', example: 'BPQ' },
      { name: 'cmdt', type: 'string', required: true, description: 'Commodity code as used in the railway freight tariff.', example: 'COAL' },
      { name: 'wgontype', type: 'string', required: true, description: 'Wagon type code.', example: 'BOXN' }
    ],
    example: { sttnfrom: 'JSG', sttnto: 'BPQ', cmdt: 'COAL', wgontype: 'BOXN' }
  },
  recordPath: ['response', 0, 'response', 'frgt'],
  printField: ['trantotlfrgt'],
  recordNote: 'The calculation is at response[0].response.frgt; response[0].response.stts says whether it succeeded.',
  envelope: [
    ...envelopeFields('response[0].response', 'Holds stts (status) and frgt (the calculation).'),
    { name: 'response[0].response.stts.successFailFlag', type: 'string', description: 'Provider flag for the calculation, e.g. "S" for success, "F" for failure.' },
    { name: 'response[0].response.stts.error', type: 'string', description: 'Provider error text when the calculation failed (e.g. unknown station or commodity).' },
    { name: 'response[0].response.stts.evntCode', type: 'string', description: 'Provider event code.' }
  ],
  fieldGroups: [
    {
      title: 'Route and timing',
      path: 'response[0].response.frgt',
      fields: [
        { name: 'dist', type: 'string (km)', description: 'Chargeable distance.', example: '812' },
        { name: 'routInfo', type: 'string', description: 'Route used for the calculation.' },
        { name: 'viaDesc', type: 'string', description: 'Via stations of the route.' },
        { name: 'atlrout[]', type: 'array of { sttnfrom, sttnto }', description: 'Alternative route legs.' },
        { name: 'ETA', type: 'string', description: 'Estimated transit time.', example: '3 days' },
        { name: 'rakeSize / minmRake / miniRake', type: 'string', description: 'Standard rake size and the minimum / mini rake sizes allowed for train-load rates.', example: '58 / 40 / 20' },
        { name: 'PCC', type: 'string (tonnes)', description: 'Permissible carrying capacity per wagon.', example: '63' },
        { name: 'CCInfo', type: 'string', description: 'Carrying-capacity notes.' }
      ]
    },
    {
      title: 'Train-load freight (tran…)',
      path: 'response[0].response.frgt',
      description: 'Charges for a full rake. The same set exists per wagon with the wgon… prefix.',
      fields: [
        { name: 'rateTL / cmdtClssTL / tranloadclss', type: 'string', description: 'Train-load rate, commodity class and load class.', example: '1,234.50 / 145 / TL' },
        { name: 'totlchblwght', type: 'string (tonnes)', description: 'Total chargeable weight of the rake.', example: '3,654' },
        { name: 'tranbascfrgt', type: 'string (₹)', description: 'Basic freight.' },
        { name: 'transurchrg / transurcont', type: 'string', description: 'Surcharge amount and its percentage.' },
        { name: 'transurchrgdtls[]', type: 'array', description: 'Surcharge break-up: { desc, prcn, rebtcode, rebtamnt }.' },
        { name: 'tranrebtamount / tranrebtprcen / tranrebtrmrk', type: 'string', description: 'Rebate amount, percentage and remark.' },
        { name: 'tranrebtchrgdtls[]', type: 'array', description: 'Rebate break-up, same shape as surcharges.' },
        { name: 'tranothrchrg / tranothrchrgdtls[]', type: 'string / array', description: 'Other charges (terminal, siding …) and their break-up.' },
        { name: 'tranloadfrgt', type: 'string (₹)', description: 'Freight after load-class adjustments.' },
        { name: 'tranfinlfrgt', type: 'string (₹)', description: 'Freight after surcharges and rebates.' },
        { name: 'trangsttax / tranfrgttax', type: 'string (₹)', description: 'GST on freight.' },
        { name: 'tranfrgttaxwrds', type: 'string', description: 'Tax amount in words.' },
        { name: 'trantotlfrgt', type: 'string (₹)', description: 'Total freight payable for the train load.', example: '45,67,890' },
        { name: 'tranfullamount', type: 'string (₹)', description: 'Total including all charges.' },
        { name: 'tranntr', type: 'string', description: 'Nature of the freight (provider code).' }
      ]
    },
    {
      title: 'Wagon-load freight (wgon…)',
      path: 'response[0].response.frgt',
      description: 'Same meaning as the tran… fields, for one wagon.',
      fields: [
        { name: 'rateWL / cmdtClssWL / wgonloadclss', type: 'string', description: 'Wagon-load rate, commodity class and load class.' },
        { name: 'wgonchblwght', type: 'string (tonnes)', description: 'Chargeable weight of one wagon.' },
        { name: 'wgonbascfrgt, wgonsurchrg, wgonrebtamount, wgonothrchrg', type: 'string (₹)', description: 'Basic freight, surcharge, rebate and other charges per wagon.' },
        { name: 'wgonfinlfrgt, wgongsttax, wgontotlfrgt, wgonfullamount', type: 'string (₹)', description: 'Final freight, GST, total freight and full amount per wagon.' }
      ]
    }
  ],
  statusCodes: standardCodes({
    missingInput: 'Commodity is required / Station From is required / Station To is required / Wagon Type is required',
    notMapped: 'FOIS 2 service not avaiable to this user',
    exhausted: 'Limit exceed for FOIS 2 service',
    killSwitch: false
  }),
  notes: [
    HTTP_200_NOTE,
    {
      title: 'Check stts as well as code',
      tone: 'warning',
      body: ['code "200" means the provider answered. Whether the freight could be calculated is in response[0].response.stts — with an unknown station, commodity or wagon type the provider answers with a failure flag and an error text, and frgt is empty.']
    },
    quotaNote(['Freight rates change only with tariff revisions, so a calculation for the same route, commodity and wagon type can safely be cached for a day or more.']),
    {
      title: 'Amounts are text',
      body: ['All amounts and weights are strings as formatted by the provider (they may contain commas). Strip separators before parsing them as numbers.']
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
          stts: { successFailFlag: 'S', error: '', evntCode: '' },
          frgt: {
            dist: '812',
            routInfo: 'JSG-NGP-BPQ',
            viaDesc: 'NGP',
            ETA: '3 days',
            rakeSize: '58',
            minmRake: '40',
            miniRake: '20',
            PCC: '63',
            rateTL: '1234.50',
            cmdtClssTL: '145',
            totlchblwght: '3654',
            tranbascfrgt: '4510863',
            transurchrg: '0',
            tranrebtamount: '0',
            tranothrchrg: '0',
            tranfinlfrgt: '4510863',
            trangsttax: '225543',
            trantotlfrgt: '4736406',
            rateWL: '1358.00',
            wgonchblwght: '63',
            wgonbascfrgt: '85554',
            wgongsttax: '4278',
            wgontotlfrgt: '89832',
            atlrout: [{ sttnfrom: 'JSG', sttnto: 'R' }, { sttnfrom: 'R', sttnto: 'BPQ' }],
            transurchrgdtls: [],
            tranrebtchrgdtls: [],
            tranothrchrgdtls: []
          }
        }
      }
    ]
  },
  errorSample: { error: 'true', code: '400', message: 'Wagon Type is required', response: null }
};
