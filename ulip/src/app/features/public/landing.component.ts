import { Component } from '@angular/core';
import { CONTACT, DATA_SOURCES, FEATURES, PRODUCT_FAMILIES, STEPS } from './public-content';

/** Public home page for signed-out visitors. */
@Component({
  selector: 'app-landing',
  standalone: false,
  templateUrl: './landing.component.html',
  styleUrls: ['./public-pages.css', './landing.component.css']
})
export class LandingComponent {
  readonly sources = DATA_SOURCES;
  readonly steps = STEPS;
  readonly features = FEATURES;
  readonly families = PRODUCT_FAMILIES;
  readonly contact = CONTACT;
  readonly stats = [
    { value: '6', label: 'national data sources' },
    { value: '25', label: 'APIs across the six sources' },
    { value: '2', label: 'environments: sandbox & production' },
    { value: '15 min', label: 'token lifetime' }
  ];
}
