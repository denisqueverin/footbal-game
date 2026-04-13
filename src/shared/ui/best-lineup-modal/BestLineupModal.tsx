import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getLineupSectionForClub } from '@/entities/game/lineups/clubBestLineups';
import type { BestLineupLine } from '@/entities/game/lineups/bestLineupTypes';
import { isChaosMode, isClubsMode, isNationalMode } from '@/entities/game/modes/gameMode';
import { getNationalLineupForCountry } from '@/entities/game/lineups/nationalBestLineups';
import { getClubFlagUrl } from '@/entities/game/data/clubCountries';
import type { DraftSourceKind, GameMode } from '@/entities/game/core/types';
import { getCountryFlagUrlRu } from '@/entities/game/data/topCountries';

function lineupDisplayName(line: BestLineupLine): string {
  if (!line.ru.trim() && !line.en.trim()) return '';
  return line.en.trim().length > 0 ? `${line.ru} (${line.en})` : line.ru;
}

/** Текст для ввода в драфт: русское имя и фамилия, иначе латиница из данных. */
function lineupCopyText(line: BestLineupLine): string {
  return line.ru.trim() || line.en.trim();
}

export interface BestLineupModalProps {
  open: boolean;
  onClose: () => void;
  mode: GameMode;
  /** Текущий клуб или страна раунда (state.currentCountry). */
  currentSource: string | null;
  /** Режим «Хаос»: тип источника раунда. */
  currentDraftSourceKind?: DraftSourceKind | null;
  /** Показывать скамейку запасных (настройка из главного меню). */
  includeBench: boolean;
}

const RUSSIA_RU = 'Россия';

const COPY_OK_MS = 1600;

