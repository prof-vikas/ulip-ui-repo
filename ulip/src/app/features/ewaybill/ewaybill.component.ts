import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface ApiResponse {
  error: string | boolean;
  code: string;
  message: string;
  response?: any;
  [key: string]: any;
}

interface FieldConfig {
  label: string;
  key: string;
  type: string;
  placeholder: string;
}

@Component({
  selector: 'app-ewaybill',
  standalone: false,
  templateUrl: './ewaybill.component.html',
  styleUrls: ['./ewaybill.component.css']
})
export class EwaybillComponent implements OnInit {
  iceGateNumber: string = '01';
  loading = false;
  submitted = false;
  apiResponse: ApiResponse | null = null;
  errorMessage = '';
  formData: Record<string, string> = {};

  // Explicit field sets for sub-APIs that have been wired up to their real
  // request contract. Anything not listed here falls back to the generic
  // single-field placeholder in fieldLabels below, until it's integrated.
  private readonly fieldConfigs: Record<string, FieldConfig[]> = {
    '01': [
      { label: 'E-Way Bill Number', key: 'ewbNo', type: 'text', placeholder: 'e.g. 101000609218' }
    ]
  };

  
  private readonly acronyms = new Set(['sb', 'boe', 'be', 'ooc', 'ewb', 'igm', 'egm', 'iec', 'rms', 'id', 'leo', 'cha']);

  get fields(): FieldConfig[] {
    if (this.fieldConfigs[this.iceGateNumber]) return this.fieldConfigs[this.iceGateNumber];
    return [];
  }

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.iceGateNumber = '01';
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

    const endpointPath = environment.endpoints.ewaybill;
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

  get isSuccess(): boolean {
    if (!this.apiResponse) return false;
    const e = this.apiResponse.error;
    const code = String(this.apiResponse.code);
    return e === 'false' || e === false || code === '200';
  }

  // The first entry of the top-level `response` array — every ICE GATE
  // sub-API wraps its payload this way (`response: [ { ... } ]`).
  private get firstEnvelope(): Record<string, any> | null {
    const resp = this.apiResponse?.response;
    if (Array.isArray(resp) && resp.length > 0 && resp[0] && typeof resp[0] === 'object') {
      return resp[0];
    }
    return null;
  }

  // Single-record shape (e.g. ICE GATE 12/13): envelope.response is a plain object.
  // Some APIs (e.g. ICE GATE 10) wrap that record in a single named DTO key
  // (`{ icdBlStatusResponceDto: {...} }`) — unwrapSingleKeyWrapper strips
  // that generically rather than hardcoding the DTO name.
  get resultData(): Record<string, any> | null {
    const envelope = this.firstEnvelope;
    if (envelope) {
      const inner = envelope['response'];
      if (inner && typeof inner === 'object' && !Array.isArray(inner)) return this.unwrapSingleKeyWrapper(inner);
      if (!('response' in envelope)) return this.unwrapSingleKeyWrapper(envelope);
      return null;
    }

    if (!this.apiResponse) return null;
    const resp = this.apiResponse.response;
    if (resp && typeof resp === 'object' && !Array.isArray(resp)) return this.unwrapSingleKeyWrapper(resp);

    const { error, code, message, response, ...rest } = this.apiResponse;
    return Object.keys(rest).length > 0 ? rest : null;
  }

