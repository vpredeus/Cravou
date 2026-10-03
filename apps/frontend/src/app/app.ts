import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PreferencesStore } from './shared/preferences/preferences-store';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
  host: {
    '[style.--accent-color]': 'preferences.accentColor()',
    '[style.--game-background]': 'preferences.backgroundColor()',
  },
})
export class App {
  protected readonly preferences = inject(PreferencesStore);
}