export function BestLineupModal(props: BestLineupModalProps) {
  const [copiedRowKey, setCopiedRowKey] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  const handleCopyPlayerName = useCallback(async (rowKey: string, text: string) => {
    if (!text) return;
    if (copyTimerRef.current != null) {
      window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        return;
      }
    }
    setCopiedRowKey(rowKey);
    copyTimerRef.current = window.setTimeout(() => {
      copyTimerRef.current = null;
      setCopiedRowKey(null);
    }, COPY_OK_MS);
  }, []);

  const clubSection = useMemo(() => {
    if (isChaosMode(props.mode)) {
      const k = props.currentDraftSourceKind ?? null;
      if (k === 'club') return getLineupSectionForClub(props.currentSource, 'clubs');
      if (k === 'rplClub') return getLineupSectionForClub(props.currentSource, 'rpl');
      return null;
    }
    return isClubsMode(props.mode) ? getLineupSectionForClub(props.currentSource, props.mode) : null;
  }, [props.mode, props.currentSource, props.currentDraftSourceKind]);

  const nationalSection = useMemo(() => {
    if (isChaosMode(props.mode) && props.currentDraftSourceKind === 'national') {
      return getNationalLineupForCountry(props.currentSource);
    }
    return isNationalMode(props.mode) ? getNationalLineupForCountry(props.currentSource) : null;
  }, [props.mode, props.currentSource, props.currentDraftSourceKind]);

  useEffect(() => {
    if (!props.open) {
      setCopiedRowKey(null);
      if (copyTimerRef.current != null) {
        window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    }
  }, [props.open]);

  useEffect(
    () => () => {
      if (copyTimerRef.current != null) {
        window.clearTimeout(copyTimerRef.current);
        copyTimerRef.current = null;
      }
    },
    [],
  );

  useEffect(() => {
    if (!props.open) {
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [props.open]);

  useEffect(() => {
    if (!props.open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        props.onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [props.open, props.onClose]);

  if (!props.open) {
    return null;
  }

  const isClubRound =
    isClubsMode(props.mode) ||
    (isChaosMode(props.mode) &&
      (props.currentDraftSourceKind === 'club' || props.currentDraftSourceKind === 'rplClub'));
  const isNational =
    isNationalMode(props.mode) ||
    (isChaosMode(props.mode) && props.currentDraftSourceKind === 'national');
  const isRussiaRound =
    isNational && props.currentSource != null && props.currentSource.trim() === RUSSIA_RU;

  const clubFlagUrl =
    isClubRound && clubSection != null ? getClubFlagUrl(clubSection.club) : null;
  const nationalFlagUrl =
    isNational && nationalSection != null ? getCountryFlagUrlRu(nationalSection.countryRu) : null;

  const clubTitle =
    clubSection != null
      ? clubSection.titleRu != null && clubSection.titleRu.length > 0
        ? `${clubSection.club} (${clubSection.titleRu})`
        : clubSection.club
      : '';

  const subHint = isChaosMode(props.mode)
    ? props.includeBench
      ? 'Подсказка по клубу или сборной текущего раунда (старт и запас)'
      : 'Подсказка по клубу или сборной текущего раунда (только стартовый состав)'
    : isClubsMode(props.mode)
      ? props.includeBench
        ? 'Подсказка по клубу текущего раунда (старт и запас)'
        : 'Подсказка по клубу текущего раунда (только стартовый состав)'
      : props.includeBench
        ? 'Подсказка по сборной текущего раунда (старт и запас)'
        : 'Подсказка по сборной текущего раунда (только стартовый состав)';

  const russiaFlagUrl = getCountryFlagUrlRu(RUSSIA_RU);

  const renderLineupLine = (line: BestLineupLine, rowKey: string) => {
    if (!line.ru.trim() && !line.en.trim()) {
      return null;
    }
    const display = lineupDisplayName(line);
    const text = lineupCopyText(line);
    return (
      <li key={rowKey} className="best-lineup-li">
        <span className="best-lineup-role">{line.role}</span>
        <span className="best-lineup-name">{display}</span>
        <button
          type="button"
          className="best-lineup-copy-btn"
          onClick={() => void handleCopyPlayerName(rowKey, text)}
          aria-label={`Скопировать имя и фамилию: ${text}`}
        >
          {copiedRowKey === rowKey ? 'Скопировано' : 'Копировать'}
        </button>
      </li>
    );
  };

  return (
    <div className="round-modal-backdrop" role="presentation" onClick={props.onClose}>
      <div
        className="best-lineup-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="best-lineup-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="round-modal-close" aria-label="Закрыть" onClick={props.onClose}>
          ×
        </button>
        <div className="best-lineup-modal-head">
          <h2 id="best-lineup-modal-title" className="best-lineup-modal-title">
            Лучший состав
          </h2>
          <p className="best-lineup-modal-sub">{subHint}</p>
        </div>
        <div className="best-lineup-modal-scroll">
          {isClubRound && clubSection == null ? (
            <p className="best-lineup-empty">Сейчас нет клуба для раунда — подсказка недоступна.</p>
          ) : null}

          {isNational && nationalSection == null ? (
            <p className="best-lineup-empty">Сейчас нет страны для раунда — подсказка недоступна.</p>
          ) : null}

          {isClubRound && clubSection != null ? (
            <section className="best-lineup-club best-lineup-club--single">
              <div className="best-lineup-club-head">
                {clubFlagUrl ? (
                  <img
                    className="best-lineup-club-flag"
                    src={clubFlagUrl}
                    alt=""
                    width={36}
                    height={24}
                    loading="lazy"
                  />
                ) : null}
                <h3 className="best-lineup-club-title">{clubTitle}</h3>
              </div>
              {clubSection.start.length === 0 &&
              (props.includeBench ? clubSection.bench.length === 0 : true) ? (
                <p className="best-lineup-empty">Нет данных для этого клуба.</p>
              ) : props.includeBench ? (
                <>
                  <h4 className="best-lineup-group-title">Старт</h4>
                  <ul className="best-lineup-list">
                    {clubSection.start.map((line, index) =>
                      renderLineupLine(line, `${clubSection.club}-s-${index}`),
                    )}
                  </ul>
                  <h4 className="best-lineup-group-title">Запас</h4>
                  <ul className="best-lineup-list">
                    {clubSection.bench.map((line, index) =>
                      renderLineupLine(line, `${clubSection.club}-b-${index}`),
                    )}
                  </ul>
                </>
              ) : (
                <ul className="best-lineup-list">
                  {clubSection.start.map((line, index) =>
                    renderLineupLine(line, `${clubSection.club}-s-${index}`),
                  )}
                </ul>
              )}
            </section>
          ) : null}

          {isRussiaRound ? (
            <section className="best-lineup-club best-lineup-club--single">
              <div className="best-lineup-club-head">
                {russiaFlagUrl ? (
                  <img
                    className="best-lineup-club-flag"
                    src={russiaFlagUrl}
                    alt=""
                    width={36}
                    height={24}
                    loading="lazy"
                  />
                ) : null}
                <h3 className="best-lineup-club-title">{RUSSIA_RU}</h3>
              </div>
              <p className="best-lineup-russia-egg">Такие вещи знать надо, стыдно должно быть...</p>
            </section>
          ) : null}

          {isNational && nationalSection != null && !isRussiaRound ? (
            <section className="best-lineup-club best-lineup-club--single">
              <div className="best-lineup-club-head">
                {nationalFlagUrl ? (
                  <img
                    className="best-lineup-club-flag"
                    src={nationalFlagUrl}
                    alt=""
                    width={36}
                    height={24}
                    loading="lazy"
                  />
                ) : null}
                <h3 className="best-lineup-club-title">{nationalSection.countryRu}</h3>
              </div>
              {nationalSection.start.length === 0 &&
              (props.includeBench ? nationalSection.bench.length === 0 : true) ? (
                <p className="best-lineup-empty">Нет данных для этой сборной.</p>
              ) : props.includeBench ? (
                <>
                  <h4 className="best-lineup-group-title">Старт</h4>
                  <ul className="best-lineup-list">
                    {nationalSection.start.map((line, index) =>
                      renderLineupLine(line, `${nationalSection.countryRu}-s-${index}`),
                    )}
                  </ul>
                  <h4 className="best-lineup-group-title">Запас</h4>
                  <ul className="best-lineup-list">
                    {nationalSection.bench.map((line, index) =>
                      renderLineupLine(line, `${nationalSection.countryRu}-b-${index}`),
                    )}
                  </ul>
                </>
              ) : (
                <ul className="best-lineup-list">
                  {nationalSection.start.map((line, index) =>
                    renderLineupLine(line, `${nationalSection.countryRu}-s-${index}`),
                  )}
                </ul>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