  // A single-record result can still carry its own nested lists (e.g. ICE
  // GATE 10's `containerDtlsResponseDtos`) alongside scalar fields — those
  // are excluded from resultEntries and rendered as their own tables instead
  // of being silently dropped.
  get resultNestedLists(): { title: string; columns: string[]; columnLabels: string[]; rows: string[][] }[] {
    const data = this.resultData;
    if (!data) return [];

    const lists: { title: string; columns: string[]; columnLabels: string[]; rows: string[][] }[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value) && value.length > 0 && value.every(v => v && typeof v === 'object' && !Array.isArray(v))) {
        const columns = Object.keys(value[0]).filter(k => !this.isComplexValue(value[0][k]));
        const rows = value.map((row: Record<string, any>) =>
          columns.map(c => this.formatCellValue(row[c]))
        );
        lists.push({ title: this.toLabel(key), columns, columnLabels: columns.map(c => this.toLabel(c)), rows });
      }
    }
    return lists;
  }

  // Multi-row shape (e.g. ICE GATE 11): envelope.response is a list of records.
  get resultList(): Record<string, any>[] | null {
    const envelope = this.firstEnvelope;
    const inner = envelope?.['response'];
    if (Array.isArray(inner) && inner.length > 0) {
      return inner;
    }
    return null;
  }

  get resultEntries(): { label: string; value: string }[] {
    const data = this.resultData;
    if (!data) return [];
    return Object.entries(data)
      .filter(([, v]) => !this.isComplexValue(v))
      .map(([key, value]) => ({
        label: this.toLabel(key),
        value: this.formatCellValue(value)
      }));
  }

  get resultColumns(): string[] {
    const rows = this.resultList;
    if (!rows || rows.length === 0) return [];
    return Object.keys(rows[0]).filter(k => !this.isComplexValue(rows[0][k]));
  }

  get resultColumnLabels(): string[] {
    return this.resultColumns.map(c => this.toLabel(c));
  }

  get resultTableRows(): string[][] {
    const rows = this.resultList;
    const cols = this.resultColumns;
    if (!rows) return [];
    return rows.map(r => cols.map(c => this.formatCellValue(r[c])));
  }

  get hasResultData(): boolean {
    return this.resultEntries.length > 0;
  }

  get hasResultList(): boolean {
    return (this.resultList?.length ?? 0) > 0;
  }

  // A result can be "found" via any of the three shapes: scalar fields
  // (hasResultData), a top-level list (hasResultList), or a nested list that
  // is the *only* thing in the record (e.g. ICE GATE 02's `boeDetails`,
  // where resultData has no scalar fields at all, only the nested array).
  get hasAnyResult(): boolean {
    return this.hasResultData || this.hasResultList || this.resultNestedLists.length > 0;
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

  // Strips a chain of single-key object wrappers (e.g. `{ someDto: { ...actualFields } }`)
  // down to the first object that actually looks like a record (0, or 2+ keys).
  private unwrapSingleKeyWrapper(obj: Record<string, any>): Record<string, any> {
    let current = obj;
    while (current && typeof current === 'object' && !Array.isArray(current)) {
      const keys = Object.keys(current);
      const onlyValue = keys.length === 1 ? current[keys[0]] : null;
      if (onlyValue && typeof onlyValue === 'object' && !Array.isArray(onlyValue)) {
        current = onlyValue;
      } else {
        break;
      }
    }
    return current;
  }

  // Some ICE GATE responses use the literal string "null" instead of JSON null.
  private isEmptyValue(value: unknown): boolean {
    if (value === null || value === undefined || value === '') return true;
    return typeof value === 'string' && value.trim().toLowerCase() === 'null';
  }

  // A "complex" value can't be shown in a single table cell: a plain object,
  // or an array that itself contains objects/arrays (a nested records list —
  // handled separately by resultNestedLists). An array of plain strings/numbers
  // (e.g. `containerNo: ["GESU5599051"]`) is NOT complex — it's just a cell
  // whose value happens to be a list, and formatCellValue joins it below.
  private isComplexValue(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) {
      return value.some(v => v !== null && v !== undefined && typeof v === 'object');
    }
    return typeof value === 'object';
  }

  private formatCellValue(value: unknown): string {
    if (Array.isArray(value)) {
      const parts = value.filter(v => !this.isEmptyValue(v)).map(v => String(v));
      return parts.length > 0 ? parts.join(', ') : '—';
    }
    return this.isEmptyValue(value) ? '—' : String(value);
  }

  private toLabel(key: string): string {
    const words = key
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .split(/\s+/);
    return words
      .map(w => (this.acronyms.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
      .join(' ')
      .trim();
  }
}
