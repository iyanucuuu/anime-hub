// Utilidades para calcular el estado de emisión de un anime

export interface BroadcastInfo {
  day?: string;
  time?: string;
  timezone?: string;
  string?: string;
}

const DAY_MAP: Record<string, number> = {
  mondays: 1, tuesdays: 2, wednesdays: 3, thursdays: 4,
  fridays: 5, saturdays: 6, sundays: 0
};

export type AirStatus = 'today' | 'tomorrow' | 'this-week' | 'not-airing' | 'unknown';

export function getAirStatus(status: string, broadcast?: BroadcastInfo): AirStatus {
  if (status !== 'Currently Airing') return 'not-airing';
  if (!broadcast?.day) return 'unknown';

  const dayKey = broadcast.day.toLowerCase();
  const airDay = DAY_MAP[dayKey];
  if (airDay === undefined) return 'unknown';

  const todayJST = getTodayJST();

  if (airDay === todayJST) return 'today';
  if (airDay === (todayJST + 1) % 7) return 'tomorrow';

  // Dentro de los próximos 7 días
  for (let i = 2; i <= 6; i++) {
    if (airDay === (todayJST + i) % 7) return 'this-week';
  }
  return 'this-week'; // si está airing, es esta semana de todas formas
}

function getTodayJST(): number {
  const now = new Date();
  const jst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  return jst.getDay(); // 0=Sunday, 1=Monday...
}

export function airStatusLabel(status: AirStatus): { emoji: string; text: string; color: string } {
  switch (status) {
    case 'today':     return { emoji: '🔴', text: 'Hoy',         color: '#ff4444' };
    case 'tomorrow':  return { emoji: '🟡', text: 'Mañana',      color: '#ffc107' };
    case 'this-week': return { emoji: '📅', text: 'Esta semana', color: '#7c4dff' };
    default:          return { emoji: '',   text: '',             color: '' };
  }
}
