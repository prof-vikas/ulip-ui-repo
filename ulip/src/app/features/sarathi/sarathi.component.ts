import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ApiResponse {
  error: string | boolean;
  code: string;
  message: string;
  response?: any;
}

@Component({
  selector: 'app-sarathi',
  standalone: false,
  templateUrl: './sarathi.component.html',
  styleUrls: ['./sarathi.component.css']
})
export class SarathiComponent {
  loading = false;
  submitted = false;
  apiResponse: ApiResponse | null = null;
  errorMessage = '';
  formData = { dlnumber: '', dob: '' };

  // Curated views onto the (very deep) Sarathi record — the raw payload has
  // 150+ mostly-internal fields across dlobj/bioObj, so unlike ICE GATE's
  // generic dump, meaningful ones are picked explicitly (same approach as
  // Vahan's importantFields).
  readonly licenseFields: { label: string; key: string }[] = [
    { label: 'Licence Number', key: 'dlLicno' },
    { label: 'Old Licence Number', key: 'dlOldLicno' },
    { label: 'Status', key: 'dlStatus' },
    { label: 'Issue Date', key: 'dlIssuedt' },
    { label: 'Issuing RTO', key: 'omRtoFullname' },
    { label: 'RTO Code', key: 'dlRtoCode' },
    { label: 'State', key: 'stateName' },
    { label: 'Non-Transport Valid From', key: 'dlNtValdfrDt' },
    { label: 'Non-Transport Valid To', key: 'dlNtValdtoDt' },
    { label: 'Transport Valid From', key: 'dlTrValdfrDt' },
    { label: 'Transport Valid To', key: 'dlTrValdtoDt' },
    { label: 'Last Endorsement No.', key: 'dlEndorseno' },
    { label: 'Last Endorsement Date', key: 'dlEndorsedt' },
    { label: 'Remarks', key: 'dlRemarks' }
  ];

  readonly personalFields: { label: string; key: string }[] = [
    { label: 'Full Name', key: 'bioFullName' },
    { label: 'Date of Birth', key: 'bioDob' },
    { label: 'Gender', key: 'bioGenderDesc' },
    { label: 'Blood Group', key: 'bioBloodGroupname' },
    { label: 'Citizenship', key: 'bioCitiZen' },
    { label: 'Mobile Number', key: 'bioMobileNo' },
    { label: 'Alternate Mobile', key: 'bioAltMobileNo' },
    { label: "Guardian's Name", key: 'bioSwdFullName' },
    { label: 'Relation', key: 'bioDependentRelation' },
    { label: 'Identity Mark', key: 'bioIdentityMark2' },
    { label: 'Organ Donor', key: 'bioOrganDonor' }
  ];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  get isFormValid(): boolean {
    return !!this.formData.dlnumber?.trim() && !!this.formData.dob?.trim();
  }

  onSubmit(): void {
    this.submitted = true;
    if (!this.isFormValid) return;

    this.loading = true;
    this.apiResponse = null;
    this.errorMessage = '';

    const url = `${environment.apiBaseUrl}${environment.endpoints.sarathi}`;

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

  clearForm(): void {
    this.formData = { dlnumber: '', dob: '' };
    this.apiResponse = null;
    this.errorMessage = '';
    this.submitted = false;
  }

  // Drills down: response[0].response.dldetobj[0]
  get dlRecord(): Record<string, any> | null {
    const resp = this.apiResponse?.response;
    if (!Array.isArray(resp) || resp.length === 0) return null;
    const dldetobj = resp[0]?.response?.dldetobj;
    if (Array.isArray(dldetobj) && dldetobj.length > 0 && dldetobj[0] && typeof dldetobj[0] === 'object') {
      return dldetobj[0];
    }
    return null;
  }

  get licenseDetails(): Record<string, any> | null {
    return this.dlRecord?.['dlobj'] ?? null;
  }

  get personalDetails(): Record<string, any> | null {
    return this.dlRecord?.['bioObj'] ?? null;
  }

  get vehicleClasses(): Record<string, any>[] {
    const list = this.dlRecord?.['dlcovs'];
    return Array.isArray(list) ? list : [];
  }

  get transactions(): Record<string, any>[] {
    const list = this.dlRecord?.['transReqObj'];
    return Array.isArray(list) ? list : [];
  }

  get photoDataUrl(): string | null {
    const photo = this.dlRecord?.['bioImgObj']?.['biPhoto'];
    return this.isEmptyValue(photo) ? null : `data:image/jpeg;base64,${photo}`;
  }

  get hasResult(): boolean {
    return !!this.dlRecord;
  }

  get permanentAddress(): string {
    return this.composeAddress('bioPermAdd1', 'bioPermAdd2', 'bioPermAdd3', 'bioPermVillTownName', 'bioPermSdName', 'bioPermDistName', 'bioPermPin');
  }

  get temporaryAddress(): string {
    return this.composeAddress('bioTempAdd1', 'bioTempAdd2', 'bioTempAdd3', 'bioTempVillTownName', 'bioTempSdName', 'bioTempDistName', 'bioTempPin');
  }

  getValue(obj: Record<string, any> | null, key: string): string {
    if (!obj) return '—';
    const value = obj[key];
    return this.isEmptyValue(value) ? '—' : String(value);
  }

  private composeAddress(...keys: string[]): string {
    const bio = this.personalDetails;
    if (!bio) return '—';
    const parts = keys.map(k => bio[k]).filter(v => !this.isEmptyValue(v));
    return parts.length > 0 ? parts.join(', ') : '—';
  }

  // Some Sarathi responses use the literal string "null" instead of JSON null.
  private isEmptyValue(value: unknown): boolean {
    if (value === null || value === undefined || value === '') return true;
    return typeof value === 'string' && value.trim().toLowerCase() === 'null';
  }
}
