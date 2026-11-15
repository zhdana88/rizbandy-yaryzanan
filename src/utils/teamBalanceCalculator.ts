import { ComputedPlayerStats, TeamLineup } from '../types';

export interface TeamStatsAnalysis {
  playerCount: number;
  totalWpi: number;
  avgWpi: number;
  avgRating: number;
  avgWinRate: number;
  attackScore: number;
  defenseScore: number;
  starPlayers: ComputedPlayerStats[];
}

export interface MatchBalanceResult {
  teamAStats: TeamStatsAnalysis;
  teamBStats: TeamStatsAnalysis;
  percentageA: number; // e.g. 50.5%
  percentageB: number; // e.g. 49.5%
  balanceIndex: number; // 0 to 100% (100 is perfectly equal)
  verdict: {
    status: 'perfect' | 'great' | 'slight_diff' | 'unbalanced';
    title: string;
    message: string;
    color: string;
  };
}

export function analyzeTeam(
  playerIds: (string | null)[],
  allPlayers: ComputedPlayerStats[]
): TeamStatsAnalysis {
  const playerMap = new Map(allPlayers.map((p) => [p.id, p]));
  const validPlayers = playerIds
    .map((id) => (id ? playerMap.get(id) : null))
    .filter((p): p is ComputedPlayerStats => Boolean(p));

  if (validPlayers.length === 0) {
    return {
      playerCount: 0,
      totalWpi: 0,
      avgWpi: 0,
      avgRating: 0,
      avgWinRate: 0,
      attackScore: 0,
      defenseScore: 0,
      starPlayers: [],
    };
  }

  const totalWpi = validPlayers.reduce((sum, p) => sum + p.fairScore, 0);
  const avgWpi = Number((totalWpi / validPlayers.length).toFixed(2));
  const totalRating = validPlayers.reduce((sum, p) => sum + p.fairRating, 0);
  const avgRating = Number((totalRating / validPlayers.length).toFixed(2));
  const totalWinRate = validPlayers.reduce((sum, p) => sum + p.winRate, 0);
  const avgWinRate = Number((totalWinRate / validPlayers.length).toFixed(1));

  // Attack score based on forward & midfield stats
  const attackScore = Number(
    (
      validPlayers.reduce((sum, p) => {
        const posFactor = p.position === 'forward' ? 1.3 : p.position === 'midfield' ? 1.1 : 0.8;
        return sum + p.fairRating * posFactor + (p.goals || 0) * 0.2;
      }, 0) / validPlayers.length
    ).toFixed(1)
  );

  // Defense score based on GK and defender stats
  const defenseScore = Number(
    (
      validPlayers.reduce((sum, p) => {
        const posFactor = p.position === 'goalkeeper' ? 1.4 : p.position === 'defender' ? 1.2 : 0.8;
        return sum + p.fairRating * posFactor;
      }, 0) / validPlayers.length
    ).toFixed(1)
  );

  const starPlayers = [...validPlayers].sort((a, b) => b.fairScore - a.fairScore).slice(0, 2);

  return {
    playerCount: validPlayers.length,
    totalWpi: Number(totalWpi.toFixed(2)),
    avgWpi,
    avgRating,
    avgWinRate,
    attackScore,
    defenseScore,
    starPlayers,
  };
}

