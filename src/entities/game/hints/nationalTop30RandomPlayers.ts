import { NATIONAL_TOP15_RANDOM_PLAYERS, type Top15RandomPlayersByPosition } from './nationalTop15RandomPlayers'

/**
 * Пул игроков для подсказки «Случайный игрок» в режиме «Сборные ТОП-30».
 * Ключ страны — как в `TOP_30_FOOTBALL_COUNTRIES_RU` (русские названия).
 *
 * Включает ТОП-15 + добавленные 16 стран.
 */
export const NATIONAL_TOP30_RANDOM_PLAYERS: Record<string, Top15RandomPlayersByPosition> = {
  ...NATIONAL_TOP15_RANDOM_PLAYERS,

  США: {
    GK: [
      { playerName: 'Тим Ховард', stars: 4 },
      { playerName: 'Брэд Гузан', stars: 3 },
      { playerName: 'Ник Римандо', stars: 2 },
      { playerName: 'Мэтт Тернер', stars: 3 },
    ],
    RB: [
      { playerName: 'Стив Черандоло', stars: 3 },
      { playerName: 'Деандре Йедлин', stars: 3 },
    ],
    CB: [
      { playerName: 'Огучи Оньеву', stars: 3 },
      { playerName: 'Карлос Боканегра', stars: 3 },
      { playerName: 'Джей Демерит', stars: 2 },
      { playerName: 'Мэтт Беслер', stars: 3 },
    ],
    LB: [
      { playerName: 'Джонатан Борнстейн', stars: 2 },
      { playerName: 'ДаМаркус Бизли', stars: 3 },
    ],
    CDM: [
      { playerName: 'Кайл Бекерман', stars: 3 },
      { playerName: 'Джермейн Джонс', stars: 3 },
    ],
    CM: [
      { playerName: 'Майкл Брэдли', stars: 4 },
      { playerName: 'Рикардо Кларк', stars: 2 },
      { playerName: 'Морис Эду', stars: 3 },
    ],
    RM: [{ playerName: 'Лэндон Донован', stars: 5 }],
    LM: [{ playerName: 'ДаМаркус Бизли', stars: 3 }],
    RW: [{ playerName: 'Эдди Джонсон', stars: 3 }],
    LW: [{ playerName: 'Фрэнки Хейдук', stars: 3 }],
    ST: [
      { playerName: 'Брайан Макбрайд', stars: 4 },
      { playerName: 'Джози Алтидор', stars: 3 },
      { playerName: 'Крис Вондоловски', stars: 3 },
      { playerName: 'Клинт Демпси', stars: 4 },
      { playerName: 'Кристиан Пулишич', stars: 4 },
    ],
  },

  Швейцария: {
    GK: [
      { playerName: 'Янн Зоммер', stars: 4 },
      { playerName: 'Йонас Омлин', stars: 2 },
      { playerName: 'Грегор Кобель', stars: 3 },
    ],
    RB: [
      { playerName: 'Штефан Лихтштайнер', stars: 4 },
      { playerName: 'Сильван Видмер', stars: 3 },
    ],
    CB: [
      { playerName: 'Йохан Джуру', stars: 3 },
      { playerName: 'Фабиан Шер', stars: 3 },
      { playerName: 'Мануэль Аканджи', stars: 4 },
      { playerName: 'Нико Эльведи', stars: 3 },
    ],
    LB: [
      { playerName: 'Рето Циглер', stars: 3 },
      { playerName: 'Рикардо Родригес', stars: 4 },
    ],
    CDM: [
      { playerName: 'Желсон Фернандеш', stars: 3 },
      { playerName: 'Денис Закариа', stars: 4 },
    ],
    CM: [
      { playerName: 'Гранит Джака', stars: 4 },
      { playerName: 'Блерим Джемайли', stars: 3 },
      { playerName: 'Валон Бехрами', stars: 3 },
      { playerName: 'Ремо Фройлер', stars: 3 },
    ],
    RM: [{ playerName: 'Валентин Штокер', stars: 3 }],
    LM: [{ playerName: 'Стивен Цубер', stars: 3 }],
    RW: [{ playerName: 'Адмир Мехмеди', stars: 3 }],
    LW: [{ playerName: 'Эрен Дердийок', stars: 3 }],
    ST: [
      { playerName: 'Харис Сеферович', stars: 3 },
      { playerName: 'Марио Гавранович', stars: 3 },
      { playerName: 'Брель Эмболо', stars: 3 },
      { playerName: 'Александер Фрай', stars: 4 },
      { playerName: 'Джердан Шакири', stars: 4 },
    ],
  },

  Дания: {
    GK: [
      { playerName: 'Томас Сёренсен', stars: 3 },
      { playerName: 'Стефан Андерсен', stars: 2 },
      { playerName: 'Каспер Шмейхель', stars: 4 },
    ],
    RB: [
      { playerName: 'Ларс Якобсен', stars: 3 },
      { playerName: 'Даниэль Васс', stars: 3 },
    ],
    CB: [
      { playerName: 'Мартин Лаурсен', stars: 4 },
      { playerName: 'Пер Крёльдруп', stars: 3 },
      { playerName: 'Симон Кьер', stars: 4 },
      { playerName: 'Андреас Кристенсен', stars: 4 },
    ],
    LB: [
      { playerName: 'Микаэль Лумб', stars: 2 },
      { playerName: 'Йенс Ларсен', stars: 3 },
    ],
    CDM: [
      { playerName: 'Кристиан Поульсен', stars: 3 },
      { playerName: 'Вильям Квист', stars: 3 },
    ],
    CM: [
      { playerName: 'Даниэль Йенсен', stars: 3 },
      { playerName: 'Кристиан Эриксен', stars: 5 },
      { playerName: 'Пьер-Эмиль Хёйбьерг', stars: 4 },
      { playerName: 'Матиас Йенсен', stars: 3 },
    ],
    RM: [{ playerName: 'Деннис Роммедаль', stars: 3 }],
    LM: [{ playerName: 'Йеспер Грёнкьер', stars: 3 }],
    RW: [{ playerName: 'Мартин Йоргенсен', stars: 3 }],
    LW: [{ playerName: 'Микаэль Крон-Дели', stars: 3 }],
    ST: [
      { playerName: 'Йон Даль Томассон', stars: 4 },
      { playerName: 'Никлас Бендтнер', stars: 3 },
      { playerName: 'Мартин Брайтвайт', stars: 3 },
      { playerName: 'Юссуф Поульсен', stars: 3 },
    ],
  },

  Швеция: {
    GK: [
      { playerName: 'Андреас Исакссон', stars: 3 },
      { playerName: 'Робин Ульсен', stars: 3 },
      { playerName: 'Карл-Юхан Юнссон', stars: 2 },
    ],
    RB: [{ playerName: 'Микаэль Лустиг', stars: 3 }],
    CB: [
      { playerName: 'Улоф Мельберг', stars: 4 },
      { playerName: 'Андреас Гранквист', stars: 3 },
      { playerName: 'Виктор Линделёф', stars: 4 },
      { playerName: 'Понтус Янссон', stars: 3 },
    ],
    LB: [
      { playerName: 'Эрик Эдман', stars: 3 },
      { playerName: 'Людвиг Аугустинссон', stars: 3 },
    ],
    CDM: [
      { playerName: 'Ким Чельстрём', stars: 4 },
      { playerName: 'Альбин Экдаль', stars: 3 },
    ],
    CM: [
      { playerName: 'Андерс Свенссон', stars: 3 },
      { playerName: 'Себастьян Ларссон', stars: 3 },
      { playerName: 'Эмиль Форсберг', stars: 4 },
      { playerName: 'Густав Свенссон', stars: 3 },
    ],
    RM: [{ playerName: 'Кристиан Вильхельмссон', stars: 3 }],
    LM: [{ playerName: 'Тобиас Хюсен', stars: 3 }],
    RW: [{ playerName: 'Маттиас Йонсон', stars: 3 }],
    LW: [{ playerName: 'Маркус Берг', stars: 4 }],
    ST: [
      { playerName: 'Златан Ибрагимович', stars: 5 },
      { playerName: 'Юхан Эльмандер', stars: 3 },
      { playerName: 'Ола Тойвонен', stars: 3 },
      { playerName: 'Александр Исак', stars: 4 },
    ],
  },

  Норвегия: {
    GK: [
      { playerName: 'Руне Ярстейн', stars: 3 },
      { playerName: 'Андре Хансен', stars: 2 },
      { playerName: 'Эрьян Нюланн', stars: 3 },
    ],
    RB: [
      { playerName: 'Том Хёгли', stars: 2 },
      { playerName: 'Омар Элабделлауи', stars: 3 },
    ],
    CB: [
      { playerName: 'Бреде Хангеланн', stars: 3 },
      { playerName: 'Ховард Нордтвейт', stars: 3 },
      { playerName: 'Вегард Форрен', stars: 2 },
      { playerName: 'Кристоффер Айер', stars: 3 },
    ],
    LB: [
      { playerName: 'Йон Арне Риисе', stars: 4 },
      { playerName: 'Хайтам Алеесами', stars: 2 },
    ],
    CDM: [
      { playerName: 'Александр Тетти', stars: 3 },
      { playerName: 'Маркус Хенриксен', stars: 3 },
    ],
    CM: [
      { playerName: 'Мортен Гамст Педерсен', stars: 3 },
      { playerName: 'Стефан Йохансен', stars: 3 },
      { playerName: 'Сандер Берге', stars: 3 },
      { playerName: 'Мартин Эдегор', stars: 4 },
    ],
    RM: [{ playerName: 'Пер Сильян Шельбред', stars: 3 }],
    LM: [{ playerName: 'Мохамед Эльюнусси', stars: 3 }],
    RW: [{ playerName: 'Джон Карью', stars: 3 }],
    LW: [{ playerName: 'Мортен Педерсен', stars: 3 }],
    ST: [
      { playerName: 'Стеффен Иверсен', stars: 3 },
      { playerName: 'Мохаммед Абделлауэ', stars: 3 },
      { playerName: 'Александер Сёрлот', stars: 3 },
      { playerName: 'Эрлинг Холанн', stars: 5 },
    ],
  },

  Польша: {
    GK: [
      { playerName: 'Артур Боруц', stars: 3 },
      { playerName: 'Лукаш Фабяньски', stars: 3 },
      { playerName: 'Войцех Щенсны', stars: 4 },
    ],
    RB: [
      { playerName: 'Лукаш Пищек', stars: 4 },
      { playerName: 'Бартош Берешиньски', stars: 3 },
    ],
    CB: [
      { playerName: 'Михал Жевлаков', stars: 3 },
      { playerName: 'Камиль Глик', stars: 4 },
      { playerName: 'Мацей Вилюш', stars: 2 },
      { playerName: 'Ян Беднарек', stars: 3 },
    ],
    LB: [
      { playerName: 'Якуб Вавжиняк', stars: 3 },
      { playerName: 'Артур Енджейчик', stars: 3 },
    ],
    CDM: [
      { playerName: 'Гжегож Крыховяк', stars: 4 },
      { playerName: 'Яцек Гуральски', stars: 3 },
    ],
    CM: [
      { playerName: 'Яцек Кшинувек', stars: 3 },
      { playerName: 'Петр Зелиньски', stars: 4 },
      { playerName: 'Кароль Линетты', stars: 3 },
      { playerName: 'Себастьян Шиманьски', stars: 3 },
    ],
    RM: [{ playerName: 'Якуб Блащиковски', stars: 4 }],
    LM: [{ playerName: 'Камиль Косицки', stars: 3 }],
    RW: [{ playerName: 'Камиль Гросицки', stars: 3 }],
    LW: [{ playerName: 'Мацей Рыбус', stars: 3 }],
    ST: [
      { playerName: 'Эби Смолярек', stars: 3 },
      { playerName: 'Роберт Левандовски', stars: 5 },
      { playerName: 'Аркадиуш Милик', stars: 4 },
      { playerName: 'Кшиштоф Пёнтек', stars: 3 },
    ],
  },

  Сенегал: {
    GK: [
      { playerName: 'Тони Сильва', stars: 3 },
      { playerName: 'Буна Кундул', stars: 2 },
      { playerName: 'Эдуар Менди', stars: 4 },
    ],
    RB: [
      { playerName: 'Ламин Гассама', stars: 3 },
      { playerName: 'Юссуф Сабали', stars: 3 },
    ],
    CB: [
      { playerName: 'Сулейман Диавара', stars: 3 },
      { playerName: 'Пап Малик Диоп', stars: 3 },
      { playerName: 'Калиду Кулибали', stars: 5 },
      { playerName: 'Салиф Сане', stars: 3 },
    ],
    LB: [
      { playerName: "Пап Н'Диайе", stars: 2 },
      { playerName: 'Абду Диалло', stars: 3 },
    ],
    CDM: [
      { playerName: 'Пап Буба Диоп', stars: 3 },
      { playerName: 'Идрисса Гейе', stars: 4 },
    ],
    CM: [
      { playerName: 'Салиф Дьяо', stars: 3 },
      { playerName: 'Мустафа Байял Салль', stars: 3 },
      { playerName: 'Пап Матар Сарр', stars: 3 },
      { playerName: 'Крепин Диатта', stars: 3 },
    ],
    RM: [{ playerName: 'Исмаила Сарр', stars: 4 }],
    LM: [{ playerName: 'Анри Севе', stars: 3 }],
    RW: [{ playerName: 'Садио Мане', stars: 5 }],
    LW: [{ playerName: 'Эль-Хаджи Диуф', stars: 4 }],
    ST: [
      { playerName: 'Мамаду Ньянг', stars: 4 },
      { playerName: 'Мусса Соу', stars: 3 },
      { playerName: 'Демба Ба', stars: 4 },
      { playerName: 'Булайе Диа', stars: 3 },
    ],
  },

  Марокко: {
    GK: [
      { playerName: 'Халид Фухами', stars: 2 },
      { playerName: 'Надир Ламьягри', stars: 2 },
      { playerName: 'Яссин Буну', stars: 4 },
    ],
    RB: [
      { playerName: 'Абдеслам Уадду', stars: 3 },
      { playerName: 'Ашраф Хакими', stars: 5 },
    ],
    CB: [
      { playerName: 'Талаль Эль-Каркури', stars: 3 },
      { playerName: 'Халид Булахруз', stars: 3 },
      { playerName: 'Меди Бенатиа', stars: 4 },
      { playerName: 'Ромен Саисс', stars: 3 },
    ],
    LB: [
      { playerName: 'Бадр Эль-Каддури', stars: 3 },
      { playerName: 'Фаузи Гулам', stars: 4 },
    ],
    CDM: [
      { playerName: 'Хусин Харджа', stars: 3 },
      { playerName: 'Карим Эль-Ахмади', stars: 3 },
    ],
    CM: [
      { playerName: 'Мурад Мсуба', stars: 2 },
      { playerName: 'Юнес Бельханда', stars: 4 },
      { playerName: 'Абдельазиз Баррада', stars: 3 },
      { playerName: 'Софьян Амрабат', stars: 4 },
    ],
    RM: [{ playerName: 'Мунир Эль-Хамдауи', stars: 3 }],
    LM: [{ playerName: 'Абдельхалик Эль-Джаади', stars: 2 }],
    RW: [{ playerName: 'Мунир Эль-Хаддади', stars: 3 }],
    LW: [{ playerName: 'Адель Таарабт', stars: 3 }],
    ST: [
      { playerName: 'Маруан Шамах', stars: 3 },
      { playerName: 'Юссеф Эль-Араби', stars: 3 },
      { playerName: 'Аюб Эль-Кааби', stars: 3 },
      { playerName: 'Юссеф Эн-Несири', stars: 4 },
    ],
  },

  Япония: {
    GK: [
      { playerName: 'Ёсикацу Кавагути', stars: 3 },
      { playerName: 'Эйдзи Кавасима', stars: 3 },
      { playerName: 'Сюити Гонда', stars: 3 },
    ],
    RB: [
      { playerName: 'Юити Комано', stars: 3 },
      { playerName: 'Хироки Сакаи', stars: 3 },
    ],
    CB: [
      { playerName: 'Юдзи Накадзава', stars: 3 },
      { playerName: 'Маркус Тулио Танака', stars: 3 },
      { playerName: 'Мая Ёсида', stars: 4 },
      { playerName: 'Готоку Сакаи', stars: 3 },
    ],
    LB: [
      { playerName: 'Юто Нагатомо', stars: 4 },
      { playerName: 'Даики Суга', stars: 3 },
    ],
    CDM: [
      { playerName: 'Дзюнъити Инамото', stars: 3 },
      { playerName: 'Макото Хасебе', stars: 4 },
    ],
    CM: [
      { playerName: 'Ясухито Эндо', stars: 4 },
      { playerName: 'Кэйсукэ Хонда', stars: 4 },
      { playerName: 'Синдзи Кагава', stars: 4 },
      { playerName: 'Гаку Сибасаки', stars: 3 },
    ],
    RM: [{ playerName: 'Ацуси Янагисава', stars: 3 }],
    LM: [{ playerName: 'Хироси Киётаке', stars: 3 }],
    RW: [{ playerName: 'Сюнсукэ Накамура', stars: 4 }],
    LW: [{ playerName: 'Такуя Хонда', stars: 2 }],
    ST: [
      { playerName: 'Наохиро Такахара', stars: 3 },
      { playerName: 'Синдзи Окадзаки', stars: 4 },
      { playerName: 'Юя Осако', stars: 3 },
      { playerName: 'Такуми Минамино', stars: 3 },
    ],
  },

  'Южная Корея': {
    GK: [
      { playerName: 'Ли Ун Чжэ', stars: 3 },
      { playerName: 'Чон Сон Рён', stars: 3 },
      { playerName: 'Ким Сын Гю', stars: 3 },
    ],
    RB: [
      { playerName: 'Чха Ду Ри', stars: 3 },
      { playerName: 'Ким Тхэ Хван', stars: 3 },
    ],
    CB: [
      { playerName: 'Чхве Джин Чхоль', stars: 3 },
      { playerName: 'Ким Ён Гвон', stars: 3 },
      { playerName: 'Ким Мин Джэ', stars: 4 },
      { playerName: 'Хон Джон Хо', stars: 3 },
    ],
    LB: [
      { playerName: 'Ли Ён Пхё', stars: 4 },
      { playerName: 'Ким Джин Су', stars: 3 },
    ],
    CDM: [
      { playerName: 'Ким Нам Иль', stars: 3 },
      { playerName: 'Ки Сон Ён', stars: 4 },
    ],
    CM: [
      { playerName: 'Ли Хо', stars: 3 },
      { playerName: 'Ку Джа Чхоль', stars: 3 },
      { playerName: 'Ли Джэ Сон', stars: 3 },
      { playerName: 'Чон У Ён', stars: 3 },
    ],
    RM: [{ playerName: 'Ли Чхон Ён', stars: 3 }],
    LM: [{ playerName: 'Ём Ки Хун', stars: 3 }],
    RW: [{ playerName: 'Пак Чи Сон', stars: 5 }],
    LW: [{ playerName: 'Сон Хын Мин', stars: 5 }],
    ST: [
      { playerName: 'Ан Джон Хван', stars: 3 },
      { playerName: 'Ли Дон Гук', stars: 3 },
      { playerName: 'Хван Хи Чхан', stars: 4 },
      { playerName: 'Чо Гю Сон', stars: 3 },
    ],
  },

  Иран: {
    GK: [
      { playerName: 'Эбрахим Мирзапур', stars: 2 },
      { playerName: 'Мехди Рахмати', stars: 3 },
      { playerName: 'Алиреза Бейранванд', stars: 3 },
    ],
    RB: [
      { playerName: 'Мехди Махдавикия', stars: 4 },
      { playerName: 'Рамин Резаян', stars: 3 },
    ],
    CB: [
      { playerName: 'Рахман Резаи', stars: 3 },
      { playerName: 'Яхья Голмохаммади', stars: 3 },
      { playerName: 'Джаляль Хоссейни', stars: 3 },
      { playerName: 'Мортеза Пуралиганджи', stars: 3 },
    ],
    LB: [
      { playerName: 'Эхсан Хаджсафи', stars: 3 },
      { playerName: 'Милад Мохаммади', stars: 3 },
    ],
    CDM: [
      { playerName: 'Джавад Некунам', stars: 4 },
      { playerName: 'Саид Эззатоллахи', stars: 3 },
    ],
    CM: [
      { playerName: 'Али Карими', stars: 4 },
      { playerName: 'Андраник Теймурян', stars: 3 },
      { playerName: 'Масуд Шоджаи', stars: 3 },
      { playerName: 'Омид Эбрахими', stars: 3 },
    ],
    RM: [{ playerName: 'Алиреза Джаханбахш', stars: 3 }],
    LM: [{ playerName: 'Вахид Амири', stars: 3 }],
    RW: [{ playerName: 'Мехди Махдавикия', stars: 4 }],
    LW: [{ playerName: 'Алиреза Вахеди Никбахт', stars: 3 }],
    ST: [
      { playerName: 'Али Даеи', stars: 5 },
      { playerName: 'Вахид Хашемян', stars: 3 },
      { playerName: 'Сардар Азмун', stars: 4 },
      { playerName: 'Мехди Тареми', stars: 4 },
    ],
  },

  Австралия: {
    GK: [
      { playerName: 'Марк Шварцер', stars: 4 },
      { playerName: 'Адам Федеричи', stars: 3 },
      { playerName: 'Мэттью Райан', stars: 3 },
    ],
    RB: [
      { playerName: 'Лукас Нил', stars: 3 },
      { playerName: 'Райан Грант', stars: 3 },
    ],
    CB: [
      { playerName: 'Крейг Мур', stars: 3 },
      { playerName: 'Мэттью Шпиранович', stars: 3 },
      { playerName: 'Трент Сейнсбери', stars: 3 },
      { playerName: 'Милош Дегенек', stars: 3 },
    ],
    LB: [
      { playerName: 'Скотт Чипперфилд', stars: 3 },
      { playerName: 'Азиз Бехич', stars: 3 },
    ],
    CDM: [
      { playerName: 'Винс Грелла', stars: 3 },
      { playerName: 'Майл Единак', stars: 3 },
    ],
    CM: [
      { playerName: 'Джейсон Чулина', stars: 3 },
      { playerName: 'Марк Брешиано', stars: 4 },
      { playerName: 'Аарон Муй', stars: 3 },
      { playerName: 'Джексон Ирвин', stars: 3 },
    ],
    RM: [{ playerName: 'Бретт Эмертон', stars: 3 }],
    LM: [{ playerName: 'Харри Кьюэлл', stars: 4 }],
    RW: [{ playerName: 'Тим Кэхилл', stars: 4 }],
    LW: [{ playerName: 'Мэттью Леки', stars: 3 }],
    ST: [
      { playerName: 'Марк Видука', stars: 4 },
      { playerName: 'Джон Алоизи', stars: 3 },
      { playerName: 'Джошуа Кеннеди', stars: 3 },
      { playerName: 'Апостолос Гианну', stars: 2 },
    ],
  },

  Чили: {
    GK: [
      { playerName: 'Нельсон Тапия', stars: 3 },
      { playerName: 'Клаудио Браво', stars: 4 },
      { playerName: 'Мигель Пинто', stars: 2 },
    ],
    RB: [
      { playerName: 'Пабло Контрерас', stars: 3 },
      { playerName: 'Маурисио Исла', stars: 3 },
    ],
    CB: [
      { playerName: 'Луис Фуэнтес', stars: 3 },
      { playerName: 'Вальдо Понсе', stars: 3 },
      { playerName: 'Гонсало Хара', stars: 3 },
      { playerName: 'Гари Медель', stars: 4 },
    ],
    LB: [
      { playerName: 'Гонсало Фьерро', stars: 3 },
      { playerName: 'Эухенио Мена', stars: 3 },
    ],
    CDM: [
      { playerName: 'Родриго Мильяр', stars: 3 },
      { playerName: 'Марсело Диас', stars: 3 },
    ],
    CM: [
      { playerName: 'Матиас Фернандес', stars: 4 },
      { playerName: 'Артуро Видаль', stars: 5 },
      { playerName: 'Чарлес Арангис', stars: 4 },
      { playerName: 'Эрик Пульгар', stars: 3 },
    ],
    RM: [{ playerName: 'Марк Гонсалес', stars: 3 }],
    LM: [{ playerName: 'Жан Босежур', stars: 3 }],
    RW: [{ playerName: 'Алексис Санчес', stars: 5 }],
    LW: [{ playerName: 'Фабиан Орельяна', stars: 3 }],
    ST: [
      { playerName: 'Умберто Суасо', stars: 3 },
      { playerName: 'Эдуардо Варгас', stars: 3 },
      { playerName: 'Маурисио Пинилья', stars: 3 },
      { playerName: 'Фелипе Мора', stars: 3 },
    ],
  },

  Эквадор: {
    GK: [
      { playerName: 'Хосе Франсиско Севальос', stars: 3 },
      { playerName: 'Александер Домингес', stars: 3 },
      { playerName: 'Максимо Бангера', stars: 2 },
    ],
    RB: [
      { playerName: 'Улисес де ла Крус', stars: 3 },
      { playerName: 'Хуан Карлос Паредес', stars: 3 },
    ],
    CB: [
      { playerName: 'Иван Уртадо', stars: 3 },
      { playerName: 'Хиованни Эспиноса', stars: 3 },
      { playerName: 'Фриксон Эрасо', stars: 3 },
      { playerName: 'Габриэль Ачильер', stars: 3 },
    ],
    LB: [
      { playerName: 'Вальтер Айови', stars: 3 },
      { playerName: 'Первис Эступиньян', stars: 4 },
    ],
    CDM: [
      { playerName: 'Эдвин Тенорио', stars: 3 },
      { playerName: 'Сегундо Кастильо', stars: 3 },
    ],
    CM: [
      { playerName: 'Луис Саритама', stars: 3 },
      { playerName: 'Кристиан Нобоа', stars: 4 },
      { playerName: 'Карлос Груэсо', stars: 3 },
      { playerName: 'Антонио Валенсия', stars: 4 },
    ],
    RM: [{ playerName: 'Ренато Ибарра', stars: 3 }],
    LM: [{ playerName: 'Джоффре Геррон', stars: 3 }],
    RW: [{ playerName: 'Фелипе Кайседо', stars: 3 }],
    LW: [{ playerName: 'Эннер Валенсия', stars: 4 }],
    ST: [
      { playerName: 'Агустин Дельгадо', stars: 4 },
      { playerName: 'Карлос Тенорио', stars: 3 },
      { playerName: 'Микаэль Эстрада', stars: 3 },
      { playerName: 'Хоао Рохас', stars: 3 },
    ],
  },

  Сербия: {
    GK: [
      { playerName: 'Владимир Стойкович', stars: 3 },
      { playerName: 'Боян Йоргачевич', stars: 2 },
      { playerName: 'Предраг Райкович', stars: 3 },
    ],
    RB: [
      { playerName: 'Бранислав Иванович', stars: 4 },
      { playerName: 'Ненад Томович', stars: 3 },
    ],
    CB: [
      { playerName: 'Неманья Видич', stars: 5 },
      { playerName: 'Невен Суботич', stars: 4 },
      { playerName: 'Александар Коларов', stars: 4 },
      { playerName: 'Никола Миленкович', stars: 3 },
    ],
    LB: [
      { playerName: 'Иван Обрадович', stars: 3 },
      { playerName: 'Филип Младенович', stars: 3 },
    ],
    CDM: [
      { playerName: 'Деян Станкович', stars: 4 },
      { playerName: 'Неманья Матич', stars: 4 },
    ],
    CM: [
      { playerName: 'Здравко Кузманович', stars: 3 },
      { playerName: 'Любомир Фейса', stars: 3 },
      { playerName: 'Неманья Гудель', stars: 3 },
      { playerName: 'Душан Тадич', stars: 4 },
    ],
    RM: [{ playerName: 'Милош Красич', stars: 3 }],
    LM: [{ playerName: 'Зоран Тошич', stars: 3 }],
    RW: [{ playerName: 'Адем Льяич', stars: 3 }],
    LW: [{ playerName: 'Лазар Маркович', stars: 3 }],
    ST: [
      { playerName: 'Никола Жигич', stars: 3 },
      { playerName: 'Марко Пантелич', stars: 3 },
      { playerName: 'Александар Митрович', stars: 4 },
      { playerName: 'Лука Йович', stars: 4 },
    ],
  },

  Турция: {
    GK: [
      { playerName: 'Рюштю Речбер', stars: 4 },
      { playerName: 'Волкан Демирель', stars: 3 },
      { playerName: 'Фехми Мерт Гюнок', stars: 3 },
    ],
    RB: [
      { playerName: 'Хамит Алтынтоп', stars: 4 },
      { playerName: 'Гёкхан Гёнюл', stars: 3 },
    ],
    CB: [
      { playerName: 'Алпай Озалан', stars: 3 },
      { playerName: 'Сервет Четин', stars: 3 },
      { playerName: 'Гёкхан Зан', stars: 3 },
      { playerName: 'Чаглар Сёюнджю', stars: 4 },
    ],
    LB: [
      { playerName: 'Хакан Балта', stars: 3 },
      { playerName: 'Умут Мераш', stars: 3 },
    ],
    CDM: [
      { playerName: 'Эмре Белёзоглу', stars: 4 },
      { playerName: 'Мехмет Топал', stars: 3 },
    ],
    CM: [
      { playerName: 'Тюмер Метин', stars: 3 },
      { playerName: 'Нури Шахин', stars: 4 },
      { playerName: 'Озан Туфан', stars: 3 },
      { playerName: 'Хакан Чалханоглу', stars: 4 },
    ],
    RM: [{ playerName: 'Гёкдениз Карадениз', stars: 4 }],
    LM: [{ playerName: 'Арда Туран', stars: 4 }],
    RW: [{ playerName: 'Нихат Кахведжи', stars: 4 }],
    LW: [{ playerName: 'Бурак Йылмаз', stars: 4 }],
    ST: [
      { playerName: 'Хакан Шукюр', stars: 5 },
      { playerName: 'Семих Шентюрк', stars: 3 },
      { playerName: 'Дженк Тосун', stars: 3 },
      { playerName: 'Умут Булут', stars: 3 },
    ],
  },
}

