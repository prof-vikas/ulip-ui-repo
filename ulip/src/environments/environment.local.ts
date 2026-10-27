// Local development: UI on http://localhost:4200, backend (ulip-rest-repo) on http://localhost:8085.
// apiBaseUrl is empty on purpose: requests go to the Angular dev server, which proxies /api to :8085
// (see proxy.local.conf.json), so the browser never makes a cross-origin call.
export const environment = {
  production: false,
  apiBaseUrl: '',
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
    icegate01: '/api/ulip/getIcegate01Details',
    icegate02: '/api/ulip/getIcegate02Details',
    icegate03: '/api/ulip/getIcegate03Details',
    icegate04: '/api/ulip/getIcegate04Details',
    icegate05: '/api/ulip/getIcegate05Details',
    icegate06: '/api/ulip/getIcegate06Details',
    icegate07: '/api/ulip/getIcegate07Details',
    icegate08: '/api/ulip/getIcegate08Details',
    icegate09: '/api/ulip/getIcegate09Details',
    icegate10: '/api/ulip/getIcegate10Details',
    icegate11: '/api/ulip/getIcegate11Details',
    icegate12: '/api/ulip/getIcegate12Details',
    icegate13: '/api/ulip/getIcegate13Details'
  }
};
