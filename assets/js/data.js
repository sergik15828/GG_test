/**
 * Сид-датасет модуля «Разбор».
 *
 * Тексты вопросов и вариантов — на английском (экзамен англоязычный).
 * Все объяснения, названия ловушек и подписи — на русском.
 *
 * Схема записи:
 *   id          string            уникальный идентификатор
 *   section     'rw' | 'math'     секция Digital SAT
 *   domain      string            домен College Board (англ., как в отчёте о баллах)
 *   skill       string            конкретный навык внутри домена (англ.)
 *   difficulty  'easy'|'medium'|'hard'
 *   targetSec   number            ориентир по времени на вопрос, секунды
 *   passage     string | null     текст-стимул, англ.
 *   stem        string            формулировка вопроса, англ.
 *   choices     Array<{ text, why }>  ровно 4 варианта; why — рус. разбор варианта
 *   correct     number            индекс верного варианта в choices
 *   explanation string            рус., ход рассуждения к верному ответу
 *   trap        string            рус., короткое имя ловушки
 */
var QUESTIONS = [
  /* ---------------------------------- Reading & Writing --------------------------------- */
  {
    id: 'rw-01',
    section: 'rw',
    domain: 'Craft and Structure',
    skill: 'Words in Context',
    difficulty: 'medium',
    targetSec: 75,
    passage:
      'Marine biologist Kakani Katija studies gelatinous zooplankton, animals so delicate that ' +
      'traditional sampling nets destroy them on contact. To observe these creatures without ' +
      'harming them, Katija’s team developed DeepPIV, an imaging system that reconstructs the ' +
      'animals’ internal structures in three dimensions while they drift undisturbed. The ' +
      'instrument therefore allows researchers to gather data that would otherwise remain ______.',
    stem: 'Which choice completes the text with the most logical and precise word or phrase?',
    choices: [
      {
        text: 'inaccessible',
        why: 'Верно. Логика текста: сети уничтожают животных, поэтому данные о них получить нельзя. ' +
          'DeepPIV снимает именно это препятствие — значит, без него данные оставались бы недоступными.'
      },
      {
        text: 'unpopular',
        why: 'Оценочное слово о популярности. В тексте нет ни слова о том, что этими данными кто-то ' +
          'не интересуется, — проблема техническая, а не в отношении исследователей.'
      },
      {
        text: 'theoretical',
        why: 'Звучит «по-научному» и потому притягивает. Но текст противопоставляет не теорию и практику, ' +
          'а возможность и невозможность собрать данные физически.'
      },
      {
        text: 'approximate',
        why: 'Про точность данных. Текст же говорит о самой возможности их получить: без прибора ' +
          'наблюдения не будет вообще, а не будет неточным.'
      }
    ],
    correct: 0,
    explanation:
      'В Words in Context ответ всегда восстанавливается из логики самого текста, а не из общего ' +
      'значения слова. Здесь связка «сети уничтожают животных → нужен щадящий прибор → он даёт данные» ' +
      'требует слова со смыслом «которые иначе получить нельзя». Подставь свой вариант в пропуск ' +
      'до того, как посмотришь на варианты, — так ловушки перестают работать.',
    trap: 'Слово звучит научно, но не следует из текста'
  },
  {
    id: 'rw-02',
    section: 'rw',
    domain: 'Information and Ideas',
    skill: 'Central Ideas and Details',
    difficulty: 'medium',
    targetSec: 75,
    passage:
      'In 2019, archaeologist Nadia Durrani reexamined pottery fragments excavated from a site in ' +
      'southern Arabia during the 1950s. The original excavators had catalogued the fragments as ' +
      'imports from the Mediterranean, citing the distinctive glaze. Durrani’s chemical analysis of ' +
      'the clay, however, matched deposits located fewer than thirty kilometers from the site itself. ' +
      'She argues that the fragments show a local workshop imitating Mediterranean styles rather than ' +
      'evidence of a long-distance trade route.',
    stem: 'Which choice best states the main idea of the text?',
    choices: [
      {
        text: 'Durrani’s analysis indicates that artifacts long believed to be imported were in fact produced locally.',
        why: 'Верно. Ровно то, что утверждает текст: новый анализ глины переворачивает прежнюю атрибуцию.'
      },
      {
        text: 'Durrani demonstrated that the excavation carried out in the 1950s was conducted carelessly.',
        why: 'Обвинение, которого в тексте нет. Прежние археологи сделали вывод по глазури — это ' +
          'разумно для своего времени, а не небрежность. Ты достроил оценку, которой автор не давал.'
      },
      {
        text: 'Mediterranean pottery styles were widely copied by workshops throughout southern Arabia.',
        why: 'Расширение масштаба: в тексте один участок и одна мастерская, в варианте — «по всей южной ' +
          'Аравии». Самая частая ловушка в Central Ideas.'
      },
      {
        text: 'Chemical analysis is a more reliable method than visual inspection for dating artifacts.',
        why: 'Про датировку речи вообще не было — спор шёл о происхождении. Плюс обобщение метода, ' +
          'которого автор не делает.'
      }
    ],
    correct: 0,
    explanation:
      'Главная мысль обязана покрывать весь текст и не выходить за его границы. Проверяй кандидата ' +
      'двумя вопросами: «это сказано в тексте?» и «это не шире текста?». Варианты про небрежность ' +
      'раскопок и про надёжность метода проваливают первый вопрос, вариант про всю Аравию — второй.',
    trap: 'Вывод шире, чем сам текст'
  },
  {
    id: 'rw-03',
    section: 'rw',
    domain: 'Craft and Structure',
    skill: 'Text Structure and Purpose',
    difficulty: 'hard',
    targetSec: 85,
    passage:
      'Economists have long assumed that people value a good more highly as soon as they own it, a ' +
      'pattern known as the endowment effect. Recent replications, however, have found that the effect ' +
      'nearly vanishes when participants are given a few practice trades before the experiment begins. ' +
      'This does not mean that the endowment effect is an illusion. Rather, it suggests that the effect ' +
      'measures inexperience with trading at least as much as it measures attachment to possessions.',
    stem: 'Which choice best describes the function of the underlined sentence ("This does not mean that the endowment effect is an illusion") in the text as a whole?',
    choices: [
      {
        text: 'It limits the conclusion a reader might draw from the replications before the author offers a revised interpretation.',
        why: 'Верно. Предложение блокирует поспешный вывод «эффекта не существует» и расчищает место ' +
          'для формулировки после «Rather».'
      },
      {
        text: 'It concedes a significant weakness in the studies that the author has just described.',
        why: 'Автор ничего не уступает: он защищает эффект, а не признаёт слабость репликаций. ' +
          'Слово «однако» выше заставляет ждать уступки, но она уже произошла раньше.'
      },
      {
        text: 'It introduces new evidence that contradicts the results of the replications.',
        why: 'Никаких новых данных здесь нет — это утверждение автора, а не доказательство. ' +
          'Путать «автор что-то заявил» и «автор привёл доказательство» — типичная ошибка.'
      },
      {
        text: 'It restates the definition of the endowment effect given in the first sentence.',
        why: 'Определение уже дано в первом предложении и здесь не повторяется — упомянуто только ' +
          'название. Вариант описывает содержание, а не функцию.'
      }
    ],
    correct: 0,
    explanation:
      'Вопросы на функцию спрашивают, что предложение ДЕЛАЕТ в тексте, а не о чём оно. Приём: закрой ' +
      'предложение и спроси, что сломается. Уберёшь его — и «Rather» повиснет без опоры, а читатель ' +
      'останется с выводом «эффекта нет». Значит, его работа — ограничить вывод и подготовить поворот.',
    trap: 'Отвечаешь на «о чём», а спросили «зачем»'
  },
  {
    id: 'rw-04',
    section: 'rw',
    domain: 'Standard English Conventions',
    skill: 'Boundaries',
    difficulty: 'medium',
    targetSec: 60,
    passage: null,
    stem:
      'Ecologist Suzanne Simard traced radioactive carbon moving between Douglas fir and paper birch ' +
      '______ two species exchange nutrients through a shared network of underground fungi.\n\n' +
      'Which choice completes the text so that it conforms to the conventions of Standard English?',
    choices: [
      {
        text: 'trees; the',
        why: 'Верно. Слева и справа от пропуска — два самостоятельных предложения. Точка с запятой ' +
          'связывает их и остаётся законной границей.'
      },
      {
        text: 'trees, the',
        why: 'Запятая между двумя самостоятельными предложениями — comma splice. На слух пауза уместна, ' +
          'поэтому вариант и выбирают чаще остальных, но по правилам запятой одной мало.'
      },
      {
        text: 'trees the',
        why: 'Границы нет вообще — предложения слипаются в run-on.'
      },
      {
        text: 'trees, and, the',
        why: 'Сама связка «, and» была бы допустима, но вторая запятая после and отрезает союз от ' +
          'подлежащего. Правильная идея, испорченная лишним знаком.'
      }
    ],
    correct: 0,
    explanation:
      'Алгоритм для Boundaries: закрой пропуск и проверь, что стоит слева и справа. Здесь слева ' +
      '«Simard traced carbon...» — законченное предложение, справа «two species exchange nutrients...» — ' +
      'тоже. Два самостоятельных предложения соединяются точкой, точкой с запятой или запятой ' +
      'вместе с сочинительным союзом. Одной запятой — никогда.',
    trap: 'Запятая кажется достаточной границей'
  },
  {
    id: 'rw-05',
    section: 'rw',
    domain: 'Expression of Ideas',
    skill: 'Transitions',
    difficulty: 'medium',
    targetSec: 70,
    passage:
      'Most rechargeable batteries lose capacity as they age, because repeated charging cracks the ' +
      'electrode material. A team of engineers has developed an electrode coated in a self-healing ' +
      'polymer that reforms its own bonds after every charging cycle. ______ batteries built with the ' +
      'coating retained ninety percent of their original capacity after one thousand cycles.',
    stem: 'Which choice completes the text with the most logical transition?',
    choices: [
      {
        text: 'As a result,',
        why: 'Верно. Третье предложение — измеренное следствие второго: покрытие восстанавливает связи, ' +
          'поэтому ёмкость сохраняется.'
      },
      {
        text: 'However,',
        why: 'Требует противопоставления, но третье предложение подтверждает второе, а не спорит с ним. ' +
          'Проверка: между разработкой и её удачным результатом контраста нет.'
      },
      {
        text: 'For example,',
        why: 'Самая живучая подмена: следствие принимают за пример. Числа в предложении создают ' +
          'ощущение иллюстрации, но это не пример покрытия, а результат его работы.'
      },
      {
        text: 'In contrast,',
        why: 'То же, что и However: контраста в тексте нет. Два «противительных» варианта рядом — ' +
          'сигнал, что оба скорее всего лишние.'
      }
    ],
    correct: 0,
    explanation:
      'Переходы решаются без чтения вариантов. Сформулируй связь между соседними предложениями своими ' +
      'словами: «сделали покрытие → поэтому ёмкость держится». Связь причинно-следственная, значит ' +
      'нужен коннектор следствия. И только потом смотри на варианты.',
    trap: 'Следствие принимают за пример'
  },
  {
    id: 'rw-06',
    section: 'rw',
    domain: 'Standard English Conventions',
    skill: 'Form, Structure, and Sense',
    difficulty: 'easy',
    targetSec: 55,
    passage: null,
    stem:
      'The collection of manuscripts donated to the university library by the descendants of the poet ' +
      '______ several letters that have never been published.\n\n' +
      'Which choice completes the text so that it conforms to the conventions of Standard English?',
    choices: [
      {
        text: 'includes',
        why: 'Верно. Подлежащее — collection, единственное число. Всё между ним и глаголом — ' +
          'определения, на число они не влияют.'
      },
      {
        text: 'include',
        why: 'Согласование с ближайшим словом descendants вместо настоящего подлежащего. Именно на ' +
          'это и рассчитана длинная вставка между подлежащим и глаголом.'
      },
      {
        text: 'are including',
        why: 'Дважды мимо: и число неверное, и продолженное время не подходит для постоянного ' +
          'свойства коллекции.'
      },
      {
        text: 'have included',
        why: 'Множественное число плюс завершённое время, которое намекает, что писем там уже нет. ' +
          'Смысл предложения — описание нынешнего состава коллекции.'
      }
    ],
    correct: 0,
    explanation:
      'Приём: вычеркни всё между подлежащим и глаголом. Остаётся «The collection ______ several ' +
      'letters» — и выбор становится очевидным. Существительное, стоящее ближе всего к глаголу, ' +
      'почти никогда не является подлежащим в таких заданиях: длинную вставку туда ставят намеренно.',
    trap: 'Существительное рядом с глаголом принял за подлежащее'
  },

  /* --------------------------------------- Math ----------------------------------------- */
  {
    id: 'math-01',
    section: 'math',
    domain: 'Algebra',
    skill: 'Linear equations in one variable',
    difficulty: 'easy',
    targetSec: 75,
    passage: null,
    stem: 'If 3(x − 4) + 5 = 2x + 7, what is the value of x?',
    choices: [
      {
        text: '14',
        why: 'Верно. 3x − 12 + 5 = 2x + 7 → 3x − 7 = 2x + 7 → x = 14.'
      },
      {
        text: '6',
        why: 'Множитель 3 не был распределён на −4: получилось 3x − 4 + 5 = 2x + 7. ' +
          'Самая частая ошибка в раскрытии скобок.'
      },
      {
        text: '24',
        why: 'Знак при сложении −12 и +5: посчитано −17 вместо −7.'
      },
      {
        text: '7',
        why: 'Число просто взято из правой части уравнения. Так выглядит ответ, выбранный ' +
          'на нехватке времени.'
      }
    ],
    correct: 0,
    explanation:
      'Раскрой скобки полностью, приведи подобные, собери x слева, числа справа. Проверка занимает ' +
      'пять секунд и ловит обе арифметические ловушки: подставь x = 14 → 3(10) + 5 = 35 и ' +
      '2(14) + 7 = 35. Сходится.',
    trap: 'Множитель распределён не на все слагаемые в скобках'
  },
  {
    id: 'math-02',
    section: 'math',
    domain: 'Advanced Math',
    skill: 'Nonlinear functions',
    difficulty: 'medium',
    targetSec: 95,
    passage: null,
    stem: 'The function f is defined by f(x) = 2x² − 12x + 22. What is the minimum value of f(x)?',
    choices: [
      {
        text: '4',
        why: 'Верно. Вершина при x = 12 / (2·2) = 3, тогда f(3) = 18 − 36 + 22 = 4.'
      },
      {
        text: '3',
        why: 'Найдена координата x вершины, и на этом решение остановилось. Вопрос спрашивает ' +
          'минимальное ЗНАЧЕНИЕ функции, то есть y.'
      },
      {
        text: '22',
        why: 'Это f(0) — свободный член. Он равен значению в точке x = 0, а не минимуму.'
      },
      {
        text: '−4',
        why: 'Знак: минимум перепутан с −f(3) либо потерян минус при подстановке. ' +
          'Парабола с ветвями вверх и положительным минимумом отрицательного значения дать не может.'
      }
    ],
    correct: 0,
    explanation:
      'У параболы с a > 0 минимум достигается в вершине. Найди x = −b / (2a), затем обязательно ' +
      'подставь его обратно в функцию. Половина потерянных баллов здесь — остановка на x, ' +
      'когда спрашивали y. Перечитывай вопрос перед тем, как отметить ответ.',
    trap: 'Найден x вершины вместо значения функции'
  },
  {
    id: 'math-03',
    section: 'math',
    domain: 'Problem-Solving and Data Analysis',
    skill: 'Percentages',
    difficulty: 'medium',
    targetSec: 90,
    passage: null,
    stem:
      'A laptop is on sale for 20% off its original price. A customer also applies a coupon that ' +
      'takes an additional 10% off the sale price. The final price is what percent of the original price?',
    choices: [
      {
        text: '72%',
        why: 'Верно. 0,80 · 0,90 = 0,72, то есть 72% исходной цены.'
      },
      {
        text: '70%',
        why: 'Скидки сложены: 20% + 10% = 30%, значит осталось 70%. Но вторая скидка берётся ' +
          'от уже сниженной цены, а не от исходной. Ловушка номер один в теме процентов.'
      },
      {
        text: '30%',
        why: 'Посчитан суммарный размер скидки, да ещё и неверно. Вопрос спрашивает про итоговую цену.'
      },
      {
        text: '28%',
        why: 'Это размер реальной скидки (100% − 72%). Верная арифметика, но отвечено ' +
          'не на тот вопрос.'
      }
    ],
    correct: 0,
    explanation:
      'Последовательные скидки перемножаются, а не складываются. Переводи каждую в множитель: ' +
      '−20% → ·0,8, −10% → ·0,9. Итог 0,72. И отдельно проверь, ' +
      'что спрашивают: итоговую цену или размер скидки — здесь оба числа есть среди вариантов.',
    trap: 'Последовательные скидки сложены вместо перемножения'
  },
  {
    id: 'math-04',
    section: 'math',
    domain: 'Geometry and Trigonometry',
    skill: 'Right triangles and trigonometry',
    difficulty: 'medium',
    targetSec: 85,
    passage: null,
    stem: 'In right triangle ABC, angle B is a right angle, AB = 6, and BC = 8. What is the value of sin A?',
    choices: [
      {
        text: '0.8',
        why: 'Верно. AC = 10 по теореме Пифагора. Против угла A лежит BC = 8, гипотенуза 10, ' +
          'значит sin A = 8/10 = 0,8.'
      },
      {
        text: '0.6',
        why: 'Это cos A: взят прилежащий катет AB = 6 вместо противолежащего. Самая частая путаница ' +
          'в тригонометрии на SAT.'
      },
      {
        text: '1.33',
        why: 'Это tan A = 8/6: вместо гипотенузы в знаменателе оказался второй катет.'
      },
      {
        text: '0.75',
        why: 'Отношение 6/8 — перевёрнутый тангенс. Оба катета на месте, но синус тут ни при чём.'
      }
    ],
    correct: 0,
    explanation:
      'Сначала найди недостающую сторону: 6² + 8² = 10². Затем определи, какой катет ' +
      'противолежит углу A — это тот, что его не касается, то есть BC. Синус — противолежащий на ' +
      'гипотенузу. Отметь угол на чертеже пальцем: сторона, до которой не дотягиваешься, и есть ' +
      'противолежащая.',
    trap: 'Противолежащий катет перепутан с прилежащим'
  },
  {
    id: 'math-05',
    section: 'math',
    domain: 'Problem-Solving and Data Analysis',
    skill: 'Ratios, rates, and units',
    difficulty: 'easy',
    targetSec: 80,
    passage: null,
    stem:
      'A machine fills bottles at a constant rate of 18 bottles per minute. How many bottles does ' +
      'the machine fill in 2 hours and 15 minutes?',
    choices: [
      {
        text: '2,430',
        why: 'Верно. 2 ч 15 мин = 135 минут, 135 · 18 = 2430.'
      },
      {
        text: '2,322',
        why: '2 ч 15 мин прочитано как 2,15 часа: 2,15 · 60 = 129 минут. Но 15 минут — ' +
          'это четверть часа, то есть 2,25 часа.'
      },
      {
        text: '2,160',
        why: 'Учтены только 2 часа = 120 минут, лишние 15 минут потеряны при переводе.'
      },
      {
        text: '270',
        why: 'Взяты только 15 минут. Часы выпали из расчёта целиком — след спешки, а не незнания.'
      }
    ],
    correct: 0,
    explanation:
      'Приводи всё к одной единице до начала вычислений: скорость дана в минутах, значит и время ' +
      'переводи в минуты. 2 · 60 + 15 = 135. Запись «2 ч 15 мин» в десятичной форме — это 2,25 ч, ' +
      'а не 2,15 ч; эта подмена стоит балла чаще, чем любая арифметика.',
    trap: '2 ч 15 мин записано как 2,15 часа'
  },
  {
    id: 'math-06',
    section: 'math',
    domain: 'Algebra',
    skill: 'Linear functions',
    difficulty: 'hard',
    targetSec: 105,
    passage: null,
    stem:
      'A gym charges a one-time registration fee plus a fixed monthly rate. A member who has paid ' +
      'for 4 months has paid $190 in total. A member who has paid for 9 months has paid $390 in total. ' +
      'What is the registration fee?',
    choices: [
      {
        text: '$30',
        why: 'Верно. Месячная плата (390 − 190) / (9 − 4) = 40. Взнос: 190 − 4 · 40 = 30.'
      },
      {
        text: '$40',
        why: 'Найден наклон — ежемесячный платёж — и решение остановилось. Это верное число, ' +
          'но ответ на другой вопрос.'
      },
      {
        text: '$47.50',
        why: '190 / 4: вся сумма поделена на месяцы, как будто разового взноса не существует. ' +
          'Тогда модель перестаёт объяснять вторую пару чисел.'
      },
      {
        text: '$150',
        why: '190 − 40: вычтен один месяц вместо четырёх. Арифметика верная, потеряна ' +
          'только четвёрка.'
      }
    ],
    correct: 0,
    explanation:
      'Формат «фиксированный взнос плюс регулярный платёж» — это линейная функция y = mx + b, где ' +
      'm — ежемесячная плата, b — взнос. Наклон находится по двум точкам: (4, 190) и (9, 390). ' +
      'Дальше подставь любую точку и найди b. Проверь на второй: 9 · 40 + 30 = 390. Сходится.',
    trap: 'Найден наклон, а спрашивали свободный член'
  }
];

