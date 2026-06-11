import { Component, AfterViewInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing implements AfterViewInit {
  particles = Array.from({ length: 25 }, () => {
    const left = Math.random() * 100;
    const delay = Math.random() * 12;
    const duration = 8 + Math.random() * 10;
    const size = 2 + Math.random() * 3;
    return `left:${left}%;bottom:-10px;width:${size}px;height:${size}px;animation-duration:${duration}s;animation-delay:-${delay}s`;
  });

  features = [
    {
      num: '01', jp: '発見', name: 'Descubre',
      desc: 'Explora rankings actualizados, temporadas en emisión y búsqueda avanzada por género, estudio o año.',
      color: '#FF2D55', delay: '1',
    },
    {
      num: '02', jp: '整理', name: 'Organiza',
      desc: 'Listas personales: Favoritos, Viendo, Vistos y Pendientes. Tu historial de anime, siempre a mano.',
      color: '#FFB627', delay: '2',
    },
    {
      num: '03', jp: '友達', name: 'Conecta',
      desc: 'Sigue a tus amigos y ve su actividad en tiempo real. Descubre lo que están viendo ahora mismo.',
      color: '#0EA5E9', delay: '3',
    },
    {
      num: '04', jp: '評価', name: 'Reseña',
      desc: 'Puntúa del 1 al 10 y escribe reseñas detalladas de cada serie. Comparte tu opinión.',
      color: '#A78BFA', delay: '4',
    },
  ];

  steps = [
    { n: '01', title: 'Regístrate', desc: 'Crea tu cuenta gratis en segundos con Google.', delay: '1' },
    { n: '02', title: 'Añade anime', desc: 'Busca y organiza lo que ya viste o tienes pendiente.', delay: '2' },
    { n: '03', title: 'Conecta', desc: 'Encuentra amigos y sigue su actividad en el feed.', delay: '3' },
  ];

  constructor(private router: Router) {}

  scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  ngAfterViewInit() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const d = parseInt(el.dataset['delay'] ?? '0', 10) * 110;
          setTimeout(() => el.classList.add('visible'), d);
          io.unobserve(el);
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' },
    );
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  }
}
