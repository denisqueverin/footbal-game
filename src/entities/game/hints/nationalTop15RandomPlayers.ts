export type Top15RandomPosition =
  | 'GK'
  | 'RB'
  | 'CB'
  | 'LB'
  | 'CM'
  | 'CDM'
  | 'CAM'
  | 'RM'
  | 'LM'
  | 'RW'
  | 'LW'
  | 'ST'

export type PlayerStars = 1 | 2 | 3 | 4 | 5

export type RandomPlayerCandidate = { playerName: string; stars: PlayerStars }

export type Top15RandomPlayersByPosition = Partial<
  Record<Top15RandomPosition, readonly (string | RandomPlayerCandidate)[]>
>

/**
 * Пул игроков для подсказки «Случайный игрок» в режиме «Сборные ТОП-15».
 * Ключ страны — как в `TOP_15_FOOTBALL_COUNTRIES_RU` (русские названия).
 */
export const NATIONAL_TOP15_RANDOM_PLAYERS: Record<string, Top15RandomPlayersByPosition> = {
  Аргентина: {
    GK: [
      { playerName: 'Мариано Андухар', stars: 2 },
      { playerName: 'Вильфредо Кабальеро', stars: 2 },
      { playerName: 'Науэль Гусман', stars: 2 },
      { playerName: 'Агустин Маркесин', stars: 2 },
      { playerName: 'Серхио Ромеро', stars: 3 },
    ],
    RB: [
      { playerName: 'Клементе Родригес', stars: 2 },
      { playerName: 'Эмилиано Инсуа', stars: 2 },
      { playerName: 'Габриэль Меркадо', stars: 3 },
      { playerName: 'Пабло Сабалета', stars: 3 },
    ],
    CB: [
      { playerName: 'Мартин Демичелис', stars: 3 },
      { playerName: 'Николас Бурдиссо', stars: 3 },
      { playerName: 'Федерико Фасио', stars: 2 },
      { playerName: 'Мартин Касерес', stars: 3 },
      { playerName: 'Николас Отаменди', stars: 4 },
      { playerName: 'Рамиро Фунес Мори', stars: 2 },
      { playerName: 'Вальтер Самуэль', stars: 4 },
    ],
    LB: [
      { playerName: 'Ариэль Гарсе', stars: 1 },
      { playerName: 'Маркос Рохо', stars: 3 },
      { playerName: 'Габриэль Хайнце', stars: 3 },
    ],
    CDM: [
      { playerName: 'Хавьер Маскерано', stars: 5 },
      { playerName: 'Матиас Краневиттер', stars: 2 },
      { playerName: 'Гвидо Писарро', stars: 2 },
    ],
    CM: [
      { playerName: 'Марио Болатти', stars: 2 },
      { playerName: 'Хавьер Пасторе', stars: 4 },
      { playerName: 'Лукас Билья', stars: 3 },
      { playerName: 'Энцо Перес', stars: 3 },
      { playerName: 'Хонас Гутьеррес', stars: 2 },
      { playerName: 'Эстебан Камбьяссо', stars: 4 },
      { playerName: 'Хуан Себастьян Верон', stars: 4 },
    ],
    RM: [{ playerName: 'Макси Родригес', stars: 3 }],
    LM: [
      { playerName: 'Роберто Перейра', stars: 3 },
      { playerName: 'Анхель Ди Мария', stars: 5 },
    ],
    RW: [
      { playerName: 'Лионель Месси', stars: 5 },
      { playerName: 'Эсекьель Лавесси', stars: 4 },
    ],
    LW: [
      { playerName: 'Анхель Корреа', stars: 3 },
      { playerName: 'Карлос Тевес', stars: 4 },
    ],
    ST: [
      { playerName: 'Диего Милито', stars: 4 },
      { playerName: 'Мартин Палермо', stars: 3 },
      { playerName: 'Родриго Паласио', stars: 3 },
      { playerName: 'Херман Денис', stars: 2 },
      { playerName: 'Лукас Пратто', stars: 3 },
      { playerName: 'Гонсало Игуаин', stars: 4 },
      { playerName: 'Серхио Агуэро', stars: 5 },
    ],
  },
  Бразилия: {
    GK: [
      { playerName: 'Диего Алвес', stars: 3 },
      { playerName: 'Виктор', stars: 2 },
      { playerName: 'Нето', stars: 2 },
      { playerName: 'Алиссон', stars: 5 },
      { playerName: 'Кассио', stars: 2 },
      { playerName: 'Жулио Сезар', stars: 4 },
    ],
    RB: [
      { playerName: 'Фабиньо', stars: 3 },
      { playerName: 'Данило', stars: 3 },
      { playerName: 'Дани Алвес', stars: 5 },
    ],
    CB: [
      { playerName: 'Родриго Кайо', stars: 3 },
      { playerName: 'Жемерсон', stars: 2 },
      { playerName: 'Жил', stars: 3 },
      { playerName: 'Давид Луис', stars: 3 },
      { playerName: 'Тиагу Силва', stars: 5 },
      { playerName: 'Маркиньос', stars: 4 },
    ],
    LB: [
      { playerName: 'Дуглас Сантос', stars: 2 },
      { playerName: 'Жорже', stars: 2 },
      { playerName: 'Марсело', stars: 5 },
    ],
    CDM: [
      { playerName: 'Каземиро', stars: 5 },
      { playerName: 'Луис Густаво', stars: 3 },
    ],
    CM: [
      { playerName: 'Лукас Лима', stars: 3 },
      { playerName: 'Уоллес', stars: 2 },
      { playerName: 'Гансо', stars: 4 },
      { playerName: 'Паулиньо', stars: 3 },
      { playerName: 'Оскар', stars: 4 },
    ],
    RM: [{ playerName: 'Дуглас Коста', stars: 4 }],
    LM: [
      { playerName: 'Тайсон', stars: 3 },
      { playerName: 'Неймар', stars: 5 },
    ],
    RW: [
      { playerName: 'Габриэл Барбоса', stars: 3 },
      { playerName: 'Виллиан', stars: 4 },
    ],
    LW: [
      { playerName: 'Тайсон', stars: 3 },
      { playerName: 'Винисиус Жуниор', stars: 5 },
    ],
    ST: [
      { playerName: 'Рикардо Оливейра', stars: 3 },
      { playerName: 'Луис Адриано', stars: 3 },
      { playerName: 'Леандро Дамиан', stars: 3 },
      { playerName: 'Жо', stars: 2 },
      { playerName: 'Фред', stars: 2 },
      { playerName: 'Роналдо', stars: 5 },
      { playerName: 'Роналдиньо', stars: 5 },
    ],
  },
  Франция: {
    GK: [
      { playerName: 'Седрик Каррассо', stars: 2 },
      { playerName: 'Стефан Руффье', stars: 3 },
      { playerName: 'Бенуа Костиль', stars: 2 },
      { playerName: 'Уго Льорис', stars: 4 },
      { playerName: 'Стив Манданда', stars: 3 },
    ],
    RB: [
      { playerName: 'Род Фанни', stars: 2 },
      { playerName: 'Матьё Дебюши', stars: 3 },
      { playerName: 'Бакари Санья', stars: 3 },
    ],
    CB: [
      { playerName: 'Себастьян Скиллачи', stars: 2 },
      { playerName: 'Адиль Рами', stars: 3 },
      { playerName: 'Мамаду Сако', stars: 3 },
      { playerName: 'Лоран Косельни', stars: 4 },
      { playerName: 'Рафаэль Варан', stars: 4 },
      { playerName: 'Вильям Галлас', stars: 3 },
    ],
    LB: [
      { playerName: 'Гаэль Клиши', stars: 3 },
      { playerName: 'Патрис Эвра', stars: 4 },
      { playerName: 'Люка Динь', stars: 3 },
    ],
    CDM: [
      { playerName: "Н'Голо Канте", stars: 5 },
      { playerName: 'Поль Погба', stars: 4 },
    ],
    CM: [
      { playerName: 'Алу Диарра', stars: 2 },
      { playerName: "Янн М'Вила", stars: 3 },
      { playerName: 'Йоанн Гуркюфф', stars: 3 },
      { playerName: 'Жереми Тулалан', stars: 3 },
    ],
    RM: [
      { playerName: 'Сидней Гову', stars: 3 },
      { playerName: 'Килиан Мбаппе', stars: 5 },
    ],
    LM: [
      { playerName: 'Матьё Вальбуэна', stars: 3 },
      { playerName: 'Франк Рибери', stars: 5 },
    ],
    RW: [
      { playerName: 'Сидней Гову', stars: 3 },
      { playerName: 'Усман Дембеле', stars: 4 },
    ],
    LW: [
      { playerName: 'Матьё Вальбуэна', stars: 3 },
      { playerName: 'Килиан Мбаппе', stars: 5 },
    ],
    ST: [
      { playerName: 'Андре-Пьер Жиньяк', stars: 3 },
      { playerName: 'Джибриль Сиссе', stars: 3 },
      { playerName: 'Кевин Гамейро', stars: 3 },
      { playerName: 'Бафетимби Гомис', stars: 3 },
      { playerName: 'Карим Бензема', stars: 5 },
      { playerName: 'Оливье Жиру', stars: 4 },
      { playerName: 'Тьерри Анри', stars: 5 },
    ],
  },
  Испания: {
    GK: [
      { playerName: 'Давид Де Хеа', stars: 4 },
      { playerName: 'Кико Касилья', stars: 2 },
      { playerName: 'Серхио Асенхо', stars: 2 },
      { playerName: 'Диего Лопес', stars: 3 },
      { playerName: 'Пепе Рейна', stars: 3 },
      { playerName: 'Икер Касильяс', stars: 5 },
    ],
    RB: [
      { playerName: 'Сесар Аспиликуэта', stars: 4 },
      { playerName: 'Хуанфран', stars: 3 },
      { playerName: 'Дани Карвахаль', stars: 4 },
    ],
    CB: [
      { playerName: 'Рауль Альбиоль', stars: 3 },
      { playerName: 'Хави Мартинес', stars: 4 },
      { playerName: 'Марк Бартра', stars: 3 },
      { playerName: 'Иньиго Мартинес', stars: 3 },
      { playerName: 'Жерар Пике', stars: 4 },
      { playerName: 'Серхио Рамос', stars: 5 },
    ],
    LB: [
      { playerName: 'Альберто Морено', stars: 3 },
      { playerName: 'Жорди Альба', stars: 4 },
    ],
    CDM: [
      { playerName: 'Серхио Бускетс', stars: 5 },
      { playerName: 'Хаби Алонсо', stars: 4 },
    ],
    CM: [
      { playerName: 'Андер Итурраспе', stars: 2 },
      { playerName: 'Тьяго Алькантара', stars: 4 },
      { playerName: 'Коке', stars: 4 },
      { playerName: 'Хави', stars: 5 },
      { playerName: 'Андрес Иньеста', stars: 5 },
    ],
    RM: [{ playerName: 'Хесус Навас', stars: 3 }],
    LM: [
      { playerName: 'Коке', stars: 4 },
      { playerName: 'Давид Сильва', stars: 5 },
    ],
    RW: [{ playerName: 'Педро Родригес', stars: 4 }],
    LW: [{ playerName: 'Педро Родригес', stars: 4 }],
    ST: [
      { playerName: 'Фернандо Льоренте', stars: 4 },
      { playerName: 'Альваро Негредо', stars: 3 },
      { playerName: 'Роберто Сольдадо', stars: 3 },
      { playerName: 'Пако Алькасер', stars: 3 },
      { playerName: 'Фернандо Торрес', stars: 4 },
      { playerName: 'Давид Вилья', stars: 5 },
    ],
  },
  Англия: {
    GK: [
      { playerName: 'Фрейзер Форстер', stars: 3 },
      { playerName: 'Джек Батленд', stars: 3 },
      { playerName: 'Роберт Грин', stars: 2 },
      { playerName: 'Том Хитон', stars: 2 },
      { playerName: 'Джон Радди', stars: 1 },
      { playerName: 'Джо Харт', stars: 3 },
    ],
    RB: [
      { playerName: 'Фил Джонс', stars: 3 },
      { playerName: 'Натаниэл Клайн', stars: 3 },
      { playerName: 'Кайл Уокер', stars: 4 },
      { playerName: 'Трент Александер-Арнольд', stars: 5 },
    ],
    CB: [
      { playerName: 'Крис Смоллинг', stars: 3 },
      { playerName: 'Джон Стоунз', stars: 4 },
      { playerName: 'Гари Кэхилл', stars: 3 },
      { playerName: 'Фил Джагелка', stars: 3 },
      { playerName: 'Джон Терри', stars: 4 },
      { playerName: 'Рио Фердинанд', stars: 4 },
    ],
    LB: [
      { playerName: 'Люк Шоу', stars: 3 },
      { playerName: 'Лейтон Бейнс', stars: 3 },
      { playerName: 'Дэнни Роуз', stars: 3 },
      { playerName: 'Эшли Коул', stars: 4 },
    ],
    CDM: [
      { playerName: 'Деклан Райс', stars: 4 },
      { playerName: 'Оуэн Харгривз', stars: 3 },
    ],
    CM: [
      { playerName: 'Джордан Хендерсон', stars: 4 },
      { playerName: 'Алекс Окслейд-Чемберлен', stars: 3 },
      { playerName: 'Джеймс Милнер', stars: 3 },
      { playerName: 'Фабиан Делф', stars: 2 },
      { playerName: 'Эрик Дайер', stars: 3 },
      { playerName: 'Фрэнк Лэмпард', stars: 5 },
      { playerName: 'Стивен Джеррард', stars: 5 },
    ],
    CAM: [
      { playerName: 'Росс Баркли', stars: 3 },
      { playerName: 'Пол Скоулз', stars: 5 },
    ],
    RM: [
      { playerName: 'Адам Лаллана', stars: 3 },
      { playerName: 'Тео Уолкотт', stars: 3 },
      { playerName: 'Дэвид Бекхэм', stars: 5 },
    ],
    LM: [
      { playerName: 'Джек Уилшир', stars: 3 },
      { playerName: 'Рахим Стерлинг', stars: 4 },
    ],
    RW: [
      { playerName: 'Адам Лаллана', stars: 3 },
      { playerName: 'Букайо Сака', stars: 4 },
    ],
    LW: [
      { playerName: 'Джек Уилшир', stars: 3 },
      { playerName: 'Маркус Рэшфорд', stars: 4 },
    ],
    ST: [
      { playerName: 'Рики Ламберт', stars: 2 },
      { playerName: 'Джермейн Дефо', stars: 3 },
      { playerName: 'Энди Кэрролл', stars: 2 },
      { playerName: 'Дэниел Старридж', stars: 4 },
      { playerName: 'Уэйн Руни', stars: 5 },
      { playerName: 'Харри Кейн', stars: 5 },
    ],
  },
  Португалия: {
    GK: [
      { playerName: 'Эдуарду', stars: 3 },
      { playerName: 'Бету', stars: 2 },
      { playerName: 'Руй Патрисиу', stars: 4 },
      { playerName: 'Антони Лопеш', stars: 3 },
      { playerName: 'Даниэл Фернандеш', stars: 1 },
    ],
    RB: [
      { playerName: 'Мигел', stars: 3 },
      { playerName: 'Жозе Бозингва', stars: 3 },
      { playerName: 'Седрик Суареш', stars: 3 },
      { playerName: 'Жоау Канселу', stars: 4 },
    ],
    CB: [
      { playerName: 'Рикарду Кошта', stars: 3 },
      { playerName: 'Бруну Алвеш', stars: 3 },
      { playerName: 'Роланду', stars: 2 },
      { playerName: 'Луиш Нету', stars: 2 },
      { playerName: 'Жозе Фонте', stars: 3 },
      { playerName: 'Рикарду Карвалью', stars: 4 },
      { playerName: 'Пепе', stars: 4 },
      { playerName: 'Рубен Диаш', stars: 4 },
    ],
    LB: [
      { playerName: 'Паулу Феррейра', stars: 3 },
      { playerName: 'Фабиу Коэнтрау', stars: 3 },
      { playerName: 'Элизеу', stars: 2 },
      { playerName: 'Рафаэл Геррейру', stars: 4 },
    ],
    CDM: [
      { playerName: 'Данилу Перейра', stars: 3 },
      { playerName: 'Жоау Палинья', stars: 3 },
    ],
    CM: [
      { playerName: 'Раул Мейрелеш', stars: 3 },
      { playerName: 'Мигел Велозу', stars: 3 },
      { playerName: 'Мануэл Фернандеш', stars: 3 },
      { playerName: 'Жоаау Моутинью', stars: 4 },
      { playerName: 'Бернарду Силва', stars: 5 },
      { playerName: 'Бруну Фернандеш', stars: 5 },
    ],
    RM: [{ playerName: 'Рикарду Куарежма', stars: 4 }],
    LM: [
      { playerName: 'Силвестре Варела', stars: 2 },
      { playerName: 'Данни', stars: 3 },
      { playerName: 'Рафаэл Леау', stars: 4 },
    ],
    RW: [{ playerName: 'Рикарду Куарежма', stars: 4 }],
    LW: [
      { playerName: 'Силвестре Варела', stars: 2 },
      { playerName: 'Криштиану Роналду', stars: 5 },
    ],
    ST: [
      { playerName: 'Угу Алмейда', stars: 3 },
      { playerName: 'Элдер Поштига', stars: 3 },
      { playerName: 'Нелсон Оливейра', stars: 2 },
      { playerName: 'Эдер', stars: 2 },
      { playerName: 'Луиш Фигу', stars: 5 },
      { playerName: 'Диогу Жота', stars: 4 },
    ],
  },
  Нидерланды: {
    GK: [
      { playerName: 'Мартен Стекеленбург', stars: 3 },
      { playerName: 'Михел Ворм', stars: 3 },
      { playerName: 'Яспер Силлессен', stars: 3 },
      { playerName: 'Тим Крул', stars: 3 },
      { playerName: 'Йерун Зут', stars: 2 },
      { playerName: 'Эдвин ван дер Сар', stars: 5 },
    ],
    RB: [
      { playerName: 'Грегори ван дер Вил', stars: 3 },
      { playerName: 'Паул Верхаг', stars: 2 },
      { playerName: 'Дэрил Янмат', stars: 3 },
      { playerName: 'Дензел Дюмфрис', stars: 4 },
    ],
    CB: [
      { playerName: 'Йорис Матейсен', stars: 3 },
      { playerName: 'Джон Хейтинга', stars: 3 },
      { playerName: 'Йоэл Велтман', stars: 3 },
      { playerName: 'Карим Рекик', stars: 2 },
      { playerName: 'Вирджил ван Дейк', stars: 5 },
      { playerName: 'Маттейс де Лигт', stars: 4 },
    ],
    LB: [
      { playerName: 'Йетро Виллемс', stars: 3 },
      { playerName: 'Дейли Блинд', stars: 3 },
      { playerName: 'Натан Аке', stars: 4 },
    ],
    CDM: [
      { playerName: 'Найджел де Йонг', stars: 3 },
      { playerName: 'Френки де Йонг', stars: 4 },
    ],
    CM: [
      { playerName: 'Стейн Схарс', stars: 2 },
      { playerName: 'Лерой Фер', stars: 3 },
      { playerName: 'Дэви Классен', stars: 3 },
      { playerName: 'Уэсли Снейдер', stars: 5 },
      { playerName: 'Джорджиньо Вейналдум', stars: 4 },
    ],
    RM: [{ playerName: 'Эльеро Элиа', stars: 3 }],
    LM: [
      { playerName: 'Джермейн Ленс', stars: 3 },
      { playerName: 'Арьен Роббен', stars: 5 },
    ],
    RW: [{ playerName: 'Эльеро Элиа', stars: 3 }],
    LW: [
      { playerName: 'Джермейн Ленс', stars: 3 },
      { playerName: 'Мемфис Депай', stars: 4 },
    ],
    ST: [
      { playerName: 'Клас-Ян Хюнтелар', stars: 4 },
      { playerName: 'Рики ван Волфсвинкел', stars: 2 },
      { playerName: 'Бас Дост', stars: 3 },
      { playerName: 'Робин ван Перси', stars: 5 },
      { playerName: 'Руд ван Нистелрой', stars: 5 },
    ],
  },
  Германия: {
    GK: [
      { playerName: 'Рене Адлер', stars: 3 },
      { playerName: 'Тим Визе', stars: 3 },
      { playerName: 'Роман Вайденфеллер', stars: 3 },
      { playerName: 'Ханс-Йорг Бутт', stars: 3 },
      { playerName: 'Свен Ульрайх', stars: 2 },
      { playerName: 'Мануэль Нойер', stars: 5 },
    ],
    RB: [
      { playerName: 'Андреас Бек', stars: 3 },
      { playerName: 'Жером Боатенг', stars: 4 },
      { playerName: 'Филипп Лам', stars: 5 },
    ],
    CB: [
      { playerName: 'Пер Мертезакер', stars: 3 },
      { playerName: 'Арне Фридрих', stars: 3 },
      { playerName: 'Хайко Вестерман', stars: 2 },
      { playerName: 'Матс Хуммельс', stars: 4 },
      { playerName: 'Антонио Рюдигер', stars: 4 },
    ],
    LB: [
      { playerName: 'Деннис Аого', stars: 3 },
      { playerName: 'Марсель Шефер', stars: 2 },
      { playerName: 'Йонас Гектор', stars: 3 },
    ],
    CDM: [
      { playerName: 'Сами Хедира', stars: 4 },
      { playerName: 'Йозуа Киммих', stars: 5 },
    ],
    CM: [
      { playerName: 'Симон Рольфес', stars: 3 },
      { playerName: 'Кристиан Треш', stars: 2 },
      { playerName: 'Тони Кроос', stars: 5 },
      { playerName: 'Бастиан Швайнштайгер', stars: 5 },
      { playerName: 'Илкай Гюндоган', stars: 4 },
    ],
    RM: [
      { playerName: 'Сидней Сэм', stars: 3 },
      { playerName: 'Томас Мюллер', stars: 5 },
    ],
    LM: [
      { playerName: 'Андре Шюррле', stars: 4 },
      { playerName: 'Марко Ройс', stars: 4 },
    ],
    RW: [
      { playerName: 'Марко Ройс', stars: 4 },
      { playerName: 'Лерой Сане', stars: 4 },
    ],
    LW: [
      { playerName: 'Андре Шюррле', stars: 4 },
      { playerName: 'Кай Хаверц', stars: 4 },
    ],
    ST: [
      { playerName: 'Марио Гомес', stars: 4 },
      { playerName: 'Какау', stars: 3 },
      { playerName: 'Штефан Кисслинг', stars: 3 },
      { playerName: 'Мирослав Клозе', stars: 5 },
      { playerName: 'Тимо Вернер', stars: 4 },
    ],
  },
  Италия: {
    GK: [
      { playerName: 'Федерико Маркетти', stars: 3 },
      { playerName: 'Сальваторе Сиригу', stars: 3 },
      { playerName: 'Марко Амелия', stars: 2 },
      { playerName: 'Эмилиано Вивиано', stars: 2 },
      { playerName: 'Антонио Миранте', stars: 2 },
      { playerName: 'Джанлуиджи Буффон', stars: 5 },
    ],
    RB: [
      { playerName: 'Кристиан Маджо', stars: 3 },
      { playerName: 'Иньяцио Абате', stars: 3 },
      { playerName: 'Джованни Ди Лоренцо', stars: 4 },
    ],
    CB: [
      { playerName: 'Андреа Бардзальи', stars: 4 },
      { playerName: 'Леонардо Бонуччи', stars: 4 },
      { playerName: 'Давиде Астори', stars: 3 },
      { playerName: 'Анджело Огбонна', stars: 3 },
      { playerName: 'Джорджо Кьеллини', stars: 5 },
      { playerName: 'Алессандро Неста', stars: 5 },
    ],
    LB: [
      { playerName: 'Федерико Бальцаретти', stars: 3 },
      { playerName: 'Доменико Кришито', stars: 3 },
      { playerName: 'Леонардо Спинаццола', stars: 4 },
    ],
    CDM: [
      { playerName: 'Тиагу Мотта', stars: 4 },
      { playerName: 'Жоржиньо', stars: 4 },
    ],
    CM: [
      { playerName: 'Риккардо Монтоливо', stars: 3 },
      { playerName: 'Антонио Ночерино', stars: 3 },
      { playerName: 'Марко Верратти', stars: 4 },
      { playerName: 'Андреа Пирло', stars: 5 },
    ],
    RM: [
      { playerName: 'Антонио Ди Натале', stars: 4 },
      { playerName: 'Федерико Кьеза', stars: 4 },
    ],
    LM: [
      { playerName: 'Эмануэле Джаккерини', stars: 3 },
      { playerName: 'Лоренцо Инсинье', stars: 4 },
    ],
    RW: [
      { playerName: 'Антонио Ди Натале', stars: 4 },
      { playerName: 'Доменико Берарди', stars: 4 },
    ],
    LW: [
      { playerName: 'Алессандро Матри', stars: 3 },
      { playerName: 'Чиро Иммобиле', stars: 4 },
    ],
    ST: [
      { playerName: 'Фабио Квальярелла', stars: 3 },
      { playerName: 'Альберто Джилардино', stars: 3 },
      { playerName: 'Грациано Пелле', stars: 3 },
      { playerName: 'Франческо Тотти', stars: 5 },
      { playerName: 'Лука Тони', stars: 4 },
    ],
  },
  Бельгия: {
    GK: [
      { playerName: 'Симон Миньоле', stars: 3 },
      { playerName: 'Кун Кастелс', stars: 2 },
      { playerName: 'Сильвио Прото', stars: 2 },
      { playerName: 'Матц Селс', stars: 2 },
      { playerName: 'Тибо Куртуа', stars: 5 },
    ],
    RB: [
      { playerName: 'Тоби Алдервейрелд', stars: 4 },
      { playerName: 'Тома Менье', stars: 3 },
    ],
    CB: [
      { playerName: 'Томас Вермален', stars: 3 },
      { playerName: 'Ян Вертонген', stars: 4 },
      { playerName: 'Венсан Компани', stars: 4 },
      { playerName: 'Дедрик Бойата', stars: 2 },
    ],
    LB: [
      { playerName: 'Лоран Симан', stars: 2 },
      { playerName: 'Ян Вертонген', stars: 4 },
    ],
    CDM: [
      { playerName: 'Аксель Витсель', stars: 4 },
      { playerName: 'Раджа Наингголан', stars: 4 },
    ],
    CM: [
      { playerName: 'Мусса Дембеле', stars: 4 },
      { playerName: 'Юри Тилеманс', stars: 4 },
      { playerName: 'Кевин Де Брёйне', stars: 5 },
    ],
    RM: [
      { playerName: 'Кевин Миральяс', stars: 3 },
      { playerName: 'Леандро Троссард', stars: 3 },
    ],
    LM: [
      { playerName: 'Дрис Мертенс', stars: 4 },
      { playerName: 'Эден Азар', stars: 5 },
    ],
    RW: [
      { playerName: 'Кевин Миральяс', stars: 3 },
      { playerName: 'Ромелу Лукаку', stars: 5 },
    ],
    LW: [
      { playerName: 'Дрис Мертенс', stars: 4 },
      { playerName: 'Эден Азар', stars: 5 },
    ],
    ST: [
      { playerName: 'Кристиан Бентеке', stars: 3 },
      { playerName: 'Миши Батшуайи', stars: 3 },
      { playerName: 'Дивок Ориги', stars: 3 },
      { playerName: 'Ромелу Лукаку', stars: 5 },
    ],
  },
  Хорватия: {
    GK: [
      { playerName: 'Стипе Плетикоса', stars: 3 },
      { playerName: 'Даниел Субашич', stars: 3 },
      { playerName: 'Ловре Калинич', stars: 2 },
      { playerName: 'Доминик Ливакович', stars: 3 },
    ],
    RB: [
      { playerName: 'Дарио Срна', stars: 4 },
      { playerName: 'Шиме Врсалько', stars: 3 },
    ],
    CB: [
      { playerName: 'Ведран Чорлука', stars: 3 },
      { playerName: 'Гордон Шильденфельд', stars: 2 },
      { playerName: 'Домагой Вида', stars: 3 },
      { playerName: 'Йосип Шимунич', stars: 3 },
      { playerName: 'Йошко Гвардиол', stars: 4 },
    ],
    LB: [
      { playerName: 'Даниэль Праньич', stars: 3 },
      { playerName: 'Иван Стринич', stars: 3 },
    ],
    CDM: [
      { playerName: 'Огньен Вукоевич', stars: 3 },
      { playerName: 'Марцело Брозович', stars: 4 },
    ],
    CM: [
      { playerName: 'Милан Бадель', stars: 3 },
      { playerName: 'Ален Халилович', stars: 3 },
      { playerName: 'Лука Модрич', stars: 5 },
      { playerName: 'Матео Ковачич', stars: 4 },
      { playerName: 'Иван Ракитич', stars: 4 },
    ],
    RM: [{ playerName: 'Иван Перишич', stars: 4 }],
    LM: [
      { playerName: 'Марко Пьяца', stars: 3 },
      { playerName: 'Иван Перишич', stars: 4 },
    ],
    RW: [{ playerName: 'Иван Перишич', stars: 4 }],
    LW: [
      { playerName: 'Марко Пьяца', stars: 3 },
      { playerName: 'Марио Пашалич', stars: 3 },
    ],
    ST: [
      { playerName: 'Никица Елавич', stars: 3 },
      { playerName: 'Марио Манджукич', stars: 4 },
      { playerName: 'Андрей Крамарич', stars: 3 },
      { playerName: 'Давор Шукер', stars: 5 },
    ],
  },
  Уругвай: {
    GK: [
      { playerName: 'Фернандо Муслера', stars: 3 },
      { playerName: 'Мартин Сильва', stars: 2 },
      { playerName: 'Хуан Кастильо', stars: 1 },
      { playerName: 'Родриго Муньос', stars: 2 },
    ],
    RB: [
      { playerName: 'Макси Перейра', stars: 3 },
      { playerName: 'Маурисио Викторино', stars: 2 },
    ],
    CB: [
      { playerName: 'Диего Годин', stars: 4 },
      { playerName: 'Мартин Касерес', stars: 3 },
      { playerName: 'Себастьян Коатес', stars: 3 },
      { playerName: 'Андрес Скотти', stars: 2 },
      { playerName: 'Хосе Мария Хименес', stars: 4 },
    ],
    LB: [
      { playerName: 'Хорхе Фусиле', stars: 2 },
      { playerName: 'Альваро Перейра', stars: 2 },
    ],
    CDM: [
      { playerName: 'Эхидио Аревало Риос', stars: 3 },
      { playerName: 'Вальтер Гаргано', stars: 3 },
    ],
    CM: [
      { playerName: 'Альваро Гонсалес', stars: 2 },
      { playerName: 'Гастон Рамирес', stars: 3 },
      { playerName: 'Федерико Вальверде', stars: 4 },
      { playerName: 'Родриго Бентанкур', stars: 4 },
    ],
    RM: [{ playerName: 'Кристиан Родригес', stars: 3 }],
    LM: [
      { playerName: 'Гастон Рамирес', stars: 3 },
      { playerName: 'Николас Лодейро', stars: 3 },
    ],
    RW: [{ playerName: 'Кристиан Родригес', stars: 3 }],
    LW: [{ playerName: 'Гастон Рамирес', stars: 3 }],
    ST: [
      { playerName: 'Диего Форлан', stars: 5 },
      { playerName: 'Себастьян Абреу', stars: 3 },
      { playerName: 'Абель Эрнандес', stars: 3 },
      { playerName: 'Луис Суарес', stars: 5 },
      { playerName: 'Эдинсон Кавани', stars: 5 },
    ],
  },
  Колумбия: {
    GK: [
      { playerName: 'Давид Оспина', stars: 3 },
      { playerName: 'Камило Варгас', stars: 2 },
      { playerName: 'Хосе Куадрадо', stars: 1 },
      { playerName: 'Иван Арболеда', stars: 2 },
    ],
    RB: [
      { playerName: 'Хуан Суньига', stars: 3 },
      { playerName: 'Сантьяго Ариас', stars: 3 },
    ],
    CB: [
      { playerName: 'Кристиан Сапата', stars: 3 },
      { playerName: 'Эдер Альварес Баланта', stars: 3 },
      { playerName: 'Йерри Мина', stars: 3 },
      { playerName: 'Давинсон Санчес', stars: 4 },
    ],
    LB: [
      { playerName: 'Пабло Армеро', stars: 3 },
      { playerName: 'Франк Фабра', stars: 3 },
    ],
    CDM: [
      { playerName: 'Карлос Санчес', stars: 3 },
      { playerName: 'Вильмар Барриос', stars: 3 },
    ],
    CM: [
      { playerName: 'Фредди Гуарин', stars: 3 },
      { playerName: 'Абель Агилар', stars: 3 },
      { playerName: 'Хамес Родригес', stars: 5 },
      { playerName: 'Хуан Кинтеро', stars: 3 },
    ],
    RM: [{ playerName: 'Хуан Куадрадо', stars: 4 }],
    LM: [
      { playerName: 'Эдвин Кардона', stars: 3 },
      { playerName: 'Луис Мурьель', stars: 3 },
    ],
    RW: [{ playerName: 'Хуан Куадрадо', stars: 4 }],
    LW: [
      { playerName: 'Луис Мурьель', stars: 3 },
      { playerName: 'Луис Диас', stars: 4 },
    ],
    ST: [
      { playerName: 'Карлос Бакка', stars: 4 },
      { playerName: 'Теофило Гутьеррес', stars: 3 },
      { playerName: 'Джексон Мартинес', stars: 4 },
      { playerName: 'Радамель Фалькао', stars: 5 },
    ],
  },
  Мексика: {
    GK: [
      { playerName: 'Гильермо Очоа', stars: 4 },
      { playerName: 'Хесус Корона', stars: 2 },
      { playerName: 'Альфредо Талавера', stars: 2 },
      { playerName: 'Хонатан Ороско', stars: 2 },
    ],
    RB: [
      { playerName: 'Пауль Агилар', stars: 3 },
      { playerName: 'Эфраин Хуарес', stars: 2 },
    ],
    CB: [
      { playerName: 'Франсиско Родригес', stars: 3 },
      { playerName: 'Эктор Морено', stars: 3 },
      { playerName: 'Диего Рейес', stars: 3 },
      { playerName: 'Уго Айяла', stars: 2 },
    ],
    LB: [
      { playerName: 'Карлос Сальсидо', stars: 3 },
      { playerName: 'Мигель Лайюн', stars: 3 },
    ],
    CDM: [
      { playerName: 'Херардо Торрадо', stars: 3 },
      { playerName: 'Эдсон Альварес', stars: 4 },
    ],
    CM: [
      { playerName: 'Исраэль Кастро', stars: 2 },
      { playerName: 'Андрес Гуардадо', stars: 4 },
      { playerName: 'Эктор Эррера', stars: 4 },
    ],
    RM: [
      { playerName: 'Пабло Баррера', stars: 3 },
      { playerName: 'Ирвинг Лосано', stars: 4 },
    ],
    LM: [{ playerName: 'Андрес Гуардадо', stars: 4 }],
    RW: [{ playerName: 'Пабло Баррера', stars: 3 }],
    LW: [
      { playerName: 'Джовани дос Сантос', stars: 3 },
      { playerName: 'Ирвинг Лосано', stars: 4 },
    ],
    ST: [
      { playerName: 'Орибе Перальта', stars: 3 },
      { playerName: 'Альдо де Нигрис', stars: 2 },
      { playerName: 'Алан Пулидо', stars: 2 },
      { playerName: 'Хавьер Эрнандес', stars: 4 },
      { playerName: 'Рауль Хименес', stars: 4 },
    ],
  },
  Россия: {
    GK: [
      { playerName: 'Игорь Акинфеев', stars: 4 },
      { playerName: 'Владимир Габулов', stars: 3 },
      { playerName: 'Сослан Джанаев', stars: 3 },
      { playerName: 'Андрей Лунёв', stars: 3 },
      { playerName: 'Гилерме', stars: 3 },
    ],
    RB: [
      { playerName: 'Александр Анюков', stars: 3 },
      { playerName: 'Алексей Березуцкий', stars: 3 },
      { playerName: 'Игорь Смольников', stars: 3 },
      { playerName: 'Марио Фернандес', stars: 4 },
    ],
    CB: [
      { playerName: 'Сергей Игнашевич', stars: 4 },
      { playerName: 'Василий Березуцкий', stars: 3 },
      { playerName: 'Роман Нойштедтер', stars: 3 },
      { playerName: 'Дмитрий Комбаров', stars: 3 },
      { playerName: 'Георгий Джикия', stars: 3 },
    ],
    LB: [
      { playerName: 'Юрий Жирков', stars: 4 },
      { playerName: 'Георгий Щенников', stars: 3 },
    ],
    CDM: [
      { playerName: 'Денис Глушаков', stars: 3 },
      { playerName: 'Роман Зобнин', stars: 3 },
    ],
    CM: [
      { playerName: 'Роман Широков', stars: 4 },
      { playerName: 'Алан Дзагоев', stars: 4 },
      { playerName: 'Олег Шатов', stars: 3 },
      { playerName: 'Александр Головин', stars: 4 },
    ],
    RM: [
      { playerName: 'Александр Самедов', stars: 3 },
      { playerName: 'Алексей Ионов', stars: 3 },
    ],
    LM: [
      { playerName: 'Юрий Жирков', stars: 4 },
      { playerName: 'Дмитрий Комбаров', stars: 3 },
    ],
    RW: [{ playerName: 'Александр Самедов', stars: 3 }],
    LW: [{ playerName: 'Дмитрий Комбаров', stars: 3 }],
    ST: [
      { playerName: 'Артём Дзюба', stars: 4 },
      { playerName: 'Фёдор Смолов', stars: 4 },
      { playerName: 'Александр Кокорин', stars: 3 },
      { playerName: 'Александр Кержаков', stars: 4 },
    ],
  },
}

