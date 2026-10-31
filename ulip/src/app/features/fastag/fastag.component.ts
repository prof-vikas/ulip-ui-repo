import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiResult, callDataApi, codeHint, mapsLink, present } from '../data-api';

interface TollRead {
  readerReadTime?: string;
  seqNo?: string;
  laneDirection?: string;
  tollPlazaGeocode?: string;
  tollPlazaName?: string;
  vehicleType?: string;
  vehicleRegNo?: string;
}

interface Fastag01Data {
  response?: { result?: string; respCode?: string; ts?: string; vehicle?: { errCode?: string; vehltxnList?: { txn?: TollRead[]; totalTagsInresponse?: string } } };
  responseStatus?: string;
}

interface Fastag02Data {
  response?: { result?: string; respCode?: string; vehicle?: { errCode?: string; vehicledetails?: { detail?: { name: string; value: string }[] }[] } };
  responseStatus?: string;
  message?: string;
}

interface TagCard {
  attrs: Record<string, string>;
  all: { name: string; value: string }[];
}

const TAG_STATUS: Record<string, { label: string; tone: string }> = {
  A: { label: 'Active', tone: 'ACTIVE' },
  B: { label: 'Blacklisted', tone: 'REJECTED' },
  C: { label: 'Closed', tone: 'CANCELLED' }
};

/** FASTag 01 (toll crossings by vehicle) and FASTag 02 (tag details by vehicle or tag id). */
@Component({
  selector: 'app-fastag',
  standalone: false,
  templateUrl: './fastag.component.html',
  styleUrls: ['../ewaybill/ewaybill.component.css', './fastag.component.css']
})
export class FastagComponent implements OnInit {
  api: '01' | '02' = '01';
  vehiclenumber = '';
  tagid = '';
  submitted = false;
  loading = false;
  result: ApiResult<unknown> | null = null;
  reads: TollRead[] = [];
  tags: TagCard[] = [];

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => {
      this.api = p.get('id') === '02' ? '02' : '01';
      this.clear();
    });
  }

  get valid(): boolean {
    return this.api === '01'
      ? !!this.vehiclenumber.trim()
      : !!this.vehiclenumber.trim() || !!this.tagid.trim();
  }

  submit(): void {
    this.submitted = true;
    if (!this.valid || this.loading) {
      return;
    }
    this.loading = true;
    this.result = null;
    this.reads = [];
    this.tags = [];
    const vehicle = this.normalise(this.vehiclenumber);
    const payload = this.api === '01'
      ? { vehiclenumber: vehicle }
      : { ...(vehicle ? { vehiclenumber: vehicle } : {}), ...(this.tagid.trim() ? { tagid: this.tagid.trim().toUpperCase() } : {}) };
    callDataApi<unknown[]>(this.http, this.api === '01' ? 'fastag' : 'fastag02', payload)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(r => {
        this.result = r;
        if (r.ok) {
          this.api === '01' ? this.readTolls(r.body?.response as Fastag01Data[]) : this.readTags(r.body?.response as Fastag02Data[]);
        }
      });
  }

  clear(): void {
    this.vehiclenumber = '';
    this.tagid = '';
    this.submitted = false;
    this.result = null;
    this.reads = [];
    this.tags = [];
  }

  hint(code: string): string {
    return codeHint(code);
  }

  map(geocode: string | undefined): string | null {
    return mapsLink(geocode);
  }

  show(v: unknown): string {
    return present(v) ? String(v) : '—';
  }

  get providerFailed(): boolean {
    return !!this.result?.ok && (this.api === '01' ? this.reads.length === 0 : this.tags.length === 0);
  }

  get latest(): TollRead | undefined {
    return this.reads[0];
  }

  get plazaCount(): number {
    return new Set(this.reads.map(r => r.tollPlazaName)).size;
  }

  tagStatus(t: TagCard): { label: string; tone: string } {
    const s = (t.attrs['TAGSTATUS'] ?? '').toUpperCase();
    return TAG_STATUS[s] ?? { label: present(s) ? s : 'Unknown', tone: 'PENDING' };
  }

  private readTolls(items: Fastag01Data[] | undefined): void {
    const txn = items?.[0]?.response?.vehicle?.vehltxnList?.txn ?? [];
    // newest first; the provider does not promise an order
    this.reads = [...txn].sort((a, b) => this.time(b.readerReadTime) - this.time(a.readerReadTime));
  }

  private readTags(items: Fastag02Data[] | undefined): void {
    const details = items?.[0]?.response?.vehicle?.vehicledetails ?? [];
    this.tags = details
      .map(d => d.detail ?? [])
      .filter(list => list.length > 0)
      .map(list => ({ all: list, attrs: Object.fromEntries(list.map(x => [x.name?.toUpperCase(), x.value])) }));
  }

  private time(v: string | undefined): number {
    const t = Date.parse((v ?? '').replace(' ', 'T'));
    return isNaN(t) ? 0 : t;
  }

  private normalise(v: string): string {
    return v.replace(/[\s-]/g, '').toUpperCase();
  }
}
