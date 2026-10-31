import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiResult, callDataApi, codeHint, mapsLink, present } from '../data-api';

interface Rake {
  fnrNo?: string;
  newFnr?: string;
  stationFrom?: string;
  stationTo?: string;
  cmdt?: string;
  currentStatus?: string;
  lastRepLocn?: string;
  lastRepStts?: string;
  locoNumb?: string;
  lttd?: string;
  lgtd?: string;
  etaDstn?: string;
}

interface ChargeDetail {
  desc?: string;
  prcn?: string;
  rebtcode?: string;
  rebtamnt?: string;
}

type Freight = Record<string, string | ChargeDetail[] | { sttnfrom?: string; sttnto?: string }[] | undefined>;

interface Fois02Data {
  response?: { stts?: { successFailFlag?: string; error?: string; evntCode?: string }; frgt?: Freight };
}

/** Train-load vs wagon-load lines of the freight break-up: [label, tran… field, wgon… field]. */
const CHARGE_ROWS: [string, string, string][] = [
  ['Rate', 'rateTL', 'rateWL'],
  ['Commodity class', 'cmdtClssTL', 'cmdtClssWL'],
  ['Chargeable weight (t)', 'totlchblwght', 'wgonchblwght'],
  ['Basic freight', 'tranbascfrgt', 'wgonbascfrgt'],
  ['Freight after load class', 'tranloadfrgt', 'wgonloadfrgt'],
  ['Surcharge', 'transurchrg', 'wgonsurchrg'],
  ['Rebate', 'tranrebtamount', 'wgonrebtamount'],
  ['Other charges', 'tranothrchrg', 'wgonothrchrg'],
  ['Final freight', 'tranfinlfrgt', 'wgonfinlfrgt'],
  ['GST', 'trangsttax', 'wgongsttax'],
  ['Total freight', 'trantotlfrgt', 'wgontotlfrgt']
];

/** FOIS 01 (rake tracking by FNR) and FOIS 02 (freight calculation). */
@Component({
  selector: 'app-fois',
  standalone: false,
  templateUrl: './fois.component.html',
  styleUrls: ['../ewaybill/ewaybill.component.css', '../fastag/fastag.component.css', './fois.component.css']
})
export class FoisComponent implements OnInit {
  readonly chargeRows = CHARGE_ROWS;
  api: '01' | '02' = '01';
  fnrnumber = '';
  freightForm = { sttnfrom: '', sttnto: '', cmdt: '', wgontype: '' };
  submitted = false;
  loading = false;
  result: ApiResult<unknown> | null = null;
  rake: Rake | null = null;
  freight: Freight | null = null;
  freightError = '';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => {
      this.api = p.get('id') === '02' ? '02' : '01';
      this.clear();
    });
  }

  get valid(): boolean {
    if (this.api === '01') {
      return !!this.fnrnumber.trim();
    }
    const f = this.freightForm;
    return !!(f.sttnfrom.trim() && f.sttnto.trim() && f.cmdt.trim() && f.wgontype.trim());
  }

  missing(field: keyof FoisComponent['freightForm']): boolean {
    return this.submitted && !this.freightForm[field].trim();
  }

  submit(): void {
    this.submitted = true;
    if (!this.valid || this.loading) {
      return;
    }
    this.loading = true;
    this.result = null;
    this.rake = null;
    this.freight = null;
    this.freightError = '';
    const f = this.freightForm;
    const payload = this.api === '01'
      ? { fnrnumber: this.fnrnumber.trim() }
      : { sttnfrom: f.sttnfrom.trim().toUpperCase(), sttnto: f.sttnto.trim().toUpperCase(), cmdt: f.cmdt.trim().toUpperCase(), wgontype: f.wgontype.trim().toUpperCase() };
    callDataApi<unknown[]>(this.http, this.api === '01' ? 'fois' : 'fois02', payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(r => {
        this.result = r;
        if (!r.ok) {
          return;
        }
        if (this.api === '01') {
          const list = (r.body?.response as { response?: Rake[] }[] | undefined)?.[0]?.response;
          this.rake = Array.isArray(list) && list.length ? list[0] : null;
        } else {
          const data = (r.body?.response as Fois02Data[] | undefined)?.[0]?.response;
          const ok = (data?.stts?.successFailFlag ?? 'S').toUpperCase() !== 'F' && !!data?.frgt;
          this.freight = ok ? data!.frgt! : null;
          this.freightError = ok ? '' : (data?.stts?.error || 'The provider could not calculate freight for these inputs.');
        }
      });
  }

  clear(): void {
    this.fnrnumber = '';
    this.freightForm = { sttnfrom: '', sttnto: '', cmdt: '', wgontype: '' };
    this.submitted = false;
    this.result = null;
    this.rake = null;
    this.freight = null;
    this.freightError = '';
  }

  hint(code: string): string {
    return codeHint(code);
  }

  show(v: unknown): string {
    return present(v) && typeof v !== 'object' ? String(v) : '—';
  }

  /** Amounts arrive as plain strings; show them with Indian digit grouping when numeric. */
  money(v: unknown): string {
    if (!present(v) || typeof v === 'object') {
      return '—';
    }
    const n = Number(String(v).replace(/,/g, ''));
    return isFinite(n) ? '₹ ' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : String(v);
  }

  get rakeMap(): string | null {
    return this.rake ? mapsLink(this.rake.lttd, this.rake.lgtd) : null;
  }

  get noRecord(): boolean {
    return !!this.result?.ok && (this.api === '01' ? !this.rake : !this.freight);
  }

  get routes(): { sttnfrom?: string; sttnto?: string }[] {
    const r = this.freight?.['atlrout'];
    return Array.isArray(r) ? (r as { sttnfrom?: string; sttnto?: string }[]) : [];
  }

  chargeList(key: string): ChargeDetail[] {
    const v = this.freight?.[key];
    return Array.isArray(v) ? (v as ChargeDetail[]).filter(c => present(c.desc) || present(c.rebtamnt)) : [];
  }

  get breakdowns(): { title: string; items: ChargeDetail[] }[] {
    return [
      { title: 'Surcharges', items: this.chargeList('transurchrgdtls') },
      { title: 'Rebates', items: this.chargeList('tranrebtchrgdtls') },
      { title: 'Other charges', items: this.chargeList('tranothrchrgdtls') }
    ].filter(b => b.items.length);
  }

  f(key: string): unknown {
    return this.freight?.[key];
  }
}
