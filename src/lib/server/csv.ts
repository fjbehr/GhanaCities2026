/** RFC 4180 CSV from objects; columns follow the first row's keys */
export function toCsv(rows: Record<string, unknown>[]): string {
	if (!rows.length) return '';
	const columns = Object.keys(rows[0]);
	const cell = (v: unknown) => {
		if (v === null || v === undefined) return '';
		const s = String(v);
		return /[",\r\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
	};
	return [columns, ...rows.map((r) => columns.map((c) => r[c]))]
		.map((r) => r.map(cell).join(','))
		.join('\r\n')
		.concat('\r\n');
}
