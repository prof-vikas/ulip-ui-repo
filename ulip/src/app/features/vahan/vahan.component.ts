import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface VehicleDetails {
  rcRegnNo?: string;
  rcRegnDt?: string;
  rcOwnerName?: string;
  rcVhClassDesc?: string;
  rcMakerDesc?: string;
  rcMakerModel?: string;
  rcBodyTypeDesc?: string;
  rcFuelDesc?: string;
  rcColor?: string;
  rcChasiNo?: string;
  rcEngNo?: string;
  rcFitUpto?: string;
  rcNormsDesc?: string;
  rcFinancer?: string;
  rcRegisteredAt?: string;
  rcStatus?: string;
  rcInsuranceComp?: string;
  rcInsurancePolicyNo?: string;
  rcInsuranceUpto?: string;
  rcTaxUpto?: string;
  rcSeatCap?: string;
  rcManuMonthYr?: string;
  rcSaleAmt?: string;
  rcPermanentAddress?: string;
  rcVchCatgDesc?: string;
  rcOwnerCdDesc?: string;
  rcNoCyl?: string;
  rcCubicCap?: string;
  rcGvw?: string;
  rcUnldWt?: string;
  rcOwnerHistory?: { ownerSr: number; ownerName: string; offName: string }[];
  stautsMessage?: string;
  // ---- Vahan 01 extras ----
  statusMessage?: string;
  rcRegnUpto?: string;
  rcPurchaseDt?: string;
  rcOwnerSr?: number;
  rcFName?: string | null;
  rcMobileNo?: string | null;
  rcPresentAddress?: string;
  stateCd?: string;
  rtoCd?: number;
  rcVchCatg?: string;
  rcNpUpto?: string | null;
  rcNpIssuedBy?: string | null;
  rcStatusAsOn?: string;
  rcPuccUpto?: string;
  rcPuccNo?: string;
  rcNcrbStatus?: string | null;
  rcBlacklistStatus?: string;
  rcNocDetails?: string;
  rcWheelbase?: number;
  rcSleeperCap?: number;
  rcStandCap?: number;
  tempPermit?: TempPermit | null;
}

export interface TempPermit {
  rcPermitCode?: string | null;
  rcPermitIssueDt?: string | null;
  rcPermitCatg?: string | null;
  rcPermitNo?: string | null;
  rcPermitType?: string | null;
  rcPermitValidFrom?: string | null;
  rcPermitValidUpto?: string | null;
  rcPermitPurCd?: string | null;
}

interface ApiResponse {
  error: string | boolean;
  code: string;
  message: string;
  vehicleDetails?: VehicleDetails;
  response?: any; // Some APIs return data in 'response' instead of 'vehicleDetails'
}

@Component({
  selector: 'app-vahan',
  standalone: false,
  templateUrl: './vahan.component.html',
  styleUrls: ['./vahan.component.css']
})
export class VahanComponent implements OnInit {
  vahanNumber: string = '';
  loading = false;
  submitted = false;
  apiResponse: ApiResponse | null = null;
  errorMessage = '';
  formData: Record<string, string> = {};

  // Actual API field configs per Vahan sub-API
  fieldConfigs: Record<string, { label: string; key: string; type: string; placeholder: string }[]> = {
    '01': [
      { label: 'Vehicle Registration Number', key: 'vehiclenumber', type: 'text', placeholder: 'e.g. MH12AB1234' }
    ],
    '02': [
      { label: 'Vehicle Registration Number', key: 'vehiclenumber', type: 'text', placeholder: 'e.g. MH12AB1234' }
    ],
    '03': [
      { label: 'Vehicle Registration Number', key: 'vehiclenumber', type: 'text', placeholder: 'e.g. MH12AB1234' }
    ],
    '04': [
      { label: 'Vehicle Registration Number', key: 'vehiclenumber', type: 'text', placeholder: 'e.g. JH01T0011' }
    ],
    '05': [
      { label: 'Chassis Number', key: 'chasisnumber', type: 'text', placeholder: 'e.g. MAT447230H3F13971' }
    ],
    '06': [
      { label: 'Engine Number', key: 'enginenumber', type: 'text', placeholder: 'e.g. GC74B44246' }
    ]
  };

