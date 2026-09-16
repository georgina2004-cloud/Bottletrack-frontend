import React from "react";
import { ILLUSTRATION_PALETTE, ILLUSTRATION_STROKES } from "@/lib/illustrationStyle";

interface StorefrontIllustrationProps {
  className?: string;
}


export function StorefrontIllustration({ className = "" }: StorefrontIllustrationProps) {
  const { amber, wood, cream, slate, accents } = ILLUSTRATION_PALETTE;
  const { thin, regular, medium, thick } = ILLUSTRATION_STROKES;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Resplandor ambiental de fondo */}
      <div
        className="absolute inset-0 bg-radial from-amber-500/10 via-amber-500/5 to-transparent blur-2xl rounded-full transform scale-110 pointer-events-none"
        aria-hidden="true"
      />

      <svg
        viewBox="0 0 460 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-sm lg:max-w-md drop-shadow-sm"
        aria-label="Ilustración artesanal de la fachada exterior de la licorería BottleTrack con vitrina de exhibición, puerta de entrada, toldo y farol clásico"
      >
        <defs>
          {/* Cono de luz cálida del farol exterior */}
          <radialGradient id="storefront-lamp-glow" cx="20%" cy="15%" r="75%">
            <stop offset="0%" stopColor={amber.bright} stopOpacity="0.25" />
            <stop offset="40%" stopColor={amber.primary} stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>

          {/* Degradado ámbar para elementos metálicos y de marca */}
          <linearGradient id="storefront-amber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={cream.highlight} />
            <stop offset="50%" stopColor={amber.bright} />
            <stop offset="100%" stopColor={amber.deep} />
          </linearGradient>

          {/* Líquido de botellas en vitrina */}
          <linearGradient id="storefront-bottle-liquid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={cream.highlight} stopOpacity="0.5" />
            <stop offset="100%" stopColor={amber.primary} stopOpacity="0.35" />
          </linearGradient>
        </defs>

        {/* Resplandor de iluminación del farol exterior */}
        <path
          d="M 50 70 L 160 310 L 0 310 Z"
          fill="url(#storefront-lamp-glow)"
        />

        <line
          x1="20"
          y1="312"
          x2="440"
          y2="312"
          stroke={slate.softTrack}
          strokeWidth={medium}
          strokeLinecap="round"
          strokeDasharray="6 6"
        />
        <line
          x1="35"
          y1="312"
          x2="425"
          y2="312"
          stroke={amber.primary}
          strokeWidth={thick}
          strokeLinecap="round"
          strokeOpacity="0.8"
        />


        {/* Cornisa Superior de la Fachada */}
        <rect
          x="45"
          y="42"
          width="370"
          height="14"
          rx="3"
          fill={wood.oak}
          stroke={wood.warm}
          strokeWidth={thick}
        />
        <line
          x1="48"
          y1="45"
          x2="412"
          y2="45"
          stroke={cream.highlight}
          strokeWidth="1"
          strokeOpacity="0.7"
        />

        {/* Letrero Principal de la Tienda "BOTTLETRACK" */}
        <rect
          x="120"
          y="20"
          width="220"
          height="32"
          rx="6"
          fill={cream.base}
          stroke={amber.primary}
          strokeWidth={medium}
        />
        <rect
          x="124"
          y="24"
          width="212"
          height="24"
          rx="4"
          fill="none"
          stroke={cream.highlight}
          strokeWidth="1"
        />
        <text
          x="230"
          y="37"
          fill={wood.oak}
          fontSize="10"
          fontWeight="800"
          letterSpacing="2.5"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          BOTTLETRACK
        </text>
        <text
          x="230"
          y="45"
          fill={amber.dark}
          fontSize="5.5"
          fontWeight="700"
          letterSpacing="1.2"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          FINE WINES & CRAFT SPIRITS
        </text>

        {/* Toldo / Marquesina a Rayas Clásica (Awning) */}
        <g id="storefront-awning" transform="translate(45, 56)">
          {/* Fondo y estructura del toldo */}
          <path
            d="M 0 0 L 15 42 L 355 42 L 370 0 Z"
            fill={cream.base}
            stroke={wood.warm}
            strokeWidth={medium}
          />

          {/* Franjas cálidas de color ámbar y terracota */}
          <path d="M 37 0 L 48 42 L 85 42 L 74 0 Z" fill={amber.primary} fillOpacity="0.9" />
          <path d="M 111 0 L 122 42 L 159 42 L 148 0 Z" fill={amber.primary} fillOpacity="0.9" />
          <path d="M 185 0 L 196 42 L 233 42 L 222 0 Z" fill={amber.primary} fillOpacity="0.9" />
          <path d="M 259 0 L 270 42 L 307 42 L 296 0 Z" fill={amber.primary} fillOpacity="0.9" />
          <path d="M 333 0 L 344 42 L 355 42 L 370 0 Z" fill={amber.primary} fillOpacity="0.9" />

          {/* Festón festoneado inferior (Scallop edge) */}
          <path
            d="M 15 42 Q 25 50 35 42 Q 45 50 55 42 Q 65 50 75 42 Q 85 50 95 42 Q 105 50 115 42 Q 125 50 135 42 Q 145 50 155 42 Q 165 50 175 42 Q 185 50 195 42 Q 205 50 215 42 Q 225 50 235 42 Q 245 50 255 42 Q 265 50 275 42 Q 285 50 295 42 Q 305 50 315 42 Q 325 50 335 42 Q 345 50 355 42"
            stroke={wood.warm}
            strokeWidth={regular}
            fill="none"
          />

          {/* Brazos de soporte metálicos del toldo */}
          <line x1="15" y1="42" x2="5" y2="70" stroke={slate.light} strokeWidth={medium} strokeLinecap="round" />
          <line x1="355" y1="42" x2="365" y2="70" stroke={slate.light} strokeWidth={medium} strokeLinecap="round" />
        </g>

        
        <g id="exterior-lantern" transform="translate(25, 68)">
          {/* Soporte de hierro forjado */}
          <path
            d="M 25 35 Q 12 30 18 10 L 32 10"
            stroke={slate.medium}
            strokeWidth={medium}
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="25" cy="35" r="3" fill={slate.charcoal} />

          {/* Estructura del Farol */}
          <path
            d="M 26 10 L 38 10 L 42 20 L 22 20 Z"
            fill={slate.charcoal}
            stroke={amber.primary}
            strokeWidth="1"
          />
          <path
            d="M 22 20 L 25 44 L 35 44 L 38 20 Z"
            fill={cream.base}
            stroke={slate.steel}
            strokeWidth={medium}
          />
          <path d="M 25 44 L 30 52 L 35 44 Z" fill={slate.charcoal} />

          {/* Foco interior con brillo cálido */}
          <circle cx="30" cy="30" r="4" fill={amber.bright} />
          <circle cx="30" cy="30" r="8" fill={cream.soft} fillOpacity="0.5" />
        </g>

        
        <g id="store-window" transform="translate(62, 115)">
          {/* Marco exterior de madera de la vitrina */}
          <rect
            x="0"
            y="0"
            width="200"
            height="180"
            rx="4"
            fill={slate.surface}
            stroke={wood.oak}
            strokeWidth={thick}
          />

          {/* Cristal interior con reflejos */}
          <rect
            x="8"
            y="8"
            width="184"
            height="164"
            rx="2"
            fill="#FFFFFF"
            stroke={slate.border}
            strokeWidth={regular}
          />

          {/* Línea divisoria superior / arcada de la vidriera */}
          <line x1="8" y1="36" x2="192" y2="36" stroke={slate.border} strokeWidth={regular} />
          <line x1="100" y1="8" x2="100" y2="36" stroke={slate.border} strokeWidth={regular} />

          {/* Tipografía grabada en el vidrio */}
          <text
            x="100"
            y="26"
            fill={amber.primary}
            fontSize="6.5"
            fontWeight="700"
            letterSpacing="2"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            · WINE CELLAR & SPIRITS ·
          </text>

          {/* Estante de madera interior de exhibición */}
          <rect
            x="12"
            y="125"
            width="176"
            height="8"
            rx="2"
            fill={wood.oak}
            stroke={wood.warm}
            strokeWidth={medium}
          />
          <line x1="14" y1="127" x2="186" y2="127" stroke={cream.highlight} strokeWidth="1" strokeOpacity="0.6" />

          {/* --- Botellas en exhibición en la vitrina --- */}
          {/* Botella 1: Vino Tinto */}
          <g transform="translate(25, 55)">
            <path
              d="M 12 0 H 18 V 20 L 24 32 V 70 H 6 V 32 L 12 20 Z"
              fill={cream.base}
              stroke={accents.rubyWine}
              strokeWidth={medium}
              strokeLinejoin="round"
            />
            <rect x="11" y="2" width="8" height="6" fill={accents.brightWine} rx="1" />
            <rect x="9" y="38" width="12" height="20" rx="1.5" fill="#FFFFFF" stroke={accents.brightWine} strokeWidth="0.8" />
            <line x1="11" y1="44" x2="19" y2="44" stroke={accents.rubyWine} strokeWidth="0.8" />
          </g>

          {/* Botella 2: Champagne / Espumoso */}
          <g transform="translate(60, 50)">
            <path
              d="M 13 0 H 17 V 16 Q 15 30 24 42 V 75 H 6 V 42 Q 15 30 13 16 Z"
              fill={cream.base}
              stroke={amber.gold}
              strokeWidth={medium}
              strokeLinejoin="round"
            />
            <path d="M 11 0 H 19 V 10 H 11 Z" fill={amber.bright} />
            <rect x="8" y="48" width="14" height="22" fill="url(#storefront-bottle-liquid)" rx="1.5" />
            <circle cx="15" cy="58" r="1.2" fill={amber.gold} />
            <circle cx="12" cy="64" r="0.8" fill={amber.gold} />
          </g>

          {/* Botella 3: Licor / Whisky en decantador */}
          <g transform="translate(100, 62)">
            <rect x="11" y="0" width="10" height="9" rx="1.5" fill={cream.highlight} stroke={amber.primary} strokeWidth="1" />
            <path
              d="M 6 15 H 26 L 30 25 V 63 H 2 V 25 Z"
              fill={cream.base}
              stroke="url(#storefront-amber-grad)"
              strokeWidth={medium}
              strokeLinejoin="round"
            />
            <path d="M 16 28 L 24 40 L 16 52 L 8 40 Z" stroke={amber.primary} strokeWidth="0.8" fill={cream.soft} fillOpacity="0.5" />
          </g>

          {/* Botella 4: Ginebra Botánica Esmeralda */}
          <g transform="translate(142, 52)">
            <path
              d="M 12 0 H 18 V 18 L 22 28 V 73 H 8 V 28 L 12 18 Z"
              fill="#F0FDFA"
              stroke={accents.emeraldGin}
              strokeWidth={medium}
              strokeLinejoin="round"
            />
            <rect x="11" y="38" width="8" height="24" rx="1.5" fill="#FFFFFF" stroke={accents.emeraldGin} strokeWidth="0.75" />
            <circle cx="15" cy="48" r="2.5" stroke={accents.emeraldGin} strokeWidth="0.75" fill="none" />
          </g>

          {/* Copa de degustación en el estante */}
          <g transform="translate(165, 96)">
            <path
              d="M 4 0 Q 4 18 12 24 V 29 H 6 V 31 H 18 V 29 H 12 V 24 Q 20 18 20 0"
              stroke={slate.steel}
              strokeWidth={regular}
              strokeLinecap="round"
              fill="none"
            />
            <path d="M 6 8 Q 6 18 12 20 Q 18 18 18 8" fill="url(#storefront-bottle-liquid)" stroke={amber.primary} strokeWidth="0.75" />
          </g>

          {/* Panel de madera inferior de la vitrina (Zócalo) */}
          <rect
            x="0"
            y="148"
            width="200"
            height="32"
            fill={slate.surface}
            stroke={wood.oak}
            strokeWidth={thick}
          />
          <rect
            x="12"
            y="154"
            width="80"
            height="20"
            rx="2"
            fill={cream.base}
            stroke={slate.border}
            strokeWidth="1"
          />
          <rect
            x="108"
            y="154"
            width="80"
            height="20"
            rx="2"
            fill={cream.base}
            stroke={slate.border}
            strokeWidth="1"
          />

          {/* Reflejos diagonales de luz sobre el cristal */}
          <line x1="25" y1="12" x2="12" y2="40" stroke="#FFFFFF" strokeWidth={thick} strokeLinecap="round" strokeOpacity="0.8" />
          <line x1="50" y1="12" x2="16" y2="90" stroke="#FFFFFF" strokeWidth={thick} strokeLinecap="round" strokeOpacity="0.8" />
        </g>

        {/* ========================================================================= */}
        {/* PUERTA DE ENTRADA BOUTIQUE (Derecha)                                      */}
        {/* ========================================================================= */}
        <g id="store-door" transform="translate(275, 115)">
          {/* Marco exterior de la puerta */}
          <rect
            x="0"
            y="0"
            width="125"
            height="195"
            rx="4"
            fill={slate.surface}
            stroke={wood.oak}
            strokeWidth={thick}
          />

          {/* Dintel / Tragalluz superior (Transom Window) */}
          <rect
            x="10"
            y="10"
            width="105"
            height="36"
            rx="2"
            fill="#FFFFFF"
            stroke={slate.border}
            strokeWidth={regular}
          />
          <line x1="62" y1="10" x2="62" y2="46" stroke={slate.border} strokeWidth={regular} />
          <path d="M 36 10 Q 62 30 88 10" stroke={slate.border} strokeWidth={regular} fill="none" />

          {/* Hoja principal de la puerta */}
          <rect
            x="10"
            y="52"
            width="105"
            height="143"
            rx="3"
            fill={cream.base}
            stroke={wood.oak}
            strokeWidth={medium}
          />

          {/* Ventana de la puerta con cristal */}
          <rect
            x="20"
            y="62"
            width="85"
            height="65"
            rx="2"
            fill="#FFFFFF"
            stroke={slate.border}
            strokeWidth={regular}
          />
          <line x1="62" y1="62" x2="62" y2="127" stroke={slate.border} strokeWidth={regular} />
          <line x1="20" y1="94" x2="105" y2="94" stroke={slate.border} strokeWidth={regular} />

          {/* Letrero colgante en la puerta "OPEN" */}
          <line x1="50" y1="74" x2="62" y2="68" stroke={amber.primary} strokeWidth="0.8" />
          <line x1="74" y1="74" x2="62" y2="68" stroke={amber.primary} strokeWidth="0.8" />
          <rect
            x="44"
            y="74"
            width="36"
            height="16"
            rx="3"
            fill={cream.highlight}
            stroke={amber.primary}
            strokeWidth={regular}
          />
          <text
            x="62"
            y="85"
            fill={wood.oak}
            fontSize="6.5"
            fontWeight="800"
            letterSpacing="1"
            textAnchor="middle"
            fontFamily="sans-serif"
          >
            OPEN
          </text>

          {/* Manija de latón dorado / pomo elegante */}
          <rect x="18" y="132" width="6" height="22" rx="2" fill={amber.bright} stroke={wood.oak} strokeWidth="1" />
          <circle cx="21" cy="137" r="2.5" fill={cream.highlight} />
          <circle cx="21" cy="148" r="1.5" fill={wood.deep} />

          {/* Tableros de madera tallada inferiores de la puerta */}
          <rect
            x="28"
            y="135"
            width="75"
            height="26"
            rx="2"
            fill={slate.surface}
            stroke={slate.border}
            strokeWidth={regular}
          />
          <rect
            x="28"
            y="166"
            width="75"
            height="22"
            rx="2"
            fill={slate.surface}
            stroke={slate.border}
            strokeWidth={regular}
          />

          {/* Umbral / Escalón de la entrada */}
          <rect
            x="-4"
            y="190"
            width="133"
            height="6"
            rx="2"
            fill={wood.oak}
            stroke={wood.warm}
            strokeWidth={regular}
          />
        </g>

      
        <g id="entrance-planter" transform="translate(408, 252)">
          {/* Mini barrica / maceta de roble */}
          <path
            d="M 4 58 C 0 45 0 20 4 6 C 8 4 28 4 32 6 C 36 20 36 45 32 58 Z"
            fill={cream.base}
            stroke={wood.oak}
            strokeWidth={regular}
          />
          <path d="M 2 20 C 10 18 26 18 34 20" stroke={amber.primary} strokeWidth={medium} fill="none" />
          <path d="M 2 44 C 10 46 26 46 34 44" stroke={amber.primary} strokeWidth={medium} fill="none" />

          {/* Hojas verdes / planta ornamental de boutique */}
          <path
            d="M 18 6 Q 10 -8 4 -2 Q 10 2 18 6"
            fill="#ECFDF5"
            stroke={accents.emeraldGin}
            strokeWidth={regular}
          />
          <path
            d="M 18 6 Q 26 -10 32 -4 Q 26 2 18 6"
            fill="#ECFDF5"
            stroke={accents.emeraldGin}
            strokeWidth={regular}
          />
          <path
            d="M 18 6 Q 18 -14 18 -6"
            stroke={accents.emeraldGin}
            strokeWidth={regular}
          />
        </g>

      
        <g fill={amber.gold} stroke="none">
          <path d="M 380 30 Q 380 35 385 35 Q 380 35 380 40 Q 380 35 375 35 Q 380 35 380 30 Z" />
          <path d="M 90 28 Q 90 32 94 32 Q 90 32 90 36 Q 90 32 86 32 Q 90 32 90 28 Z" opacity="0.8" />
          <circle cx="430" cy="95" r="1.5" opacity="0.7" />
          <circle cx="35" cy="40" r="1.5" opacity="0.6" />
          <circle cx="280" cy="15" r="1" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
}
