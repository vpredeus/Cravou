import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EntryShell } from '../../shared/components/entry-shell/entry-shell';

export interface NextStepContent {
  readonly heading: string;
  readonly subtitle: string;
  readonly notice: string;
  readonly backTo: string;
}

@Component({
  selector: 'app-next-step-page',
  imports: [EntryShell],
  template: `
    <app-entry-shell
      [heading]="content.heading"
      [subtitle]="content.subtitle"
      [backTo]="content.backTo"
    >
      <div class="entry-panel">
        <p>{{ content.notice }}</p>
      </div>
    </app-entry-shell>
  `,
  styleUrl: './next-step-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextStepPage {
  protected readonly content = inject(ActivatedRoute).snapshot.data as NextStepContent;
}
