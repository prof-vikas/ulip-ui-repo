/**
 * Index of the built-in API reference pages. Kept tiny because the shell imports it (for the docs link
 * above each API page); the full content lives in *.doc.ts files loaded with the docs page.
 */
export interface ApiDocEntry {
  slug: string;
  title: string;
  /** Portal page of the API, relative to /dashboard ('' when the portal has no page for it). */
  portalPath: string;
  apiId: number;
  category: string;
  summary: string;
}

export const API_DOCS: ApiDocEntry[] = [
  { slug: 'fastag-01', title: 'FASTag 01 — Toll Plaza Crossings', portalPath: '/fastag/01', apiId: 1, category: 'Vehicle tracking',
    summary: 'Toll-plaza reads of a vehicle: plaza, time, direction and location.' },
  { slug: 'fastag-02', title: 'FASTag 02 — Tag Details', portalPath: '/fastag/02', apiId: 8, category: 'Vehicle tracking',
    summary: 'Tag id, status, class and issuing bank by registration number or tag id.' },
  { slug: 'fois-01', title: 'FOIS 01 — Rake Tracking by FNR', portalPath: '/fois/01', apiId: 4, category: 'Rail freight',
    summary: 'Current status, last location and ETA of a rail consignment.' },
  { slug: 'fois-02', title: 'FOIS 02 — Freight Calculation', portalPath: '/fois/02', apiId: 6, category: 'Rail freight',
    summary: 'Distance, route, charges, GST and total freight between two stations.' },
  { slug: 'ewaybill', title: 'E-Way Bill — Bill Details', portalPath: '/ewaybill', apiId: 5, category: 'Goods movement',
    summary: 'Validity, status, PIN codes, HSN and vehicles of an e-way bill.' },
  { slug: 'sarathi', title: 'Sarathi — Driving Licence', portalPath: '/sarathi', apiId: 2, category: 'Driver',
    summary: 'Licence status, validity, holder details and vehicle classes.' }
];
