import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface IceGateCard {
  id: string;
  title: string;
  desc: string;
  inputLabel: string;
  inputExample: string;
  tag: string;
  available: boolean;
}

@Component({
  selector: 'app-icegate-overview',
  standalone: false,
  templateUrl: './icegate-overview.component.html',
  styleUrls: ['./icegate-overview.component.css']
})
export class IceGateOverviewComponent {

  cards: IceGateCard[] = [
    { id: '01', title: 'ICE GATE 01', desc: 'Fetch Import General Manifest (IGM) vessel, voyage and container details.', inputLabel: 'IGM Number / IGM Date', inputExample: 'e.g. 2001362', tag: 'IGM No.', available: true },
    { id: '02', title: 'ICE GATE 02', desc: 'Fetch Bill of Entry container and cargo details — IMO code, weight, origin.', inputLabel: 'Bill of Entry Number / Date', inputExample: 'e.g. 2002892', tag: 'BE No.', available: true },
    { id: '03', title: 'ICE GATE 03', desc: 'Fetch Out of Charge (OOC) number and date for a Bill of Entry.', inputLabel: 'Bill of Entry Number / Date', inputExample: 'e.g. 6330973', tag: 'BE No.', available: true },
    { id: '04', title: 'ICE GATE 04', desc: 'Fetch vessel rotation number and shipping line/agent details by IMO code and arrival date.', inputLabel: 'Site ID / IMO Code / Vessel Code / Arrival Date', inputExample: 'e.g. 9241205', tag: 'IMO Code', available: true },
    { id: '05', title: 'ICE GATE 05', desc: 'Fetch Shipping Bill cargo details — nature, package count and destination port.', inputLabel: 'Shipping Bill Number / Date', inputExample: 'e.g. 6845161', tag: 'SB No.', available: true },
    { id: '06', title: 'ICE GATE 06', desc: 'Fetch the Let Export Order (LEO) date for a Shipping Bill.', inputLabel: 'Shipping Bill Number / Date', inputExample: 'e.g. 5444772', tag: 'SB No.', available: true },
    { id: '07', title: 'ICE GATE 07', desc: 'Fetch Import General Manifest (IGM) vessel, voyage and container details.', inputLabel: 'IGM Number / IGM Date', inputExample: 'e.g. 2000690', tag: 'IGM No.', available: true },
    { id: '08', title: 'ICE GATE 08', desc: 'Fetch Shipping Bill and container details linked to an Export General Manifest (EGM).', inputLabel: 'EGM Number / EGM Date', inputExample: 'e.g. 103978', tag: 'EGM No.', available: true },
    { id: '09', title: 'ICE GATE 09', desc: 'Fetch air cargo IGM, flight and package details using the MAWB number and customs site.', inputLabel: 'MAWB Number / Customs Site', inputExample: 'e.g. 06536234962', tag: 'MAWB No.', available: true },
    { id: '10', title: 'ICE GATE 10', desc: 'Fetch ICD/BL status and container clearance details using MAWB and HAWB numbers.', inputLabel: 'MAWB Number / HAWB Number', inputExample: 'e.g. 15754138070', tag: 'MAWB No.', available: true },
    { id: '11', title: 'ICE GATE 11', desc: 'Fetch flight-wise EGM/IGM manifest submission records by location and flight number.', inputLabel: 'Location / Flight Date / Flight Number / Flag', inputExample: 'e.g. 123G', tag: 'Flight No.', available: true },
    { id: '12', title: 'ICE GATE 12', desc: 'Fetch Shipping Bill EGM and LEO clearance details using the SB number, date and location.', inputLabel: 'Shipping Bill Number / Date / Location', inputExample: 'e.g. 1340721', tag: 'SB No.', available: true },
    { id: '13', title: 'ICE GATE 13', desc: 'Verify container e-seal details and status using the container and e-seal number.', inputLabel: 'Container Number / E-Seal Number', inputExample: 'e.g. MSKU3663553', tag: 'Container No.', available: true }
  ];

  constructor(private router: Router) {}

  openApi(id: string): void {
    this.router.navigate(['/dashboard/icegate', id]);
  }
}
