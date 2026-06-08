import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAirStatus, airStatusLabel } from './broadcast';

describe('getAirStatus', () => {
  it('devuelve "not-airing" si el anime no está en emisión', () => {
    expect(getAirStatus('Finished Airing')).toBe('not-airing');
    expect(getAirStatus('Not yet aired')).toBe('not-airing');
  });

  it('devuelve "unknown" si está en emisión pero falta el día de broadcast', () => {
    expect(getAirStatus('Currently Airing')).toBe('unknown');
    expect(getAirStatus('Currently Airing', {})).toBe('unknown');
    expect(getAirStatus('Currently Airing', { day: undefined })).toBe('unknown');
  });

  it('devuelve "unknown" si el día de broadcast no es reconocido', () => {
    expect(getAirStatus('Currently Airing', { day: 'weekdays' })).toBe('unknown');
  });

  it('devuelve "today" si el anime emite el día actual (JST)', () => {
    // Simulamos que hoy es martes (2) en JST
    const fakeTuesday = new Date('2025-01-07T10:00:00+09:00'); // martes en Tokio
    vi.setSystemTime(fakeTuesday);

    expect(getAirStatus('Currently Airing', { day: 'tuesdays' })).toBe('today');
  });

  it('devuelve "tomorrow" si el anime emite el día siguiente (JST)', () => {
    const fakeTuesday = new Date('2025-01-07T10:00:00+09:00');
    vi.setSystemTime(fakeTuesday);

    expect(getAirStatus('Currently Airing', { day: 'wednesdays' })).toBe('tomorrow');
  });

  it('devuelve "this-week" para días dentro de los próximos 7 días', () => {
    const fakeTuesday = new Date('2025-01-07T10:00:00+09:00');
    vi.setSystemTime(fakeTuesday);

    expect(getAirStatus('Currently Airing', { day: 'fridays' })).toBe('this-week');
    expect(getAirStatus('Currently Airing', { day: 'saturdays' })).toBe('this-week');
  });

  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });
});

describe('airStatusLabel', () => {
  it('devuelve el label correcto para cada estado', () => {
    expect(airStatusLabel('today').text).toBe('Hoy');
    expect(airStatusLabel('tomorrow').text).toBe('Mañana');
    expect(airStatusLabel('this-week').text).toBe('Esta semana');
  });

  it('devuelve strings vacíos para estados no emitibles', () => {
    const label = airStatusLabel('not-airing');
    expect(label.text).toBe('');
    expect(label.emoji).toBe('');
  });
});
