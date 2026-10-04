import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EntryShell } from '../../shared/components/entry-shell/entry-shell';

@Component({
  selector: 'app-home-page',
  imports: [EntryShell, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
