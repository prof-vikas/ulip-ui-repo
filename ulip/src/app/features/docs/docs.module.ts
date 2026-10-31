import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ApiDocComponent } from './api-doc.component';

/** API reference page, shared by the signed-in portal (/dashboard/docs) and the public site (/docs). */
@NgModule({
  declarations: [ApiDocComponent],
  imports: [SharedModule],
  exports: [ApiDocComponent]
})
export class DocsModule {}
