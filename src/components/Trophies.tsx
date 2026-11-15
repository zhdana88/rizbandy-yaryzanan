import React from 'react';

interface TrophyProps {
  className?: string;
  size?: number | string;
  glow?: boolean;
}

// 1. BALLON D'OR TROPHY (خەڵاتی تۆپی زێڕین)
export const BallonDorTrophy: React.FC<TrophyProps> = ({ 
  className = '', 
  size = 56,
  glow = true 
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {glow && (
        <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-md animate-pulse pointer-events-none" />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative drop-shadow-md transition-transform hover:scale-105 duration-300"
      >
        <defs>
          {/* Gold Gradients */}
          <linearGradient id="goldBallGrad" x1="20" y1="10" x2="100" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF9D2" />
            <stop offset="25%" stopColor="#FFD700" />
            <stop offset="60%" stopColor="#D4AF37" />
            <stop offset="85%" stopColor="#AA771C" />
            <stop offset="100%" stopColor="#66460B" />
          </linearGradient>

          <linearGradient id="goldBallHighlight" x1="40" y1="15" x2="80" y2="55" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FFE066" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="basePyriteGrad" x1="15" y1="80" x2="105" y2="125" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFE87C" />
            <stop offset="30%" stopColor="#D4AF37" />
            <stop offset="70%" stopColor="#8C6514" />
            <stop offset="100%" stopColor="#4A3408" />
          </linearGradient>

          <linearGradient id="goldPlaqueGrad" x1="30" y1="105" x2="90" y2="122" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF2A3" />
            <stop offset="50%" stopColor="#DFB235" />
            <stop offset="100%" stopColor="#8A6014" />
          </linearGradient>

          <radialGradient id="ballShine" cx="45" cy="35" r="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#FFEAA7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Pyrite / Crystal Rugged Golden Rock Base */}
        <path
          d="M 22 95 L 35 84 L 55 86 L 75 83 L 95 87 L 102 96 L 98 120 L 78 124 L 40 124 L 18 118 Z"
          fill="url(#basePyriteGrad)"
          stroke="#4A3408"
          strokeWidth="1.5"
        />
        {/* Crystal Facets */}
        <polygon points="35,84 55,86 48,102 28,98" fill="#F3C644" opacity="0.6" />
        <polygon points="55,86 75,83 72,102 48,102" fill="#DFB235" opacity="0.8" />
        <polygon points="75,83 95,87 90,103 72,102" fill="#AA771C" opacity="0.7" />
        <polygon points="28,98 48,102 42,122 20,116" fill="#755110" opacity="0.9" />
        <polygon points="72,102 90,103 96,119 76,122" fill="#573C09" opacity="0.9" />

        {/* Engraved Plaque on Base */}
        <rect
          x="32"
          y="104"
          width="56"
          height="16"
          rx="2.5"
          fill="url(#goldPlaqueGrad)"
          stroke="#52380A"
          strokeWidth="1.2"
        />
        <text
          x="60"
          y="115.5"
          fill="#3E2706"
          fontSize="6.5"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          letterSpacing="0.8"
        >
          BALLON D'OR
        </text>

        {/* Golden Soccer Ball Sphere */}
        <circle cx="60" cy="48" r="38" fill="url(#goldBallGrad)" stroke="#7A5311" strokeWidth="1.5" />

        {/* Ball Pattern (Hexagons & Pentagons Facets with luxury seams) */}
        {/* Center Pentagon */}
        <polygon
          points="60,32 72,41 68,55 52,55 48,41"
          fill="#6E4B0B"
          stroke="#FFE680"
          strokeWidth="1.2"
          opacity="0.85"
        />
        {/* Top Connecting Lines & Hexagons */}
        <line x1="60" y1="32" x2="60" y2="14" stroke="#8C6010" strokeWidth="1.4" />
        <line x1="72" y1="41" x2="88" y2="34" stroke="#8C6010" strokeWidth="1.4" />
        <line x1="68" y1="55" x2="84" y2="67" stroke="#8C6010" strokeWidth="1.4" />
        <line x1="52" y1="55" x2="36" y2="67" stroke="#8C6010" strokeWidth="1.4" />
        <line x1="48" y1="41" x2="32" y2="34" stroke="#8C6010" strokeWidth="1.4" />

        {/* Outer Hexagonal Patches */}
        <polygon points="60,14 78,19 88,34 72,41 60,32" fill="#E6BA39" opacity="0.3" />
        <polygon points="60,14 42,19 32,34 48,41 60,32" fill="#FFF2A3" opacity="0.4" />
        <polygon points="88,34 96,50 84,67 68,55 72,41" fill="#BA881F" opacity="0.35" />
        <polygon points="32,34 24,50 36,67 52,55 48,41" fill="#FCE079" opacity="0.4" />
        <polygon points="52,55 68,55 84,67 60,82 36,67" fill="#7D550D" opacity="0.4" />

        {/* Specular Highlight Sheen */}
        <ellipse cx="46" cy="30" rx="18" ry="12" fill="url(#ballShine)" />
        <circle cx="42" cy="26" r="3.5" fill="#FFFFFF" opacity="0.9" />

        {/* Sparkling Stars on Trophy */}
        <path d="M 85 20 Q 85 27 92 27 Q 85 27 85 34 Q 85 27 78 27 Q 85 27 85 20 Z" fill="#FFF9D2" />
        <circle cx="85" cy="27" r="1.2" fill="#FFFFFF" />

        <path d="M 28 45 Q 28 50 33 50 Q 28 50 28 55 Q 28 50 23 50 Q 28 50 28 45 Z" fill="#FFF9D2" />
        <circle cx="28" cy="50" r="0.9" fill="#FFFFFF" />
      </svg>
    </div>
  );
};

// 2. TAPIRO D'ORO TROPHY (خەڵاتی بەرازی زێڕین - خەڵاتی تەنزی ئامێزی ستریشا لا نۆتیزیا)
export const TapiroDoroTrophy: React.FC<TrophyProps> = ({ 
  className = '', 
  size = 56,
  glow = true 
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {glow && (
        <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-md pointer-events-none" />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 130 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative drop-shadow-md transition-transform hover:scale-105 duration-300"
      >
        <defs>
          {/* Polished Gold Pig/Tapir Gradient */}
          <linearGradient id="tapirGoldGrad" x1="15" y1="15" x2="115" y2="85" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFAD4" />
            <stop offset="25%" stopColor="#FFDC52" />
            <stop offset="60%" stopColor="#DDA726" />
            <stop offset="85%" stopColor="#A37112" />
            <stop offset="100%" stopColor="#5E3F05" />
          </linearGradient>

          {/* Wooden Pedestal Gradient */}
          <linearGradient id="woodBaseGrad" x1="20" y1="80" x2="110" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#B35924" />
            <stop offset="40%" stopColor="#7A340E" />
            <stop offset="85%" stopColor="#4A1C04" />
            <stop offset="100%" stopColor="#2E0E00" />
          </linearGradient>

          {/* Brass Nameplate Gradient */}
          <linearGradient id="tapirPlaqueGrad" x1="30" y1="85" x2="100" y2="102" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFF4B8" />
            <stop offset="50%" stopColor="#E0B638" />
            <stop offset="100%" stopColor="#8C6314" />
          </linearGradient>

          {/* Golden Highlight */}
          <radialGradient id="tapirBackShine" cx="65" cy="28" r="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#FFEAA7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#E2A619" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Lower Mahogany Wood Base Plate */}
        <ellipse cx="65" cy="98" rx="55" ry="10" fill="url(#woodBaseGrad)" stroke="#2B0E02" strokeWidth="1.2" />
        <ellipse cx="65" cy="95" rx="50" ry="8" fill="#8C3F12" opacity="0.6" />

        {/* Upper Mahogany Wood Tier */}
        <ellipse cx="65" cy="91" rx="46" ry="7.5" fill="url(#woodBaseGrad)" stroke="#381303" strokeWidth="1" />

        {/* Curved Brass Nameplate */}
        <rect
          x="30"
          y="84"
          width="70"
          height="14"
          rx="2.5"
          fill="url(#tapirPlaqueGrad)"
          stroke="#4D3507"
          strokeWidth="1.2"
        />
        <text
          x="65"
          y="93.5"
          fill="#3B2605"
          fontSize="6.2"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          textAnchor="middle"
          letterSpacing="0.6"
        >
          TAPIRO D'ORO
        </text>

        {/* Golden Tapir Statue (Trunk / Snout, Ears, Rounded Back, Legs) */}
        {/* Back Legs (Shadowed) */}
        <path
          d="M 86 52 C 86 64, 88 78, 88 88 L 82 88 C 81 76, 80 65, 80 55 Z"
          fill="#8A5B0B"
        />
        <path
          d="M 46 54 C 45 65, 46 76, 47 88 L 41 88 C 39 76, 38 65, 41 55 Z"
          fill="#8A5B0B"
        />

        {/* Main Golden Tapir Body Silhouette */}
        <path
          d="M 16 54
             C 14 50, 18 42, 26 36
             C 32 30, 40 24, 55 20
             C 72 15, 92 18, 102 26
             C 112 34, 114 46, 110 58
             C 106 68, 100 74, 96 87
             L 89 87
             C 91 76, 95 64, 94 56
             C 92 48, 85 52, 78 54
             C 65 56, 56 60, 52 74
             L 52 87
             L 45 87
             C 45 74, 49 60, 45 52
             C 41 46, 35 48, 28 55
             C 22 62, 17 60, 16 54 Z"
          fill="url(#tapirGoldGrad)"
          stroke="#6E4A07"
          strokeWidth="1.2"
        />

        {/* Tapir Head & Elongated Snout */}
        <path
          d="M 38 34
             C 33 33, 26 38, 20 44
             C 15 48, 12 55, 14 58
             C 15 60, 19 59, 23 54
             C 28 48, 35 44, 40 43 Z"
          fill="url(#tapirGoldGrad)"
        />

        {/* Snout Mouth Line */}
        <path d="M 14 56 C 18 54, 21 51, 23 50" stroke="#523605" strokeWidth="1" strokeLinecap="round" />

        {/* Tiny Tapir Eye */}
        <circle cx="27" cy="40" r="1.6" fill="#3D2604" />
        <circle cx="27.4" cy="39.6" r="0.6" fill="#FFFFFF" />

        {/* Small Rounded Ear */}
        <path
          d="M 38 30 C 37 24, 42 22, 45 25 C 47 28, 43 32, 38 30 Z"
          fill="#E5B229"
          stroke="#694607"
          strokeWidth="0.9"
        />
        <path d="M 40 27 C 41 25, 43 25, 44 27" stroke="#7A520A" strokeWidth="0.8" />

        {/* Short Stubby Tail */}
        <path d="M 108 34 C 113 35, 114 39, 112 41" stroke="#94650E" strokeWidth="2.5" strokeLinecap="round" />

        {/* Shiny Highlight across the Golden Back */}
        <ellipse cx="68" cy="25" rx="24" ry="7" fill="url(#tapirBackShine)" />
        <path d="M 52 23 Q 66 18 86 23" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />

        {/* Comical Sweat / Sparkle */}
        <path d="M 98 12 Q 98 16 102 16 Q 98 16 98 20 Q 98 16 94 16 Q 98 16 98 12 Z" fill="#FFE57A" />
      </svg>
    </div>
  );
};

// 3. SILVER STAR TROPHY (خەڵاتی ئەستێرەی زیوین بۆ پلەی دووەم)
export const SilverStarTrophy: React.FC<TrophyProps> = ({
  className = '',
  size = 56,
  glow = true
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {glow && (
        <div className="absolute inset-0 rounded-full bg-slate-400/20 blur-md pointer-events-none" />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative drop-shadow-md transition-transform hover:scale-105 duration-300"
      >
        <defs>
          <linearGradient id="silverGrad" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#E2E8F0" />
            <stop offset="70%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
          <linearGradient id="silverBaseGrad" x1="20" y1="80" x2="100" y2="110" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#CBD5E1" />
            <stop offset="50%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>
        </defs>

        {/* Base */}
        <rect x="30" y="92" width="60" height="18" rx="3" fill="url(#silverBaseGrad)" stroke="#0F172A" strokeWidth="1.5" />
        <rect x="34" y="95" width="52" height="10" rx="1.5" fill="#F8FAFC" />
        <text x="60" y="102" fill="#0F172A" fontSize="5.5" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">
          SILVER STAR
        </text>

        {/* Column */}
        <rect x="52" y="74" width="16" height="18" fill="#CBD5E1" stroke="#334155" strokeWidth="1.2" />

        {/* Star */}
        <polygon
          points="60,18 69,38 91,40 74,55 79,77 60,65 41,77 46,55 29,40 51,38"
          fill="url(#silverGrad)"
          stroke="#334155"
          strokeWidth="1.5"
        />

        {/* Shine */}
        <circle cx="54" cy="36" r="3" fill="#FFFFFF" opacity="0.9" />
        <path d="M 82 24 Q 82 28 86 28 Q 82 28 82 32 Q 82 28 78 28 Q 82 28 82 24 Z" fill="#FFFFFF" />
      </svg>
    </div>
  );
};

// 4. BRONZE MEDAL TROPHY (خەڵاتی برۆنز بۆ پلەی سێیەم)
export const BronzeMedalTrophy: React.FC<TrophyProps> = ({
  className = '',
  size = 56,
  glow = true
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center select-none ${className}`}>
      {glow && (
        <div className="absolute inset-0 rounded-full bg-amber-700/20 blur-md pointer-events-none" />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative drop-shadow-md transition-transform hover:scale-105 duration-300"
      >
        <defs>
          <linearGradient id="bronzeGrad" x1="20" y1="20" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FED7AA" />
            <stop offset="40%" stopColor="#D97706" />
            <stop offset="80%" stopColor="#92400E" />
            <stop offset="100%" stopColor="#451A03" />
          </linearGradient>
        </defs>

        <circle cx="60" cy="60" r="38" fill="url(#bronzeGrad)" stroke="#78350F" strokeWidth="2" />
        <circle cx="60" cy="60" r="30" fill="#B45309" stroke="#FDE68A" strokeWidth="1" strokeDasharray="3 2" />
        <text x="60" y="68" fill="#FFFBEB" fontSize="24" fontWeight="900" textAnchor="middle" fontFamily="system-ui, sans-serif">
          3
        </text>
      </svg>
    </div>
  );
};

