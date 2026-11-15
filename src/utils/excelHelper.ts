import * as XLSX from 'xlsx';
import { ComputedPlayerStats, Player, RankingConfig } from '../types';

export function exportPlayersToExcel(
  players: ComputedPlayerStats[],
  config: RankingConfig,
  fileName: string = 'خشتەی_ریزبەندی_دادپەروەرانە.xlsx'
) {
  // Build header & rows
  const data = [
    ['خشتەی ریزبەندی یاریزانانی تۆپیپێ - سیستەمی دادپەروەرانە'],
    ['سیستەمی خاڵدانی: بردنەوە = ٣ خاڵ | یەکسانبوون = ١ خاڵ | دۆران = ٠ خاڵ'],
    [`شێوازی ریزبەندی: ${config.system === 'fair_wpi' ? `دادپەروەرانە (WPI بە فاکتەری +${config.bonusFactor})` : 'ڕێژەی سەرکەوتن'}`],
    [],
    [
      'پلە',
      'ناوی یاریزان',
      'بردنەوە',
      'دۆران',
      'یەکسانبوون',
      'کۆی یاریەکان',
      'کۆی خاڵەکان',
      'ڕێژەی بردنەوە (لە ١٠٠)',
      'نمرەی دادپەروەرانە (WPI)',
      'ڕێتینگ (لە ١٠)',
      'ئاست / دۆخ'
    ],
    ...players.map((p) => [
      p.rank,
      p.name,
      p.wins,
      p.losses,
      p.draws,
      p.totalMatches,
      p.totalPoints,
      p.winRate,
      p.fairScore,
      p.fairRating,
      p.tier === 'champions'
        ? 'تۆپ پلەیەر 🌟'
        : p.tier === 'top'
        ? 'ئاستی بەرز 🟢'
        : p.tier === 'danger'
        ? 'ناوچەی مەترسی 🔴'
        : 'ناوەڕاست ⚪'
    ])
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set RTL on sheet if supported
  if (!worksheet['!views']) {
    worksheet['!views'] = [{ rightToLeft: true }];
  }

  // Set column widths
  worksheet['!cols'] = [
    { wch: 8 },  // پلە
    { wch: 20 }, // ناو
    { wch: 10 }, // بردنەوە
    { wch: 10 }, // دۆران
    { wch: 12 }, // یەکسانبوون
    { wch: 14 }, // کۆی یاریەکان
    { wch: 14 }, // کۆی خاڵەکان
    { wch: 22 }, // ڕێژەی بردنەوە
    { wch: 24 }, // نمرەی دادپەروەرانە
    { wch: 16 }, // ڕێتینگ
    { wch: 18 }, // ئاست
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ریزبەندی');
  XLSX.writeFile(workbook, fileName);
}

export function parseExcelFile(file: File): Promise<Player[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        const workbook = XLSX.read(buffer, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Find header row containing 'ناوی یاریزان' or 'Player' or similar
        let headerRowIndex = -1;
        let nameColIdx = 2;
        let winsColIdx = 3;
        let lossesColIdx = 4;
        let drawsColIdx = 5;

        for (let i = 0; i < Math.min(rows.length, 15); i++) {
          const row = rows[i];
          if (!row) continue;
          const strRow = row.map((cell) => String(cell || '').trim());
          const foundNameIdx = strRow.findIndex(
            (c) => c.includes('ناوی') || c.includes('یاریزان') || c.toLowerCase().includes('name') || c.toLowerCase().includes('player')
          );
          if (foundNameIdx !== -1) {
            headerRowIndex = i;
            nameColIdx = foundNameIdx;
            // look for wins, losses, draws
            strRow.forEach((c, idx) => {
              if (c.includes('بردنەوە') || c.toLowerCase().includes('win')) winsColIdx = idx;
              if (c.includes('دۆران') || c.includes('دۆڕان') || c.toLowerCase().includes('loss')) lossesColIdx = idx;
              if (c.includes('یەکسان') || c.toLowerCase().includes('draw')) drawsColIdx = idx;
            });
            break;
          }
        }

        if (headerRowIndex === -1) {
          // Default to skiprows = 6 or 7
          headerRowIndex = 6;
        }

        const parsedPlayers: Player[] = [];

        for (let i = headerRowIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;

          const name = String(row[nameColIdx] || '').trim();
          if (!name || name === 'undefined' || name === 'null' || name.startsWith('=')) continue;

          const wins = Number(row[winsColIdx]) || 0;
          const losses = Number(row[lossesColIdx]) || 0;
          const draws = Number(row[drawsColIdx]) || 0;

          parsedPlayers.push({
            id: `p-import-${Date.now()}-${i}`,
            name,
            wins,
            losses,
            draws,
          });
        }

        if (parsedPlayers.length === 0) {
          reject(new Error('هیچ یاریزانێک لە فایلەکەدا نەدۆزرایەوە'));
        } else {
          resolve(parsedPlayers);
        }
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
}
