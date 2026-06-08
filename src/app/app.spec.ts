import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App (root component)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not show navbar on the landing route ("/")', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    // showNav starts as false (landing page), so navbar should not be rendered
    const navbar = fixture.nativeElement.querySelector('app-navbar');
    expect(navbar).toBeNull();
  });
});
