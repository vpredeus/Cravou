import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterNextRender,
  input,
  viewChild,
} from '@angular/core';
import { AppHeader } from '../app-header/app-header';

@Component({
  selector: 'app-entry-shell',
  imports: [AppHeader],
  templateUrl: './entry-shell.html',
  styleUrl: './entry-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntryShell {
  readonly heading = input.required<string>();
  readonly subtitle = input('');
  readonly backTo = input<string>();
  readonly welcome = input(false);
  private readonly title = viewChild.required<ElementRef<HTMLHeadingElement>>('title');

  constructor() {
    afterNextRender(() => this.title().nativeElement.focus({ preventScroll: true }));
  }
}