/** Причины ошибок. Порядок фиксированный: используется в отчёте «где я теряю баллы». */
var REASONS = [
  { id: 'topic',     label: 'Не знал тему',        hint: 'Правило или формула не выучены' },
  { id: 'question',  label: 'Не понял вопрос',     hint: 'Решал не то, что спрашивали' },
  { id: 'trap',      label: 'Повёлся на ловушку',  hint: 'Вариант выглядел правдоподобно' },
  { id: 'careless',  label: 'Невнимательность',    hint: 'Знал, но ошибся механически' },
  { id: 'time',      label: 'Не хватило времени',  hint: 'Торопился и выбрал наугад' }
];

/** Рекомендации под каждую причину — подставляются в отчёт. */
var REASON_ADVICE = {
  topic:    'Тема не закрыта. Вернись к теории по этим доменам до того, как решать дальше: ' +
            'дриллы поверх пробела только закрепляют угадывание.',
  question: 'Ты решаешь верно, но не то. Перед тем как отметить ответ, перечитай последнюю строку ' +
            'вопроса и спроси себя, о какой величине спрашивают.',
  trap:     'Тебя ловят дистракторы. Формулируй ответ своими словами до того, как посмотришь ' +
            'на варианты, — тогда правдоподобный вариант перестаёт быть притягательным.',
  careless: 'Материал ты знаешь, теряешь на механике. Заложи пять секунд на проверку подстановкой ' +
            'в каждом вычислительном вопросе.',
  time:     'Скорость решает не всё: помечай тяжёлый вопрос и возвращайся к нему. Один вопрос, ' +
            'съевший три минуты, стоит дороже, чем кажется.'
};

/** Человеческие подписи для секций и сложности. */
var SECTION_LABEL = { rw: 'Reading & Writing', math: 'Math' };
var DIFFICULTY_LABEL = { easy: 'Лёгкий', medium: 'Средний', hard: 'Сложный' };
