/**
 * Text for the overview page of a module with several APIs (FASTag, FOIS, …). The cards themselves come
 * from the module's children in the user's menu, so they follow role and approved access; this only adds
 * descriptions. A module or API missing here still gets a page, with generic text.
 */
export interface ApiCardInfo {
  title: string;
  desc: string;
  /** What you search by, e.g. "Reg. No." */
  tag: string;
  example: string;
  /** Slug of the built-in reference page (/dashboard/docs/<slug>). */
  docs?: string;
}

export interface ModuleOverviewInfo {
  title: string;
  desc: string;
  cards: Record<string, ApiCardInfo>;
}

export const MODULE_OVERVIEWS: Record<string, ModuleOverviewInfo> = {
  fastag: {
    title: 'FASTag APIs',
    desc: 'Select an API below to look up a vehicle\'s toll-plaza crossings or the FASTag issued to it.',
    cards: {
      FASTAG_01: {
        title: 'FASTag 01',
        desc: 'Recent toll-plaza crossings of a vehicle — plaza, time, lane direction and location — read from its FASTag.',
        tag: 'Reg. No.',
        example: 'e.g. MH12AB1234',
        docs: 'fastag-01'
      },
      FASTAG_02: {
        title: 'FASTag 02',
        desc: 'Details of the FASTag issued to a vehicle — tag id, status, vehicle class and issuing bank.',
        tag: 'Reg. No. / Tag ID',
        example: 'e.g. 34161FA82032D4A40200C3E0',
        docs: 'fastag-02'
      }
    }
  },
  fois: {
    title: 'FOIS APIs',
    desc: 'Select an API below to track a rail consignment or calculate Indian Railways freight.',
    cards: {
      FOIS_01: {
        title: 'FOIS 01',
        desc: 'Live status of a rake by Forwarding Note Number — last reported station, locomotive, position and ETA.',
        tag: 'FNR',
        example: 'e.g. 24211017345',
        docs: 'fois-01'
      },
      FOIS_02: {
        title: 'FOIS 02',
        desc: 'Freight for a commodity between two stations in a wagon type — distance, route, charges, GST and total.',
        tag: 'Stations · Commodity · Wagon',
        example: 'e.g. JSG → BPQ · COAL · BOXN',
        docs: 'fois-02'
      }
    }
  }
};
