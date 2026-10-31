export const environment = {
  production: false,
  // Build-time menu. Pick the modules the sidebar should expose, then build.
  //   'all'                                   -> Vahan, Sarathi, FASTag, FOIS, E-Way Bill, ICE GATE
  //   ['icegate']                             -> ICE GATE only
  //   ['icegate', 'ewaybill']                 -> ICE GATE + E-Way Bill
  menuModules: 'all',
  // apiBaseUrl: '/ulip/api',
    apiBaseUrl: 'https://ulip.surajinformatics.in/ulip/api',
  endpoints: {
    login: '/ulip/auth/login',
    vahan01: '/vahan/01',
    vahan02: '/vahan/02',
    vahan03: '/vahan/03',
    vahan04: '/ulip/vahan/getVahanDetails/04',
    vahan05: '/ulip/vahan/getVahanDetails/05',
    vahan06: '/ulip/vahan/getVahanDetails/06',
    sarathi: '/ulip/getSarathiDetails',
    fastag: '/fastag',
    fois: '/fois',
    ewaybill: '/ulip/getEWayBillDetails',
    icegate01: '/ulip/icegate/v1/01',
    icegate02: '/ulip/icegate/v1/02',
    icegate03: '/ulip/icegate/v1/03',
    icegate04: '/ulip/icegate/v1/04',
    icegate05: '/ulip/icegate/v1/05',
    icegate06: '/ulip/icegate/v1/06',
    icegate07: '/ulip/icegate/v1/07',
    icegate08: '/ulip/icegate/v1/08',
    icegate09: '/ulip/icegate/v1/09',
    icegate10: '/ulip/icegate/v1/10',
    icegate11: '/ulip/icegate/v1/11',
    icegate12: '/ulip/icegate/v1/12',
    icegate13: '/ulip/icegate/v1/13'
  }
};
