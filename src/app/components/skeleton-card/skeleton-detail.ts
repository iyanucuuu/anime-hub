import { Component } from '@angular/core';

@Component({
  selector: 'app-skeleton-detail',
  imports: [],
  template: `
    <div class="skeleton-detail-header">
      <div class="skeleton-cover shimmer"></div>
      <div class="skeleton-info">
        <div class="skeleton-line shimmer" style="width:70%; height:1.8rem; margin-bottom:.75rem"></div>
        <div class="skeleton-line shimmer" style="width:45%; margin-bottom:1rem"></div>
        <div class="skeleton-badges">
          @for (_ of [1,2,3]; track $index) {
            <div class="skeleton-badge shimmer"></div>
          }
        </div>
        <div class="skeleton-line shimmer" style="width:100%; margin-bottom:.5rem"></div>
        <div class="skeleton-line shimmer" style="width:100%; margin-bottom:.5rem"></div>
        <div class="skeleton-line shimmer" style="width:80%; margin-bottom:1.5rem"></div>
        <div class="skeleton-actions">
          @for (_ of [1,2,3]; track $index) {
            <div class="skeleton-btn shimmer"></div>
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './skeleton-detail.css',
})
export class SkeletonDetail {}
