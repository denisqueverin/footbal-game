import type { ReactNode } from 'react';

export interface RulesSlide {
  title: string;
  content: ReactNode;
}

export const RULES_SLIDES: RulesSlide[] = [
  {
    title: '1–3. Режимы, схема и очерёдность',
    content: (
      <>
        <div className="rules-slide-block">
          <div className="rules-slide-block-title">1. Режимы</div>
          <ul>
            <li>Сборные ТОП-15 или ТОП-30 (разные пулы стран)</li>
            <li>Клубы (топ европейских клубов)</li>
            <li>РПЛ (российские клубы)</li>
            <li>Хаос (сборные ТОП-30, топ европейских клубов и клубы РПЛ в одном пуле)</li>
          </ul>
        </div>
        <div className="rules-slide-block">
          <div className="rules-slide-block-title">2. Схема</div>
          <p>
            Выберите тактическую схему (1-4-4-2, 1-4-3-3, 1-3-5-2 и т.д.). Фиксируется до драфта.
          </p>
        </div>
        <div className="rules-slide-block">
          <div className="rules-slide-block-title">3. Очерёдность</div>
          <p>Цуефа / монетка. Победитель начинает первый раунд.</p>
        </div>
      </>
    ),
  },
  {
    title: '4. Драфт (11 раундов)',
    content: (
      <>
        <div className="rules-slide-block">
          <p className="rules-slide-lead">Каждый раунд:</p>
          <ul>
            <li>Случайно выпадает клуб/сборная.</li>
            <li>
              Игрок по очереди выбирает футболиста из этого клуба/сборной и назначает ему свободную позицию в своей
              схеме.
            </li>
            <li>Второй игрок выбирает другого футболиста из того же клуба/сборной на любую свободную позицию.</li>
          </ul>
        </div>
        <div className="rules-slide-block">
          <p className="rules-slide-lead">Ограничения:</p>
          <ul>
            <li>В одной команде — максимум 1 игрок из одного клуба/сборной.</li>
            <li>Каждый клуб/сборная используются только в одном раунде (два игрока — по одному в каждую команду).</li>
            <li>Нельзя повторно выбирать уже выбранного игрока.</li>
          </ul>
        </div>
      </>
    ),
  },
  {
    title: '5–6. Симуляция и победитель',
    content: (
      <>
        <div className="rules-slide-block">
          <div className="rules-slide-block-title">5. Симуляция чемпионата</div>
          <p>После драфта отправьте в DeepSeek промт:</p>
          <blockquote className="rules-slide-quote">
            «Просимулируй 100 матчей (50 дома, 50 в гостях) между командами. Все игроки в прайме. Учитывай тактические
            роли. Предоставь: итоговую таблицу (В/Н/П, разница мячей), лучших и худших игроков, бомбардиров, ассистентов,
            дисциплину (ЖК/КК), анализ причин победы и поражения.»
          </blockquote>
        </div>
        <div className="rules-slide-block">
          <div className="rules-slide-block-title">6. Победитель</div>
          <p>Команда с большим числом побед. При равенстве — разница мячей, затем личные встречи.</p>
        </div>
      </>
    ),
  },
];