  // Important fields to display from vehicleDetails
  importantFields: { label: string; key: keyof VehicleDetails }[] = [
    { label: 'Registration Number',   key: 'rcRegnNo' },
    { label: 'Registration Date',     key: 'rcRegnDt' },
    { label: 'Owner Name',            key: 'rcOwnerName' },
    { label: 'Owner Category',        key: 'rcOwnerCdDesc' },
    { label: 'Permanent Address',     key: 'rcPermanentAddress' },
    { label: 'Registered At',         key: 'rcRegisteredAt' },
    { label: 'Maker',                 key: 'rcMakerDesc' },
    { label: 'Model',                 key: 'rcMakerModel' },
    { label: 'Vehicle Class',         key: 'rcVhClassDesc' },
    { label: 'Vehicle Category',      key: 'rcVchCatgDesc' },
    { label: 'Body Type',             key: 'rcBodyTypeDesc' },
    { label: 'Fuel Type',             key: 'rcFuelDesc' },
    { label: 'Color',                 key: 'rcColor' },
    { label: 'Chassis Number',        key: 'rcChasiNo' },
    { label: 'Engine Number',         key: 'rcEngNo' },
    { label: 'Mfg. Month / Year',     key: 'rcManuMonthYr' },
    { label: 'Cylinders',             key: 'rcNoCyl' },
    { label: 'Cubic Capacity (cc)',   key: 'rcCubicCap' },
    { label: 'Seating Capacity',      key: 'rcSeatCap' },
    { label: 'Unladen Weight (kg)',   key: 'rcUnldWt' },
    { label: 'Emission Norms',        key: 'rcNormsDesc' },
    { label: 'Financer',              key: 'rcFinancer' },
    { label: 'Sale Amount (₹)',       key: 'rcSaleAmt' },
    { label: 'Fitness Valid Upto',    key: 'rcFitUpto' },
    { label: 'Tax Valid Upto',        key: 'rcTaxUpto' },
    { label: 'Insurance Company',     key: 'rcInsuranceComp' },
    { label: 'Insurance Policy No.',  key: 'rcInsurancePolicyNo' },
    { label: 'Insurance Valid Upto',  key: 'rcInsuranceUpto' },
    { label: 'RC Status',             key: 'rcStatus' }
  ];

  // Vahan 01 returns a wider payload than 04/05/06 (extra registration, address,
  // PUCC, NOC and non-use fields) plus a nested `tempPermit` object, so it gets
  // its own field set instead of reusing the 04 column layout.
  private readonly sections01: { title: string; fields: { label: string; key: keyof VehicleDetails }[] }[] = [
    {
      title: 'Vehicle Identity',
      fields: [
        { label: 'Registration Number',  key: 'rcRegnNo' },
        { label: 'Registration Date',    key: 'rcRegnDt' },
        { label: 'Registration Valid Upto', key: 'rcRegnUpto' },
        { label: 'Owner Serial No.',     key: 'rcOwnerSr' },
        { label: 'Owner Name',           key: 'rcOwnerName' },
        { label: "Father's Name",        key: 'rcFName' },
        { label: 'Mobile Number',        key: 'rcMobileNo' }
      ]
    },
    {
      title: 'Registration & Location',
      fields: [
        { label: 'Permanent Address',    key: 'rcPermanentAddress' },
        { label: 'Present Address',      key: 'rcPresentAddress' },
        { label: 'Registered At',        key: 'rcRegisteredAt' },
        { label: 'State Code',           key: 'stateCd' },
        { label: 'RTO Code',             key: 'rtoCd' },
        { label: 'Purchase Date',        key: 'rcPurchaseDt' }
      ]
    },
    {
      title: 'Vehicle Specifications',
      fields: [
        { label: 'Vehicle Class',        key: 'rcVhClassDesc' },
        { label: 'Vehicle Category',     key: 'rcVchCatg' },
        { label: 'Body Type',            key: 'rcBodyTypeDesc' },
        { label: 'Fuel Type',            key: 'rcFuelDesc' },
        { label: 'Color',                key: 'rcColor' },
        { label: 'Chassis Number',       key: 'rcChasiNo' },
        { label: 'Engine Number',        key: 'rcEngNo' },
        { label: 'Mfg. Month / Year',    key: 'rcManuMonthYr' },
        { label: 'Cylinders',            key: 'rcNoCyl' },
        { label: 'Cubic Capacity (cc)',  key: 'rcCubicCap' },
        { label: 'Seating Capacity',     key: 'rcSeatCap' },
        { label: 'Sleeper Capacity',     key: 'rcSleeperCap' },
        { label: 'Standing Capacity',    key: 'rcStandCap' },
        { label: 'Wheelbase (mm)',       key: 'rcWheelbase' },
        { label: 'Unladen Weight (kg)',  key: 'rcUnldWt' },
        { label: 'Gross Vehicle Weight (kg)', key: 'rcGvw' },
        { label: 'Emission Norms',       key: 'rcNormsDesc' }
      ]
    },
    {
      title: 'Finance & Validity',
      fields: [
        { label: 'Financer',             key: 'rcFinancer' },
        { label: 'Sale Amount',          key: 'rcSaleAmt' },
        { label: 'Tax Valid Upto',       key: 'rcTaxUpto' },
        { label: 'Insurance Company',    key: 'rcInsuranceComp' },
        { label: 'Insurance Policy No.', key: 'rcInsurancePolicyNo' },
        { label: 'Insurance Valid Upto', key: 'rcInsuranceUpto' },
        { label: 'PUCC Number',          key: 'rcPuccNo' },
        { label: 'PUCC Valid Upto',      key: 'rcPuccUpto' },
        { label: 'Non-Use Valid Upto',   key: 'rcNpUpto' },
        { label: 'Non-Use Issued By',    key: 'rcNpIssuedBy' }
      ]
    },
    {
      title: 'Status & Flags',
      fields: [
        { label: 'RC Status',            key: 'rcStatus' },
        { label: 'Status As On',         key: 'rcStatusAsOn' },
        { label: 'Blacklist Status',     key: 'rcBlacklistStatus' },
        { label: 'NOC Details',          key: 'rcNocDetails' },
        { label: 'NCRB Status',          key: 'rcNcrbStatus' },
        { label: 'API Status Message',   key: 'statusMessage' }
      ]
    }
  ];

