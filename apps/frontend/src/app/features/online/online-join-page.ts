import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EntryShell } from '../../shared/components/entry-shell/entry-shell';

@Component({
  selector: 'app-online-join-page',
  imports: [EntryShell],
  templateUrl: './online-join-page.html',
  styleUrl: './online-join-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnlineJoinPage {
  protected readonly code = signal('');
  private readonly router = inject(Router);

  protected editCode(event: Event): void {
    this.code.set((event.target as HTMLInputElement).value.toUpperCase());
  }

  protected submit(event: Event): void {
    event.preventDefault();
    const code = this.code().trim();
    this.code.set(code);
    if (code) void this.router.navigateByUrl('/online/join/next');
  }
}
