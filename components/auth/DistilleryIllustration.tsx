import React from "react";

interface DistilleryIllustrationProps {
  className?: string;
}

export function DistilleryIllustration({ className = "" }: DistilleryIllustrationProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Ambient background glow in subtle copper/amber */}
      <div className="absolute inset-0 bg-radial from-[#D17B00]/10 via-amber-500/5 to-transparent blur-2xl rounded-full transform scale-110 pointer-events-none" />

      <svg
        viewBox="0 0 440 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-sm lg:max-w-md drop-shadow-sm"
        aria-label="Ilustración artesanal de destilería y control de inventario de botellas BottleTrack con alambique de cobre y barrica de roble"
      >
        <defs>
          {/* Copper Gradients */}
          <linearGradient id="copperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="45%" stopColor="#D17B00" />
            <stop offset="100%" stopColor="#9A5400" />
          </linearGradient>

          <linearGradient id="copperPipeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E59866" />
            <stop offset="50%" stopColor="#D17B00" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          <linearGradient id="barrelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#F8FAFC" />
            <stop offset="100%" stopColor="#F1F5F9" />
          </linearGradient>

          <linearGradient id="bottleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#D17B00" stopOpacity="0.45" />
          </linearGradient>

          <linearGradient id="columnGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F1F5F9" />
          </linearGradient>
        </defs>

        {/* Base Shelf / Foundation Line */}
        <line
          x1="40"
          y1="280"
          x2="400"
          y2="280"
          stroke="#E2E8F0"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="6 6"
        />
        <line
          x1="80"
          y1="280"
          x2="360"
          y2="280"
          stroke="#D17B00"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* ================= BARREL (LEFT) ================= */}
        <g id="oak-barrel" transform="translate(65, 140)">
          {/* Barrel Body */}
          <path
            d="M 15 135 C 0 100 0 40 15 5 C 25 2 75 2 85 5 C 100 40 100 100 85 135 C 75 138 25 138 15 135 Z"
            fill="url(#barrelGrad)"
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />
          {/* Barrel Wood Staves (Vertical curve lines) */}
          <path
            d="M 38 4 C 28 40 28 100 38 136"
            stroke="#E2E8F0"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M 62 4 C 72 40 72 100 62 136"
            stroke="#E2E8F0"
            strokeWidth="1.5"
            fill="none"
          />
          <line x1="50" y1="3" x2="50" y2="137" stroke="#E2E8F0" strokeWidth="1.5" />

          {/* Copper Hoops (Zunchos de cobre) */}
          {/* Top Hoop */}
          <path
            d="M 12 24 C 30 20 70 20 88 24"
            stroke="url(#copperGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Mid-Top Hoop */}
          <path
            d="M 5 56 C 25 50 75 50 95 56"
            stroke="url(#copperGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Mid-Bottom Hoop */}
          <path
            d="M 5 84 C 25 90 75 90 95 84"
            stroke="url(#copperGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          {/* Bottom Hoop */}
          <path
            d="M 12 116 C 30 120 70 120 88 116"
            stroke="url(#copperGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Barrel Bung (Tapón de barrica en cobre) */}
          <circle cx="50" cy="70" r="4.5" fill="url(#copperGrad)" />
          <circle cx="50" cy="70" r="2" fill="#78350F" />
        </g>

        {/* ================= ALAMBIC / STILL (CENTER) ================= */}
        <g id="copper-pot-still" transform="translate(165, 80)">
          {/* Pot Furnace / Base Support */}
          <path
            d="M 30 195 L 35 170 L 105 170 L 110 195 Z"
            fill="#F8FAFC"
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />
          <line x1="45" y1="183" x2="95" y2="183" stroke="#D17B00" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

          {/* Boiler / Cucúrbita (Main Pot Base) */}
          <path
            d="M 25 170 C 15 140 20 115 45 105 L 95 105 C 120 115 125 140 115 170 Z"
            fill="url(#copperGrad)"
            stroke="#E59866"
            strokeWidth="1.5"
          />

          {/* Pot highlight reflex */}
          <path
            d="M 38 160 C 30 140 35 122 50 114"
            stroke="#FEF3C7"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
            fill="none"
          />

          {/* Waist Band */}
          <rect x="42" y="103" width="56" height="4" rx="2" fill="#78350F" stroke="#FDBA74" strokeWidth="0.8" />

          {/* Onion Head / Capitel (Domo del Alambique) */}
          <path
            d="M 45 103 C 35 75 50 45 70 38 C 90 45 105 75 95 103 Z"
            fill="url(#copperGrad)"
            stroke="#E59866"
            strokeWidth="1.5"
          />

          {/* Capitel highlight */}
          <path
            d="M 54 88 C 48 68 58 50 68 45"
            stroke="#FEF3C7"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.85"
            fill="none"
          />

          {/* Swan Neck Pipe (Cuello de Cisne) */}
          <path
            d="M 70 38 C 70 15 95 5 118 12 C 145 20 155 45 158 85 L 158 115"
            stroke="url(#copperPipeGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 70 38 C 70 15 95 5 118 12 C 145 20 155 45 158 85 L 158 115"
            stroke="#FEF3C7"
            strokeWidth="1"
            strokeLinecap="round"
            opacity="0.9"
            fill="none"
          />

          {/* Thermometer Gauge on Capitel */}
          <circle cx="70" cy="72" r="5" fill="#FFFFFF" stroke="#D17B00" strokeWidth="1" />
          <line x1="70" y1="72" x2="73" y2="69" stroke="#EF4444" strokeWidth="1" />

          {/* Condenser / Serpentín Cooler Column (Right side of alembic) */}
          <rect
            x="146"
            y="115"
            width="24"
            height="80"
            rx="4"
            fill="url(#columnGrad)"
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />
          {/* Condenser Coil rings visible inside column */}
          <line x1="149" y1="130" x2="167" y2="130" stroke="#D17B00" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="149" y1="145" x2="167" y2="145" stroke="#D17B00" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="149" y1="160" x2="167" y2="160" stroke="#D17B00" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="149" y1="175" x2="167" y2="175" stroke="#D17B00" strokeWidth="2.5" strokeLinecap="round" />

          {/* Distillate Spout & Droplet */}
          <path d="M 158 195 L 158 200" stroke="#D17B00" strokeWidth="2" strokeLinecap="round" />
          <circle cx="158" cy="204" r="1.5" fill="#D17B00" opacity="0.9" />
        </g>

        {/* ================= BOTTLE & GLASS (RIGHT) ================= */}
        <g id="craft-bottle" transform="translate(325, 135)">
          {/* Glass Bottle Body */}
          <path
            d="M 10 140 L 10 65 C 10 50 18 45 18 30 L 18 10 L 32 10 L 32 30 C 32 45 40 50 40 65 L 40 140 Z"
            fill="url(#bottleGrad)"
            stroke="#94A3B8"
            strokeWidth="1.5"
          />

          {/* Copper Wax Seal / Cork */}
          <rect x="17" y="4" width="16" height="8" rx="2" fill="url(#copperGrad)" stroke="#FDBA74" strokeWidth="0.8" />
          <circle cx="25" cy="55" r="7" fill="url(#copperGrad)" />
          <circle cx="25" cy="55" r="5" fill="#78350F" />
          <path d="M 23 53 L 27 57 M 27 53 L 23 57" stroke="#FDBA74" strokeWidth="0.8" />

          {/* Minimalist Bottle Label */}
          <rect
            x="14"
            y="75"
            width="22"
            height="38"
            rx="1.5"
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth="0.8"
          />
          <line x1="18" y1="84" x2="32" y2="84" stroke="#18181B" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="18" y1="91" x2="30" y2="91" stroke="#D17B00" strokeWidth="1" strokeLinecap="round" />
          <line x1="18" y1="97" x2="28" y2="97" stroke="#94A3B8" strokeWidth="0.8" strokeLinecap="round" />
          <line x1="18" y1="103" x2="32" y2="103" stroke="#E2E8F0" strokeWidth="0.8" strokeLinecap="round" />

          {/* Glass light reflection streak */}
          <path
            d="M 14 66 L 14 135"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Tasting Glass / Copita */}
          <path
            d="M 50 140 L 58 140 M 54 140 L 54 125 C 50 120 46 110 50 102 L 58 102 C 62 110 58 120 54 125"
            stroke="#94A3B8"
            strokeWidth="1.2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Amber spirit inside glass */}
          <path
            d="M 49 116 C 51 120 57 120 59 116 C 57 114 51 114 49 116 Z"
            fill="#D17B00"
            opacity="0.85"
          />
        </g>

        {/* Small floating craft spark accents */}
        <circle cx="160" cy="50" r="1.5" fill="#D17B00" opacity="0.6" />
        <circle cx="300" cy="100" r="1" fill="#D17B00" opacity="0.4" />
        <circle cx="130" cy="120" r="1" fill="#D17B00" opacity="0.5" />
      </svg>
    </div>
  );
}
