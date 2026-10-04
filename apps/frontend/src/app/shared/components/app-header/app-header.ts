import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SettingsPanel } from '../settings-panel/settings-panel';

@Component({
  selector: 'app-header',
  imports: [RouterLink, SettingsPanel],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHeader {
  readonly showBrand = input(true);
  readonly showSettings = input(false);
  readonly centeredNavigation = input(false);
  readonly backTo = input<string>();
  readonly settingsOpenedChange = output<boolean>();
}
