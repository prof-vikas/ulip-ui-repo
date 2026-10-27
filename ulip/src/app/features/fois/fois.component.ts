import { Component } from '@angular/core';

@Component({
  selector: 'app-fois',
  standalone: false,
  template: `
    <div class="page-container">
      <app-back-button></app-back-button>
      <div class="page-header">
        <div class="breadcrumb">FOIS</div>
        <h1 class="page-title">FOIS</h1>
        <p class="page-desc">Query freight operations information via FOIS API</p>
      </div>
      <div class="card">
        <div class="card-title">Request Parameters</div>
        <div class="coming-soon">
          <div class="icon">🚂</div>
          <p>FOIS API inputs — awaiting API specification</p>
          <span>Fields will be configured once API details are provided</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .coming-soon { text-align: center; padding: 48px 24px; color: var(--color-text-faint); }
    .coming-soon .icon { font-size: 40px; margin-bottom: 12px; }
    .coming-soon p { font-size: 15px; font-weight: 500; color: var(--color-text-muted); margin: 0 0 4px; }
    .coming-soon span { font-size: 13px; }
    .page-container { max-width: 800px; }
    .page-header { margin-bottom: 24px; }
    .breadcrumb { font-size: 12px; color: var(--color-text-faint); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    .page-title { font-size: 22px; font-weight: 800; color: var(--color-text); margin: 0 0 4px; }
    .page-desc { font-size: 14px; color: var(--color-text-muted); margin: 0; }
    .card { background: var(--color-surface); border-radius: var(--radius-md); border: 1px solid var(--color-border); padding: 24px 28px; animation: fadeInUp 0.35s ease both; }
    .card-title { font-size: 13px; font-weight: 600; color: var(--color-text-faint); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 20px; }
  `]
})
export class FoisComponent {}
