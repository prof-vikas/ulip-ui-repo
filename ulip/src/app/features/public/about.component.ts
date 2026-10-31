import { Component } from '@angular/core';
import { CONTACT, PRODUCT_FAMILIES } from './public-content';

/** About Gativra and Suraj Informatics (facts from gativra.com/about). */
@Component({
  selector: 'app-about',
  standalone: false,
  template: `
    <section class="page-hero">
      <div class="pub-wrap">
        <span class="eyebrow">About Gativra</span>
        <h1>We build AI software that runs the physical side of logistics.</h1>
        <p>Gativra is the AI smart logistics automation brand of Suraj Informatics Pvt. Ltd. Our software turns the cameras, sensors and
          weighbridges already on a site into one system that reads every truck, container and pallet, decides what should happen
          and acts on it in under a second.</p>
        <div class="tags">
          <span><app-icon name="building" [size]="14"></app-icon> A brand of Suraj Informatics</span>
          <span><app-icon name="map-pin" [size]="14"></app-icon> Head office in Navi Mumbai</span>
          <span><app-icon name="globe" [size]="14"></app-icon> Built in India</span>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="pub-wrap">
        <div class="sec-head">
          <span class="eyebrow">The name</span>
          <h2>What Gativra means</h2>
          <p>The name joins two Sanskrit words, and the logo shows the AI that sits between them.</p>
        </div>
        <div class="name-grid">
          <article *ngFor="let n of name" class="name" [attr.data-tone]="n.tone">
            <span class="name-k">{{ n.kicker }}</span>
            <h3>{{ n.title }}</h3>
            <p>{{ n.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="pub-wrap two">
        <div>
          <span class="eyebrow">Who we are</span>
          <h2>Gativra, by Suraj Informatics</h2>
          <p class="sec-p">Gativra is developed and supported by the engineering team at <b>Suraj Informatics Pvt. Ltd. (SIPL)</b>, a Navi Mumbai
            technology company working in industrial automation and logistics, based at the {{ contact.address }}.</p>
          <p class="sec-p">We build software that identifies, checks and records the physical movement of goods: trucks at gates, weights on
            weighbridges, containers on cranes and trains, pallets at docks and people in work areas. Each reading becomes an action, such as
            opening a barrier, issuing a gate pass or posting an entry in your ERP.</p>
          <p class="sec-p">The <b>Gativra API Platform</b> extends that work to data: verified vehicle, driver, toll, rail, e-way bill and customs
            records that your systems can call directly.</p>
        </div>
        <div class="panel-card">
          <h3>Sixteen products, one platform</h3>
          <p>Every product shares the same AI engine and dashboard, so a site can start with one and add the next on the same cameras.</p>
          <div class="fam" *ngFor="let f of families">
            <span class="fam-icon"><app-icon [name]="f.icon" [size]="16"></app-icon></span>
            <div><b>{{ f.title }}</b><span>{{ f.items }}</span></div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="pub-wrap">
        <div class="sec-head">
          <span class="eyebrow">How we work</span>
          <h2>What we believe in</h2>
        </div>
        <div class="val-grid">
          <article class="val" *ngFor="let v of values">
            <span class="val-icon"><app-icon [name]="v.icon" [size]="18"></app-icon></span>
            <h3>{{ v.title }}</h3>
            <p>{{ v.text }}</p>
          </article>
        </div>

        <div class="journey">
          <div class="j" *ngFor="let j of journey; let i = index">
            <span class="j-num">0{{ i + 1 }}</span>
            <h4>{{ j.title }}</h4>
            <p>{{ j.text }}</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section tight-top">
      <div class="pub-wrap">
        <div class="contact">
          <div>
            <h2>Talk to us</h2>
            <p>A 30-minute walkthrough with a solutions engineer, using your layout and vehicle volumes.</p>
          </div>
          <div class="contact-actions">
            <a class="btn btn-primary btn-lg" [href]="contact.site" target="_blank" rel="noopener">Book a demo <app-icon name="external" [size]="14"></app-icon></a>
            <a class="btn btn-lg on-dark" [href]="'tel:' + contact.tollFree"><app-icon name="phone" [size]="15"></app-icon> {{ contact.tollFree }}</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrls: ['./public-pages.css'],
  styles: [`
    .tags { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
    .tags span { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: var(--radius-pill); font-size: 13px; font-weight: 600;
                 background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-muted); }
    .tags app-icon { color: var(--color-primary); }
    .name-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
    .name { padding: 28px; border-radius: var(--radius-lg); background: var(--color-surface); border: 1px solid var(--color-border); border-top: 4px solid var(--brand-orange); }
    .name[data-tone='green'] { border-top-color: var(--brand-green); }
    .name[data-tone='grey'] { border-top-color: var(--brand-charcoal); }
    .name-k { font-size: 12px; font-weight: 800; letter-spacing: 1px; color: var(--color-text-faint); }
    .name h3 { margin: 8px 0 8px; font-size: 19px; color: var(--color-text); }
    .name p { margin: 0; font-size: 14px; line-height: 1.65; color: var(--color-text-muted); }
    .two { display: grid; grid-template-columns: 1.1fr 1fr; gap: 48px; align-items: start; }
    .two .sec-p { margin-bottom: 14px; }
    .sec-p b { color: var(--color-text); }
    .panel-card { padding: 28px; border-radius: var(--radius-lg); background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: var(--shadow-md); }
    .panel-card h3 { margin: 0 0 6px; font-size: 18px; color: var(--color-text); }
    .panel-card > p { margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: var(--color-text-muted); }
    .fam { display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1px solid var(--color-border-subtle); }
    .fam-icon { width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center;
                background: var(--color-primary-light); color: var(--color-primary); }
    .fam b { display: block; font-size: 14px; color: var(--color-text); }
    .fam span { font-size: 12.5px; color: var(--color-text-muted); }
    .val-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
    .val { padding: 24px; border-radius: var(--radius-lg); background: var(--color-surface); border: 1px solid var(--color-border); }
    .val-icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center;
                background: var(--color-success-bg); color: var(--color-success); }
    .val h3 { margin: 16px 0 6px; font-size: 16px; color: var(--color-text); }
    .val p { margin: 0; font-size: 13.5px; line-height: 1.6; color: var(--color-text-muted); }
    .journey { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-top: 40px; border-top: 2px solid var(--color-border); }
    .j { position: relative; padding: 22px 18px 0 0; }
    .j::before { content: ''; position: absolute; top: -7px; left: 0; width: 12px; height: 12px; border-radius: 50%; background: var(--brand-orange);
                 box-shadow: 0 0 0 4px var(--color-primary-light); }
    .j-num { font-size: 12px; font-weight: 800; color: var(--color-primary); letter-spacing: 1px; }
    .j h4 { margin: 6px 0 6px; font-size: 16px; color: var(--color-text); }
    .j p { margin: 0; font-size: 13.5px; line-height: 1.6; color: var(--color-text-muted); }
    .tight-top { padding-top: 0; }
    .contact { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; padding: 40px 44px; border-radius: 22px;
               background: var(--gradient-dark); }
    .contact h2 { margin: 0 0 6px; color: #fff; }
    .contact p { margin: 0; color: #C9CBCF; }
    .contact-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .btn.on-dark { background: rgba(255, 255, 255, 0.08); color: #fff; border-color: rgba(255, 255, 255, 0.18); }
    @media (max-width: 1000px) {
      .two { grid-template-columns: 1fr; }
      .val-grid, .journey { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .journey { row-gap: 28px; }
    }
    @media (max-width: 640px) {
      .name-grid, .val-grid, .journey { grid-template-columns: 1fr; }
      .contact { padding: 28px 22px; }
    }
  `]
})
export class AboutComponent {
  readonly contact = CONTACT;
  readonly families = PRODUCT_FAMILIES;
  readonly name = [
    { kicker: 'GATI · SPEED', title: 'Faster movement', tone: 'orange',
      text: 'The orange speed lines stand for trucks that clear the gate, weighbridge and dock without waiting for paperwork.' },
    { kicker: 'THE GREEN DOT · AI VISION', title: 'Every read, in real time', tone: 'green',
      text: 'Number plates, container numbers, weights and people, each read with a confidence score.' },
    { kicker: 'VARA · A BREEZE', title: 'Logistics that flows', tone: 'grey',
      text: 'Operations that run smoothly, shift after shift, with every movement logged and posted to your ERP.' }
  ];
  readonly values = [
    { icon: 'layers', title: 'Use what you already have', text: 'Works with your existing IP cameras, RFID readers, weighbridges and boom barriers wherever possible.' },
    { icon: 'lock', title: 'Your data stays yours', text: 'Run on your own servers or in the cloud, with role-based access and a full audit trail.' },
    { icon: 'code', title: 'Open to your systems', text: 'Every read and event flows into SAP, Oracle, your terminal operating system or your own apps.' },
    { icon: 'sparkle', title: 'Start small, then grow', text: 'Begin with one gate or one dock, prove the result, then add more on the same platform.' }
  ];
  readonly journey = [
    { title: 'Site study', text: 'Our engineers review your gates, docks and yard and map today\'s process.' },
    { title: 'Pilot', text: 'We start with one lane or one dock so you can see results on your own trucks.' },
    { title: 'Roll-out', text: 'Gativra is extended across the site and connected to your ERP and dashboards.' },
    { title: 'Support', text: 'Our team in Navi Mumbai monitors, maintains and improves the system with you.' }
  ];
}
