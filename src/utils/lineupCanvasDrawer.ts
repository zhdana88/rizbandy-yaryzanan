import { ComputedPlayerStats, LineupMatchState } from '../types';
import { FORMATIONS_6V6, KIT_COLORS } from './formations6v6';
import { evaluateMatchBalance } from './teamBalanceCalculator';
import { getDefaultAvatar } from './avatarHelper';
import { getTodayISODate, formatLiveKurdishFullDate } from './dateHelper';

// Preload all player avatars asynchronously to guarantee they are drawn into the canvas
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
        resolve(); // Continue even if an avatar fails to load
      };
      img.src = avatarUrl;
    });
  });

  await Promise.all(promises);
  return imageMap;
}

// Helper to draw an authentic 3D football kit jersey shape
function drawJerseyVector(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  primaryColor: string,
  darkColor: string,
  textColor: string,
  squadNumber?: string
) {
  ctx.save();
  ctx.translate(x, y);

  // Jersey body with subtle gradient
  const kitGrad = ctx.createLinearGradient(0, 0, 0, height);
  kitGrad.addColorStop(0, primaryColor);
  kitGrad.addColorStop(1, darkColor || primaryColor);

  ctx.fillStyle = kitGrad;
  ctx.strokeStyle = darkColor || '#000000';
  ctx.lineWidth = 1.8;

  ctx.beginPath();
  // Collar center
  ctx.moveTo(width * 0.32, 2);
  // Left shoulder & sleeve
  ctx.lineTo(width * 0.12, 8);
  ctx.lineTo(0, height * 0.4);
  ctx.lineTo(width * 0.16, height * 0.52);
  ctx.lineTo(width * 0.22, height * 0.38);
  // Left torso
  ctx.lineTo(width * 0.22, height);
  // Bottom hem
  ctx.quadraticCurveTo(width * 0.5, height + 3, width * 0.78, height);
  // Right torso
  ctx.lineTo(width * 0.78, height * 0.38);
  // Right sleeve
  ctx.lineTo(width * 0.84, height * 0.52);
  ctx.lineTo(width, height * 0.4);
  ctx.lineTo(width * 0.88, 8);
  // Right neck
  ctx.lineTo(width * 0.68, 2);
  // Neck V-collar
  ctx.quadraticCurveTo(width * 0.5, height * 0.22, width * 0.32, 2);
  ctx.closePath();

  ctx.fill();
  ctx.stroke();

  // Collar Trim
  ctx.strokeStyle = textColor === '#ffffff' ? '#ffffff' : '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width * 0.32, 2);
  ctx.quadraticCurveTo(width * 0.5, height * 0.22, width * 0.68, 2);
  ctx.stroke();

  // Left sleeve cuff
  ctx.beginPath();
  ctx.moveTo(0, height * 0.4);
  ctx.lineTo(width * 0.16, height * 0.52);
  ctx.stroke();

  // Right sleeve cuff
  ctx.beginPath();
  ctx.moveTo(width, height * 0.4);
  ctx.lineTo(width * 0.84, height * 0.52);
  ctx.stroke();

  // Draw squad number on jersey chest
  if (squadNumber) {
    ctx.fillStyle = textColor === '#ffffff' ? '#ffffff' : '#0f172a';
    ctx.font = `900 ${Math.round(height * 0.42)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(squadNumber, width * 0.5, height * 0.65);
  }

  // Mini Golden Club Crest on left chest
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(width * 0.68, height * 0.38, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export async function drawLineupToCanvas(
  matchState: LineupMatchState,
  allPlayers: ComputedPlayerStats[],
  leagueTitle: string = 'ڕێزبەندی Rizbandy'
): Promise<HTMLCanvasElement> {
  const scale = 2; // ٢ قات کردنی کوالیتی بۆ ئەوەی ڕێتینا و زۆر ڕوون بێت
  const width = 1180;
  const height = 1600;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));
  const balanceResult = evaluateMatchBalance(matchState.teamA, matchState.teamB, allPlayers);

  // Preload all avatar images before drawing
  const loadedAvatars = await preloadPlayerAvatars(allPlayers);

  const kitA = KIT_COLORS[matchState.teamA.color] || KIT_COLORS.yellow;
  const kitB = KIT_COLORS[matchState.teamB.color] || KIT_COLORS.blue;

  const textColorA = kitA.text === 'text-white' ? '#ffffff' : '#0f172a';
  const textColorB = kitB.text === 'text-white' ? '#ffffff' : '#0f172a';

  // 1. Overall Background (Clean modern sport aesthetic)
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Outer border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // 2. Header Section
  let currentY = 32;

  // Logo & Match Tag
  ctx.fillStyle = '#059669';
  ctx.beginPath();
  ctx.arc(width - 64, currentY + 30, 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚽', width - 64, currentY + 30);

  // Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 28px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(matchState.title || 'پێکهاتەی فەرمی یاریگای ٦ بەرامبەر ٦', width - 105, currentY + 6);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${leagueTitle} • سیستەمی دادپەروەرانەی درێس و هەڵسەنگاندنی تیمەکان`, width - 105, currentY + 44);

  // Date & Match Info Box (Left side)
  const dateBoxW = 240;
  const dateBoxH = 62;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(36, currentY + 6, dateBoxW, dateBoxH);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(36, currentY + 6, dateBoxW, dateBoxH);

  const finalDate = matchState.date && matchState.date.length === 10 ? matchState.date : getTodayISODate();

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('بەرواری یاری:', 36 + dateBoxW - 12, currentY + 20);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${finalDate} (${formatLiveKurdishFullDate(finalDate)})`, 36 + dateBoxW - 12, currentY + 37);

  ctx.fillStyle = '#059669';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`٦ سەرەکی + ${matchState.subCount} یەدەگ بۆ هەر تیمێک`, 36 + dateBoxW - 12, currentY + 53);

  currentY += 80;

  // 3. Dynamic Balance Evaluator Bar with CLEAR Kit Colors & Jerseys
  const balanceBarY = currentY;
  const balanceBarW = width - 72;
  const balanceBarH = 76;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(36, balanceBarY, balanceBarW, balanceBarH);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, balanceBarY, balanceBarW, balanceBarH);

  // Team A Badge & Jersey on Right
  drawJerseyVector(ctx, width - 82, balanceBarY + 14, 34, 40, kitA.hex, kitA.darkHex, textColorA, 'A');

  ctx.textAlign = 'right';
  ctx.fillStyle = kitA.darkHex || '#ca8a04';
  ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${matchState.teamA.name} (${kitA.label})`, width - 96, balanceBarY + 22);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(`WPI: ${balanceResult.teamAStats.avgWpi} • ڕەیتینگ: ${balanceResult.teamAStats.avgRating}/10`, width - 96, balanceBarY + 44);

  ctx.fillStyle = kitA.darkHex || '#ca8a04';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText(`ڕەنگی درێسی یاریزانان: ${kitA.label}`, width - 96, balanceBarY + 62);

  // Team B Badge & Jersey on Left
  drawJerseyVector(ctx, 48, balanceBarY + 14, 34, 40, kitB.hex, kitB.darkHex, textColorB, 'B');

  ctx.textAlign = 'left';
  ctx.fillStyle = kitB.darkHex || '#1d4ed8';
  ctx.font = 'bold 17px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${matchState.teamB.name} (${kitB.label})`, 94, balanceBarY + 22);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(`WPI: ${balanceResult.teamBStats.avgWpi} • ڕەیتینگ: ${balanceResult.teamBStats.avgRating}/10`, 94, balanceBarY + 44);

  ctx.fillStyle = kitB.darkHex || '#1d4ed8';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText(`ڕەنگی درێسی یاریزانان: ${kitB.label}`, 94, balanceBarY + 62);

  // Center Balance Progress Gauge
  const meterW = 340;
  const meterX = width / 2 - meterW / 2;
  const meterY = balanceBarY + 24;

  const percentA = balanceResult.percentageA;
  const percentB = balanceResult.percentageB;

  ctx.fillStyle = kitB.hex;
  ctx.beginPath();
  ctx.roundRect(meterX, meterY, (meterW * percentB) / 100, 18, [9, 0, 0, 9]);
  ctx.fill();
  ctx.strokeStyle = kitB.darkHex;
  ctx.stroke();

  ctx.fillStyle = kitA.hex;
  ctx.beginPath();
  ctx.roundRect(meterX + (meterW * percentB) / 100, meterY, (meterW * percentA) / 100, 18, [0, 9, 9, 0]);
  ctx.fill();
  ctx.strokeStyle = kitA.darkHex;
  ctx.stroke();

  // Percentage labels
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillText(`⚡ ${kitB.emoji} ${percentB}%  بەرامبەر  ${percentA}% ${kitA.emoji} • هاوسەنگی: ${balanceResult.balanceIndex}%`, width / 2, balanceBarY + 60);

  currentY += balanceBarH + 16;

  // 4. The Football Pitch
  const pitchX = 36;
  const pitchY = currentY;
  const pitchW = width - 72;
  const pitchH = 940;

  // Green Turf background with alternate stripes
  ctx.fillStyle = '#15803d';
  ctx.fillRect(pitchX, pitchY, pitchW, pitchH);

  const stripeCount = 10;
  const stripeHeight = pitchH / stripeCount;
  for (let i = 0; i < stripeCount; i += 2) {
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(pitchX, pitchY + i * stripeHeight, pitchW, stripeHeight);
  }

  // Pitch White Boundary Lines
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.5;
  const margin = 24;
  const fieldX = pitchX + margin;
  const fieldY = pitchY + margin;
  const fieldW = pitchW - margin * 2;
  const fieldH = pitchH - margin * 2;

  ctx.strokeRect(fieldX, fieldY, fieldW, fieldH);

  // Halfway Line
  ctx.beginPath();
  ctx.moveTo(fieldX, fieldY + fieldH / 2);
  ctx.lineTo(fieldX + fieldW, fieldY + fieldH / 2);
  ctx.stroke();

  // Center Circle & Spot
  ctx.beginPath();
  ctx.arc(fieldX + fieldW / 2, fieldY + fieldH / 2, 70, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(fieldX + fieldW / 2, fieldY + fieldH / 2, 5, 0, Math.PI * 2);
  ctx.fill();

  // Top Penalty Box (Team B)
  const boxW = 340;
  const boxH = 130;
  const smallBoxW = 180;
  const smallBoxH = 60;

  ctx.strokeRect(fieldX + (fieldW - boxW) / 2, fieldY, boxW, boxH);
  ctx.strokeRect(fieldX + (fieldW - smallBoxW) / 2, fieldY, smallBoxW, smallBoxH);

  // Top Penalty Spot
  ctx.beginPath();
  ctx.arc(fieldX + fieldW / 2, fieldY + 95, 4, 0, Math.PI * 2);
  ctx.fill();

  // Bottom Penalty Box (Team A)
  ctx.strokeRect(fieldX + (fieldW - boxW) / 2, fieldY + fieldH - boxH, boxW, boxH);
  ctx.strokeRect(fieldX + (fieldW - smallBoxW) / 2, fieldY + fieldH - smallBoxH, smallBoxW, smallBoxH);

  // Bottom Penalty Spot
  ctx.beginPath();
  ctx.arc(fieldX + fieldW / 2, fieldY + fieldH - 95, 4, 0, Math.PI * 2);
  ctx.fill();

  // TEAM B BANNER ON TOP HALF OF PITCH
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.roundRect(fieldX + 16, fieldY + 16, 290, 44, 10);
  ctx.fill();
  ctx.strokeStyle = kitB.hex;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  drawJerseyVector(ctx, fieldX + 24, fieldY + 20, 24, 28, kitB.hex, kitB.darkHex, textColorB, 'B');

  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${matchState.teamB.name} • درێسی ${kitB.label}`, fieldX + 56, fieldY + 38);

  // TEAM A BANNER ON BOTTOM HALF OF PITCH
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.roundRect(fieldX + fieldW - 306, fieldY + fieldH - 60, 290, 44, 10);
  ctx.fill();
  ctx.strokeStyle = kitA.hex;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  drawJerseyVector(ctx, fieldX + fieldW - 298, fieldY + fieldH - 56, 24, 28, kitA.hex, kitA.darkHex, textColorA, 'A');

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${matchState.teamA.name} • درێسی ${kitA.label}`, fieldX + fieldW - 266, fieldY + fieldH - 38);

  // 5. RENDER FULL PLAYER UNIFORMS ON PITCH (PHOTO HEAD + 3D TEAM JERSEY + NAME BADGE)
  const formA = FORMATIONS_6V6[matchState.teamA.formation] || FORMATIONS_6V6['1-2-2-1'];
  const formB = FORMATIONS_6V6[matchState.teamB.formation] || FORMATIONS_6V6['1-2-2-1'];

  const drawPitchPlayerToken = (
    player: ComputedPlayerStats | null,
    relX: number,
    relY: number,
    teamKit: typeof kitA,
    roleLabel: string,
    squadNum: number,
    isTeamA: boolean
  ) => {
    const px = fieldX + (relX / 100) * fieldW;
    const py = fieldY + (relY / 100) * fieldH;

    const jerseyW = 54;
    const jerseyH = 40;
    const headRadius = 22;

    const headY = py - 18;
    const jerseyX = px - jerseyW / 2;
    const jerseyY = py - 2;

    // Drop shadow under player base
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(px, py + jerseyH + 16, 32, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 1. Draw Team Football Jersey
    const textColor = teamKit.text === 'text-white' ? '#ffffff' : '#0f172a';
    drawJerseyVector(ctx, jerseyX, jerseyY, jerseyW, jerseyH, teamKit.hex, teamKit.darkHex, textColor, squadNum.toString());

    // 2. Draw Player Avatar Head (Placed gracefully at the jersey collar)
    // Outer Ring
    ctx.fillStyle = teamKit.hex;
    ctx.beginPath();
    ctx.arc(px, headY, headRadius + 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    if (player && loadedAvatars.has(player.id)) {
      const img = loadedAvatars.get(player.id)!;
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, headY, headRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(img, px - headRadius, headY - headRadius, headRadius * 2, headRadius * 2);
      ctx.restore();
    } else {
      ctx.fillStyle = player ? '#0f172a' : '#1e293b';
      ctx.beginPath();
      ctx.arc(px, headY, headRadius, 0, Math.PI * 2);
      ctx.fill();

      if (player) {
        ctx.fillStyle = isTeamA ? '#fde047' : '#93c5fd';
        ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.name.slice(0, 2), px, headY);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(roleLabel, px, headY);
      }
    }

    // 3. Name & Rating Plate below Jersey
    if (player) {
      const nameText = player.name;
      ctx.font = 'bold 12.5px system-ui, -apple-system, sans-serif';
      const nameWidth = ctx.measureText(nameText).width;
      const pillW = Math.max(nameWidth + 22, 92);
      const pillH = 22;
      const pillY = jerseyY + jerseyH + 3;

      // Dark background badge
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.beginPath();
      ctx.roundRect(px - pillW / 2, pillY, pillW, pillH, 6);
      ctx.fill();
      ctx.strokeStyle = teamKit.hex;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Name Text in Team's Tone
      ctx.fillStyle = isTeamA ? '#fef08a' : '#93c5fd';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(nameText, px, pillY + pillH / 2);

      // Star & Role Tag
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
      ctx.fillText(`★ ${player.fairScore} • ${roleLabel}`, px, pillY + pillH + 11);
    }
  };

  // Draw Team B Starting 6 (Top Half - Team B Jersey)
  const positionsB = matchState.teamB.customPositions && matchState.teamB.customPositions.length === 6
    ? matchState.teamB.customPositions
    : formB.positionsB;

  positionsB.forEach((pos, idx) => {
    const playerId = matchState.teamB.starterIds[idx];
    const player = playerId ? playerMap.get(playerId) || null : null;
    drawPitchPlayerToken(player, pos.x, pos.y, kitB, pos.label, idx + 1, false);
  });

  // Draw Team A Starting 6 (Bottom Half - Team A Jersey)
  const positionsA = matchState.teamA.customPositions && matchState.teamA.customPositions.length === 6
    ? matchState.teamA.customPositions
    : formA.positionsA;

  positionsA.forEach((pos, idx) => {
    const playerId = matchState.teamA.starterIds[idx];
    const player = playerId ? playerMap.get(playerId) || null : null;
    drawPitchPlayerToken(player, pos.x, pos.y, kitA, pos.label, idx + 1, true);
  });

  currentY += pitchH + 18;

  // 6. Substitutes / Bench Section (یەدەگ)
  const benchBoxW = (width - 72 - 18) / 2;
  const benchH = 146;

  // Team B Bench (Left side)
  const benchBX = 36;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(benchBX, currentY, benchBoxW, benchH);
  ctx.strokeStyle = kitB.darkHex || '#2563eb';
  ctx.lineWidth = 2;
  ctx.strokeRect(benchBX, currentY, benchBoxW, benchH);

  // Bench B Header with Jersey
  ctx.fillStyle = kitB.hex;
  ctx.fillRect(benchBX, currentY, benchBoxW, 36);
  drawJerseyVector(ctx, benchBX + 10, currentY + 4, 22, 26, '#ffffff', '#0f172a', '#0f172a', 'B');

  ctx.fillStyle = kitB.text === 'text-white' ? '#ffffff' : '#0f172a';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`یاریزانانی یەدەگ: ${matchState.teamB.name} (${kitB.label})`, benchBX + benchBoxW - 14, currentY + 18);

  // Team B Subs Cards
  matchState.teamB.substituteIds.forEach((id, idx) => {
    const subPlayer = id ? playerMap.get(id) : null;
    const subCardX = benchBX + 14 + idx * 172;
    const subCardY = currentY + 48;

    ctx.fillStyle = '#f0f9ff';
    ctx.fillRect(subCardX, subCardY, 162, 84);
    ctx.strokeStyle = kitB.hex;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(subCardX, subCardY, 162, 84);

    if (subPlayer) {
      const subAvatarRadius = 20;
      const subAvatarX = subCardX + 130;
      const subAvatarY = subCardY + 30;

      // Draw Sub mini jersey & avatar
      drawJerseyVector(ctx, subAvatarX - 16, subCardY + 40, 32, 34, kitB.hex, kitB.darkHex, textColorB, (idx + 7).toString());

      // Sub Avatar Head
      ctx.fillStyle = kitB.hex;
      ctx.beginPath();
      ctx.arc(subAvatarX, subAvatarY, subAvatarRadius + 2, 0, Math.PI * 2);
      ctx.fill();

      if (loadedAvatars.has(subPlayer.id)) {
        const img = loadedAvatars.get(subPlayer.id)!;
        ctx.save();
        ctx.beginPath();
        ctx.arc(subAvatarX, subAvatarY, subAvatarRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, subAvatarX - subAvatarRadius, subAvatarY - subAvatarRadius, subAvatarRadius * 2, subAvatarRadius * 2);
        ctx.restore();
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(subAvatarX, subAvatarY, subAvatarRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#93c5fd';
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(subPlayer.name.slice(0, 1), subAvatarX, subAvatarY);
      }

      // Name in Blue & WPI
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#1d4ed8';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(subPlayer.name, subCardX + 102, subCardY + 24);

      ctx.fillStyle = '#0284c7';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(`WPI: ${subPlayer.fairScore}`, subCardX + 102, subCardY + 46);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`یەدەگ ${idx + 1} (بەتاڵ)`, subCardX + 81, subCardY + 42);
    }
  });

  // Team A Bench (Right side)
  const benchAX = width - 36 - benchBoxW;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(benchAX, currentY, benchBoxW, benchH);
  ctx.strokeStyle = kitA.darkHex || '#ca8a04';
  ctx.lineWidth = 2;
  ctx.strokeRect(benchAX, currentY, benchBoxW, benchH);

  // Bench A Header with Jersey
  ctx.fillStyle = kitA.hex;
  ctx.fillRect(benchAX, currentY, benchBoxW, 36);
  drawJerseyVector(ctx, benchAX + benchBoxW - 30, currentY + 4, 22, 26, '#ffffff', '#0f172a', '#0f172a', 'A');

  ctx.fillStyle = kitA.text === 'text-white' ? '#ffffff' : '#0f172a';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`یاریزانانی یەدەگ: ${matchState.teamA.name} (${kitA.label})`, benchAX + benchBoxW - 38, currentY + 18);

  // Team A Subs Cards
  matchState.teamA.substituteIds.forEach((id, idx) => {
    const subPlayer = id ? playerMap.get(id) : null;
    const subCardX = benchAX + benchBoxW - 14 - 162 - idx * 172;
    const subCardY = currentY + 48;

    ctx.fillStyle = '#fefce8';
    ctx.fillRect(subCardX, subCardY, 162, 84);
    ctx.strokeStyle = kitA.hex;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(subCardX, subCardY, 162, 84);

    if (subPlayer) {
      const subAvatarRadius = 20;
      const subAvatarX = subCardX + 130;
      const subAvatarY = subCardY + 30;

      // Draw Sub mini jersey & avatar
      drawJerseyVector(ctx, subAvatarX - 16, subCardY + 40, 32, 34, kitA.hex, kitA.darkHex, textColorA, (idx + 7).toString());

      // Sub Avatar Head
      ctx.fillStyle = kitA.hex;
      ctx.beginPath();
      ctx.arc(subAvatarX, subAvatarY, subAvatarRadius + 2, 0, Math.PI * 2);
      ctx.fill();

      if (loadedAvatars.has(subPlayer.id)) {
        const img = loadedAvatars.get(subPlayer.id)!;
        ctx.save();
        ctx.beginPath();
        ctx.arc(subAvatarX, subAvatarY, subAvatarRadius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, subAvatarX - subAvatarRadius, subAvatarY - subAvatarRadius, subAvatarRadius * 2, subAvatarRadius * 2);
        ctx.restore();
      } else {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(subAvatarX, subAvatarY, subAvatarRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(subPlayer.name.slice(0, 1), subAvatarX, subAvatarY);
      }

      // Name in Gold/Yellow & WPI
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#854d0e';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(subPlayer.name, subCardX + 102, subCardY + 24);

      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(`WPI: ${subPlayer.fairScore}`, subCardX + 102, subCardY + 46);
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`یەدەگ ${idx + 1} (بەتاڵ)`, subCardX + 81, subCardY + 42);
    }
  });

  currentY += benchH + 18;

  // 7. Footer
  ctx.fillStyle = '#64748b';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('⚽ پێکهاتەی فەرمی یاریگای ٦ بەرامبەر ٦ • Rizbandy', width - 36, currentY + 10);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#059669';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillText('پاشەکەوتکراوە بە کوالێتی بەرز بۆ داونلۆد و بڵاوکردنەوە لە مۆبایل و تۆڕە کۆمەڵایەتییەکان', 36, currentY + 10);

  return canvas;
}
