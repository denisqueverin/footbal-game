import { useId } from 'react';

import type { ColorSchemeId } from '@/entities/game/core/types';

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface KitSchemeIconProps {
  schemeId: ColorSchemeId;
  className?: string;
}

/** Миниатюра формы: майка + шорты (без текста). */
export function KitSchemeIcon(props: KitSchemeIconProps) {
  const rid = useId().replace(/:/g, '');

  const shirt = 'M6 12 L10 8 L22 8 L26 12 L26 24 L6 24 Z';

  switch (props.schemeId) {
    case 'kitRedWhite':
      return (
        <svg
          className={cn('kit-scheme-icon', props.className)}
          viewBox="0 0 32 40"
          width={28}
          height={35}
          aria-hidden
        >
          <defs>
            <pattern id={`${rid}-rw`} patternUnits="userSpaceOnUse" width="4" height="24" x="0" y="8">
              <rect width="2" height="24" fill="#c8102e" />
              <rect x="2" width="2" height="24" fill="#f4f4f4" />
            </pattern>
          </defs>
          <path d={shirt} fill={`url(#${rid}-rw)`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#f4f4f4" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
        </svg>
      );

    case 'kitBlueWhite':
      return (
        <svg
          className={cn('kit-scheme-icon', props.className)}
          viewBox="0 0 32 40"
          width={28}
          height={35}
          aria-hidden
        >
          <path d={shirt} fill="#1e4d8b" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#f4f4f4" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
        </svg>
      );

    case 'kitMilan':
      return (
        <svg
          className={cn('kit-scheme-icon', props.className)}
          viewBox="0 0 32 40"
          width={28}
          height={35}
          aria-hidden
        >
          <defs>
            <pattern id={`${rid}-milan`} patternUnits="userSpaceOnUse" width="3" height="24" x="0" y="8">
              <rect width="1.5" height="24" fill="#c8102e" />
              <rect x="1.5" width="1.5" height="24" fill="#111111" />
            </pattern>
          </defs>
          <path d={shirt} fill={`url(#${rid}-milan)`} stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#111111" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
        </svg>
      );

    case 'kitJuventus':
      return (
        <svg
          className={cn('kit-scheme-icon', props.className)}
          viewBox="0 0 32 40"
          width={28}
          height={35}
          aria-hidden
        >
          <defs>
            <pattern id={`${rid}-juv`} patternUnits="userSpaceOnUse" width="3" height="24" x="0" y="8">
              <rect width="1.5" height="24" fill="#ffffff" />
              <rect x="1.5" width="1.5" height="24" fill="#1a1a1a" />
            </pattern>
          </defs>
          <path d={shirt} fill={`url(#${rid}-juv)`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#f4f4f4" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
        </svg>
      );

    case 'kitBarcelona':
      return (
        <svg
          className={cn('kit-scheme-icon', props.className)}
          viewBox="0 0 32 40"
          width={28}
          height={35}
          aria-hidden
        >
          <defs>
            <pattern id={`${rid}-fcb`} patternUnits="userSpaceOnUse" width="6" height="24" x="0" y="8">
              <rect width="3" height="24" fill="#004d98" />
              <rect x="3" width="3" height="24" fill="#a50044" />
            </pattern>
          </defs>
          <path d={shirt} fill={`url(#${rid}-fcb)`} stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#004d98" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
        </svg>
      );

    case 'kitRealMadrid':
      return (
        <svg className={cn('kit-scheme-icon', props.className)} viewBox="0 0 32 40" width={28} height={35} aria-hidden>
          <path d={shirt} fill="#f6f6fa" stroke="rgba(0,0,0,0.22)" strokeWidth="0.6" />
          <path d="M14 10 L18 10 L17 14 L15 14 Z" fill="#d4af37" opacity="0.95" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#f0f0f5" stroke="rgba(212,175,55,0.5)" strokeWidth="0.6" />
        </svg>
      );

    case 'kitLiverpool':
      return (
        <svg className={cn('kit-scheme-icon', props.className)} viewBox="0 0 32 40" width={28} height={35} aria-hidden>
          <path d={shirt} fill="#c8102e" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#8b0a1f" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
        </svg>
      );

    case 'kitBrazil':
      return (
        <svg className={cn('kit-scheme-icon', props.className)} viewBox="0 0 32 40" width={28} height={35} aria-hidden>
          <path d={shirt} fill="#f7d020" stroke="rgba(0,0,0,0.22)" strokeWidth="0.5" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#003c8c" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
        </svg>
      );

    case 'kitNetherlands':
      return (
        <svg className={cn('kit-scheme-icon', props.className)} viewBox="0 0 32 40" width={28} height={35} aria-hidden>
          <path d={shirt} fill="#ff6b0a" stroke="rgba(0,0,0,0.22)" strokeWidth="0.5" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#e85a00" stroke="rgba(0,0,0,0.22)" strokeWidth="0.5" />
        </svg>
      );

    case 'kitPSG':
      return (
        <svg className={cn('kit-scheme-icon', props.className)} viewBox="0 0 32 40" width={28} height={35} aria-hidden>
          <path d={shirt} fill="#0c1a5c" stroke="rgba(0,0,0,0.3)" strokeWidth="0.5" />
          <path d="M14 8 L18 8 L18 24 L14 24 Z" fill="#e30613" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#0c1a5c" stroke="rgba(227,6,19,0.35)" strokeWidth="0.5" />
        </svg>
      );

    case 'kitArsenalCherry':
      return (
        <svg className={cn('kit-scheme-icon', props.className)} viewBox="0 0 32 40" width={28} height={35} aria-hidden>
          <defs>
            <linearGradient id={`${rid}-arsch`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b1e32" />
              <stop offset="100%" stopColor="#5c0f1f" />
            </linearGradient>
          </defs>
          <path d={shirt} fill={`url(#${rid}-arsch)`} stroke="rgba(255,255,255,0.14)" strokeWidth="0.5" />
          <path d="M10 9 L22 9 L21 12 L11 12 Z" fill="#f4f4f4" opacity="0.92" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#f4f4f4" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
        </svg>
      );

    case 'kitLokomotiv':
      return (
        <svg className={cn('kit-scheme-icon', props.className)} viewBox="0 0 32 40" width={28} height={35} aria-hidden>
          <defs>
            <linearGradient id={`${rid}-loko`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#d20a11" />
              <stop offset="52%" stopColor="#d20a11" />
              <stop offset="52%" stopColor="#0d5c2e" />
              <stop offset="100%" stopColor="#0a4a26" />
            </linearGradient>
          </defs>
          <path d={shirt} fill={`url(#${rid}-loko)`} stroke="rgba(0,0,0,0.28)" strokeWidth="0.5" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#0d5c2e" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
        </svg>
      );

    case 'kitSynthwave':
      return (
        <svg className={cn('kit-scheme-icon', props.className)} viewBox="0 0 32 40" width={28} height={35} aria-hidden>
          <defs>
            <linearGradient id={`${rid}-synth`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="45%" stopColor="#db2777" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <path d={shirt} fill={`url(#${rid}-synth)`} stroke="rgba(0,0,0,0.35)" strokeWidth="0.5" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#1e0a2e" stroke="rgba(34,211,238,0.45)" strokeWidth="0.55" />
        </svg>
      );

    case 'kitAcidTech':
      return (
        <svg className={cn('kit-scheme-icon', props.className)} viewBox="0 0 32 40" width={28} height={35} aria-hidden>
          <path d={shirt} fill="#121214" stroke="rgba(200,255,60,0.35)" strokeWidth="0.55" />
          <path d="M13 8 L19 8 L19 24 L13 24 Z" fill="#c8ff2e" opacity="0.95" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#0e0e10" stroke="rgba(200,255,60,0.5)" strokeWidth="0.55" />
        </svg>
      );

    case 'green':
      return (
        <svg className={cn('kit-scheme-icon', props.className)} viewBox="0 0 32 40" width={28} height={35} aria-hidden>
          <path d={shirt} fill="#269150" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#1e6b3d" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
        </svg>
      );

    case 'red':
      return (
        <svg className={cn('kit-scheme-icon', props.className)} viewBox="0 0 32 40" width={28} height={35} aria-hidden>
          <path d={shirt} fill="#be303a" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#8b2229" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
        </svg>
      );

    case 'blue':
      return (
        <svg className={cn('kit-scheme-icon', props.className)} viewBox="0 0 32 40" width={28} height={35} aria-hidden>
          <path d={shirt} fill="#2d5cc8" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
          <path d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z" fill="#244a9e" stroke="rgba(0,0,0,0.2)" strokeWidth="0.5" />
        </svg>
      );

    case 'white':
      return (
        <svg className={cn('kit-scheme-icon', props.className)} viewBox="0 0 32 40" width={28} height={35} aria-hidden>
          <path d={shirt} fill="#f0f0f5" stroke="rgba(0,0,0,0.35)" strokeWidth="0.75" />
          <path
            d="M9 24 L23 24 L24 34 L18 34 L16 28 L14 34 L8 34 Z"
            fill="#d8dae2"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="0.5"
          />
        </svg>
      );
  }
}
