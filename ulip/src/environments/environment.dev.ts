// Dev: UI on http://localhost:4200, backend (ulip-rest-repo) on http://localhost:8082.
// apiBaseUrl is empty on purpose: requests go to the Angular dev server, which proxies
// /api to :8082 (see proxy.conf.json), so the browser never makes a cross-origin call.
// Endpoint paths mirror the backend controllers exactly.
export const environment = {
  production: false,
  // Build-time menu. Pick the modules the sidebar should expose, then build.
  //   'all'                                   -> Vahan, Sarathi, FASTag, FOIS, E-Way Bill, ICE GATE
  //   ['icegate']                             -> ICE GATE only
  //   ['icegate', 'ewaybill']                 -> ICE GATE + E-Way Bill
  menuModules: 'all',
  apiBaseUrl: '',
  // ulip-rbac (roles, menus, developer portal). Proxied to :8086 by proxy.conf.json.
  rbacApiUrl: '/api/rbac/v1',
  // Base URL of the SANDBOX ulip-rest (same paths as apiBaseUrl). Empty = sandbox calls from the portal are off.
  sandboxApiBaseUrl: '',
  endpoints: {
    login: '/api/ulip/auth/login',
    vahan01: '/api/ulip/vahan/getVahanDetails/01',
    vahan02: '/api/ulip/vahan/getVahanDetails/02',
    vahan03: '/api/ulip/vahan/getVahanDetails/03',
    vahan04: '/api/ulip/vahan/getVahanDetails/04',
    vahan05: '/api/ulip/vahan/getVahanDetails/05',
    vahan06: '/api/ulip/vahan/getVahanDetails/06',
    sarathi: '/api/ulip/getSarathiDetails',
    fastag: '/api/ulip/getFastagDetails',
    fastag02: '/api/ulip/getFastagTwoDetails',
    fois: '/api/ulip/getFoisDetails',
    fois02: '/api/ulip/getFoisDetails/02',
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
