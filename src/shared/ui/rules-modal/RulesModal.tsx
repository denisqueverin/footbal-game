import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';

import { RULES_SLIDES } from './rules-modal.constants';

export interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

function stopPanelPointerPropagation(event: MouseEvent<HTMLDivElement>): void {
  event.stopPropagation();
}

export function RulesModal(props: RulesModalProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const slideCount = RULES_SLIDES.length;

  const updateIndexFromScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el || el.clientWidth === 0) {
      return;
    }
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.min(Math.max(0, idx), slideCount - 1));
  }, [slideCount]);

  useEffect(() => {
    if (!props.open) {
      return;
    }
    const el = viewportRef.current;
    if (!el) {
      return;
    }
    el.scrollTo({ left: 0 });
    setActiveIndex(0);
  }, [props.open]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) {
      return;
    }
    el.addEventListener('scroll', updateIndexFromScroll, { passive: true });
    return () => el.removeEventListener('scroll', updateIndexFromScroll);
  }, [updateIndexFromScroll, props.open]);

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

  const goTo = useCallback(
    (index: number) => {
      const el = viewportRef.current;
      if (!el) {
        return;
      }
      const clamped = Math.min(Math.max(0, index), slideCount - 1);
      el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
    },
    [slideCount],
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  if (!props.open) {
    return null;
  }

  return (
    <div className="round-modal-backdrop" role="presentation" onClick={props.onClose}>
      <div
        className="rules-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rules-modal-title"
        onClick={stopPanelPointerPropagation}
      >
        <button type="button" className="round-modal-close" aria-label="Закрыть" onClick={props.onClose}>
          ×
        </button>
        <div className="rules-modal-head">
          <h2 id="rules-modal-title" className="rules-modal-title">
            Правила игры
          </h2>
          <p className="rules-modal-hint">Листайте влево-вправо или используйте стрелки</p>
        </div>

        <div className="rules-carousel-wrap">
          <button
            type="button"
            className="rules-carousel-arrow rules-carousel-arrow--prev"
            aria-label="Предыдущий слайд"
            disabled={activeIndex <= 0}
            onClick={goPrev}
          >
            ‹
          </button>
          <div ref={viewportRef} className="rules-carousel-viewport">
            {RULES_SLIDES.map((slide, i) => (
              <section key={slide.title} className="rules-carousel-slide" aria-label={`Слайд ${i + 1} из ${slideCount}`}>
                <h3 className="rules-slide-heading">{slide.title}</h3>
                <div className="rules-slide-body">{slide.content}</div>
              </section>
            ))}
          </div>
          <button
            type="button"
            className="rules-carousel-arrow rules-carousel-arrow--next"
            aria-label="Следующий слайд"
            disabled={activeIndex >= slideCount - 1}
            onClick={goNext}
          >
            ›
          </button>
        </div>

        <div className="rules-carousel-dots" role="tablist" aria-label="Слайды правил">
          {RULES_SLIDES.map((slide, i) => (
            <button
              key={slide.title}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              className={`rules-carousel-dot ${i === activeIndex ? 'rules-carousel-dot--active' : ''}`}
              aria-label={`${slide.title}, слайд ${i + 1}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <div className="rules-carousel-counter" aria-live="polite">
          {activeIndex + 1} / {slideCount}
        </div>
      </div>
    </div>
  );
}
