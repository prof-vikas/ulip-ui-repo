import { ApiDoc } from './doc.model';
import { HTTP_200_NOTE, envelopeFields, quotaNote, standardCodes } from './doc.common';

/**
 * E-Way Bill reference, documented from ulip-rest EWayBillServiceImpl:
 * POST /api/ulip/getEWayBillDetails (ApiEnum.API_E_WAY_BILLS = 5). Sample values are fictitious.
 */
export const EWAYBILL_DOC: ApiDoc = {
  slug: 'ewaybill',
  title: 'E-Way Bill — Bill Details',
  apiId: 5,
  category: 'Goods movement',
  portalPath: '/ewaybill',
  summary: 'Status, validity, origin/destination PIN codes, HSN code and the vehicles assigned to a GST e-way bill.',
  overview: [
    'Given an e-way bill number, returns the bill\'s generation date, validity, current status, the from and to PIN codes, the HSN code of the goods and the list of vehicles the bill has been assigned to (Part-B updates), with the mode of transport.',
    'Typical uses are checking that a consignment is covered by a valid e-way bill before loading, matching the vehicle on the bill against the vehicle at the gate, and tracking hand-overs between vehicles.'
  ],
  method: 'POST',
  path: '/api/ulip/getEWayBillDetails',
  request: {
    description: 'JSON body, Content-Type: application/json.',
    fields: [
      {
        name: 'ewbNo', type: 'string', required: true,
        description: '12-digit e-way bill number, digits only. Send it as a string so leading digits are kept.',
        example: '101000609218'
      }
    ],
    example: { ewbNo: '101000609218' }
  },
  recordPath: ['response', 0, 'response'],
  printField: ['validUpto'],
  recordNote: 'The bill sits at response[0].response.',
  envelope: envelopeFields('response[0].response', 'The e-way bill record, see below.'),
  fieldGroups: [
    {
      title: 'E-way bill (response[0].response)',
      path: 'response[0].response',
      fields: [
        { name: 'ewbNo', type: 'number', description: 'E-way bill number (returned as a JSON number).', example: '101000609218' },
        { name: 'ewayBillDate', type: 'string (date-time)', description: 'When the bill was generated.', example: '30/10/2026 11:42:00 AM' },
        { name: 'validUpto', type: 'string (date-time)', description: 'End of validity. Movement after this time needs an extension.', example: '01/11/2026 11:59:00 PM' },
        { name: 'status', type: 'string', description: 'Bill status as reported by the GST system (e.g. ACT for active, CNL for cancelled).', example: 'ACT' },
        { name: 'fromPincode', type: 'number', description: 'PIN code of the place of dispatch.', example: '411019' },
        { name: 'toPincode', type: 'number', description: 'PIN code of the place of delivery.', example: '560058' },
        { name: 'hsnCode', type: 'string', description: 'HSN code of the (main) goods.', example: '84295200' },
        { name: 'vehiclListDetails', type: 'array', description: 'Vehicles assigned to the bill, see below. Note the spelling: vehiclListDetails.' }
      ]
    },
    {
      title: 'Vehicle assignments (vehiclListDetails[])',
      path: 'response[0].response.vehiclListDetails[]',
      description: 'One entry per Part-B update; the latest entry is the vehicle currently carrying the goods.',
      fields: [
        { name: 'vehicleNo', type: 'string', description: 'Vehicle registration number.', example: 'MH12AB1234' },
        { name: 'enteredDate', type: 'string (date-time)', description: 'When the vehicle was assigned.', example: '30/10/2026 11:45:00 AM' },
        { name: 'transMode', type: 'string', description: 'Mode of transport (1 road, 2 rail, 3 air, 4 ship).', example: '1' }
      ]
    }
  ],
  statusCodes: standardCodes({
    missingInput: 'Vehicle number is required',
    notMapped: 'E-WayBill service not avaiable to this user',
    exhausted: 'Limit exceed for E-WayBill service'
  }),
  notes: [
    HTTP_200_NOTE,
    quotaNote(),
    {
      title: 'Message on missing input',
      body: ['When ewbNo is missing, the 400 message currently reads "Vehicle number is required". It refers to the e-way bill number; match on code "400" rather than the text.']
    },
    {
      title: 'Validity checks',
      body: [
        'A bill is usable only when status is active and validUpto is in the future. Compare validUpto in Indian Standard Time.',
        'Sort vehiclListDetails by enteredDate to find the vehicle currently assigned.'
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
        response: {
          ewbNo: 101000609218,
          ewayBillDate: '30/10/2026 11:42:00 AM',
          validUpto: '01/11/2026 11:59:00 PM',
          status: 'ACT',
          fromPincode: 411019,
          toPincode: 560058,
          hsnCode: '84295200',
          vehiclListDetails: [
            { vehicleNo: 'MH12AB1234', enteredDate: '30/10/2026 11:45:00 AM', transMode: '1' }
          ]
        }
      }
    ]
  },
  errorSample: { response: null, error: 'true', code: '429', message: 'Limit exceed for E-WayBill service' }
};
