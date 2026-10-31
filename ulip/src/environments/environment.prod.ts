export const environment = {
  production: true,
  // Build-time menu. Pick the modules the sidebar should expose, then build.
  //   'all'                                   -> Vahan, Sarathi, FASTag, FOIS, E-Way Bill, ICE GATE
  //   ['icegate']                             -> ICE GATE only
  //   ['icegate', 'ewaybill']                 -> ICE GATE + E-Way Bill
  menuModules: ['icegate', 'ewaybill'] ,
    apiBaseUrl: 'https://ulip.surajinformatics.in/ulip',
  endpoints: {
    login: '/api/ulip/auth/login',
    vahan01: '/vahan/01',
    vahan02: '/vahan/02',
    vahan03: '/vahan/03',
    vahan04: '/vahan/04',
    vahan05: '/vahan/05',
    vahan06: '/vahan/06',
    sarathi: '/api/ulip/getSarathiDetails',
    fastag: '/fastag',
    fois: '/fois',
    ewaybill: '/api/ulip/getEWayBillDetails',
    icegate01: '/api/ulip/icegate/v1/01',
    icegate02: '/api/ulip/icegate/v1/02',
    icegate03: '/api/ulip/icegate/v1/03',
    icegate04: '/api/ulip/icegate/v1/04',
    icegate05: '/api/ulip/icegate/v1/05',
    icegate06: '/api/ulip/icegate/v1/06',
    icegate07: '/api/ulip/icegate/v1/07',
    icegate08: '/api/ulip/icegate/v1/08',
    icegate09: '/api/ulip/icegate/v1/09',
    icegate10: '/api/ulip/icegate/v1/10',
    icegate11: '/api/ulip/icegate/v1/11',
    icegate12: '/api/ulip/icegate/v1/12',
    icegate13: '/api/ulip/icegate/v1/13'
  }
};
