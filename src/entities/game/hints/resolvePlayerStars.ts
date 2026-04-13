import type { DraftSourceKind, GameMode } from '../core/types';
import { isNationalDraftSource } from '../modes/gameMode';
import type { RandomPlayerCandidate, Top15RandomPlayersByPosition, Top15RandomPosition } from './nationalTop15RandomPlayers';
import { NATIONAL_TOP15_RANDOM_PLAYERS } from './nationalTop15RandomPlayers';
import { NATIONAL_TOP30_RANDOM_PLAYERS } from './nationalTop30RandomPlayers';
import { EURO_CLUBS_PLAYER_STARS, EURO_CLUBS_RANDOM_PLAYERS } from './euroClubsRandomPlayers';
import { RPL_PLAYER_STARS, RPL_RANDOM_PLAYERS } from './rplRandomPlayers';

export type ResolvedPlayerStars = 1 | 2 | 3 | 4 | 5;

function normalizePersonName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/ё/g, 'е');
}

const SLOT_LABEL_TO_POOL: Partial<Record<string, Top15RandomPosition>> = {
  LAM: 'CAM',
  RAM: 'CAM',
  LWB: 'LM',
  RWB: 'RM',
};

function slotLabelToPoolPosition(label: string): Top15RandomPosition {
  const t = label.trim();
  return (SLOT_LABEL_TO_POOL[t] ?? t) as Top15RandomPosition;
}

function starsFromCandidate(item: string | RandomPlayerCandidate): ResolvedPlayerStars {
  return typeof item === 'string' ? 3 : item.stars;
}

function nameFromCandidate(item: string | RandomPlayerCandidate): string {
  return typeof item === 'string' ? item : item.playerName;
}

function resolveInNationalCountryPool(
  countryPool: Top15RandomPlayersByPosition,
  slotLabel: string,
  playerName: string,
): ResolvedPlayerStars | null {
  const needle = normalizePersonName(playerName);
  if (!needle) return null;

  const pos = slotLabelToPoolPosition(slotLabel);
  const exactStars = new Set<ResolvedPlayerStars>();
  const fuzzyPrimary = new Set<ResolvedPlayerStars>();
  const fuzzyAny = new Set<ResolvedPlayerStars>();

  for (const [key, list] of Object.entries(countryPool)) {
    if (!list) continue;
    const onPrimary = key === pos;
    for (const item of list) {
      const nn = normalizePersonName(nameFromCandidate(item));
      const st = starsFromCandidate(item);
      if (nn === needle) {
        exactStars.add(st);
      } else if (needle.length >= 4 && (nn.includes(needle) || needle.includes(nn))) {
        fuzzyAny.add(st);
        if (onPrimary) fuzzyPrimary.add(st);
      }
    }
  }

  if (exactStars.size === 1) return [...exactStars][0]!;
  if (exactStars.size > 1) {
    const arr = [...exactStars];
    return arr.every((s) => s === arr[0]) ? arr[0]! : null;
  }
  if (fuzzyPrimary.size === 1) return [...fuzzyPrimary][0]!;
  if (fuzzyAny.size === 1) return [...fuzzyAny][0]!;
  return null;
}

function nationalPoolsForMode(mode: GameMode, country: string): Top15RandomPlayersByPosition | null {
  if (mode === 'nationalTop15') {
    return NATIONAL_TOP15_RANDOM_PLAYERS[country] ?? null;
  }
  if (mode === 'nationalTop30') {
    return NATIONAL_TOP30_RANDOM_PLAYERS[country] ?? NATIONAL_TOP15_RANDOM_PLAYERS[country] ?? null;
  }
  return NATIONAL_TOP30_RANDOM_PLAYERS[country] ?? NATIONAL_TOP15_RANDOM_PLAYERS[country] ?? null;
}

function matchInStarMap(
  map: Record<string, ResolvedPlayerStars> | undefined,
  needleNorm: string,
): ResolvedPlayerStars | null {
  if (!map) return null;
  for (const [k, stars] of Object.entries(map)) {
    if (normalizePersonName(k) === needleNorm) return stars;
  }
  if (needleNorm.length < 4) return null;
  const fuzz = new Set<ResolvedPlayerStars>();
  for (const [k, stars] of Object.entries(map)) {
    const kn = normalizePersonName(k);
    if (kn.includes(needleNorm) || needleNorm.includes(kn)) fuzz.add(stars);
  }
  return fuzz.size === 1 ? [...fuzz][0]! : null;
}

function resolveClubRpl(
  club: string,
  slotLabel: string,
  playerName: string,
  starMap: Record<string, Record<string, ResolvedPlayerStars>> | undefined,
  randomPool: Record<string, Top15RandomPlayersByPosition> | undefined,
): ResolvedPlayerStars | null {
  const needle = normalizePersonName(playerName);
  if (!needle) return null;
  const fromMap = matchInStarMap(starMap?.[club], needle);
  if (fromMap != null) return fromMap;
  const pool = randomPool?.[club];
  if (!pool) return null;
  return resolveInNationalCountryPool(pool, slotLabel, playerName);
}

/**
 * Сопоставляет введённое имя с пулами режима (сборная/клуб) и возвращает уровень звёзд для окраски карточки.
 */
export function resolvePlayerStarsForDraftedName(args: {
  mode: GameMode;
  draftSourceKind: DraftSourceKind | null;
  sourceLabel: string;
  slotLabel: string;
  playerName: string;
}): ResolvedPlayerStars | null {
  const source = args.sourceLabel.trim();
  const name = args.playerName.trim();
  if (!source || !name) return null;

  if (isNationalDraftSource(args.mode, args.draftSourceKind)) {
    const pool = nationalPoolsForMode(args.mode, source);
    if (!pool) return null;
    return resolveInNationalCountryPool(pool, args.slotLabel, name);
  }

  if (args.mode === 'rpl' || (args.mode === 'chaos' && args.draftSourceKind === 'rplClub')) {
    return resolveClubRpl(source, args.slotLabel, name, RPL_PLAYER_STARS, RPL_RANDOM_PLAYERS);
  }

  if (args.mode === 'clubs' || (args.mode === 'chaos' && args.draftSourceKind === 'club')) {
    return resolveClubRpl(source, args.slotLabel, name, EURO_CLUBS_PLAYER_STARS, EURO_CLUBS_RANDOM_PLAYERS);
  }

  return null;
}
