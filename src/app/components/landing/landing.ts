import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class Landing {
  tags = ['Shonen', 'Isekai', 'Mecha', 'Romance', 'Seinen', 'Fantasy', 'Action', 'Slice of Life', 'Horror', 'Sports', 'Mystery', 'Shoujo'];

  particles = Array.from({ length: 30 }, (_) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 10;
    const duration = 6 + Math.random() * 10;
    const size = 2 + Math.random() * 4;
    return `left:${left}%;bottom:-10px;width:${size}px;height:${size}px;animation-duration:${duration}s;animation-delay:${delay}s`;
  });

  constructor(private router: Router) {}

  get styledTags() {
    return this.tags.map((tag, i) => ({
      label: tag,
      style: `left:${(i * 8.5) % 95}%;animation-duration:${12 + i * 1.5}s;animation-delay:${i * 0.8}s`
    }));
  }

  enter() {
    this.router.navigate(['/home']);
  }
}
