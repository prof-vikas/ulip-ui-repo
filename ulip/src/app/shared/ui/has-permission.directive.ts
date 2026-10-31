import { Directive, Input, TemplateRef, ViewContainerRef, effect, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

/** `*appHasPermission="'USER_MANAGE'"` renders its content only when the role grants that code. */
@Directive({
  selector: '[appHasPermission]',
  standalone: false
})
export class HasPermissionDirective {
  private readonly code = signal<string | null>(null);
  private shown = false;

  constructor(private tpl: TemplateRef<unknown>, private vcr: ViewContainerRef, auth: AuthService) {
    effect(() => {
      const allowed = auth.hasPermission(this.code()) && auth.permissions() !== null;
      if (allowed && !this.shown) {
        this.vcr.createEmbeddedView(this.tpl);
        this.shown = true;
      } else if (!allowed && this.shown) {
        this.vcr.clear();
        this.shown = false;
      }
    });
  }

  @Input() set appHasPermission(code: string) {
    this.code.set(code);
  }
}
