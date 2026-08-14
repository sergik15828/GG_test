/**
 * Хранилище модуля «Разбор».
 *
 * Одна версионированная запись в localStorage:
 *   { version, stats, deck, seenIds, lastVisit }
 *
 * localStorage может быть недоступен (приватный режим, отключённые куки, file:// в части
 * сборок браузеров). Поэтому любое обращение обёрнуто в try/catch: при отказе модуль
 * переходит в режим «только память» — приложение продолжает работать, данные живут до
 * закрытия вкладки.
 */
var Store = (function () {
  var KEY = 'gg_sat_review_v1';
  var VERSION = 1;
  var SESSION_SIZE = 6;

  /**
   * Лестница интервалов SRS: индекс — ступень карточки, значение — через сколько дней
   * она вернётся после верного ответа. Ступень MASTERED (= длина массива) значит «усвоено»:
   * карточка больше не всплывает.
   */
  var STAGE_DAYS = [0, 1, 3, 7];
  var MASTERED = STAGE_DAYS.length;

  var persistent = true; // false, если localStorage недоступен
  var state = null;

  /* ------------------------------- даты (по календарным дням) ------------------------------ */

  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  /** Ключ дня в локальном времени: YYYY-MM-DD. Все сравнения дат идут по нему, не по timestamp. */
  function dayKey(date) {
    var d = date ? new Date(date) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function parseDay(key) {
    if (typeof key !== 'string') return null;
    var parts = key.split('-');
    if (parts.length !== 3) return null;
    var y = parseInt(parts[0], 10);
    var m = parseInt(parts[1], 10);
    var d = parseInt(parts[2], 10);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  /** Сколько календарных дней от дня `fromKey` до дня `toKey` (может быть отрицательным). */
  function daysBetween(fromKey, toKey) {
    var a = parseDay(fromKey);
    var b = parseDay(toKey);
    if (!a || !b) return 0;
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  function shiftDay(key, days) {
    var d = parseDay(key) || new Date();
    d.setDate(d.getDate() + days);
    return dayKey(d);
  }

  /* --------------------------------- чтение и валидация ------------------------------------ */

  function defaultState() {
    return {
      version: VERSION,
      stats: { answered: 0, correct: 0, mistakes: 0, sessions: 0 },
      deck: [],
      seenIds: [],
      lastVisit: null
    };
  }

  function num(value) {
    var n = Number(value);
    return isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  }

  function questionExists(id) {
    for (var i = 0; i < QUESTIONS.length; i++) {
      if (QUESTIONS[i].id === id) return true;
    }
    return false;
  }

  function reasonExists(id) {
    for (var i = 0; i < REASONS.length; i++) {
      if (REASONS[i].id === id) return true;
    }
    return false;
  }

  /** Приводим карточку к схеме; мусор отбрасываем, чтобы рендер не падал на битых данных. */
  function sanitizeCard(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (!questionExists(raw.questionId)) return null;

    var stage = num(raw.stage);
    if (stage > MASTERED) stage = MASTERED;

    return {
      questionId: raw.questionId,
      reasonId: reasonExists(raw.reasonId) ? raw.reasonId : REASONS[0].id,
      stage: stage,
      dueAt: parseDay(raw.dueAt) ? raw.dueAt : dayKey(),
      wrongCount: Math.max(1, num(raw.wrongCount)),
      addedAt: typeof raw.addedAt === 'string' ? raw.addedAt : new Date().toISOString(),
      lastResult: raw.lastResult === 'correct' ? 'correct' : 'wrong'
    };
  }

  function sanitizeState(raw) {
    if (!raw || typeof raw !== 'object') return null;
    if (raw.version !== VERSION) return null; // мягкий сброс при смене версии схемы

    var fresh = defaultState();
    var stats = raw.stats && typeof raw.stats === 'object' ? raw.stats : {};
    fresh.stats = {
      answered: num(stats.answered),
      correct: num(stats.correct),
      mistakes: num(stats.mistakes),
      sessions: num(stats.sessions)
    };
    if (fresh.stats.correct > fresh.stats.answered) fresh.stats.correct = fresh.stats.answered;

    var deck = [];
    var seenCardIds = {};
    if (Object.prototype.toString.call(raw.deck) === '[object Array]') {
      for (var i = 0; i < raw.deck.length; i++) {
        var card = sanitizeCard(raw.deck[i]);
        if (card && !seenCardIds[card.questionId]) {
          seenCardIds[card.questionId] = true;
          deck.push(card);
        }
      }
    }
    fresh.deck = deck;

    if (Object.prototype.toString.call(raw.seenIds) === '[object Array]') {
      var seen = [];
      for (var j = 0; j < raw.seenIds.length; j++) {
        var id = raw.seenIds[j];
        if (questionExists(id) && seen.indexOf(id) === -1) seen.push(id);
      }
      fresh.seenIds = seen;
    }

    fresh.lastVisit = typeof raw.lastVisit === 'string' ? raw.lastVisit : null;
    return fresh;
  }

  function load() {
    var raw = null;
    try {
      raw = window.localStorage.getItem(KEY);
    } catch (e) {
      persistent = false;
      return defaultState();
    }
    if (!raw) return defaultState();

    var parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return defaultState(); // битый JSON — начинаем с чистого состояния
    }
    return sanitizeState(parsed) || defaultState();
  }

  function save() {
    if (!persistent) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      persistent = false; // квота или приватный режим — дальше живём в памяти
    }
  }

  function ensure() {
    if (!state) state = load();
    return state;
  }

  /* ------------------------------------- выборка вопросов ---------------------------------- */

  /** Перемешивание Фишера — Йетса. Используется и для отбора вопросов, и для вариантов ответа. */
  function shuffle(list) {
    var arr = list.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function questionById(id) {
    for (var i = 0; i < QUESTIONS.length; i++) {
      if (QUESTIONS[i].id === id) return QUESTIONS[i];
    }
    return null;
  }

  /**
   * Отбор вопросов в сессию.
   * Приоритет — те, что студент ещё не видел; невиденные идут первыми в каждой секции.
   * Цель по составу — половина Reading & Writing, половина Math; если в одной секции
   * материала не хватает, добираем из общего остатка, а не падаем.
   */
  function pickSession(size) {
    var total = size || SESSION_SIZE;
    var seen = ensure().seenIds;

    function pool(section) {
      var unseen = [];
      var already = [];
      for (var i = 0; i < QUESTIONS.length; i++) {
        var q = QUESTIONS[i];
        if (q.section !== section) continue;
        if (seen.indexOf(q.id) === -1) unseen.push(q);
        else already.push(q);
      }
      return shuffle(unseen).concat(shuffle(already));
    }

    var rw = pool('rw');
    var math = pool('math');
    var half = Math.floor(total / 2);
    var picked = rw.slice(0, half).concat(math.slice(0, total - half));

    // Добор, если в какой-то секции вопросов оказалось меньше нормы.
    if (picked.length < total) {
      var rest = rw.slice(half).concat(math.slice(total - half));
      for (var k = 0; k < rest.length && picked.length < total; k++) {
        if (picked.indexOf(rest[k]) === -1) picked.push(rest[k]);
      }
    }
    return shuffle(picked);
  }

  /* ---------------------------------------- колода ----------------------------------------- */

  function findCard(questionId) {
    var deck = ensure().deck;
    for (var i = 0; i < deck.length; i++) {
      if (deck[i].questionId === questionId) return deck[i];
    }
    return null;
  }

  /**
   * Ошибка по вопросу кладёт карточку в колоду.
   * Одна карточка на вопрос: повторная ошибка обновляет причину, увеличивает счётчик
   * и сбрасывает интервал на нулевую ступень.
   */
  function upsertCard(questionId, reasonId) {
    var card = findCard(questionId);
    if (card) {
      card.reasonId = reasonExists(reasonId) ? reasonId : card.reasonId;
      card.wrongCount += 1;
      card.stage = 0;
      card.dueAt = dayKey();
      card.lastResult = 'wrong';
      return card;
    }
    card = {
      questionId: questionId,
      reasonId: reasonExists(reasonId) ? reasonId : REASONS[0].id,
      stage: 0,
      dueAt: dayKey(),
      wrongCount: 1,
      addedAt: new Date().toISOString(),
      lastResult: 'wrong'
    };
    ensure().deck.push(card);
    return card;
  }

  function isMastered(card) {
    return card.stage >= MASTERED;
  }

  function isDue(card, todayKey) {
    if (isMastered(card)) return false;
    return daysBetween(card.dueAt, todayKey || dayKey()) >= 0;
  }

  function dueCards() {
    var today = dayKey();
    return ensure().deck.filter(function (card) {
      return isDue(card, today);
    });
  }

  /** Ближайший день, когда хоть одна карточка вернётся. null — если возвращать нечего. */
  function nextDueDay() {
    var deck = ensure().deck;
    var best = null;
    for (var i = 0; i < deck.length; i++) {
      if (isMastered(deck[i])) continue;
      if (best === null || daysBetween(deck[i].dueAt, best) > 0) best = deck[i].dueAt;
    }
    return best;
  }

  function deckStats() {
    var deck = ensure().deck;
    var mastered = 0;
    for (var i = 0; i < deck.length; i++) {
      if (isMastered(deck[i])) mastered++;
    }
    return {
      total: deck.length,
      due: dueCards().length,
      mastered: mastered,
      nextDue: nextDueDay()
    };
  }

  function removeCard(questionId) {
    var s = ensure();
    s.deck = s.deck.filter(function (card) {
      return card.questionId !== questionId;
    });
    save();
  }

  /**
   * Итог повтора карточки.
   * Верно — поднимаемся на ступень выше по лестнице 0 → 1 → 3 → 7 дней → «усвоено».
   * Неверно — сброс на нулевую ступень (карточка вернётся сегодня же) и новая причина.
   */
  function reviewCard(questionId, isCorrect, reasonId) {
    var card = findCard(questionId);
    if (!card) return null;

    var s = ensure();
    s.stats.answered += 1;
    if (isCorrect) {
      s.stats.correct += 1;
      card.stage = Math.min(card.stage + 1, MASTERED);
      card.lastResult = 'correct';
      card.dueAt = isMastered(card) ? dayKey() : shiftDay(dayKey(), STAGE_DAYS[card.stage]);
    } else {
      s.stats.mistakes += 1;
      card.stage = 0;
      card.wrongCount += 1;
      card.lastResult = 'wrong';
      card.dueAt = dayKey();
      if (reasonExists(reasonId)) card.reasonId = reasonId;
    }
    save();
    return card;
  }

  /* ------------------------------------- итоги сессии -------------------------------------- */

  /**
   * results: [{ questionId, isCorrect, reasonId, seconds }]
   * Пишем статистику, помечаем вопросы как виденные, ошибки уходят в колоду.
   */
  function commitSession(results) {
    var s = ensure();
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      s.stats.answered += 1;
      if (r.isCorrect) {
        s.stats.correct += 1;
      } else {
        s.stats.mistakes += 1;
        upsertCard(r.questionId, r.reasonId);
      }
      if (s.seenIds.indexOf(r.questionId) === -1) s.seenIds.push(r.questionId);
    }
    s.stats.sessions += 1;
    s.lastVisit = new Date().toISOString();
    save();
  }

  function accuracy() {
    var st = ensure().stats;
    if (!st.answered) return 0;
    return Math.round((st.correct / st.answered) * 100);
  }

  function isFirstVisit() {
    var s = ensure();
    return s.stats.answered === 0 && s.deck.length === 0;
  }

  function reset() {
    state = defaultState();
    save();
  }

  return {
    SESSION_SIZE: SESSION_SIZE,
    STAGE_DAYS: STAGE_DAYS,
    MASTERED: MASTERED,
    getState: ensure,
    isPersistent: function () {
      ensure();
      return persistent;
    },
    isFirstVisit: isFirstVisit,
    accuracy: accuracy,
    pickSession: pickSession,
    questionById: questionById,
    shuffle: shuffle,
    commitSession: commitSession,
    findCard: findCard,
    dueCards: dueCards,
    deckStats: deckStats,
    removeCard: removeCard,
    reviewCard: reviewCard,
    isMastered: isMastered,
    isDue: isDue,
    dayKey: dayKey,
    daysBetween: daysBetween,
    reset: reset
  };
})();
