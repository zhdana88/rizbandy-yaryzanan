import { ComputedPlayerStats, RankingConfig, ThemeConfig } from '../types';
import { getDefaultAvatar } from './avatarHelper';
import { getTodayISODate, formatLiveKurdishFullDate } from './dateHelper';

// Preload all player avatars asynchronously to draw real photos onto the canvas
async function preloadPlayerAvatars(players: ComputedPlayerStats[]): Promise<Map<string, HTMLImageElement>> {
  const imageMap = new Map<string, HTMLImageElement>();
  
  const promises = players.map((player) => {
    const avatarUrl = player.avatar?.trim() || getDefaultAvatar(player.name, player.id);

    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imageMap.set(player.id, img);
        resolve();
      };
      img.onerror = () => {
        resolve(); // Continue gracefully if an image fails
      };
      img.src = avatarUrl;
    });
  });

  await Promise.all(promises);
  return imageMap;
}

// ----------------------------------------------------
// CANVAS VECTOR TROPHY DRAWERS
// ----------------------------------------------------

/**
 * Draw Ballon d'Or Trophy onto 2D Canvas
 */
function drawCanvasBallonDor(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  const s = size / 100; // normalize to 100x100 viewBox

  // Golden Glow
  const glowGrad = ctx.createRadialGradient(50 * s, 40 * s, 5 * s, 50 * s, 40 * s, 45 * s);
  glowGrad.addColorStop(0, 'rgba(253, 224, 71, 0.4)');
  glowGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(50 * s, 40 * s, 45 * s, 0, Math.PI * 2);
  ctx.fill();

  // Pyrite / Rugged Gold Rock Base
  const baseGrad = ctx.createLinearGradient(20 * s, 68 * s, 80 * s, 95 * s);
  baseGrad.addColorStop(0, '#FFE87C');
  baseGrad.addColorStop(0.3, '#D4AF37');
  baseGrad.addColorStop(0.7, '#8C6514');
  baseGrad.addColorStop(1, '#4A3408');

  ctx.fillStyle = baseGrad;
  ctx.strokeStyle = '#4A3408';
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.moveTo(22 * s, 72 * s);
  ctx.lineTo(34 * s, 64 * s);
  ctx.lineTo(52 * s, 66 * s);
  ctx.lineTo(68 * s, 63 * s);
  ctx.lineTo(82 * s, 67 * s);
  ctx.lineTo(88 * s, 75 * s);
  ctx.lineTo(84 * s, 92 * s);
  ctx.lineTo(68 * s, 95 * s);
  ctx.lineTo(36 * s, 95 * s);
  ctx.lineTo(18 * s, 88 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Facet lines on base
  ctx.fillStyle = 'rgba(255, 235, 130, 0.4)';
  ctx.beginPath();
  ctx.moveTo(34 * s, 64 * s);
  ctx.lineTo(52 * s, 66 * s);
  ctx.lineTo(46 * s, 78 * s);
  ctx.lineTo(26 * s, 75 * s);
  ctx.closePath();
  ctx.fill();

  // Engraved Plaque on Base
  const plaqueGrad = ctx.createLinearGradient(28 * s, 80 * s, 72 * s, 92 * s);
  plaqueGrad.addColorStop(0, '#FFF2A3');
  plaqueGrad.addColorStop(0.5, '#DFB235');
  plaqueGrad.addColorStop(1, '#8A6014');
  ctx.fillStyle = plaqueGrad;
  ctx.strokeStyle = '#52380A';
  ctx.lineWidth = 1 * s;
  ctx.fillRect(28 * s, 81 * s, 44 * s, 11 * s);
  ctx.strokeRect(28 * s, 81 * s, 44 * s, 11 * s);

  ctx.fillStyle = '#3E2706';
  ctx.font = `bold ${Math.max(5, Math.round(5.5 * s))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("BALLON D'OR", 50 * s, 86.5 * s);

  // Golden Soccer Ball Sphere
  const ballGrad = ctx.createRadialGradient(40 * s, 26 * s, 4 * s, 50 * s, 36 * s, 30 * s);
  ballGrad.addColorStop(0, '#FFFBEB');
  ballGrad.addColorStop(0.25, '#FDE047');
  ballGrad.addColorStop(0.65, '#CA8A04');
  ballGrad.addColorStop(0.9, '#854D0E');
  ballGrad.addColorStop(1, '#451A03');

  ctx.fillStyle = ballGrad;
  ctx.strokeStyle = '#713F12';
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.arc(50 * s, 36 * s, 28 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Center Pentagon / Facet details
  ctx.save();
  ctx.beginPath();
  ctx.arc(50 * s, 36 * s, 28 * s, 0, Math.PI * 2);
  ctx.clip();

  ctx.fillStyle = '#78350F';
  ctx.strokeStyle = '#FEF08A';
  ctx.lineWidth = 1 * s;
  ctx.beginPath();
  ctx.moveTo(50 * s, 24 * s);
  ctx.lineTo(59 * s, 31 * s);
  ctx.lineTo(56 * s, 42 * s);
  ctx.lineTo(44 * s, 42 * s);
  ctx.lineTo(41 * s, 31 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Radial seams
  ctx.strokeStyle = '#854D0E';
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.moveTo(50 * s, 24 * s); ctx.lineTo(50 * s, 10 * s);
  ctx.moveTo(59 * s, 31 * s); ctx.lineTo(72 * s, 26 * s);
  ctx.moveTo(56 * s, 42 * s); ctx.lineTo(68 * s, 52 * s);
  ctx.moveTo(44 * s, 42 * s); ctx.lineTo(32 * s, 52 * s);
  ctx.moveTo(41 * s, 31 * s); ctx.lineTo(28 * s, 26 * s);
  ctx.stroke();

  // Specular sheen
  const shineGrad = ctx.createRadialGradient(38 * s, 22 * s, 2 * s, 38 * s, 22 * s, 14 * s);
  shineGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  shineGrad.addColorStop(0.6, 'rgba(254, 240, 138, 0.3)');
  shineGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
  ctx.fillStyle = shineGrad;
  ctx.beginPath();
  ctx.ellipse(38 * s, 22 * s, 14 * s, 9 * s, -Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Sparkles
  ctx.fillStyle = '#FFFBEB';
  ctx.beginPath();
  ctx.arc(68 * s, 16 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(26 * s, 34 * s, 1.5 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw Silver Star Trophy onto 2D Canvas
 */
function drawCanvasSilverTrophy(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  const s = size / 100;

  // Silver glow
  const glowGrad = ctx.createRadialGradient(50 * s, 42 * s, 5 * s, 50 * s, 42 * s, 44 * s);
  glowGrad.addColorStop(0, 'rgba(226, 232, 240, 0.4)');
  glowGrad.addColorStop(1, 'rgba(226, 232, 240, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(50 * s, 42 * s, 44 * s, 0, Math.PI * 2);
  ctx.fill();

  // Pedestal Base
  const baseGrad = ctx.createLinearGradient(24 * s, 74 * s, 76 * s, 94 * s);
  baseGrad.addColorStop(0, '#E2E8F0');
  baseGrad.addColorStop(0.5, '#94A3B8');
  baseGrad.addColorStop(1, '#334155');

  ctx.fillStyle = baseGrad;
  ctx.strokeStyle = '#1E293B';
  ctx.lineWidth = 1.2 * s;
  ctx.fillRect(26 * s, 80 * s, 48 * s, 14 * s);
  ctx.strokeRect(26 * s, 80 * s, 48 * s, 14 * s);

  // Plaque
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(30 * s, 83 * s, 40 * s, 8 * s);
  ctx.fillStyle = '#0F172A';
  ctx.font = `bold ${Math.max(5, Math.round(5 * s))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SILVER STAR', 50 * s, 87 * s);

  // Pillar
  ctx.fillStyle = '#CBD5E1';
  ctx.fillRect(42 * s, 66 * s, 16 * s, 14 * s);
  ctx.strokeStyle = '#475569';
  ctx.strokeRect(42 * s, 66 * s, 16 * s, 14 * s);

  // Star Emblem
  const starGrad = ctx.createRadialGradient(42 * s, 30 * s, 4 * s, 50 * s, 38 * s, 28 * s);
  starGrad.addColorStop(0, '#FFFFFF');
  starGrad.addColorStop(0.35, '#E2E8F0');
  starGrad.addColorStop(0.75, '#94A3B8');
  starGrad.addColorStop(1, '#475569');

  ctx.fillStyle = starGrad;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.4 * s;

  // 5 Pointed Star
  const points = 5;
  const outerRadius = 26 * s;
  const innerRadius = 12 * s;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = 50 * s + Math.cos(angle) * r;
    const y = 38 * s + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Star center shine
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(44 * s, 32 * s, 3 * s, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw Tapiro d'Oro (Golden Boar / Tapir Trophy) onto 2D Canvas
 */
function drawCanvasTapiroDoro(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  const s = size / 110; // normalized to 110x100 viewBox

  // Golden Glow
  const glowGrad = ctx.createRadialGradient(55 * s, 45 * s, 5 * s, 55 * s, 45 * s, 48 * s);
  glowGrad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
  glowGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(55 * s, 45 * s, 48 * s, 0, Math.PI * 2);
  ctx.fill();

  // Mahogany Pedestal
  const woodGrad = ctx.createLinearGradient(15 * s, 74 * s, 95 * s, 95 * s);
  woodGrad.addColorStop(0, '#B45309');
  woodGrad.addColorStop(0.5, '#78350F');
  woodGrad.addColorStop(1, '#451A03');

  ctx.fillStyle = woodGrad;
  ctx.strokeStyle = '#2A0E02';
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.ellipse(55 * s, 85 * s, 45 * s, 9 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(55 * s, 82 * s, 40 * s, 7 * s, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#92400E';
  ctx.fill();

  // Brass Plaque
  const plaqueGrad = ctx.createLinearGradient(25 * s, 76 * s, 85 * s, 88 * s);
  plaqueGrad.addColorStop(0, '#FEF08A');
  plaqueGrad.addColorStop(0.5, '#EAB308');
  plaqueGrad.addColorStop(1, '#854D0E');
  ctx.fillStyle = plaqueGrad;
  ctx.strokeStyle = '#451A03';
  ctx.lineWidth = 1 * s;
  ctx.fillRect(28 * s, 77 * s, 54 * s, 10 * s);
  ctx.strokeRect(28 * s, 77 * s, 54 * s, 10 * s);

  ctx.fillStyle = '#3E1F03';
  ctx.font = `bold ${Math.max(5, Math.round(5.5 * s))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("TAPIRO D'ORO 🐗", 55 * s, 82 * s);

  // Golden Tapir / Boar Body
  const tapirGrad = ctx.createLinearGradient(15 * s, 18 * s, 95 * s, 75 * s);
  tapirGrad.addColorStop(0, '#FFFBEB');
  tapirGrad.addColorStop(0.25, '#FDE047');
  tapirGrad.addColorStop(0.65, '#D97706');
  tapirGrad.addColorStop(1, '#78350F');

  // Back legs
  ctx.fillStyle = '#92400E';
  ctx.fillRect(72 * s, 55 * s, 6 * s, 22 * s);
  ctx.fillRect(38 * s, 55 * s, 6 * s, 22 * s);

  // Main Silhouette
  ctx.fillStyle = tapirGrad;
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.moveTo(18 * s, 48 * s);
  ctx.bezierCurveTo(15 * s, 42 * s, 22 * s, 32 * s, 34 * s, 26 * s);
  ctx.bezierCurveTo(46 * s, 20 * s, 64 * s, 18 * s, 80 * s, 24 * s);
  ctx.bezierCurveTo(94 * s, 30 * s, 96 * s, 42 * s, 92 * s, 54 * s);
  ctx.bezierCurveTo(88 * s, 64 * s, 82 * s, 72 * s, 78 * s, 76 * s);
  ctx.lineTo(72 * s, 76 * s);
  ctx.bezierCurveTo(74 * s, 65 * s, 76 * s, 55 * s, 74 * s, 48 * s);
  ctx.bezierCurveTo(68 * s, 46 * s, 56 * s, 48 * s, 48 * s, 62 * s);
  ctx.lineTo(44 * s, 76 * s);
  ctx.lineTo(38 * s, 76 * s);
  ctx.bezierCurveTo(38 * s, 64 * s, 42 * s, 50 * s, 36 * s, 44 * s);
  ctx.bezierCurveTo(30 * s, 38 * s, 22 * s, 45 * s, 18 * s, 48 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Head and elongated snout
  ctx.beginPath();
  ctx.moveTo(34 * s, 30 * s);
  ctx.bezierCurveTo(28 * s, 28 * s, 20 * s, 34 * s, 14 * s, 40 * s);
  ctx.bezierCurveTo(10 * s, 44 * s, 10 * s, 52 * s, 14 * s, 54 * s);
  ctx.bezierCurveTo(18 * s, 54 * s, 22 * s, 48 * s, 28 * s, 42 * s);
  ctx.bezierCurveTo(32 * s, 38 * s, 36 * s, 36 * s, 38 * s, 36 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Eye
  ctx.fillStyle = '#3E1F03';
  ctx.beginPath();
  ctx.arc(24 * s, 36 * s, 1.8 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(24.5 * s, 35.5 * s, 0.6 * s, 0, Math.PI * 2);
  ctx.fill();

  // Ear
  ctx.fillStyle = '#FDE047';
  ctx.strokeStyle = '#78350F';
  ctx.lineWidth = 0.8 * s;
  ctx.beginPath();
  ctx.arc(36 * s, 26 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Gold highlight on back
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1.6 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(58 * s, 24 * s, 18 * s, Math.PI * 1.1, Math.PI * 1.7);
  ctx.stroke();

  ctx.restore();
}

export async function drawLeaderboardToCanvas(
  players: ComputedPlayerStats[],
  config: RankingConfig,
  themeConfig: ThemeConfig,
  customBgColor?: string
): Promise<HTMLCanvasElement> {
  const scale = 2; // ٢ قات کردنی کوالیتی بۆ ئەوەی ڕێتینا و زۆر ڕوون بێت
  const width = 1180;
  
  // Calculate bottom 2 danger zone players
  const top1 = players[0];
  const top2 = players[1];
  
  // Find bottom 2 players (relegation zone)
  const bottomPlayers = players.length >= 4 
    ? [players[players.length - 2], players[players.length - 1]] 
    : [];

  const hasDangerSpotlight = bottomPlayers.length === 2;

  // Preload avatars before drawing
  const loadedAvatars = await preloadPlayerAvatars(players);

  // Layout heights
  const headerHeight = 135;
  const topSpotlightHeight = (top1 && top2) ? 108 : 0;
  const dangerSpotlightHeight = hasDangerSpotlight ? 108 : 0;
  const tableHeaderHeight = 46;
  const rowHeight = 48;
  const tableHeight = tableHeaderHeight + players.length * rowHeight;
  const footerHeight = 54;
  const padding = 28;

  const totalHeight = 
    headerHeight + 
    topSpotlightHeight + 
    (hasDangerSpotlight ? dangerSpotlightHeight + 16 : 0) + 
    tableHeight + 
    footerHeight + 
    padding * 2;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = totalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Background
  ctx.fillStyle = customBgColor || '#ffffff';
  ctx.fillRect(0, 0, width, totalHeight);

  // Outer border with subtle corner radius styling
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(14, 14, width - 28, totalHeight - 28);

  let currentY = padding + 8;

  // 2. Header
  const logoUrl = themeConfig.logoUrl || '/logo.jpg';
  let logoImg: HTMLImageElement | null = null;
  try {
    logoImg = await new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = logoUrl;
    });
  } catch (e) {
    // ignore
  }

  if (logoImg) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(width - 55, currentY + 34, 28, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImg, width - 83, currentY + 6, 56, 56);
    ctx.restore();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width - 55, currentY + 34, 28, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.arc(width - 55, currentY + 34, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚽', width - 55, currentY + 34);
  }

  // Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(themeConfig.leagueTitle || 'ڕێزبەندی Rizbandy', width - 95, currentY + 8);

  // Subtitle & Bonus factor
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillText(`سیستەمی دادپەروەرانەی تۆپی پێ (WPI Score) • فاکتەری یاری: +${config.bonusFactor ?? 0.15}`, width - 95, currentY + 44);

  // Date & Total Count Box on Left side
  const lbDateW = 200;
  const lbDateH = 58;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(36, currentY + 8, lbDateW, lbDateH);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(36, currentY + 8, lbDateW, lbDateH);

  const todayStr = getTodayISODate();
  ctx.fillStyle = '#64748b';
  ctx.font = '10px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('بەرواری نوێکردنەوە:', 36 + lbDateW - 10, currentY + 20);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${todayStr} (${formatLiveKurdishFullDate(todayStr)})`, 36 + lbDateW - 10, currentY + 35);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`کۆی گشتی یاریزانان: ${players.length}`, 36 + lbDateW - 10, currentY + 51);

  currentY += 80;

  // Divider line below header
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(36, currentY);
  ctx.lineTo(width - 36, currentY);
  ctx.stroke();

  currentY += 16;

  const boxWidth = (width - 72 - 16) / 2;

  // Helper to draw circular player avatar
  const drawAvatar = (
    player: ComputedPlayerStats,
    x: number,
    y: number,
    radius: number,
    bgColor: string,
    borderColor: string,
    textColor: string
  ) => {
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (loadedAvatars.has(player.id)) {
      const img = loadedAvatars.get(player.id)!;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
      ctx.restore();
    } else {
      ctx.fillStyle = textColor;
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.name.slice(0, 2), x, y);
    }

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
  };

  // 3. Top 1 & Top 2 Spotlight Cards with Vector Trophies
  if (top1 && top2) {
    const cardHeight = 92;

    // Top 1 Box (Right side in RTL) - Gold Ballon d'Or Card
    const box1X = width - 36 - boxWidth;
    ctx.fillStyle = '#fefce8';
    ctx.fillRect(box1X, currentY, boxWidth, cardHeight);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.strokeRect(box1X, currentY, boxWidth, cardHeight);

    // Player Avatar (Right side)
    const avatar1X = box1X + boxWidth - 40;
    const avatar1Y = currentY + 46;
    drawAvatar(top1, avatar1X, avatar1Y, 25, '#fef08a', '#eab308', '#854d0e');

    // Tag / Badge
    ctx.textAlign = 'right';
    ctx.fillStyle = '#854d0e';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('🏆 تۆپ ٠١ • خەڵاتی باڵۆن دۆر (Ballon d\'Or MVP)', box1X + boxWidth - 76, currentY + 22);

    // Player Name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
    ctx.fillText(top1.name, box1X + boxWidth - 76, currentY + 45);

    // Stats
    ctx.fillStyle = '#64748b';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`(${top1.wins}ب - ${top1.draws}ی - ${top1.losses}د • ${top1.totalMatches} یاری)`, box1X + boxWidth - 76, currentY + 68);

    // Score on Left of Box
    ctx.textAlign = 'left';
    ctx.fillStyle = '#854d0e';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(`WPI: ${top1.fairScore}`, box1X + 66, currentY + 38);
    ctx.fillStyle = '#a16207';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${top1.totalPoints} خاڵ • ${top1.winRate}%`, box1X + 66, currentY + 60);

    // DRAW REAL BALLON D'OR TROPHY ON LEFT OF CARD
    drawCanvasBallonDor(ctx, box1X + 34, currentY + 46, 54);


    // Top 2 Box (Left side in RTL) - Silver Star Card
    const box2X = 36;
    ctx.fillStyle = '#f0fdf4';
    ctx.fillRect(box2X, currentY, boxWidth, cardHeight);
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 2;
    ctx.strokeRect(box2X, currentY, boxWidth, cardHeight);

    // Avatar (Right side)
    const avatar2X = box2X + boxWidth - 40;
    const avatar2Y = currentY + 46;
    drawAvatar(top2, avatar2X, avatar2Y, 25, '#dcfce7', '#16a34a', '#166534');

    // Tag / Badge
    ctx.textAlign = 'right';
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText('🥈 تۆپ ٠٢ • ئەستێرەی زیوین (Silver Star Award)', box2X + boxWidth - 76, currentY + 22);

    // Player Name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
    ctx.fillText(top2.name, box2X + boxWidth - 76, currentY + 45);

    // Stats
    ctx.fillStyle = '#64748b';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`(${top2.wins}ب - ${top2.draws}ی - ${top2.losses}د • ${top2.totalMatches} یاری)`, box2X + boxWidth - 76, currentY + 68);

    // Score on Left of Box
    ctx.textAlign = 'left';
    ctx.fillStyle = '#166534';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(`WPI: ${top2.fairScore}`, box2X + 66, currentY + 38);
    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${top2.totalPoints} خاڵ • ${top2.winRate}%`, box2X + 66, currentY + 60);

    // DRAW REAL SILVER STAR TROPHY ON LEFT OF CARD
    drawCanvasSilverTrophy(ctx, box2X + 34, currentY + 46, 52);

    currentY += cardHeight + 14;
  }

  // 4. Relegation / Danger Zone Spotlight Cards (Bottom 2 Players)
  if (hasDangerSpotlight) {
    const cardHeight = 92;
    const danger1 = bottomPlayers[0]; // e.g. #21
    const danger2 = bottomPlayers[1]; // e.g. #22 (Last Place / Boar award)

    // Danger 1 Box (Right side in RTL)
    const dBox1X = width - 36 - boxWidth;
    ctx.fillStyle = '#fff1f2';
    ctx.fillRect(dBox1X, currentY, boxWidth, cardHeight);
    ctx.strokeStyle = '#fca5a5';
    ctx.lineWidth = 2;
    ctx.strokeRect(dBox1X, currentY, boxWidth, cardHeight);

    // Avatar
    const dAvatar1X = dBox1X + boxWidth - 40;
    const dAvatar1Y = currentY + 46;
    drawAvatar(danger1, dAvatar1X, dAvatar1Y, 25, '#fee2e2', '#dc2626', '#991b1b');

    // Title / Badge
    ctx.textAlign = 'right';
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`⚠️ مەترسی دابەزین (#${danger1.rank}) • پێویستی بە سەرکەوتنە`, dBox1X + boxWidth - 76, currentY + 22);

    // Player Name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
    ctx.fillText(danger1.name, dBox1X + boxWidth - 76, currentY + 45);

    // Stats
    ctx.fillStyle = '#64748b';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`(${danger1.wins}ب - ${danger1.draws}ی - ${danger1.losses}د • ${danger1.totalMatches} یاری)`, dBox1X + boxWidth - 76, currentY + 68);

    // Score
    ctx.textAlign = 'left';
    ctx.fillStyle = '#b91c1c';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(`WPI: ${danger1.fairScore}`, dBox1X + 54, currentY + 38);
    ctx.fillStyle = '#991b1b';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${danger1.totalPoints} خاڵ • ${danger1.winRate}%`, dBox1X + 54, currentY + 60);

    // Alert Icon on Left
    ctx.fillStyle = '#fee2e2';
    ctx.beginPath();
    ctx.arc(dBox1X + 28, currentY + 46, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f87171';
    ctx.stroke();
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠️', dBox1X + 28, currentY + 46);


    // Danger 2 Box (Left side in RTL) - TAPIRO D'ORO (خەڵاتی بەرازی زێڕین بۆ دواین پلە)
    const dBox2X = 36;
    ctx.fillStyle = '#fff7ed';
    ctx.fillRect(dBox2X, currentY, boxWidth, cardHeight);
    ctx.strokeStyle = '#fdba74';
    ctx.lineWidth = 2;
    ctx.strokeRect(dBox2X, currentY, boxWidth, cardHeight);

    // Avatar
    const dAvatar2X = dBox2X + boxWidth - 40;
    const dAvatar2Y = currentY + 46;
    drawAvatar(danger2, dAvatar2X, dAvatar2Y, 25, '#ffedd5', '#ea580c', '#9a3412');

    // Title / Badge
    ctx.textAlign = 'right';
    ctx.fillStyle = '#9a3412';
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`🐗 خەڵاتی بەرازی زێڕین (Tapiro d'Oro) • پلەی #${danger2.rank}`, dBox2X + boxWidth - 76, currentY + 22);

    // Player Name
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
    ctx.fillText(danger2.name, dBox2X + boxWidth - 76, currentY + 45);

    // Stats
    ctx.fillStyle = '#64748b';
    ctx.font = '11px system-ui, -apple-system, sans-serif';
    ctx.fillText(`(${danger2.wins}ب - ${danger2.draws}ی - ${danger2.losses}د • ${danger2.totalMatches} یاری)`, dBox2X + boxWidth - 76, currentY + 68);

    // Score
    ctx.textAlign = 'left';
    ctx.fillStyle = '#c2410c';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.fillText(`WPI: ${danger2.fairScore}`, dBox2X + 66, currentY + 38);
    ctx.fillStyle = '#9a3412';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${danger2.totalPoints} خاڵ • ${danger2.winRate}%`, dBox2X + 66, currentY + 60);

    // DRAW REAL TAPIRO D'ORO (GOLDEN BOAR) TROPHY ON LEFT OF CARD
    drawCanvasTapiroDoro(ctx, dBox2X + 34, currentY + 46, 56);

    currentY += cardHeight + 14;
  }

  // 5. Table Header
  const columns = [
    { key: 'rank', label: 'پلە', width: 65 },
    { key: 'name', label: 'ناوی یاریزان (وێنە، ناو و نازناو)', width: 245 },
    { key: 'matches', label: 'یاری', width: 65 },
    { key: 'wins', label: 'ب', width: 55 },
    { key: 'draws', label: 'ی', width: 55 },
    { key: 'losses', label: 'د', width: 55 },
    { key: 'points', label: 'خاڵ', width: 75 },
    { key: 'winRate', label: '٪ ڕێژەی', width: 95 },
    { key: 'wpi', label: 'WPI Score', width: 110 },
    { key: 'rating', label: 'ڕەیتینگ', width: 85 },
  ];

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(36, currentY, width - 72, tableHeaderHeight);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(36, currentY, width - 72, tableHeaderHeight);

  let headerX = width - 36;
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const col of columns) {
    headerX -= col.width;
    ctx.fillText(col.label, headerX + col.width / 2, currentY + tableHeaderHeight / 2);
  }

  currentY += tableHeaderHeight;

  // 6. Table Rows
  const maxRankNumber = Math.max(...players.map((p) => p.rank));

  players.forEach((p, index) => {
    const rowY = currentY + index * rowHeight;
    const isTop1 = p.rank === 1;
    const isTop2 = p.rank === 2;
    const isTop3 = p.rank === 3;
    const isElite = p.rank >= 4 && p.rank <= 6;
    const isLastPlace = p.rank === maxRankNumber && players.length >= 4;
    const isDanger = !isLastPlace && p.rank >= players.length - 2 && players.length >= 4;

    // Row Background Color based on Ranking Level
    if (isTop1) {
      ctx.fillStyle = '#fef9c3'; // Rich Gold
    } else if (isTop2) {
      ctx.fillStyle = '#ecfdf5'; // Crisp Emerald / Silver
    } else if (isTop3) {
      ctx.fillStyle = '#fffbeb'; // Warm Bronze
    } else if (isElite) {
      ctx.fillStyle = '#f0fdfa'; // Light Teal / Elite
    } else if (isLastPlace) {
      ctx.fillStyle = '#fff7ed'; // Tapiro Warm Orange
    } else if (isDanger) {
      ctx.fillStyle = '#fff1f2'; // Danger Rose
    } else if (index % 2 === 1) {
      ctx.fillStyle = '#f8fafc'; // Clean alternating light grey
    } else {
      ctx.fillStyle = '#ffffff'; // Pure white
    }

    ctx.fillRect(36, rowY, width - 72, rowHeight);

    // Left accent colored bar to highlight tier visibly
    const accentColor = isTop1 
      ? '#eab308' 
      : isTop2 
      ? '#10b981' 
      : isTop3 
      ? '#f59e0b' 
      : isElite 
      ? '#06b6d4' 
      : isLastPlace 
      ? '#f97316' 
      : isDanger 
      ? '#ef4444' 
      : (index % 2 === 1 ? '#94a3b8' : '#cbd5e1');

    ctx.fillStyle = accentColor;
    ctx.fillRect(width - 36 - 4, rowY, 4, rowHeight);

    // Clear and distinct horizontal bottom dividing line below EVERY player row
    const borderBottomColor = isTop1
      ? '#facc15'
      : isTop2
      ? '#86efac'
      : isTop3
      ? '#fde68a'
      : isLastPlace
      ? '#fdba74'
      : isDanger
      ? '#fca5a5'
      : '#cbd5e1'; // Strong, visible slate line for all standard players

    ctx.strokeStyle = borderBottomColor;
    ctx.lineWidth = isTop1 || isTop2 || isLastPlace || isDanger ? 2 : 1.5;
    ctx.beginPath();
    ctx.moveTo(36, rowY + rowHeight);
    ctx.lineTo(width - 36, rowY + rowHeight);
    ctx.stroke();

    // Subtle vertical column separator lines for complete clarity
    let colDividerX = width - 36;
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
    ctx.lineWidth = 1;
    for (let i = 0; i < columns.length - 1; i++) {
      colDividerX -= columns[i].width;
      ctx.beginPath();
      ctx.moveTo(colDividerX, rowY);
      ctx.lineTo(colDividerX, rowY + rowHeight);
      ctx.stroke();
    }

    let cellX = width - 36;
    const textY = rowY + rowHeight / 2;

    for (const col of columns) {
      cellX -= col.width;

      switch (col.key) {
        case 'rank':
          ctx.textAlign = 'center';
          ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
          if (isTop1) {
            ctx.fillStyle = '#854d0e';
            ctx.fillText('🥇 1', cellX + col.width / 2, textY);
          } else if (isTop2) {
            ctx.fillStyle = '#166534';
            ctx.fillText('🥈 2', cellX + col.width / 2, textY);
          } else if (isTop3) {
            ctx.fillStyle = '#92400e';
            ctx.fillText('🥉 3', cellX + col.width / 2, textY);
          } else if (isLastPlace) {
            ctx.fillStyle = '#c2410c';
            ctx.fillText(`🐗 #${p.rank}`, cellX + col.width / 2, textY);
          } else if (isDanger) {
            ctx.fillStyle = '#dc2626';
            ctx.fillText(`⚠️ #${p.rank}`, cellX + col.width / 2, textY);
          } else if (isElite) {
            ctx.fillStyle = '#0f766e';
            ctx.fillText(`⭐ #${p.rank}`, cellX + col.width / 2, textY);
          } else {
            ctx.fillStyle = '#334155';
            ctx.fillText(`#${p.rank}`, cellX + col.width / 2, textY);
          }
          break;

        case 'name':
          const avatarRadius = 14;
          const avatarCenterX = cellX + col.width - 26;
          const avatarCenterY = textY;

          // Draw Real Player Avatar
          const bgCol = isTop1 
            ? '#fde047' 
            : isTop2 
            ? '#bbf7d0' 
            : isTop3 
            ? '#fed7aa' 
            : isElite 
            ? '#ccfbf1' 
            : isLastPlace 
            ? '#fed7aa' 
            : isDanger 
            ? '#fecdd3' 
            : '#e2e8f0';

          const borderCol = isTop1 
            ? '#ca8a04' 
            : isTop2 
            ? '#16a34a' 
            : isTop3 
            ? '#d97706' 
            : isElite 
            ? '#0d9488' 
            : isLastPlace 
            ? '#ea580c' 
            : isDanger 
            ? '#e11d48' 
            : '#94a3b8';

          const textCol = isTop1 
            ? '#854d0e' 
            : isTop2 
            ? '#166534' 
            : isTop3 
            ? '#92400e' 
            : isElite 
            ? '#115e59' 
            : isLastPlace 
            ? '#9a3412' 
            : isDanger 
            ? '#9f1239' 
            : '#334155';

          drawAvatar(p, avatarCenterX, avatarCenterY, avatarRadius, bgCol, borderCol, textCol);

          // Player Name Text
          ctx.textAlign = 'right';
          ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#0f172a';
          const nameX = avatarCenterX - avatarRadius - 8;
          ctx.fillText(p.name, nameX, textY);

          // Draw Distinct Award Badge next to the name
          if (isTop1) {
            const badgeText = '🏆 باڵۆن دۆر';
            ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
            const nameWidth = ctx.measureText(p.name).width;
            ctx.fillStyle = '#854d0e';
            ctx.fillText(badgeText, nameX - nameWidth - 8, textY);
          } else if (isTop2) {
            const badgeText = '🥈 ئەستێرەی زیوین';
            ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
            const nameWidth = ctx.measureText(p.name).width;
            ctx.fillStyle = '#166534';
            ctx.fillText(badgeText, nameX - nameWidth - 8, textY);
          } else if (isTop3) {
            const badgeText = '🥉 برۆنز';
            ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
            const nameWidth = ctx.measureText(p.name).width;
            ctx.fillStyle = '#92400e';
            ctx.fillText(badgeText, nameX - nameWidth - 8, textY);
          } else if (isLastPlace) {
            const badgeText = '🐗 بەرازی زێڕین';
            ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
            const nameWidth = ctx.measureText(p.name).width;
            ctx.fillStyle = '#c2410c';
            ctx.fillText(badgeText, nameX - nameWidth - 8, textY);
          }
          break;

        case 'matches':
          ctx.textAlign = 'center';
          ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#1e293b';
          ctx.fillText(p.totalMatches.toString(), cellX + col.width / 2, textY);
          break;

        case 'wins':
          ctx.textAlign = 'center';
          ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#047857';
          ctx.fillText(p.wins.toString(), cellX + col.width / 2, textY);
          break;

        case 'draws':
          ctx.textAlign = 'center';
          ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#64748b';
          ctx.fillText(p.draws.toString(), cellX + col.width / 2, textY);
          break;

        case 'losses':
          ctx.textAlign = 'center';
          ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#dc2626';
          ctx.fillText(p.losses.toString(), cellX + col.width / 2, textY);
          break;

        case 'points':
          ctx.textAlign = 'center';
          ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#d97706';
          ctx.fillText(p.totalPoints.toString(), cellX + col.width / 2, textY);
          break;

        case 'winRate':
          ctx.textAlign = 'center';
          ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#0f172a';
          ctx.fillText(`${p.winRate}%`, cellX + col.width / 2, textY);
          break;

        case 'wpi':
          ctx.textAlign = 'center';
          ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = isTop1 
            ? '#854d0e' 
            : isTop2 
            ? '#15803d' 
            : isTop3 
            ? '#92400e' 
            : isLastPlace 
            ? '#c2410c' 
            : isDanger 
            ? '#dc2626' 
            : '#059669';
          ctx.fillText(p.fairScore.toString(), cellX + col.width / 2, textY);
          break;

        case 'rating':
          ctx.textAlign = 'center';
          ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
          ctx.fillStyle = '#0284c7';
          ctx.fillText(p.fairRating.toString(), cellX + col.width / 2, textY);
          break;
      }
    }
  });

  // Draw full perimeter outline around the table
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, currentY - tableHeaderHeight, width - 72, tableHeight);

  currentY += players.length * rowHeight + 14;

  // 7. Footer
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('🏆 زێڕین: تۆپ پلەیەر و باڵۆن دۆر  |  🥈 زیوین: ئەستێرەی دووەم  |  🐗 بەرازی زێڕین: کۆتایی خشتە', width - 36, currentY + 12);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = '10px system-ui, -apple-system, sans-serif';
  ctx.fillText('🌍 WPI Fair Football Ranking • ئەپی دادپەروەرانەی ڕیزبەندی یاریزانان', 36, currentY + 12);

  return canvas;
}

