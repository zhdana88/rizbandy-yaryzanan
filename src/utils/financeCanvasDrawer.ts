import { WeeklyFinanceSession, Player } from '../types';
import { computeSessionSummary, formatCurrency, formatDisplayDate, isGoalkeeper } from './financeUtils';
import { getDefaultAvatar } from './avatarHelper';
import { formatLiveKurdishFullDate, getTodayISODate } from './dateHelper';

// Helper to safely load an image with fallback
function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export interface FinanceDrawerOptions {
  session: WeeklyFinanceSession;
  players: Player[];
  matrixTuesdays?: string[];
  sessionMap?: Map<string, WeeklyFinanceSession>;
  playerMatrixStats?: Record<string, { totalPaid: number; totalDebt: number; matchCount: number }>;
  columnMatrixTotals?: Record<string, { totalCollected: number; pitchCost: number; net: number; attendedCount: number }>;
  activeSummary?: {
    totalIncome: number;
    totalPitchRent: number;
    totalOtherExpenses: number;
    totalExpenses: number;
    netBalance: number;
    totalOutstandingDebt: number;
  };
  leagueTitle?: string;
  theme?: 'dark' | 'emerald' | 'navy' | 'white' | 'cream' | 'custom';
  customBgColor?: string;
  mode?: 'matrix' | 'single';
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  let clean = (hex || '#ffffff').replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 255, g: 255, b: 255 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function isColorLight(hex: string): boolean {
  const { r, g, b } = parseHexColor(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
}

function adjustBrightness(hex: string, percent: number): string {
  const { r, g, b } = parseHexColor(hex);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, r + amt));
  const G = Math.min(255, Math.max(0, g + amt));
  const B = Math.min(255, Math.max(0, b + amt));
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

export async function drawFinanceToCanvas(options: FinanceDrawerOptions): Promise<HTMLCanvasElement> {
  const {
    session,
    players,
    matrixTuesdays = [],
    sessionMap = new Map(),
    playerMatrixStats = {},
    columnMatrixTotals = {},
    activeSummary,
    leagueTitle = 'ڕێزبەندی Rizbandy',
    theme = 'white',
    customBgColor,
    mode = 'matrix',
  } = options;

  const singleSummary = computeSessionSummary(session);
  const summary = activeSummary || {
    totalIncome: singleSummary.totalCollected,
    totalPitchRent: singleSummary.totalPitchCost,
    totalOtherExpenses: singleSummary.totalOtherExpenses,
    totalExpenses: singleSummary.totalExpenses,
    netBalance: singleSummary.remainingBalance,
    totalOutstandingDebt: singleSummary.totalOutstandingDebt,
  };

  // Dimensions & Scale (Retina 2x)
  const scale = 2; // ٢ قات کردنی کوالیتی بۆ ئەوەی ڕێتینا و زۆر ڕوون بێت
  const isMatrix = mode === 'matrix';
  const width = isMatrix ? Math.max(1180, 500 + matrixTuesdays.length * 125) : 1180;
  
  const headerHeight = 150;
  const statsHeight = 120;
  const tableHeaderHeight = 52;
  const rowHeight = 44;
  const tableHeight = tableHeaderHeight + players.length * rowHeight + 54; // rows + tfoot
  const footerHeight = 65;
  const padding = 32;

  const totalHeight = headerHeight + statsHeight + tableHeight + footerHeight + padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = totalHeight * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d context');

  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Determine if theme or custom color is Light or Dark
  let isLight = false;
  if (theme === 'white' || (theme as any) === 'light') {
    isLight = true;
  } else if (theme === 'cream') {
    isLight = true;
  } else if (theme === 'custom' || customBgColor) {
    isLight = isColorLight(customBgColor || '#ffffff');
  } else if (theme === 'emerald' || theme === 'navy' || theme === 'dark') {
    isLight = false;
  }

  // Background Theme Colors
  let bgGradientStart = '#ffffff';
  let bgGradientEnd = '#f8fafc';
  let cardBg = '#ffffff';
  let cardBorder = '#cbd5e1';
  let accentColor = '#059669';
  let accentLight = '#047857';
  let textPrimary = '#0f172a';
  let textSecondary = '#334155';
  let textMuted = '#64748b';
  let tableBg = '#ffffff';
  let tableHeaderBg = '#f1f5f9';
  let tableRowEven = '#ffffff';
  let tableRowOdd = '#f8fafc';
  let tableRowBorder = '#e2e8f0';
  let tableBorder = '#cbd5e1';
  let tableFooterBg = '#f1f5f9';
  let netBoxBg = '#ffffff';
  let paidColor = '#047857';
  let debtColor = '#b91c1c';
  let exemptColor = '#0284c7';
  let absentColor = '#64748b';
  let netPositiveColor = '#047857';
  let netNegativeColor = '#b91c1c';

  if (isLight) {
    if (theme === 'cream') {
      bgGradientStart = '#faf8f5';
      bgGradientEnd = '#f4efe6';
      cardBg = '#ffffff';
      cardBorder = '#e7e0d3';
      textPrimary = '#1c1917';
      textSecondary = '#44403c';
      textMuted = '#78716c';
      tableBg = '#ffffff';
      tableHeaderBg = '#f3eee4';
      tableRowEven = '#ffffff';
      tableRowOdd = '#fcfbf9';
      tableRowBorder = '#eee8dc';
      tableBorder = '#ded5c4';
      tableFooterBg = '#f3eee4';
    } else if (theme === 'custom' && customBgColor) {
      const userBg = customBgColor;
      bgGradientStart = userBg;
      bgGradientEnd = adjustBrightness(userBg, -4);
      cardBg = '#ffffff';
      cardBorder = adjustBrightness(userBg, -16);
      textPrimary = '#0f172a';
      textSecondary = '#334155';
      textMuted = '#64748b';
      tableBg = '#ffffff';
      tableHeaderBg = adjustBrightness(userBg, -7);
      tableRowEven = '#ffffff';
      tableRowOdd = adjustBrightness(userBg, -3);
      tableRowBorder = adjustBrightness(userBg, -10);
      tableBorder = adjustBrightness(userBg, -16);
      tableFooterBg = adjustBrightness(userBg, -7);
    } else {
      // Clean White Theme (Default)
      bgGradientStart = '#ffffff';
      bgGradientEnd = '#f8fafc';
      cardBg = '#ffffff';
      cardBorder = '#e2e8f0';
      tableBg = '#ffffff';
      tableHeaderBg = '#f1f5f9';
      tableRowEven = '#ffffff';
      tableRowOdd = '#f8fafc';
      tableRowBorder = '#f1f5f9';
      tableBorder = '#cbd5e1';
      tableFooterBg = '#f1f5f9';
    }
  } else {
    // Darker / Deep Themes
    paidColor = '#34d399';
    debtColor = '#f87171';
    exemptColor = '#06b6d4';
    absentColor = '#64748b';
    netPositiveColor = '#34d399';
    netNegativeColor = '#f87171';
    textPrimary = '#ffffff';
    textSecondary = '#94a3b8';
    textMuted = '#64748b';
    tableBg = '#0b1120';
    tableHeaderBg = '#1e293b';
    tableRowEven = '#0f172a';
    tableRowOdd = '#090d16';
    tableRowBorder = '#1e293b';
    tableFooterBg = '#0f172a';
    netBoxBg = '#030712';

    if (theme === 'emerald') {
      bgGradientStart = '#022c22';
      bgGradientEnd = '#011812';
      cardBg = '#064e3b';
      cardBorder = '#047857';
      accentColor = '#10b981';
      accentLight = '#6ee7b7';
      tableBorder = '#047857';
    } else if (theme === 'navy') {
      bgGradientStart = '#0b132b';
      bgGradientEnd = '#050a18';
      cardBg = '#1c2541';
      cardBorder = '#3a506b';
      accentColor = '#38bdf8';
      accentLight = '#7dd3fc';
      tableBorder = '#3a506b';
    } else if (theme === 'custom' && customBgColor) {
      const userBg = customBgColor;
      bgGradientStart = userBg;
      bgGradientEnd = adjustBrightness(userBg, -10);
      cardBg = adjustBrightness(userBg, 6);
      cardBorder = adjustBrightness(userBg, 18);
      accentColor = '#10b981';
      accentLight = '#34d399';
      tableBorder = adjustBrightness(userBg, 20);
    } else {
      // Classic Dark
      bgGradientStart = '#080c16';
      bgGradientEnd = '#03050a';
      cardBg = '#0e1626';
      cardBorder = '#1e293b';
      accentColor = '#10b981';
      accentLight = '#34d399';
      tableBorder = '#1e293b';
    }
  }

  // Draw Poster Background
  const grad = ctx.createLinearGradient(0, 0, width, totalHeight);
  grad.addColorStop(0, bgGradientStart);
  grad.addColorStop(1, bgGradientEnd);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, totalHeight);

  // Outer border
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, width - 20, totalHeight - 20);

  // Try preloading logo
  const logoImg = await loadImageSafe('/logo.jpg');

  // Preload player avatars
  const avatarMap = new Map<string, HTMLImageElement>();
  await Promise.all(
    players.map(async (p) => {
      const avatarUrl = p.avatar?.trim() || getDefaultAvatar(p.name, p.id);
      const img = await loadImageSafe(avatarUrl);
      if (img) avatarMap.set(p.id, img);
    })
  );

  let currentY = padding;

  // -------------------------------------------------------------
  // 1. HEADER SECTION
  // -------------------------------------------------------------
  const headerCardX = padding;
  const headerCardW = width - padding * 2;
  const headerCardH = 120;

  // Header background container
  ctx.fillStyle = cardBg;
  ctx.beginPath();
  ctx.roundRect(headerCardX, currentY, headerCardW, headerCardH, 16);
  ctx.fill();
  ctx.strokeStyle = cardBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Logo on the Right (RTL layout)
  const logoSize = 84;
  const logoX = headerCardX + headerCardW - logoSize - 20;
  const logoY = currentY + (headerCardH - logoSize) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(logoX, logoY, logoSize, logoSize, 14);
  ctx.clip();
  if (logoImg) {
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
  } else {
    // Fallback vector shield/badge
    ctx.fillStyle = isLight ? '#059669' : '#065f46';
    ctx.fillRect(logoX, logoY, logoSize, logoSize);
    ctx.fillStyle = isLight ? '#ffffff' : '#34d399';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚽', logoX + logoSize / 2, logoY + logoSize / 2);
  }
  ctx.restore();

  // Logo Border
  ctx.strokeStyle = isLight ? '#059669' : accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(logoX, logoY, logoSize, logoSize, 14);
  ctx.stroke();

  // Titles (Right to Left)
  const textStartX = logoX - 24;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';

  // League Title & Official Badge
  ctx.fillStyle = textPrimary;
  ctx.font = '900 24px Vazirmatn, system-ui, sans-serif';
  ctx.fillText(leagueTitle, textStartX, currentY + 45);

  // Subtitle
  ctx.fillStyle = isLight ? '#059669' : accentLight;
  ctx.font = 'bold 13px Vazirmatn, system-ui, sans-serif';
  ctx.fillText(
    isMatrix
      ? 'خشتەی فەرمی حیساباتی دارایی ڕۆژانی سێشەممە (Weekly Tuesday Finance Matrix)'
      : `پسوولەی حیساباتی دارایی هەفتانە • بەروار: ${session.date}`,
    textStartX,
    currentY + 74
  );

  // System Badge
  ctx.fillStyle = textMuted;
  ctx.font = '11px Vazirmatn, system-ui, sans-serif';
  ctx.fillText('تۆماری دارایی و سندووقی یاریزانانی یاریگا • بەڕێوەبردنی شەفاف', textStartX, currentY + 98);

  // Net Balance Box on Left Side of Header
  const netBoxW = 240;
  const netBoxH = 84;
  const netBoxX = headerCardX + 20;
  const netBoxY = currentY + (headerCardH - netBoxH) / 2;

  ctx.fillStyle = netBoxBg;
  ctx.beginPath();
  ctx.roundRect(netBoxX, netBoxY, netBoxW, netBoxH, 12);
  ctx.fill();
  ctx.strokeStyle = summary.netBalance >= 0 ? (isLight ? '#059669' : '#059669') : '#dc2626';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = textMuted;
  ctx.font = 'bold 11px Vazirmatn, system-ui, sans-serif';
  ctx.fillText('ڕاپۆرتی کۆتایی سندووق (Net)', netBoxX + netBoxW / 2, netBoxY + 24);

  ctx.fillStyle = summary.netBalance >= 0 ? netPositiveColor : netNegativeColor;
  ctx.font = '900 20px monospace';
  const netSign = summary.netBalance >= 0 ? '+' : '';
  ctx.fillText(`${netSign}${formatCurrency(summary.netBalance)}`, netBoxX + netBoxW / 2, netBoxY + 52);

  ctx.fillStyle = summary.netBalance >= 0 ? (isLight ? '#059669' : '#10b981') : (isLight ? '#dc2626' : '#ef4444');
  ctx.font = 'bold 10px Vazirmatn, system-ui, sans-serif';
  ctx.fillText(
    summary.netBalance >= 0 ? '✓ بڕی ماوەتەوە لە سندووق' : '⚠ کورتهێنانی دارایی',
    netBoxX + netBoxW / 2,
    netBoxY + 72
  );

  currentY += headerCardH + 18;

  // -------------------------------------------------------------
  // 2. STATS SUMMARY 4 CARDS
  // -------------------------------------------------------------
  const cardCount = 4;
  const cardGap = 14;
  const singleCardW = (headerCardW - cardGap * (cardCount - 1)) / cardCount;
  const statCardH = 92;

  const statItems = [
    {
      title: 'کۆی گشتی داهات',
      sub: 'Total Income',
      val: formatCurrency(summary.totalIncome),
      color: isLight ? '#047857' : '#34d399',
      border: isLight ? '#cbd5e1' : '#059669',
    },
    {
      title: 'پارەی وەصڵی ساحە',
      sub: 'Pitch Rent',
      val: formatCurrency(summary.totalPitchRent),
      color: isLight ? '#1d4ed8' : '#60a5fa',
      border: isLight ? '#cbd5e1' : '#2563eb',
    },
    {
      title: 'خەرجی تۆپ و پێداویستی',
      sub: 'Expenses & Balls',
      val: formatCurrency(summary.totalOtherExpenses),
      color: isLight ? '#b45309' : '#fbbf24',
      border: isLight ? '#cbd5e1' : '#d97706',
    },
    {
      title: 'کۆی قەرزە نەدراوەکان',
      sub: 'Unpaid Debt',
      val: formatCurrency(summary.totalOutstandingDebt),
      color: summary.totalOutstandingDebt > 0 
        ? (isLight ? '#b91c1c' : '#f87171') 
        : (isLight ? '#64748b' : '#94a3b8'),
      border: summary.totalOutstandingDebt > 0 ? (isLight ? '#dc2626' : '#dc2626') : (isLight ? '#cbd5e1' : '#334155'),
    },
  ];

  statItems.forEach((item, idx) => {
    const cx = headerCardX + idx * (singleCardW + cardGap);
    ctx.fillStyle = cardBg;
    ctx.beginPath();
    ctx.roundRect(cx, currentY, singleCardW, statCardH, 14);
    ctx.fill();
    ctx.strokeStyle = item.border;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = isLight ? '#1e293b' : '#cbd5e1';
    ctx.font = 'bold 12px Vazirmatn, system-ui, sans-serif';
    ctx.fillText(item.title, cx + singleCardW / 2, currentY + 28);

    ctx.fillStyle = item.color;
    ctx.font = '900 17px monospace';
    ctx.fillText(item.val, cx + singleCardW / 2, currentY + 56);

    ctx.fillStyle = textMuted;
    ctx.font = '10px sans-serif';
    ctx.fillText(item.sub, cx + singleCardW / 2, currentY + 76);
  });

  currentY += statCardH + 18;

  // -------------------------------------------------------------
  // 3. TABLE RENDERING
  // -------------------------------------------------------------
  const tableX = headerCardX;
  const tableW = headerCardW;

  // Draw Table Container Background
  ctx.fillStyle = tableBg;
  ctx.beginPath();
  ctx.roundRect(tableX, currentY, tableW, tableHeight, 14);
  ctx.fill();
  ctx.strokeStyle = tableBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (isMatrix) {
    // MATRIX TABLE COLUMNS
    const colNumW = 44;
    const colPlayerW = 220;
    const colTotalW = 120;
    const colDebtW = 100;
    const remainingW = tableW - colNumW - colPlayerW - colTotalW - colDebtW;
    const colDateW = matrixTuesdays.length > 0 ? remainingW / matrixTuesdays.length : 100;

    // Table Header Row
    ctx.fillStyle = tableHeaderBg;
    ctx.beginPath();
    ctx.roundRect(tableX, currentY, tableW, tableHeaderHeight, [14, 14, 0, 0]);
    ctx.fill();

    // Table Header Texts
    ctx.textBaseline = 'middle';
    const headerMidY = currentY + tableHeaderHeight / 2;

    // # (Index)
    let curColX = tableX + tableW;
    curColX -= colNumW;
    ctx.textAlign = 'center';
    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = 'bold 12px Vazirmatn, sans-serif';
    ctx.fillText('#', curColX + colNumW / 2, headerMidY);

    // Player Name
    curColX -= colPlayerW;
    ctx.textAlign = 'right';
    ctx.fillStyle = textPrimary;
    ctx.font = 'bold 13px Vazirmatn, sans-serif';
    ctx.fillText('ناوی یاریزان (Player)', curColX + colPlayerW - 16, headerMidY);

    // Tuesday Columns
    matrixTuesdays.forEach((tDate) => {
      curColX -= colDateW;
      ctx.textAlign = 'center';
      ctx.fillStyle = isLight ? '#047857' : '#34d399';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(formatDisplayDate(tDate), curColX + colDateW / 2, headerMidY - 7);
      ctx.fillStyle = textMuted;
      ctx.font = '10px Vazirmatn, sans-serif';
      ctx.fillText('سێشەممە', curColX + colDateW / 2, headerMidY + 10);
    });

    // Total Paid Column
    curColX -= colTotalW;
    ctx.textAlign = 'center';
    ctx.fillStyle = isLight ? '#047857' : '#34d399';
    ctx.font = 'bold 12px Vazirmatn, sans-serif';
    ctx.fillText('کۆی دراو', curColX + colTotalW / 2, headerMidY);

    // Debt Column
    curColX -= colDebtW;
    ctx.textAlign = 'center';
    ctx.fillStyle = isLight ? '#b91c1c' : '#f87171';
    ctx.font = 'bold 12px Vazirmatn, sans-serif';
    ctx.fillText('قەرز', curColX + colDebtW / 2, headerMidY);

    // Rows for players
    let rowY = currentY + tableHeaderHeight;

    players.forEach((p, pIdx) => {
      const pStat = playerMatrixStats[p.id] || { totalPaid: 0, totalDebt: 0, matchCount: 0 };
      const isGK = isGoalkeeper(p);
      const rowMidY = rowY + rowHeight / 2;

      // Row alternate background
      ctx.fillStyle = pIdx % 2 === 0 ? tableRowEven : tableRowOdd;
      ctx.fillRect(tableX, rowY, tableW, rowHeight);

      // Row bottom divider
      ctx.strokeStyle = tableRowBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tableX, rowY + rowHeight);
      ctx.lineTo(tableX + tableW, rowY + rowHeight);
      ctx.stroke();

      let cellX = tableX + tableW;

      // 1. #
      cellX -= colNumW;
      ctx.textAlign = 'center';
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(String(pIdx + 1), cellX + colNumW / 2, rowMidY);

      // 2. Avatar & Name
      cellX -= colPlayerW;
      const avatarSize = 26;
      const avatarX = cellX + colPlayerW - avatarSize - 12;
      const avatarY = rowMidY - avatarSize / 2;

      const pImg = avatarMap.get(p.id);
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 6);
      ctx.clip();
      if (pImg) {
        ctx.drawImage(pImg, avatarX, avatarY, avatarSize, avatarSize);
      } else {
        ctx.fillStyle = isLight ? '#e2e8f0' : '#1e293b';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isGK ? '🧤' : p.name.slice(0, 1), avatarX + avatarSize / 2, rowMidY);
      }
      ctx.restore();

      // Draw Player Name
      ctx.textAlign = 'right';
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 12px Vazirmatn, sans-serif';
      ctx.fillText(p.name, avatarX - 10, rowMidY);

      if (isGK) {
        // Goalkeeper badge
        ctx.fillStyle = isLight ? '#0284c7' : '#0891b2';
        ctx.font = 'bold 9px Vazirmatn, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('(گۆڵچی)', avatarX - 10 - ctx.measureText(p.name).width - 6, rowMidY);
      }

      // 3. Tuesdays Matrix Cells
      matrixTuesdays.forEach((tDate) => {
        cellX -= colDateW;
        const rec = sessionMap.get(tDate)?.records[p.id];
        const status = rec?.status || (rec?.isExempt ? 'exempt' : rec?.attended ? 'attended' : 'absent');
        const paid = rec ? Number(rec.paidAmount) || 0 : 0;
        const isPaidFull = status === 'attended' && paid >= 5000;
        const isExempt = status === 'exempt';
        const isAbsent = status === 'absent';

        ctx.textAlign = 'center';
        if (isExempt) {
          ctx.fillStyle = exemptColor;
          ctx.font = 'bold 11px Vazirmatn, sans-serif';
          ctx.fillText('بەخشراو 🧤', cellX + colDateW / 2, rowMidY);
        } else if (isAbsent) {
          ctx.fillStyle = absentColor;
          ctx.font = '11px Vazirmatn, sans-serif';
          ctx.fillText('نەهاتووە', cellX + colDateW / 2, rowMidY);
        } else if (isPaidFull) {
          ctx.fillStyle = paidColor;
          ctx.font = 'bold 11px monospace';
          ctx.fillText(paid.toLocaleString('en-US'), cellX + colDateW / 2, rowMidY);
        } else {
          ctx.fillStyle = debtColor;
          ctx.font = 'bold 11px monospace';
          ctx.fillText(paid > 0 ? paid.toLocaleString('en-US') : '0', cellX + colDateW / 2, rowMidY);
        }
      });

      // 4. Total Paid
      cellX -= colTotalW;
      ctx.textAlign = 'center';
      ctx.fillStyle = paidColor;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(pStat.totalPaid.toLocaleString('en-US'), cellX + colTotalW / 2, rowMidY);

      // 5. Debt
      cellX -= colDebtW;
      ctx.textAlign = 'center';
      if (pStat.totalDebt > 0) {
        ctx.fillStyle = debtColor;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(pStat.totalDebt.toLocaleString('en-US'), cellX + colDebtW / 2, rowMidY);
      } else {
        ctx.fillStyle = isLight ? '#047857' : '#10b981';
        ctx.font = 'bold 11px monospace';
        ctx.fillText('0', cellX + colDebtW / 2, rowMidY);
      }

      rowY += rowHeight;
    });

    // TABLE FOOTER (TFOOT)
    ctx.fillStyle = tableFooterBg;
    ctx.beginPath();
    ctx.roundRect(tableX, rowY, tableW, 54, [0, 0, 14, 14]);
    ctx.fill();
    ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    const tfootMidY = rowY + 27;
    let tfX = tableX + tableW;

    // ColSpan for Name + #
    tfX -= colNumW + colPlayerW;
    ctx.textAlign = 'right';
    ctx.fillStyle = textPrimary;
    ctx.font = '900 13px Vazirmatn, sans-serif';
    ctx.fillText('کۆی گشتی هەفتانە (مجموع):', tfX + colPlayerW - 16, tfootMidY);

    // Tuesday totals
    matrixTuesdays.forEach((tDate) => {
      tfX -= colDateW;
      const colTotal = columnMatrixTotals[tDate]?.totalCollected || 0;
      ctx.textAlign = 'center';
      ctx.fillStyle = isLight ? '#047857' : '#34d399';
      ctx.font = '900 12px monospace';
      ctx.fillText(colTotal.toLocaleString('en-US'), tfX + colDateW / 2, tfootMidY);
    });

    // Grand Total Paid
    tfX -= colTotalW;
    ctx.textAlign = 'center';
    ctx.fillStyle = isLight ? '#047857' : '#10b981';
    ctx.font = '900 13px monospace';
    ctx.fillText(summary.totalIncome.toLocaleString('en-US'), tfX + colTotalW / 2, tfootMidY);

    // Grand Total Debt
    tfX -= colDebtW;
    ctx.textAlign = 'center';
    ctx.fillStyle = summary.totalOutstandingDebt > 0 ? debtColor : (isLight ? '#047857' : '#10b981');
    ctx.font = '900 13px monospace';
    ctx.fillText(summary.totalOutstandingDebt.toLocaleString('en-US'), tfX + colDebtW / 2, tfootMidY);

  } else {
    // SINGLE SESSION RECEIPT TABLE
    const colNumW = 50;
    const colPlayerW = 320;
    const colStatusW = 160;
    const colPaidW = 160;
    const colDebtW = 150;
    const colActionW = tableW - colNumW - colPlayerW - colStatusW - colPaidW - colDebtW;

    // Header
    ctx.fillStyle = tableHeaderBg;
    ctx.beginPath();
    ctx.roundRect(tableX, currentY, tableW, tableHeaderHeight, [14, 14, 0, 0]);
    ctx.fill();

    ctx.textBaseline = 'middle';
    const headerMidY = currentY + tableHeaderHeight / 2;

    let curColX = tableX + tableW;
    curColX -= colNumW;
    ctx.textAlign = 'center';
    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = 'bold 12px Vazirmatn, sans-serif';
    ctx.fillText('#', curColX + colNumW / 2, headerMidY);

    curColX -= colPlayerW;
    ctx.textAlign = 'right';
    ctx.fillStyle = textPrimary;
    ctx.font = 'bold 13px Vazirmatn, sans-serif';
    ctx.fillText('ناوی یاریزان', curColX + colPlayerW - 16, headerMidY);

    curColX -= colStatusW;
    ctx.textAlign = 'center';
    ctx.fillStyle = textPrimary;
    ctx.fillText('دۆخی ئامادەبوون', curColX + colStatusW / 2, headerMidY);

    curColX -= colPaidW;
    ctx.textAlign = 'center';
    ctx.fillStyle = paidColor;
    ctx.fillText('بڕی دراو', curColX + colPaidW / 2, headerMidY);

    curColX -= colDebtW;
    ctx.textAlign = 'center';
    ctx.fillStyle = debtColor;
    ctx.fillText('بڕی قەرز', curColX + colDebtW / 2, headerMidY);

    curColX -= colActionW;
    ctx.textAlign = 'center';
    ctx.fillStyle = textMuted;
    ctx.fillText('دۆخی حیسابات', curColX + colActionW / 2, headerMidY);

    // Rows
    let rowY = currentY + tableHeaderHeight;
    players.forEach((p, pIdx) => {
      const rec = session.records[p.id];
      const status = rec?.status || (rec?.isExempt ? 'exempt' : rec?.attended ? 'attended' : 'absent');
      const paid = rec ? rec.paidAmount : 0;
      const debt = rec ? rec.currentDebt : 0;
      const isGK = isGoalkeeper(p);
      const rowMidY = rowY + rowHeight / 2;

      ctx.fillStyle = pIdx % 2 === 0 ? tableRowEven : tableRowOdd;
      ctx.fillRect(tableX, rowY, tableW, rowHeight);

      ctx.strokeStyle = tableRowBorder;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tableX, rowY + rowHeight);
      ctx.lineTo(tableX + tableW, rowY + rowHeight);
      ctx.stroke();

      let cellX = tableX + tableW;

      // #
      cellX -= colNumW;
      ctx.textAlign = 'center';
      ctx.fillStyle = textMuted;
      ctx.font = 'bold 11px monospace';
      ctx.fillText(String(pIdx + 1), cellX + colNumW / 2, rowMidY);

      // Name & Avatar
      cellX -= colPlayerW;
      const avatarSize = 26;
      const avatarX = cellX + colPlayerW - avatarSize - 12;
      const avatarY = rowMidY - avatarSize / 2;
      const pImg = avatarMap.get(p.id);

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(avatarX, avatarY, avatarSize, avatarSize, 6);
      ctx.clip();
      if (pImg) {
        ctx.drawImage(pImg, avatarX, avatarY, avatarSize, avatarSize);
      } else {
        ctx.fillStyle = isLight ? '#e2e8f0' : '#1e293b';
        ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
        ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isGK ? '🧤' : p.name.slice(0, 1), avatarX + avatarSize / 2, rowMidY);
      }
      ctx.restore();

      ctx.textAlign = 'right';
      ctx.fillStyle = textPrimary;
      ctx.font = 'bold 12px Vazirmatn, sans-serif';
      ctx.fillText(p.name, avatarX - 10, rowMidY);

      // Status
      cellX -= colStatusW;
      ctx.textAlign = 'center';
      if (status === 'exempt') {
        ctx.fillStyle = exemptColor;
        ctx.font = 'bold 11px Vazirmatn, sans-serif';
        ctx.fillText('بەخشراو 🧤', cellX + colStatusW / 2, rowMidY);
      } else if (status === 'attended') {
        ctx.fillStyle = isLight ? '#047857' : '#10b981';
        ctx.font = 'bold 11px Vazirmatn, sans-serif';
        ctx.fillText('هاتووە ✓', cellX + colStatusW / 2, rowMidY);
      } else {
        ctx.fillStyle = absentColor;
        ctx.font = '11px Vazirmatn, sans-serif';
        ctx.fillText('نەهاتووە ✗', cellX + colStatusW / 2, rowMidY);
      }

      // Paid
      cellX -= colPaidW;
      ctx.textAlign = 'center';
      ctx.fillStyle = paidColor;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(status === 'exempt' ? '٠ د.ع' : status === 'absent' ? '٠ د.ع' : formatCurrency(paid), cellX + colPaidW / 2, rowMidY);

      // Debt
      cellX -= colDebtW;
      ctx.textAlign = 'center';
      ctx.fillStyle = debt > 0 ? debtColor : (isLight ? '#047857' : '#10b981');
      ctx.font = 'bold 12px monospace';
      ctx.fillText(debt > 0 ? formatCurrency(debt) : '0', cellX + colDebtW / 2, rowMidY);

      // Action / Final Status
      cellX -= colActionW;
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px Vazirmatn, sans-serif';
      if (status === 'exempt') {
        ctx.fillStyle = exemptColor;
        ctx.fillText('بەخشراو', cellX + colActionW / 2, rowMidY);
      } else if (status === 'absent') {
        ctx.fillStyle = absentColor;
        ctx.fillText('نەهاتوو', cellX + colActionW / 2, rowMidY);
      } else if (debt > 0) {
        ctx.fillStyle = debtColor;
        ctx.fillText('قەرزارە', cellX + colActionW / 2, rowMidY);
      } else {
        ctx.fillStyle = paidColor;
        ctx.fillText('پاککراوە ✓', cellX + colActionW / 2, rowMidY);
      }

      rowY += rowHeight;
    });

    // Summary footer row
    ctx.fillStyle = tableFooterBg;
    ctx.beginPath();
    ctx.roundRect(tableX, rowY, tableW, 54, [0, 0, 14, 14]);
    ctx.fill();
    ctx.strokeStyle = isLight ? '#cbd5e1' : '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    const tfootMidY = rowY + 27;
    ctx.textAlign = 'right';
    ctx.fillStyle = textPrimary;
    ctx.font = '900 13px Vazirmatn, sans-serif';
    ctx.fillText('کۆی گشتی ئەم هەفتەیە:', tableX + tableW - 20, tfootMidY);

    ctx.textAlign = 'center';
    ctx.fillStyle = paidColor;
    ctx.font = '900 13px monospace';
    ctx.fillText(formatCurrency(singleSummary.totalCollected), tableX + tableW - colNumW - colPlayerW - colStatusW - colPaidW / 2, tfootMidY);

    ctx.fillStyle = singleSummary.totalOutstandingDebt > 0 ? debtColor : (isLight ? '#047857' : '#10b981');
    ctx.fillText(formatCurrency(singleSummary.totalOutstandingDebt), tableX + tableW - colNumW - colPlayerW - colStatusW - colPaidW - colDebtW / 2, tfootMidY);
  }

  currentY += tableHeight + 16;

  // -------------------------------------------------------------
  // 4. FOOTER NOTE
  // -------------------------------------------------------------
  ctx.textAlign = 'right';
  ctx.fillStyle = textMuted;
  ctx.font = '11px Vazirmatn, sans-serif';
  ctx.fillText('سیستەمی دادپەروەرانەی دارایی و حیساباتی یاریزانان • Rizbandy Pro HD', tableX + tableW - 10, currentY + 22);

  const todayIso = getTodayISODate();
  ctx.textAlign = 'left';
  ctx.font = '11px Vazirmatn, sans-serif';
  ctx.fillText(`بەرواری دەرهێنان: ${todayIso} (${formatLiveKurdishFullDate(todayIso)})`, tableX + 10, currentY + 22);

  return canvas;
}
