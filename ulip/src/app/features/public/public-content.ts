/** Copy for the public (signed-out) site. Company facts follow gativra.com/about. */

export interface DataSource {
  name: string;
  icon: string;
  authority: string;
  text: string;
  /** Slug of the public reference page, when there is one. */
  docs?: string;
  apis: number;
}

export const DATA_SOURCES: DataSource[] = [
  { name: 'Vahan', icon: 'car', authority: 'Vehicle registration', apis: 6,
    text: 'Registration, owner, fitness, insurance, permit and emission validity of any vehicle by its registration number.' },
  { name: 'Sarathi', icon: 'id-card', authority: 'Driving licence', apis: 1, docs: 'sarathi',
    text: 'Licence status, validity, holder details and the vehicle classes a driver may drive.' },
  { name: 'FASTag', icon: 'tag', authority: 'Highway tolls', apis: 2, docs: 'fastag-01',
    text: 'Toll-plaza crossings of a vehicle and the details of the FASTag issued to it.' },
  { name: 'FOIS', icon: 'train', authority: 'Rail freight', apis: 2, docs: 'fois-01',
    text: 'Track a rake by FNR, with last location and ETA, and calculate freight between two stations.' },
  { name: 'E-Way Bill', icon: 'file', authority: 'Goods movement', apis: 1, docs: 'ewaybill',
    text: 'Validity, status, PIN codes, HSN and vehicles of an e-way bill before goods move.' },
  { name: 'ICE GATE', icon: 'anchor', authority: 'Customs', apis: 13,
    text: 'IGM and EGM manifests, bills of entry, shipping bills, LEO and OOC dates, air cargo and e-seal status.' }
];

export const STEPS = [
  { icon: 'user', title: 'Create an account', text: 'Sign up with your work e-mail. Your organisation gets its own workspace and roles.' },
  { icon: 'sparkle', title: 'Try it in the sandbox', text: 'Sandbox access is approved instantly and comes with free credits to test every response.' },
  { icon: 'shield', title: 'Request production', text: 'Describe your use case. An administrator approves it and sets your quota.' },
  { icon: 'zap', title: 'Go live', text: 'Exchange your API key for a 15-minute token and call the API from your servers.' }
];

export const FEATURES = [
  { icon: 'shield', title: 'Role-based access', text: 'Admins, approvers and developers each see only the screens and APIs their role allows.' },
  { icon: 'key', title: 'Keys and short-lived tokens', text: 'Separate sandbox and production keys, exchanged for bearer tokens that expire in 15 minutes.' },
  { icon: 'chart', title: 'Usage and credits', text: 'Every call is metered against your quota, with usage per API and per day.' },
  { icon: 'history', title: 'Audit trail', text: 'Approvals, revocations and key changes are logged with who did what and when.' }
];

/** Gativra product families, from gativra.com. */
export const PRODUCT_FAMILIES = [
  { icon: 'truck', title: 'Gate & weighbridge', items: 'GateX · ANPRX · IWB · VBS' },
  { icon: 'apps', title: 'Warehouse', items: 'WMS · CountX' },
  { icon: 'anchor', title: 'Port, yard & rail', items: 'CraneX · YardX · Rail OCR' },
  { icon: 'map-pin', title: 'Fleet & road', items: 'MoveX · FuelX · ViolationX' },
  { icon: 'shield', title: 'Safety', items: 'SafeX · ProximityX' },
  { icon: 'building', title: 'Visitor & parking', items: 'VisitorX · ParkX' }
];

export const CONTACT = {
  tollFree: '1800-200-7775',
  phone: '(91) 22-40309800',
  site: 'https://gativra.com',
  address: 'International Technology Centre, CBD Belapur, Navi Mumbai'
};
