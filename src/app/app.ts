import { Component, Signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Navbar } from './components/navbar/navbar';
import { ThemeService } from './services/theme';
import { filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  showNav: Signal<boolean>;
  // Inicializar ThemeService en el root para aplicar el tema desde el arranque
  private _theme = inject(ThemeService);

  constructor(private router: Router) {
    this.showNav = toSignal(
      this.router.events.pipe(
        filter(e => e instanceof NavigationEnd),
        map(e => (e as NavigationEnd).urlAfterRedirects !== '/')
      ),
      { initialValue: false }
    );
  }
}
