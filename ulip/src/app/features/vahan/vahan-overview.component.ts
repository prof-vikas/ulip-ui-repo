import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface VahanCard {
  id: string;
  title: string;
  desc: string;
  inputLabel: string;
  inputExample: string;
  tag: string;
  available: boolean;
}

@Component({
  selector: 'app-vahan-overview',
  standalone: false,
  templateUrl: './vahan-overview.component.html',
  styleUrls: ['./vahan-overview.component.css']
})
export class VahanOverviewComponent {

  cards: VahanCard[] = [
    {
      id: '01',
      title: 'Vahan 01',
      desc: 'Retrieve complete vehicle registration details using a registration number. Returns owner info, vehicle specs, insurance, and fitness data.',
      inputLabel: 'Vehicle Registration Number',
      inputExample: 'e.g. MH12AB1234',
      tag: 'Reg. No.',
      available: true
    },
    /* Deprecated: Vahan 02 hidden from the section, kept for reference.
    {
      id: '02',
      title: 'Vahan 02',
      desc: 'Fetch vehicle RC details with extended emission and fitness validity information via registration number lookup.',
      inputLabel: 'Vehicle Registration Number',
      inputExample: 'e.g. MH12AB1234',
      tag: 'Reg. No.',
      available: false
    },
    {
      id: '03',
      title: 'Vahan 03',
      desc: 'Query vehicle permit, tax, and road-worthiness status using the vehicle registration number.',
      inputLabel: 'Vehicle Registration Number',
      inputExample: 'e.g. MH12AB1234',
      tag: 'Reg. No.',
      available: false
    },
    */
    {
      id: '04',
      title: 'Vahan 04',
      desc: 'Get comprehensive vehicle RC details — owner history, insurance, fitness, permit, and financer — using vehicle registration number.',
      inputLabel: 'Vehicle Registration Number',
      inputExample: 'e.g. JH01T0011',
      tag: 'Reg. No.',
      available: true
    },
    {
      id: '05',
      title: 'Vahan 05',
      desc: 'Look up full vehicle registration record and owner details by providing the chassis (VIN) number of the vehicle.',
      inputLabel: 'Chassis Number',
      inputExample: 'e.g. MAT447230H3F13971',
      tag: 'Chassis No.',
      available: true
    }
    /* Deprecated: Vahan 06 hidden from the section, kept for reference.
    ,
    {
      id: '06',
      title: 'Vahan 06',
      desc: 'Search for vehicle registration certificate and associated details using the vehicle\'s engine number.',
      inputLabel: 'Engine Number',
      inputExample: 'e.g. GC74B44246',
      tag: 'Engine No.',
      available: true
    }
    */
  ];

  constructor(private router: Router) {}

  openApi(id: string): void {
    this.router.navigate(['/dashboard/vahan', id]);
  }
}
