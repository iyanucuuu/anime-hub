import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-card',
  imports: [],
  template: `
    <div class="skeleton-grid">
      @for (_ of items; track $index) {
        <div class="skeleton-card">
          <div class="skeleton-img shimmer"></div>
          <div class="skeleton-info">
            <div class="skeleton-line shimmer" style="width: 80%"></div>
            <div class="skeleton-line shimmer" style="width: 45%; margin-top: .4rem"></div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrl: './skeleton-card.css',
})
export class SkeletonCard {
  @Input() count = 12;
  get items() { return Array(this.count); }
}
