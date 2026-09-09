import React from 'react';

interface LogoProps {
  className?: string;
  inverted?: boolean;
}

/**
 * Official SICDA Logo component matching company branding:
 * S, I, C, A in dark charcoal (#2D323A or white if inverted),
 * D in vivid safety orange, and the dynamic curved orange swoosh underline.
 */
export const SicdaLogo: React.FC<LogoProps> = ({ className = 'h-8 w-auto', inverted = false }) => {
  const mainColor = inverted ? '#FFFFFF' : '#2D323A';
  const orangeGradientId = inverted ? 'sicdaOrangeInv' : 'sicdaOrangeStd';

  return (
    <svg
      viewBox="0 0 540 145"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo SICDA"
    >
      <defs>
        <linearGradient id={orangeGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FF7A00" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>

      {/* S */}
      <path
        d="M 120 44 C 120 44, 48 44, 48 44 C 30 44, 30 70, 48 70 L 104 70 C 122 70, 122 96, 104 96 L 36 96"
        stroke={mainColor}
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* I */}
      <line
        x1="162"
        y1="44"
        x2="162"
        y2="96"
        stroke={mainColor}
        strokeWidth="16"
        strokeLinecap="round"
      />

      {/* C */}
      <path
        d="M 252 44 C 252 44, 202 44, 202 44 C 184 44, 184 96, 202 96 L 252 96"
        stroke={mainColor}
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* D (Vivid Orange) */}
      <path
        d="M 295 44 L 338 44 C 362 44, 362 96, 338 96 L 295 96 Z"
        stroke={`url(#${orangeGradientId})`}
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* A */}
      <path
        d="M 392 96 L 434 44 L 476 96"
        stroke={mainColor}
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="406"
        y1="80"
        x2="462"
        y2="80"
        stroke={mainColor}
        strokeWidth="15"
        strokeLinecap="round"
      />

      {/* Swoosh Underline Curve */}
      <path
        d="M 10 118 Q 260 102 530 134 Q 260 110 10 118 Z"
        fill={`url(#${orangeGradientId})`}
      />
    </svg>
  );
};

/**
 * Official Groupe Hexagonal Monogram Logo (MP / Mutandis / Groupe)
 * with deep blue gradient hexagonal contour and split facet geometry.
 */
export const GroupeLogo: React.FC<LogoProps> = ({ className = 'h-8 w-auto', inverted = false }) => {
  const gradId = inverted ? 'hexBlueInv' : 'hexBlueStd';
  const innerGradId = inverted ? 'innerBlueInv' : 'innerBlueStd';
  const dividerColor = inverted ? '#0F172A' : '#FFFFFF';

  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo Groupe"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284C7" />
          <stop offset="45%" stopColor="#0369A1" />
          <stop offset="100%" stopColor="#0C2340" />
        </linearGradient>
        <linearGradient id={innerGradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#0284C7" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
      </defs>

      {/* Outer Hexagon Border */}
      <polygon
        points="100,10 184,56 184,144 100,190 16,144 16,56"
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="9"
        strokeLinejoin="round"
      />

      {/* Inner Left Facet: Monogram "M" */}
      <g stroke={`url(#${gradId})`} strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 94 28 L 29 63 L 29 137 L 94 172" />
        <line x1="44" y1="76" x2="44" y2="140" strokeWidth="8" stroke={`url(#${gradId})`} />
        <line x1="62" y1="76" x2="62" y2="140" strokeWidth="8" stroke={`url(#${innerGradId})`} />
        <line x1="80" y1="52" x2="80" y2="152" strokeWidth="8" stroke={`url(#${innerGradId})`} />
        <path d="M 44 76 L 80 52" strokeWidth="7" />
      </g>

      {/* Center Vertical Divider Gap */}
      <line x1="100" y1="12" x2="100" y2="188" stroke={dividerColor} strokeWidth="6" />

      {/* Inner Right Facet: Monogram "P" / "D" */}
      <g stroke={`url(#${gradId})`} strokeWidth="7.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 106 28 L 171 63 L 171 137 L 106 172" />
        <line x1="118" y1="50" x2="118" y2="156" strokeWidth="8" stroke={`url(#${innerGradId})`} />
        <path d="M 118 56 L 152 74 L 152 108 L 118 108" strokeWidth="7.5" stroke={`url(#${gradId})`} />
        <path d="M 132 120 L 152 130 L 132 144" strokeWidth="6.5" stroke={`url(#${innerGradId})`} />
      </g>
    </svg>
  );
};

interface DualBrandHeaderProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
  showTagline?: boolean;
}

/**
 * Harmonious Dual-Brand Component displaying both the Groupe Logo and the SICDA Logo
 * with official corporate hierarchy.
 */
export const DualBrandHeader: React.FC<DualBrandHeaderProps> = ({
  className = '',
  size = 'md',
  inverted = false,
  showTagline = true,
}) => {
  const dimensions = {
    sm: { hex: 'h-7 w-7', sicda: 'h-6 w-24', text: 'text-[10px]', sub: 'text-[9px]' },
    md: { hex: 'h-10 w-10', sicda: 'h-8 w-32', text: 'text-xs', sub: 'text-[10px]' },
    lg: { hex: 'h-14 w-14', sicda: 'h-11 w-44', text: 'text-sm', sub: 'text-xs' },
  }[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Groupe Hexagonal Emblem */}
      <div
        className={`shrink-0 flex items-center justify-center rounded-xl p-1 ${
          inverted ? 'bg-slate-800/80 border border-slate-700/60' : 'bg-white shadow-xs border border-slate-200/80'
        }`}
        title="Logo Groupe"
      >
        <GroupeLogo className={dimensions.hex} inverted={inverted} />
      </div>

      {/* Subtle Vertical Divider */}
      <div className={`w-px self-stretch my-1 ${inverted ? 'bg-slate-700' : 'bg-slate-300'}`} />

      {/* SICDA Logo & Typography */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <SicdaLogo className={dimensions.sicda} inverted={inverted} />
        </div>
        {showTagline && (
          <div
            className={`font-semibold tracking-wider uppercase mt-0.5 ${dimensions.sub} ${
              inverted ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Groupe &bull; Direction QHSE
          </div>
        )}
      </div>
    </div>
  );
};
