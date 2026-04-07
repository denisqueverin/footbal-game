import { useEffect, useMemo } from 'react';

import { getLineupSectionForClub } from '@/entities/game/clubBestLineups';
import { isNationalMode } from '@/entities/game/gameMode';
import { getNationalLineupForCountry } from '@/entities/game/nationalBestLineups';
import { getClubFlagUrl } from '@/entities/game/clubCountries';
import type { GameMode } from '@/entities/game/types';
import { getCountryFlagUrlRu } from '@/entities/game/topCountries';

export interface BestLineupModalProps {
  open: boolean;
  onClose: () => void;
  mode: GameMode;
  /** Текущий клуб или страна раунда (state.currentCountry). */
  currentSource: string | null;
  /** Показывать скамейку запасных (настройка из главного меню). */
  includeBench: boolean;
}

const RUSSIA_RU = 'Россия';

export function BestLineupModal(props: BestLineupModalProps) {
  const clubSection = useMemo(
    () => (props.mode === 'clubs' ? getLineupSectionForClub(props.currentSource) : null),
    [props.mode, props.currentSource],
  );

  const nationalSection = useMemo(
    () => (isNationalMode(props.mode) ? getNationalLineupForCountry(props.currentSource) : null),
    [props.mode, props.currentSource],
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

  const isClubs = props.mode === 'clubs';
  const isNational = isNationalMode(props.mode);
  const isRussiaRound =
    isNational && props.currentSource != null && props.currentSource.trim() === RUSSIA_RU;

  const clubFlagUrl =
    isClubs && clubSection != null ? getClubFlagUrl(clubSection.club) : null;
  const nationalFlagUrl =
    isNational && nationalSection != null ? getCountryFlagUrlRu(nationalSection.countryRu) : null;

  const clubTitle =
    clubSection != null
      ? clubSection.titleRu != null && clubSection.titleRu.length > 0
        ? `${clubSection.club} (${clubSection.titleRu})`
        : clubSection.club
      : '';

  const subHint =
    props.mode === 'clubs'
      ? props.includeBench
        ? 'Подсказка по клубу текущего раунда (старт и запас)'
        : 'Подсказка по клубу текущего раунда (только стартовый состав)'
      : props.includeBench
        ? 'Подсказка по сборной текущего раунда (старт и запас)'
        : 'Подсказка по сборной текущего раунда (только стартовый состав)';

  const russiaFlagUrl = getCountryFlagUrlRu(RUSSIA_RU);

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
          {isClubs && clubSection == null ? (
            <p className="best-lineup-empty">Сейчас нет клуба для раунда — подсказка недоступна.</p>
          ) : null}

          {isNational && nationalSection == null ? (
            <p className="best-lineup-empty">Сейчас нет страны для раунда — подсказка недоступна.</p>
          ) : null}

          {isClubs && clubSection != null ? (
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
                    {clubSection.start.map((line, index) => {
                      if (!line.ru.trim() && !line.en.trim()) {
                        return null;
                      }
                      const name = line.en.trim().length > 0 ? `${line.ru} (${line.en})` : line.ru;
                      return (
                        <li key={`${clubSection.club}-s-${index}`} className="best-lineup-li">
                          <span className="best-lineup-role">{line.role}</span>
                          <span className="best-lineup-name">{name}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <h4 className="best-lineup-group-title">Запас</h4>
                  <ul className="best-lineup-list">
                    {clubSection.bench.map((line, index) => {
                      if (!line.ru.trim() && !line.en.trim()) {
                        return null;
                      }
                      const name = line.en.trim().length > 0 ? `${line.ru} (${line.en})` : line.ru;
                      return (
                        <li key={`${clubSection.club}-b-${index}`} className="best-lineup-li">
                          <span className="best-lineup-role">{line.role}</span>
                          <span className="best-lineup-name">{name}</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <ul className="best-lineup-list">
                  {clubSection.start.map((line, index) => {
                    if (!line.ru.trim() && !line.en.trim()) {
                      return null;
                    }
                    const name = line.en.trim().length > 0 ? `${line.ru} (${line.en})` : line.ru;
                    return (
                      <li key={`${clubSection.club}-s-${index}`} className="best-lineup-li">
                        <span className="best-lineup-role">{line.role}</span>
                        <span className="best-lineup-name">{name}</span>
                      </li>
                    );
                  })}
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
                    {nationalSection.start.map((line, index) => {
                      if (!line.ru.trim() && !line.en.trim()) {
                        return null;
                      }
                      const name = line.en.trim().length > 0 ? `${line.ru} (${line.en})` : line.ru;
                      return (
                        <li key={`${nationalSection.countryRu}-s-${index}`} className="best-lineup-li">
                          <span className="best-lineup-role">{line.role}</span>
                          <span className="best-lineup-name">{name}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <h4 className="best-lineup-group-title">Запас</h4>
                  <ul className="best-lineup-list">
                    {nationalSection.bench.map((line, index) => {
                      if (!line.ru.trim() && !line.en.trim()) {
                        return null;
                      }
                      const name = line.en.trim().length > 0 ? `${line.ru} (${line.en})` : line.ru;
                      return (
                        <li key={`${nationalSection.countryRu}-b-${index}`} className="best-lineup-li">
                          <span className="best-lineup-role">{line.role}</span>
                          <span className="best-lineup-name">{name}</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <ul className="best-lineup-list">
                  {nationalSection.start.map((line, index) => {
                    if (!line.ru.trim() && !line.en.trim()) {
                      return null;
                    }
                    const name = line.en.trim().length > 0 ? `${line.ru} (${line.en})` : line.ru;
                    return (
                      <li key={`${nationalSection.countryRu}-s-${index}`} className="best-lineup-li">
                        <span className="best-lineup-role">{line.role}</span>
                        <span className="best-lineup-name">{name}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