  readonly permitFields: { label: string; key: keyof TempPermit }[] = [
    { label: 'Permit Number',   key: 'rcPermitNo' },
    { label: 'Permit Type',     key: 'rcPermitType' },
    { label: 'Permit Category', key: 'rcPermitCatg' },
    { label: 'Permit Code',     key: 'rcPermitCode' },
    { label: 'Issued On',       key: 'rcPermitIssueDt' },
    { label: 'Valid From',      key: 'rcPermitValidFrom' },
    { label: 'Valid Upto',      key: 'rcPermitValidUpto' },
    { label: 'Purpose Code',    key: 'rcPermitPurCd' }
  ];

  // 01 gets its own sections; 04/05/06 keep the original 4-card grouping.
  get sections(): { title: string; fields: { label: string; key: keyof VehicleDetails }[] }[] {
    if (this.vahanNumber === '01') return this.sections01;
    return [
      { title: 'Vehicle Identity',        fields: this.importantFields.slice(0, 4) },
      { title: 'Registration & Location', fields: this.importantFields.slice(4, 8) },
      { title: 'Vehicle Specifications',  fields: this.importantFields.slice(8, 21) },
      { title: 'Finance & Validity',      fields: this.importantFields.slice(21) }
    ];
  }

  get permitData(): TempPermit | null {
    const permit = (this.vehicleData as any)?.tempPermit;
    return permit && typeof permit === 'object' ? (permit as TempPermit) : null;
  }

  getPermitValue(key: keyof TempPermit): string {
    const val = this.permitData ? (this.permitData as any)[key] : null;
    if (val === null || val === undefined || val === '') return '—';
    return String(val);
  }

  get fields() {
    return this.fieldConfigs[this.vahanNumber] || [];
  }

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.vahanNumber = params['id'];
      this.formData = {};
      this.apiResponse = null;
      this.errorMessage = '';
      this.submitted = false;
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (!this.isFormValid) return;

    this.loading = true;
    this.apiResponse = null;
    this.errorMessage = '';

    const endpointPath = (environment.endpoints as any)[`vahan${this.vahanNumber}`];
    const url = `${environment.apiBaseUrl}${endpointPath}`;

    this.http.post<ApiResponse>(url, this.formData).subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.loading = false;
          this.apiResponse = res;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.loading = false;
          this.errorMessage = err?.error?.message || `API Error: ${err.status} ${err.statusText}`;
          this.cdr.detectChanges();
        });
      }
    });
  }

  getFieldValue(key: keyof VehicleDetails): string {
    const data = this.vehicleData;
    const val = data ? (data as any)[key] : null;
    if (val === null || val === undefined || val === '') return '—';
    return String(val);
  }

  get isSuccess(): boolean {
    if (!this.apiResponse) return false;
    const e = this.apiResponse.error;
    const code = String(this.apiResponse.code);
    // Check for explicit false error or HTTP 200 code
    return e === 'false' || e === false || code === '200';
  }

  // Show details whenever any data is present in vehicleDetails or response
  get hasVehicleDetails(): boolean {
    const data = this.vehicleData;
    return !!data && Object.keys(data).length > 0;
  }

  // Helper to get the actual data object for iteration (traverses nested arrays if needed)
  get vehicleData(): VehicleDetails | null {
    if (!this.apiResponse) return null;
    
    // 1. Check vehicleDetails directly
    if (this.apiResponse.vehicleDetails) return this.apiResponse.vehicleDetails;
    
    const resp = this.apiResponse.response;
    if (!resp) return null;

    // 2. Check if response is an array (case: { response: [ { response: { ...data } } ] })
    if (Array.isArray(resp) && resp.length > 0) {
      const firstItem = resp[0];
      if (firstItem && firstItem.response && typeof firstItem.response === 'object') {
        return firstItem.response;
      }
      // If array items are the data directly
      if (typeof firstItem === 'object') return firstItem;
    }

    // 3. Check if response is an object
    if (typeof resp === 'object' && !Array.isArray(resp)) {
      return resp;
    }

    return null;
  }

  get isFormValid(): boolean {
    return this.fields.every(f => this.formData[f.key]?.trim());
  }

  clearForm(): void {
    this.formData = {};
    this.apiResponse = null;
    this.errorMessage = '';
    this.submitted = false;
  }
}
