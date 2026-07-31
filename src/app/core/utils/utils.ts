export function initials(name: string): string {
  return (name ?? '').split(' ').slice(0,2).map(p => p[0] ?? '').join('').toUpperCase();
}
export function formatSoles(v: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}
export function safePct(num: number, den: number, dec = 0): number {
  if (!den) return 0;
  return parseFloat(((num / den) * 100).toFixed(dec));
}
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let t: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }) as T;
}
