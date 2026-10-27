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
