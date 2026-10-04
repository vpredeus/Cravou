import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EntryShell } from '../../shared/components/entry-shell/entry-shell';

@Component({
  selector: 'app-local-entry-page',
  imports: [EntryShell, RouterLink],
  templateUrl: './local-entry-page.html',
  styleUrl: './local-entry-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalEntryPage {}
