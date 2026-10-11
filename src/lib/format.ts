const nf = (digits: number) =>
	new Intl.NumberFormat('en-GB', { maximumFractionDigits: digits, minimumFractionDigits: 0 });

/** 1234567 → "1,234,567"; null/NaN → "–" */
export function num(v: number | null | undefined, digits = 0): string {
	return v === null || v === undefined || Number.isNaN(v) ? '–' : nf(digits).format(v);
}

/** 5624066 → "5.6 million", 811887 → "812,000" */
export function people(v: number | null | undefined): string {
	if (v === null || v === undefined || Number.isNaN(v)) return '–';
	if (v >= 1e6) return `${nf(1).format(v / 1e6)} million`;
	if (v >= 1e4) return nf(0).format(Math.round(v / 1000) * 1000);
	return nf(0).format(v);
}

export const pct = (v: number | null | undefined, digits = 0) =>
	v === null || v === undefined || Number.isNaN(v) ? '–' : `${nf(digits).format(v)} %`;

export const degrees = (v: number | null | undefined) =>
	v === null || v === undefined || Number.isNaN(v) ? '–' : `${nf(0).format(v)} °C`;

/** Signed °C difference: "+2.1 °C", "−0.4 °C" */
export function signedDegrees(v: number | null | undefined): string {
	if (v === null || v === undefined || Number.isNaN(v)) return '–';
	const s = nf(1).format(Math.abs(v));
	return `${v > 0 ? '+' : v < 0 ? '−' : '±'}${s} °C`;
}

/** "12 min ago", "3 h ago", "2 days ago" */
export function ago(iso: string | null | undefined, now = new Date()): string {
	if (!iso) return 'unknown';
	const minutes = Math.round((now.getTime() - new Date(iso).getTime()) / 60000);
	if (minutes < 1) return 'just now';
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 48) return `${hours} h ago`;
	return `${Math.round(hours / 24)} days ago`;
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** "2026-03" or "03" → "Mar" */
export const monthName = (period: string) => months[Number(period.slice(-2)) - 1] ?? period;

/** "2026-10-12" → "Mon 12 Oct" (Ghana time = UTC) */
export function dayName(date: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		timeZone: 'UTC'
	}).format(new Date(`${date}T12:00:00Z`));
}

/** "moderate (Saharan dust)" → "Moderate (Saharan dust)" */
export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