export function evaluateMatchBalance(
  teamA: TeamLineup,
  teamB: TeamLineup,
  allPlayers: ComputedPlayerStats[]
): MatchBalanceResult {
  // Only evaluate starters for dynamic pitch match balance (or all assigned)
  const startersA = teamA.starterIds;
  const startersB = teamB.starterIds;

  const statsA = analyzeTeam(startersA, allPlayers);
  const statsB = analyzeTeam(startersB, allPlayers);

  const totalScore = statsA.totalWpi + statsB.totalWpi;

  let percentageA = 50;
  let percentageB = 50;

  if (totalScore > 0) {
    percentageA = Number(((statsA.totalWpi / totalScore) * 100).toFixed(1));
    percentageB = Number(((statsB.totalWpi / totalScore) * 100).toFixed(1));
  }

  const diff = Math.abs(percentageA - 50);
  const balanceIndex = Math.max(0, Number((100 - diff * 2.5).toFixed(0)));

  let verdict: MatchBalanceResult['verdict'];

  if (balanceIndex >= 96) {
    verdict = {
      status: 'perfect',
      title: 'هاوسەنگی تەواو (٥٠٪ - ٥٠٪)',
      message: 'هەردوو تیم لە ڕووی ئاست و ئەزموونەوە لەوپەڕی یەکسانیدان و یارییەکی زۆر بەهێز دەبێت.',
      color: 'text-emerald-700 bg-emerald-50 border-emerald-300',
    };
  } else if (balanceIndex >= 88) {
    verdict = {
      status: 'great',
      title: 'هاوسەنگی زۆر باش و دادپەروەرانە',
      message: 'جیاوازی نێوان هەردوو تیم کەمە و ڕێژەی سەرکەوتنیان لە یەکترەوە نزیکە.',
      color: 'text-blue-700 bg-blue-50 border-blue-300',
    };
  } else if (balanceIndex >= 78) {
    const strongerTeam = percentageA > percentageB ? teamA.name : teamB.name;
    verdict = {
      status: 'slight_diff',
      title: `جیاوازییەکی کەم هەیە (${strongerTeam})`,
      message: `${strongerTeam} بە ڕێژەیەکی کەم لە ڕووی نمرەی WPI باڵادەستترە.`,
      color: 'text-amber-700 bg-amber-50 border-amber-300',
    };
  } else {
    const strongerTeam = percentageA > percentageB ? teamA.name : teamB.name;
    verdict = {
      status: 'unbalanced',
      title: `نایەکسانە (${strongerTeam} زۆر بەهێزترە)`,
      message: 'پێشنیار دەکرێت دوگمەی «هاوسەنگکردنی زیرەکانە» دابگریت بۆ دابەشکردنی دادپەروەرانەی یاریزانەکان.',
      color: 'text-rose-700 bg-rose-50 border-rose-300',
    };
  }

  return {
    teamAStats: statsA,
    teamBStats: statsB,
    percentageA,
    percentageB,
    balanceIndex,
    verdict,
  };
}

/**
 * Intelligent AI Auto-Balancing Algorithm:
 * Sorts all given players by WPI and balances them into two teams
 * by alternating high and lower rated players while respecting positions.
 */
export function autoBalanceTeams(
  availablePlayers: ComputedPlayerStats[],
  subCount: number = 2
): {
  startersA: string[];
  subsA: string[];
  startersB: string[];
  subsB: string[];
} {
  const neededPerTeam = 6 + subCount;
  const totalNeeded = neededPerTeam * 2;

  // Take top players available
  const selectedPool = [...availablePlayers]
    .filter((p) => p.status !== 'injured')
    .slice(0, totalNeeded);

  // Group by position
  const gks = selectedPool.filter((p) => p.position === 'goalkeeper').sort((a, b) => b.fairScore - a.fairScore);
  const defs = selectedPool.filter((p) => p.position === 'defender').sort((a, b) => b.fairScore - a.fairScore);
  const mids = selectedPool.filter((p) => p.position === 'midfield').sort((a, b) => b.fairScore - a.fairScore);
  const fwds = selectedPool.filter((p) => p.position === 'forward').sort((a, b) => b.fairScore - a.fairScore);
  const others = selectedPool.filter((p) => !['goalkeeper', 'defender', 'midfield', 'forward'].includes(p.position || '')).sort((a, b) => b.fairScore - a.fairScore);

  const teamA: ComputedPlayerStats[] = [];
  const teamB: ComputedPlayerStats[] = [];

  const distributeEvenly = (list: ComputedPlayerStats[]) => {
    list.forEach((p, idx) => {
      // Alternate based on sum of WPI
      const sumA = teamA.reduce((s, item) => s + item.fairScore, 0);
      const sumB = teamB.reduce((s, item) => s + item.fairScore, 0);

      if (teamA.length >= neededPerTeam) {
        teamB.push(p);
      } else if (teamB.length >= neededPerTeam) {
        teamA.push(p);
      } else if (sumA <= sumB) {
        teamA.push(p);
      } else {
        teamB.push(p);
      }
    });
  };

  // 1. Distribute GKs first
  distributeEvenly(gks);
  // 2. Distribute Defs
  distributeEvenly(defs);
  // 3. Distribute Fwds
  distributeEvenly(fwds);
  // 4. Distribute Mids
  distributeEvenly(mids);
  // 5. Distribute Others
  distributeEvenly(others);

  // Fill remaining if pool had less
  while (teamA.length < neededPerTeam && teamB.length > teamA.length) {
    const moved = teamB.pop();
    if (moved) teamA.push(moved);
  }

  // Separate starters and subs
  const startersA = teamA.slice(0, 6).map((p) => p.id);
  const subsA = teamA.slice(6, 6 + subCount).map((p) => p.id);

  const startersB = teamB.slice(0, 6).map((p) => p.id);
  const subsB = teamB.slice(6, 6 + subCount).map((p) => p.id);

  return {
    startersA,
    subsA,
    startersB,
    subsB,
  };
}
