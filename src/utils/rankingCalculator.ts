import { Player, ComputedPlayerStats, RankingConfig } from '../types';

export const DEFAULT_CONFIG: RankingConfig = {
  system: 'fair_wpi',
  bonusFactor: 0.15,
  matchBonusPoints: 0.1,
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  minMatchesForRanking: 0,
};

export function calculatePlayerStats(
  player: Player,
  config: RankingConfig = DEFAULT_CONFIG,
  leagueAvgWinRate: number = 50
): Omit<ComputedPlayerStats, 'rank' | 'tier'> {
  const totalMatches = player.wins + player.draws + player.losses;
  const matchBonusRate = config.matchBonusPoints ?? config.bonusFactor ?? 0.1;
  
  // A gentle small bonus directly awarded for each match played (پۆینتی کەم و گونجاوی بەشداری لە یارییەکان)
  const matchBonus = Number((totalMatches * matchBonusRate).toFixed(2));

  // Base match points from Wins (3pts), Draws (1pt), Losses (0pt)
  const basePoints =
    player.wins * config.winPoints +
    player.draws * config.drawPoints +
    player.losses * config.lossPoints;

  // Total points combines base performance points + gentle match attendance bonus
  const totalPoints = Number((basePoints + matchBonus).toFixed(2));

  const rawWinRate =
    totalMatches > 0
      ? Number(((basePoints / (totalMatches * (config.winPoints || 3))) * 100).toFixed(2))
      : 0;

  const rawRating = Number((rawWinRate / 10).toFixed(2));

  const confidenceWeight =
    totalMatches > 0 ? 1 - 1 / Math.sqrt(totalMatches + 3) : 0;
  const fairWpiScore = totalMatches > 0
    ? Number((rawWinRate * confidenceWeight).toFixed(2))
    : 0;

  // 2. Bayesian formula: (Prior Matches * Prior Avg + Base Points) / (Prior Matches * 3 + Total Possible Points) * 100 + Match Bonus
  const priorMatches = 5;
  const priorPoints = priorMatches * 3 * (leagueAvgWinRate / 100);
  const bayesianScore =
    totalMatches > 0
      ? Number(
          (
            ((basePoints + priorPoints) / (totalMatches * 3 + priorMatches * 3)) *
            100 + matchBonus
          ).toFixed(2)
        )
      : Number(leagueAvgWinRate.toFixed(2));

  let finalFairScore = fairWpiScore;
  if (config.system === 'bayesian') {
    finalFairScore = bayesianScore;
  } else if (config.system === 'win_rate') {
    finalFairScore = Number((rawWinRate + matchBonus).toFixed(2));
  } else if (config.system === 'total_points') {
    finalFairScore = totalPoints;
  }

  const fairRating = Number((finalFairScore / 10).toFixed(2));
  const pointsPerMatch = totalMatches > 0 ? Number((totalPoints / totalMatches).toFixed(2)) : 0;

  return {
    ...player,
    totalMatches,
    basePoints,
    matchBonus,
    totalPoints,
    winRate: rawWinRate,
    rawRating,
    fairScore: finalFairScore,
    fairRating,
    pointsPerMatch,
  };
}

export function rankPlayers(
  players: Player[],
  config: RankingConfig = DEFAULT_CONFIG
): ComputedPlayerStats[] {
  if (!players || players.length === 0) return [];

  // Calculate league average win rate
  const totalLeagueMatches = players.reduce((sum, p) => sum + p.wins + p.draws + p.losses, 0);
  const totalLeaguePoints = players.reduce((sum, p) => sum + (p.wins * 3 + p.draws * 1), 0);
  const leagueAvgWinRate =
    totalLeagueMatches > 0
      ? (totalLeaguePoints / (totalLeagueMatches * 3)) * 100
      : 50;

  // Only rank active players (exclude injured players completely from the official leaderboard)
  const activePlayers = players.filter((p) => p.status !== 'injured');

  const statsList = activePlayers.map((p) => calculatePlayerStats(p, config, leagueAvgWinRate));

  // Sorting
  statsList.sort((a, b) => {
    if (a.customRank && b.customRank) return a.customRank - b.customRank;
    if (a.customRank && !b.customRank) return -1;
    if (!a.customRank && b.customRank) return 1;

    if (config.system === 'fair_wpi') {
      if (b.fairScore !== a.fairScore) return b.fairScore - a.fairScore;
      if (b.basePoints !== a.basePoints) return b.basePoints - a.basePoints;
      if (b.totalMatches !== a.totalMatches) return b.totalMatches - a.totalMatches;
      return b.wins - a.wins;
    } else if (config.system === 'win_rate') {
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      return b.wins - a.wins;
    } else if (config.system === 'total_points') {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.winRate !== a.winRate) return b.winRate - a.winRate;
      return b.wins - a.wins;
    } else {
      // bayesian
      if (b.fairScore !== a.fairScore) return b.fairScore - a.fairScore;
      return b.totalPoints - a.totalPoints;
    }
  });

  const totalCount = statsList.length;

  return statsList.map((stat, index) => {
    const rank = index + 1;
    let tier: 'champions' | 'top' | 'mid' | 'danger' = 'mid';

    if (rank <= 2) {
      tier = 'champions'; // Top 1 & 2 (زێڕینی / پلەی پێشەنگ)
    } else if (rank <= Math.min(6, totalCount - 2)) {
      tier = 'top'; // Rank 3-6 (پێشەنگانی ناوەڕاست)
    } else if (rank > Math.max(totalCount - 2, 2)) {
      tier = 'danger'; // Last 2 (ناوچەی مەترسی / دابەزین)
    } else {
      tier = 'mid'; // Others
    }

    return {
      ...stat,
      rank,
      tier,
    };
  });
}
