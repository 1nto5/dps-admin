import type { RequestHandler } from './$types';
import { db, workEntries, settings } from '$lib/db';
import { asc, eq } from 'drizzle-orm';
import {
	Document, Packer, Paragraph, Table, TableRow, TableCell,
	TextRun, WidthType, AlignmentType, BorderStyle,
	VerticalAlign, TableLayoutType, convertInchesToTwip,
	HeadingLevel, ShadingType
} from 'docx';

const POLISH_MONTHS = [
	'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
	'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

function formatDate(d: string): string {
	const [y, m, day] = d.split('-');
	return `${day}.${m}.${y}`;
}

function formatDuration(mins: number): string {
	const h = Math.floor(mins / 60);
	const m = mins % 60;
	return m > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${h}:00`;
}

// Consistent text helper
function txt(content: string, opts: { bold?: boolean; italic?: boolean; size?: number; color?: string } = {}): TextRun {
	return new TextRun({
		text: content,
		font: 'Calibri',
		size: opts.size || 22,
		bold: opts.bold,
		italics: opts.italic,
		color: opts.color
	});
}

export const GET: RequestHandler = async ({ url }) => {
	const monthParam = url.searchParams.get('month');
	if (!monthParam) {
		return new Response('Month parameter required', { status: 400 });
	}

	const [year, month] = monthParam.split('-').map(Number);
	const billingMonth = `${year}-${String(month).padStart(2, '0')}`;

	const entries = db
		.select()
		.from(workEntries)
		.where(eq(workEntries.billingMonth, billingMonth))
		.orderBy(asc(workEntries.date))
		.all();

	const contractDateSetting = db.select().from(settings).where(eq(settings.key, 'contract_date')).get();
	const contractDate = contractDateSetting?.value || '01.02.2023';

	const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);

	// Border styles
	const thinBorder = { style: BorderStyle.SINGLE, size: 4, color: '999999' };
	const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };

	const cellBorders = { top: thinBorder, bottom: thinBorder, left: thinBorder, right: thinBorder };
	const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

	// Cell margins for padding (in twips, 1 inch = 1440 twips)
	const cellMargins = { top: 40, bottom: 40, left: 80, right: 80 };

	// Header cell style (gray background)
	const headerShading = { fill: 'E8E8E8', type: ShadingType.CLEAR, color: 'auto' };

	const doc = new Document({
		styles: {
			default: {
				document: {
					run: { font: 'Calibri', size: 22 }
				}
			}
		},
		sections: [{
			properties: {
				page: {
					margin: {
						top: convertInchesToTwip(0.8),
						bottom: convertInchesToTwip(0.6),
						left: convertInchesToTwip(0.8),
						right: convertInchesToTwip(0.8)
					}
				}
			},
			children: [
				// ═══════════════════════════════════════════════════════════
				// HEADER SECTION
				// ═══════════════════════════════════════════════════════════
				new Table({
					width: { size: 100, type: WidthType.PERCENTAGE },
					layout: TableLayoutType.FIXED,
					rows: [
						new TableRow({
							children: [
								new TableCell({
									children: [
										new Paragraph({
											children: [txt('EWIDENCJA GODZIN', { bold: true, size: 32 })],
										}),
										new Paragraph({
											children: [txt('ŚWIADCZENIA USŁUG INFORMATYCZNYCH', { size: 20, color: '666666' })],
										})
									],
									borders: noBorders,
									width: { size: 65, type: WidthType.PERCENTAGE }
								}),
								new TableCell({
									children: [
										new Paragraph({
											children: [txt(`Załącznik do umowy`, { size: 18, color: '666666' })],
											alignment: AlignmentType.RIGHT
										}),
										new Paragraph({
											children: [txt(`z dnia ${contractDate} r.`, { size: 18, color: '666666' })],
											alignment: AlignmentType.RIGHT
										})
									],
									borders: noBorders,
									width: { size: 35, type: WidthType.PERCENTAGE },
									verticalAlign: VerticalAlign.CENTER
								})
							]
						})
					]
				}),

				// Divider line
				new Paragraph({
					border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: '333333' } },
					spacing: { after: 300 }
				}),

				// ═══════════════════════════════════════════════════════════
				// INFO SECTION (Month + Contractor)
				// ═══════════════════════════════════════════════════════════
				new Table({
					width: { size: 100, type: WidthType.PERCENTAGE },
					layout: TableLayoutType.FIXED,
					rows: [
						new TableRow({
							children: [
								new TableCell({
									children: [
										new Paragraph({ children: [txt('Okres rozliczeniowy:', { size: 20, color: '666666' })] }),
										new Paragraph({ children: [txt(`${POLISH_MONTHS[month - 1]} ${year}`, { bold: true, size: 26 })] })
									],
									borders: noBorders,
									width: { size: 50, type: WidthType.PERCENTAGE }
								}),
								new TableCell({
									children: [
										new Paragraph({ children: [txt('Zleceniobiorca:', { size: 20, color: '666666' })], alignment: AlignmentType.RIGHT }),
										new Paragraph({ children: [txt('Adrian Antosiak', { bold: true, size: 26 })], alignment: AlignmentType.RIGHT })
									],
									borders: noBorders,
									width: { size: 50, type: WidthType.PERCENTAGE }
								})
							]
						})
					]
				}),

				new Paragraph({ text: '', spacing: { after: 300 } }),

				// ═══════════════════════════════════════════════════════════
				// DATA TABLE
				// ═══════════════════════════════════════════════════════════
				new Table({
					width: { size: 100, type: WidthType.PERCENTAGE },
					layout: TableLayoutType.FIXED,
					rows: [
						// Header row
						new TableRow({
							tableHeader: true,
							children: [
								new TableCell({
									children: [new Paragraph({ children: [txt('Data', { bold: true, size: 20 })], alignment: AlignmentType.CENTER })],
									width: { size: 12, type: WidthType.PERCENTAGE },
									borders: cellBorders,
									shading: headerShading,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								}),
								new TableCell({
									children: [new Paragraph({ children: [txt('Od', { bold: true, size: 20 })], alignment: AlignmentType.CENTER })],
									width: { size: 8, type: WidthType.PERCENTAGE },
									borders: cellBorders,
									shading: headerShading,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								}),
								new TableCell({
									children: [new Paragraph({ children: [txt('Do', { bold: true, size: 20 })], alignment: AlignmentType.CENTER })],
									width: { size: 8, type: WidthType.PERCENTAGE },
									borders: cellBorders,
									shading: headerShading,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								}),
								new TableCell({
									children: [new Paragraph({ children: [txt('Godz.', { bold: true, size: 20 })], alignment: AlignmentType.CENTER })],
									width: { size: 10, type: WidthType.PERCENTAGE },
									borders: cellBorders,
									shading: headerShading,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								}),
								new TableCell({
									children: [new Paragraph({ children: [txt('Zakres wykonanych prac', { bold: true, size: 20 })], alignment: AlignmentType.CENTER })],
									width: { size: 62, type: WidthType.PERCENTAGE },
									borders: cellBorders,
									shading: headerShading,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								})
							]
						}),
						// Data rows
						...entries.map((entry) => new TableRow({
							children: [
								new TableCell({
									children: [new Paragraph({ children: [txt(formatDate(entry.date), { size: 20 })], alignment: AlignmentType.CENTER })],
									borders: cellBorders,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								}),
								new TableCell({
									children: [new Paragraph({ children: [txt(entry.startTime, { size: 20 })], alignment: AlignmentType.CENTER })],
									borders: cellBorders,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								}),
								new TableCell({
									children: [new Paragraph({ children: [txt(entry.endTime, { size: 20 })], alignment: AlignmentType.CENTER })],
									borders: cellBorders,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								}),
								new TableCell({
									children: [new Paragraph({ children: [txt(formatDuration(entry.duration), { size: 20, bold: true })], alignment: AlignmentType.CENTER })],
									borders: cellBorders,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								}),
								new TableCell({
									children: [new Paragraph({ children: [txt(entry.scope, { size: 20 })] })],
									borders: cellBorders,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								})
							]
						})),
						// Summary row
						new TableRow({
							children: [
								new TableCell({
									children: [new Paragraph({ children: [txt('SUMA', { bold: true, size: 20 })], alignment: AlignmentType.RIGHT })],
									columnSpan: 3,
									borders: cellBorders,
									shading: headerShading,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								}),
								new TableCell({
									children: [new Paragraph({ children: [txt(formatDuration(totalMinutes), { bold: true, size: 22 })], alignment: AlignmentType.CENTER })],
									borders: cellBorders,
									shading: headerShading,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								}),
								new TableCell({
									children: [new Paragraph({ text: '' })],
									borders: cellBorders,
									shading: headerShading,
									margins: cellMargins
								})
							]
						}),
						// Hourly rate row
						new TableRow({
							children: [
								new TableCell({
									children: [new Paragraph({ children: [txt('Stawka za godzinę', { size: 20 })], alignment: AlignmentType.RIGHT })],
									columnSpan: 3,
									borders: cellBorders,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								}),
								new TableCell({
									children: [new Paragraph({ text: '' })],
									borders: cellBorders,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								}),
								new TableCell({
									children: [new Paragraph({ text: '' })],
									borders: cellBorders,
									margins: cellMargins
								})
							]
						}),
						// Total payment row
						new TableRow({
							children: [
								new TableCell({
									children: [new Paragraph({ children: [txt('Razem do zapłaty', { bold: true, size: 20 })], alignment: AlignmentType.RIGHT })],
									columnSpan: 3,
									borders: cellBorders,
									shading: headerShading,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								}),
								new TableCell({
									children: [new Paragraph({ text: '' })],
									borders: cellBorders,
									shading: headerShading,
									verticalAlign: VerticalAlign.CENTER,
									margins: cellMargins
								}),
								new TableCell({
									children: [new Paragraph({ text: '' })],
									borders: cellBorders,
									shading: headerShading,
									margins: cellMargins
								})
							]
						})
					]
				}),

				new Paragraph({ text: '', spacing: { after: 600 } }),

				// ═══════════════════════════════════════════════════════════
				// SIGNATURES SECTION
				// ═══════════════════════════════════════════════════════════
				new Table({
					width: { size: 100, type: WidthType.PERCENTAGE },
					layout: TableLayoutType.FIXED,
					rows: [
						// Signature lines
						new TableRow({
							children: [
								new TableCell({
									children: [
										new Paragraph({ text: '', spacing: { after: 400 } }),
										new Paragraph({
											children: [txt('........................................', { size: 20 })],
											alignment: AlignmentType.CENTER
										}),
										new Paragraph({
											children: [txt('Podpis Zleceniobiorcy', { size: 18, color: '666666' })],
											alignment: AlignmentType.CENTER
										})
									],
									borders: noBorders,
									width: { size: 33, type: WidthType.PERCENTAGE }
								}),
								new TableCell({
									children: [
										new Paragraph({ text: '', spacing: { after: 400 } }),
										new Paragraph({
											children: [txt('........................................', { size: 20 })],
											alignment: AlignmentType.CENTER
										}),
										new Paragraph({
											children: [txt('Podpis Kierownika', { size: 18, color: '666666' })],
											alignment: AlignmentType.CENTER
										})
									],
									borders: noBorders,
									width: { size: 33, type: WidthType.PERCENTAGE }
								}),
								new TableCell({
									children: [
										new Paragraph({
											children: [txt('Zatwierdzam:', { size: 18, color: '666666' })],
											alignment: AlignmentType.CENTER
										}),
										new Paragraph({ text: '', spacing: { after: 200 } }),
										new Paragraph({
											children: [txt('........................................', { size: 20 })],
											alignment: AlignmentType.CENTER
										}),
										new Paragraph({ text: '' })
									],
									borders: noBorders,
									width: { size: 33, type: WidthType.PERCENTAGE }
								})
							]
						})
					]
				})
			]
		}]
	});

	const buffer = await Packer.toBuffer(doc);

	return new Response(new Uint8Array(buffer), {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'Content-Disposition': `attachment; filename="ewidencja-${monthParam}.docx"`
		}
	});
};
