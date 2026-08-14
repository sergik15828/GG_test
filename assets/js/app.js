/**
 * Модуль «Разбор» — роутинг экранов, дрилл, итог сессии и колода ошибок.
 * Никаких зависимостей: только DOM, data.js, icons.js и store.js.
 */
(function () {
  'use strict';

  /* --------------------------------------- утилиты ----------------------------------------- */

  function $(id) {
    return document.getElementById(id);
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  /** Иконка вставляется в обёртку: innerHTML получает только статическую строку из ICONS. */
  function iconEl(name, cls) {
    var span = el('span', 'icon' + (cls ? ' ' + cls : ''));
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML = ICONS[name] || '';
    return span;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function append(parent) {
    for (var i = 1; i < arguments.length; i++) {
      if (arguments[i]) parent.appendChild(arguments[i]);
    }
    return parent;
  }

  /** Текст из данных всегда идёт через textContent — никакой сборки разметки из данных. */
  function paragraphs(container, text, cls) {
    var parts = String(text).split(/\n{2,}/);
    for (var i = 0; i < parts.length; i++) {
      var line = parts[i].replace(/\n/g, ' ').trim();
      if (line) container.appendChild(el('p', cls || null, line));
    }
    return container;
  }

  function pill(text, variant, iconName) {
    var node = el('span', 'pill' + (variant ? ' pill--' + variant : ''));
    if (iconName) node.appendChild(iconEl(iconName));
    node.appendChild(el('span', null, text));
    return node;
  }

  function eyebrow(text, cls) {
    return el('span', 'eyebrow' + (cls ? ' ' + cls : ''), text);
  }

  function button(label, cls, onClick, iconName, iconFirst) {
    var b = el('button', cls);
    b.type = 'button';
    if (iconName && iconFirst) b.appendChild(iconEl(iconName));
    b.appendChild(el('span', null, label));
    if (iconName && !iconFirst) b.appendChild(iconEl(iconName));
    if (onClick) b.addEventListener('click', onClick);
    return b;
  }

  function mmss(totalSeconds) {
    var s = Math.max(0, Math.round(totalSeconds));
    var m = Math.floor(s / 60);
    return (m < 10 ? '0' + m : m) + ':' + (s % 60 < 10 ? '0' + (s % 60) : s % 60);
  }

  /** Русское склонение: plural(2, 'день','дня','дней'). */
  function plural(n, one, few, many) {
    var abs = Math.abs(n) % 100;
    var last = abs % 10;
    if (abs > 10 && abs < 20) return many;
    if (last > 1 && last < 5) return few;
    if (last === 1) return one;
    return many;
  }

  function truncate(text, max) {
    var flat = String(text).replace(/\s+/g, ' ').trim();
    return flat.length > max ? flat.slice(0, max - 1).replace(/[\s.,;:]+$/, '') + '…' : flat;
  }

  function reasonById(id) {
    for (var i = 0; i < REASONS.length; i++) {
      if (REASONS[i].id === id) return REASONS[i];
    }
    return null;
  }

  var LETTERS = ['A', 'B', 'C', 'D'];

  /* ------------------------------------ состояние экранов ---------------------------------- */

  var SCREENS = {
    dashboard: 'screen-dashboard',
    drill: 'screen-drill',
    result: 'screen-result',
    deck: 'screen-deck'
  };

  var session = null; // текущая сессия дрилла или повтора
  var summary = null; // итог последней сессии дрилла — для экрана результата
  var reviewNote = null; // итог последнего повтора — показывается один раз на экране колоды
  var timerId = null;

  function showScreen(name) {
    for (var key in SCREENS) {
      if (!Object.prototype.hasOwnProperty.call(SCREENS, key)) continue;
      var node = $(SCREENS[key]);
      node.hidden = key !== name;
    }
    if (name !== 'deck') reviewNote = null;
    if (name !== 'drill') stopTimer();
    window.scrollTo(0, 0);
    var active = $(SCREENS[name]);
    active.setAttribute('tabindex', '-1');
    active.focus({ preventScroll: true });
  }

  function refreshHeader() {
    var stats = Store.deckStats();
    var badge = $('deck-due-count');
    badge.textContent = String(stats.due);
    badge.classList.toggle('is-zero', stats.due === 0);
    $('nav-deck').setAttribute(
      'aria-label',
      'Открыть колоду ошибок, к повторению сегодня: ' + stats.due
    );
  }

  /* ------------------------------------- экран 1: дашборд ---------------------------------- */

  function heroBlock(isEmpty) {
    var hero = el('div', 'hero');
    var inner = el('div', 'hero__inner');

    inner.appendChild(eyebrow('Работа над ошибками', 'eyebrow--light'));
    inner.appendChild(el('h1', 'hero__title', 'Ошибки, которые ты не разобрал, вернутся на экзамене'));
    inner.appendChild(
      el(
        'p',
        'hero__lead',
        isEmpty
          ? 'Здесь ошибка перестаёт быть красным крестиком. Ты решаешь короткий дрилл, ' +
              'видишь разбор каждого варианта и сам называешь причину промаха. Дальше вопрос ' +
              'возвращается по интервалам, пока не станет твоим.'
          : 'Продолжай там, где остановился. Шесть вопросов, разбор каждого варианта и одна ' +
              'честная причина за каждой ошибкой.'
      )
    );

    var cta = el('div', 'hero__cta');
    cta.appendChild(button('Начать разбор', 'btn btn-hero btn-lg', startDrill, 'arrow-right'));
    cta.appendChild(
      el('span', 'hero__note', Store.SESSION_SIZE + ' вопросов, Reading & Writing и Math, около 8 минут')
    );
    inner.appendChild(cta);

    hero.appendChild(inner);
    return hero;
  }

  function statCard(iconName, label, value, note) {
    var card = el('article', 'card stat');
    var head = el('div', 'stat__head');
    head.appendChild(iconEl(iconName, 'icon-box'));
    head.appendChild(eyebrow(label));
    card.appendChild(head);
    card.appendChild(el('div', 'stat__value', value));
    card.appendChild(el('p', 'stat__note', note));
    return card;
  }

  function howItWorks(expanded) {
    var section = el('section', 'card how');
    section.appendChild(eyebrow('Как это работает'));
    if (expanded) {
      section.appendChild(
        el(
          'h2',
          'how__title',
          'Три шага, которые превращают ошибку в разобранный урок'
        )
      );
    }

    var steps = [
      {
        icon: 'book-open',
        title: 'Решаешь дрилл',
        text: 'Шесть вопросов с таймером. Сразу после ответа — разбор: почему верный верный и почему каждый неверный вариант поставлен именно там.'
      },
      {
        icon: 'target',
        title: 'Называешь причину',
        text: 'Ошибся — выбираешь, что случилось: не знал тему, не понял вопрос, повёлся на ловушку, был невнимателен, не хватило времени. Без этого дальше не пройти.'
      },
      {
        icon: 'refresh',
        title: 'Вопрос возвращается',
        text: 'Ошибка уходит в колоду и всплывает через день, три, неделю. Три верных повтора подряд — и карточка помечается усвоенной.'
      }
    ];

    var list = el('ol', 'how__list');
    for (var i = 0; i < steps.length; i++) {
      var item = el('li', 'how__item');
      var mark = el('span', 'how__mark');
      mark.appendChild(iconEl(steps[i].icon));
      item.appendChild(mark);
      var body = el('div', 'how__body');
      body.appendChild(el('h3', 'how__step', steps[i].title));
      body.appendChild(el('p', 'how__text', steps[i].text));
      item.appendChild(body);
      list.appendChild(item);
    }
    section.appendChild(list);
    return section;
  }

  function deckBlock(stats) {
    var card = el('section', 'card deck-promo');
    var main = el('div', 'deck-promo__main');
    main.appendChild(eyebrow('Колода ошибок'));
    main.appendChild(
      el(
        'h2',
        'deck-promo__title',
        stats.due > 0
          ? 'К повторению сегодня: ' + stats.due
          : 'Сегодня повторять нечего'
      )
    );

    var note;
    if (stats.due > 0) {
      note = 'Эти карточки ты уже разбирал. Ответишь верно — интервал вырастет, ошибёшься — вернутся сегодня же.';
    } else if (stats.nextDue) {
      var days = Store.daysBetween(Store.dayKey(), stats.nextDue);
      note =
        'Ближайший повтор ' +
        (days <= 1 ? 'завтра' : 'через ' + days + ' ' + plural(days, 'день', 'дня', 'дней')) +
        '. Интервалы держат материал в памяти без зубрёжки.';
    } else {
      note = 'Все карточки усвоены. Новые появятся из следующих ошибок.';
    }
    main.appendChild(el('p', 'deck-promo__note', note));

    var figures = el('div', 'deck-promo__figures');
    figures.appendChild(figure(stats.total, 'карточек всего'));
    figures.appendChild(figure(stats.due, 'готовы к повтору'));
    figures.appendChild(figure(stats.mastered, 'усвоено'));
    main.appendChild(figures);

    card.appendChild(main);
    card.appendChild(
      button('Открыть колоду', 'btn btn-secondary', renderDeck, 'layers', true)
    );
    return card;
  }

  function figure(value, label) {
    var wrap = el('div', 'figure');
    wrap.appendChild(el('span', 'figure__value', value));
    wrap.appendChild(el('span', 'figure__label', label));
    return wrap;
  }

  function renderDashboard() {
    var root = $('screen-dashboard');
    clear(root);

    var empty = Store.isFirstVisit();
    root.appendChild(heroBlock(empty));

    if (empty) {
      // Первый визит: вместо нулевой статистики — объяснение механики. Кнопка одна, в hero.
      root.appendChild(howItWorks(true));
      root.appendChild(
        el(
          'p',
          'center-cta__note',
          'Статистика, срез по доменам и колода появятся сразу после первой сессии.'
        )
      );
    } else {
      var state = Store.getState();
      var stats = Store.deckStats();

      var grid = el('div', 'stat-grid');
      grid.appendChild(
        statCard(
          'target',
          'Точность',
          Store.accuracy() + '%',
          'верных ' + state.stats.correct + ' из ' + state.stats.answered
        )
      );
      grid.appendChild(
        statCard(
          'bar-chart',
          'Разобрано ошибок',
          state.stats.mistakes,
          state.stats.sessions + ' ' + plural(state.stats.sessions, 'сессия', 'сессии', 'сессий') + ' позади'
        )
      );
      grid.appendChild(
        statCard(
          'clock',
          'К повторению сегодня',
          stats.due,
          'в колоде ' + stats.total + ' ' + plural(stats.total, 'карточка', 'карточки', 'карточек')
        )
      );
      root.appendChild(grid);
      root.appendChild(deckBlock(stats));
      root.appendChild(howItWorks(false));
    }

    showScreen('dashboard');
    refreshHeader();
  }

  /* ---------------------------------- экран 2: дрилл и повтор ------------------------------ */

  function startDrill() {
    var questions = Store.pickSession();
    if (!questions.length) return;
    session = { mode: 'drill', items: questions, index: 0, results: [], view: null };
    showScreen('drill');
    renderQuestion();
  }

  function startReview() {
    var due = Store.dueCards();
    var items = [];
    for (var i = 0; i < due.length; i++) {
      var q = Store.questionById(due[i].questionId);
      if (q) items.push(q);
    }
    if (!items.length) return;
    session = { mode: 'review', items: Store.shuffle(items), index: 0, results: [], view: null };
    showScreen('drill');
    renderQuestion();
  }

  function exitSession() {
    session = null;
    stopTimer();
    renderDashboard();
  }

  function stopTimer() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    tickLabel();
    timerId = window.setInterval(function () {
      if (!session || !session.view || session.view.answered) return;
      session.view.elapsed += 1;
      tickLabel();
    }, 1000);
  }

  function tickLabel() {
    var view = session && session.view;
    if (!view) return;
    $('drill-time').textContent = mmss(view.elapsed);
    $('drill-timer').classList.toggle('is-over', view.elapsed > view.question.targetSec);
  }

  function renderQuestion() {
    var question = session.items[session.index];
    var order = Store.shuffle([0, 1, 2, 3]);

    // Правильный ответ в датасете всегда под индексом 0, поэтому варианты обязательно
    // перемешиваются, а позиция верного пересчитывается уже после перемешивания.
    session.view = {
      question: question,
      order: order,
      correctPos: order.indexOf(question.correct),
      selected: null,
      answered: false,
      elapsed: 0,
      reasonId: null
    };

    var total = session.items.length;
    var num = session.index + 1;
    $('drill-counter').textContent = 'Вопрос ' + num + ' из ' + total;
    $('drill-mode').textContent = session.mode === 'review' ? 'Повтор колоды' : 'Дрилл';

    var percent = Math.round((num / total) * 100);
    $('drill-progress-bar').style.width = percent + '%';
    $('drill-progress').setAttribute('aria-valuenow', String(percent));
    $('drill-progress').setAttribute('aria-label', 'Пройдено ' + num + ' из ' + total);

    renderBadges(question);
    renderPassage(question);
    renderStem(question);
    renderChoices(question);

    var analysis = $('q-analysis');
    analysis.hidden = true;
    clear(analysis);

    var reasons = $('q-reasons');
    reasons.hidden = true;
    clear(reasons);

    var answerBtn = $('btn-answer');
    answerBtn.hidden = false;
    answerBtn.disabled = true;

    var nextBtn = $('btn-next');
    nextBtn.hidden = true;
    nextBtn.disabled = false;

    var hint = $('q-hint');
    hint.hidden = true;
    hint.textContent = '';

    // Новый вопрос — возвращаем фокус в карточку: иначе он теряется на скрытых кнопках.
    var card = document.querySelector('.question-card');
    card.setAttribute('tabindex', '-1');
    window.scrollTo(0, 0);
    card.focus({ preventScroll: true });

    startTimer();
  }

  function renderBadges(question) {
    var box = $('q-badges');
    clear(box);
    box.appendChild(pill(SECTION_LABEL[question.section], 'brand', question.section === 'math' ? 'calculator' : 'book-open'));
    box.appendChild(pill(question.domain, 'ghost'));
    box.appendChild(pill(question.skill, 'ghost'));
    box.appendChild(pill(DIFFICULTY_LABEL[question.difficulty], question.difficulty === 'hard' ? 'warn' : 'muted'));
  }

  function renderPassage(question) {
    var box = $('q-passage');
    clear(box);
    if (!question.passage) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    box.appendChild(eyebrow('Текст'));
    paragraphs(box, question.passage);
  }

  function renderStem(question) {
    var box = $('q-stem');
    clear(box);
    paragraphs(box, question.stem);
  }

  function renderChoices(question) {
    var box = $('q-choices');
    clear(box);
    var view = session.view;

    for (var pos = 0; pos < view.order.length; pos++) {
      var choice = question.choices[view.order[pos]];
      var row = el('div', 'choice-row');

      var btn = el('button', 'choice');
      btn.type = 'button';
      btn.setAttribute('role', 'radio');
      btn.setAttribute('aria-checked', 'false');
      btn.setAttribute('tabindex', pos === 0 ? '0' : '-1');
      btn.dataset.pos = String(pos);

      var letter = el('span', 'choice__letter', LETTERS[pos]);
      var text = el('span', 'choice__text', choice.text);
      append(btn, letter, text);
      btn.addEventListener('click', onChoiceClick);
      btn.addEventListener('keydown', onChoiceKeydown);

      var why = el('div', 'choice__why');
      why.hidden = true;
      why.appendChild(el('p', null, choice.why));

      append(row, btn, why);
      box.appendChild(row);
    }
  }

  function choiceButtons() {
    return Array.prototype.slice.call($('q-choices').querySelectorAll('.choice'));
  }

  function onChoiceClick(event) {
    selectChoice(parseInt(event.currentTarget.dataset.pos, 10));
  }

  /** Клавиатура внутри radiogroup: стрелки переносят фокус и выбирают вариант. */
  function onChoiceKeydown(event) {
    var keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'];
    if (keys.indexOf(event.key) === -1) return;
    event.preventDefault();
    var buttons = choiceButtons();
    var current = parseInt(event.currentTarget.dataset.pos, 10);
    var step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
    var next = (current + step + buttons.length) % buttons.length;
    buttons[next].focus();
    selectChoice(next);
  }

  function selectChoice(pos) {
    var view = session && session.view;
    if (!view || view.answered) return;
    view.selected = pos;

    var buttons = choiceButtons();
    for (var i = 0; i < buttons.length; i++) {
      var isActive = i === pos;
      buttons[i].classList.toggle('is-selected', isActive);
      buttons[i].setAttribute('aria-checked', isActive ? 'true' : 'false');
      buttons[i].setAttribute('tabindex', isActive ? '0' : '-1');
    }
    $('btn-answer').disabled = false;
  }

  function onAnswer() {
    var view = session && session.view;
    if (!view || view.answered || view.selected === null) return;

    view.answered = true;
    stopTimer();

    var isCorrect = view.selected === view.correctPos;
    var buttons = choiceButtons();

    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      btn.disabled = true;
      btn.classList.remove('is-selected');
      if (i === view.correctPos) btn.classList.add('is-correct');
      if (i === view.selected && !isCorrect) btn.classList.add('is-wrong');
      if (i === view.selected) btn.classList.add('is-chosen');
      var why = btn.parentNode.querySelector('.choice__why');
      why.hidden = false;
      why.classList.add(i === view.correctPos ? 'is-correct' : 'is-wrong');
    }

    renderAnalysis(isCorrect);

    $('btn-answer').hidden = true;
    var nextBtn = $('btn-next');
    clear(nextBtn);
    var last = session.index === session.items.length - 1;
    nextBtn.appendChild(
      el('span', null, last ? (session.mode === 'review' ? 'Показать итог повтора' : 'Показать результат') : 'Дальше')
    );
    nextBtn.appendChild(iconEl('arrow-right'));
    nextBtn.hidden = false;

    if (isCorrect) {
      nextBtn.disabled = false;
    } else {
      renderReasons();
      nextBtn.disabled = true;
      var hint = $('q-hint');
      hint.textContent = 'Выбери причину ошибки, чтобы пойти дальше.';
      hint.hidden = false;
    }

    // Варианты после ответа заблокированы, поэтому фокус переносим на разбор:
    // так скринридер зачитает результат, а не молчит на потерянном фокусе.
    var analysis = $('q-analysis');
    analysis.setAttribute('tabindex', '-1');
    analysis.focus({ preventScroll: true });
    analysis.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderAnalysis(isCorrect) {
    var view = session.view;
    var question = view.question;
    var box = $('q-analysis');
    clear(box);
    box.hidden = false;

    var status = el('div', 'analysis__status ' + (isCorrect ? 'is-ok' : 'is-err'));
    status.appendChild(iconEl(isCorrect ? 'check' : 'x'));
    status.appendChild(el('span', null, isCorrect ? 'Верно' : 'Мимо'));
    box.appendChild(status);

    var body = el('div', 'analysis__body');

    var main = el('div', 'analysis__main');
    main.appendChild(eyebrow('Как прийти к ответу'));
    paragraphs(main, question.explanation, 'analysis__text');
    body.appendChild(main);

    var side = el('aside', 'analysis__side');
    var trapBox = el('div', 'analysis__card');
    trapBox.appendChild(eyebrow('Ловушка вопроса'));
    var trapPill = pill(question.trap, 'warn', 'alert-triangle');
    trapPill.classList.add('pill--wrap');
    trapBox.appendChild(trapPill);
    side.appendChild(trapBox);

    var over = view.elapsed > question.targetSec;
    var timeBox = el('div', 'analysis__card');
    timeBox.appendChild(eyebrow('Время'));
    var timeLine = el('p', 'analysis__time');
    timeLine.appendChild(el('strong', null, view.elapsed + ' с'));
    timeLine.appendChild(el('span', null, ' при норме ' + question.targetSec + ' с'));
    timeBox.appendChild(timeLine);
    timeBox.appendChild(pill(over ? 'Дольше нормы' : 'В норме', over ? 'warn' : 'ok'));
    side.appendChild(timeBox);

    body.appendChild(side);
    box.appendChild(body);

    var note = el('p', 'analysis__hint');
    note.appendChild(iconEl('chevron-down'));
    note.appendChild(
      el('span', null, 'Под каждым вариантом — почему он там стоит. Дистракторы на SAT собраны из типовых ошибок, не наугад.')
    );
    box.appendChild(note);
  }

  function renderReasons() {
    var box = $('q-reasons');
    clear(box);
    box.hidden = false;

    var head = el('div', 'reasons__head');
    head.appendChild(eyebrow('Почему ошибся'));
    head.appendChild(
      el(
        'p',
        'reasons__lead',
        'Назови причину честно — из этих отметок собирается карта твоих потерь и порядок повторов.'
      )
    );
    box.appendChild(head);

    var group = el('div', 'reason-chips');
    group.setAttribute('role', 'radiogroup');
    group.setAttribute('aria-label', 'Причина ошибки');

    for (var i = 0; i < REASONS.length; i++) {
      (function (reason) {
        var chip = el('button', 'reason-chip');
        chip.type = 'button';
        chip.setAttribute('role', 'radio');
        chip.setAttribute('aria-checked', 'false');
        chip.appendChild(el('span', 'reason-chip__label', reason.label));
        chip.appendChild(el('span', 'reason-chip__hint', reason.hint));
        chip.addEventListener('click', function () {
          selectReason(reason.id, group, chip);
        });
        group.appendChild(chip);
      })(REASONS[i]);
    }
    box.appendChild(group);
  }

  function selectReason(reasonId, group, chip) {
    session.view.reasonId = reasonId;
    var chips = group.querySelectorAll('.reason-chip');
    for (var i = 0; i < chips.length; i++) {
      var active = chips[i] === chip;
      chips[i].classList.toggle('is-selected', active);
      chips[i].setAttribute('aria-checked', active ? 'true' : 'false');
    }
    $('btn-next').disabled = false;
    $('q-hint').hidden = true;
  }

  function onNext() {
    var view = session && session.view;
    if (!view || !view.answered) return;

    var isCorrect = view.selected === view.correctPos;
    if (!isCorrect && !view.reasonId) return; // причина обязательна

    session.results.push({
      questionId: view.question.id,
      isCorrect: isCorrect,
      reasonId: view.reasonId,
      seconds: view.elapsed
    });

    // В режиме повтора карточка обновляется сразу: интервал растёт или сбрасывается.
    if (session.mode === 'review') {
      Store.reviewCard(view.question.id, isCorrect, view.reasonId);
    }

    session.index += 1;
    if (session.index < session.items.length) {
      renderQuestion();
      return;
    }

    if (session.mode === 'review') finishReview();
    else finishDrill();
  }

  /* ------------------------------------ экран 3: итог сессии ------------------------------- */

  function buildSummary(results) {
    var data = {
      total: results.length,
      correct: 0,
      seconds: 0,
      target: 0,
      domains: [],
      reasons: [],
      mistakes: []
    };
    var domainIndex = {};
    var reasonCount = {};

    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      var q = Store.questionById(r.questionId);
      if (!q) continue;

      data.seconds += r.seconds;
      data.target += q.targetSec;
      if (r.isCorrect) data.correct += 1;

      if (!domainIndex[q.domain]) {
        domainIndex[q.domain] = { name: q.domain, section: q.section, correct: 0, total: 0 };
        data.domains.push(domainIndex[q.domain]);
      }
      domainIndex[q.domain].total += 1;
      if (r.isCorrect) domainIndex[q.domain].correct += 1;

      if (!r.isCorrect) {
        reasonCount[r.reasonId] = (reasonCount[r.reasonId] || 0) + 1;
        data.mistakes.push({ question: q, reasonId: r.reasonId });
      }
    }

    // Порядок причин фиксирован датасетом, пустые не показываем.
    for (var j = 0; j < REASONS.length; j++) {
      var count = reasonCount[REASONS[j].id] || 0;
      if (count) data.reasons.push({ reason: REASONS[j], count: count });
    }
    data.reasons.sort(function (a, b) {
      return b.count - a.count;
    });

    data.percent = data.total ? Math.round((data.correct / data.total) * 100) : 0;
    return data;
  }

  function ringChart(percent, tone) {
    var NS = 'http://www.w3.org/2000/svg';
    var radius = 52;
    var circumference = 2 * Math.PI * radius;

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 120 120');
    svg.setAttribute('class', 'ring__svg');
    svg.setAttribute('aria-hidden', 'true');

    var track = document.createElementNS(NS, 'circle');
    track.setAttribute('cx', '60');
    track.setAttribute('cy', '60');
    track.setAttribute('r', String(radius));
    track.setAttribute('class', 'ring__track');

    var arc = document.createElementNS(NS, 'circle');
    arc.setAttribute('cx', '60');
    arc.setAttribute('cy', '60');
    arc.setAttribute('r', String(radius));
    arc.setAttribute('class', 'ring__arc is-' + tone);
    arc.setAttribute('stroke-dasharray', circumference.toFixed(2));
    arc.setAttribute('stroke-dashoffset', (circumference * (1 - percent / 100)).toFixed(2));
    arc.setAttribute('transform', 'rotate(-90 60 60)');

    svg.appendChild(track);
    svg.appendChild(arc);
    return svg;
  }

  function toneFor(percent) {
    if (percent >= 80) return 'ok';
    if (percent >= 50) return 'warn';
    return 'err';
  }

  function barRow(name, valueText, percent, tone, tag) {
    var row = el('div', 'bar-row');
    var head = el('div', 'bar-row__head');
    var nameBox = el('div', 'bar-row__name');
    nameBox.appendChild(el('span', null, name));
    if (tag) nameBox.appendChild(pill(tag, 'err'));
    head.appendChild(nameBox);
    head.appendChild(el('span', 'bar-row__value', valueText));
    row.appendChild(head);

    var bar = el('div', 'bar');
    var fill = el('span', 'bar__fill is-' + tone);
    fill.style.width = Math.max(3, percent) + '%';
    bar.appendChild(fill);
    row.appendChild(bar);
    return row;
  }

  function panel(titleText, eyebrowText) {
    var box = el('section', 'card panel');
    if (eyebrowText) box.appendChild(eyebrow(eyebrowText));
    box.appendChild(el('h2', 'panel__title', titleText));
    return box;
  }

  function renderResult() {
    var root = $('screen-result');
    clear(root);
    var data = summary;

    var head = el('header', 'page-head');
    head.appendChild(eyebrow('Итог сессии'));
    head.appendChild(el('h1', 'page-title', 'Где ты теряешь баллы'));
    head.appendChild(
      el(
        'p',
        'page-lead',
        data.correct === data.total
          ? 'Чистая сессия. Ниже — время и домены, чтобы понять, за счёт чего это вышло.'
          : 'Счёт — только вход. Смотри на домены и причины: они повторяются от сессии к сессии.'
      )
    );
    root.appendChild(head);

    /* результат + время */
    var top = el('div', 'result-top');

    var scoreCard = el('article', 'card score');
    var ring = el('div', 'ring');
    ring.appendChild(ringChart(data.percent, toneFor(data.percent)));
    var ringText = el('div', 'ring__text');
    ringText.appendChild(el('span', 'ring__value', data.percent + '%'));
    ringText.appendChild(el('span', 'ring__label', 'точность'));
    ring.appendChild(ringText);
    scoreCard.appendChild(ring);

    var scoreBody = el('div', 'score__body');
    scoreBody.appendChild(eyebrow('Результат'));
    scoreBody.appendChild(el('p', 'score__value', data.correct + ' из ' + data.total));
    scoreBody.appendChild(
      el(
        'p',
        'score__note',
        data.total - data.correct === 0
          ? 'Ни одной ошибки. Колода не пополнилась.'
          : (data.total - data.correct) +
              ' ' +
              plural(data.total - data.correct, 'ошибка ушла', 'ошибки ушли', 'ошибок ушли') +
              ' в колоду с указанной причиной.'
      )
    );
    scoreCard.appendChild(scoreBody);
    top.appendChild(scoreCard);

    var timeCard = el('article', 'card time-card');
    timeCard.appendChild(eyebrow('Время'));
    var avg = data.total ? data.seconds / data.total : 0;
    var avgTarget = data.total ? data.target / data.total : 0;
    var timeGrid = el('div', 'time-grid');
    timeGrid.appendChild(figure(mmss(data.seconds), 'суммарно'));
    timeGrid.appendChild(figure(Math.round(avg) + ' с', 'в среднем на вопрос'));
    timeGrid.appendChild(figure(Math.round(avgTarget) + ' с', 'норма на вопрос'));
    timeCard.appendChild(timeGrid);

    var diff = Math.round(avg - avgTarget);
    var timeNote = el('p', 'time-card__note');
    if (diff > 5) {
      timeNote.textContent =
        'Ты идёшь медленнее нормы на ' + diff + ' с на вопрос. На полном экзамене это стоит нескольких заданий в конце модуля.';
    } else if (diff < -5) {
      timeNote.textContent =
        'Ты быстрее нормы на ' + Math.abs(diff) + ' с. Запас есть — вложи его в проверку ответа перед отметкой.';
    } else {
      timeNote.textContent = 'Темп ровный, близко к норме. Это тот ритм, который стоит удерживать на экзамене.';
    }
    timeCard.appendChild(timeNote);
    top.appendChild(timeCard);
    root.appendChild(top);

    /* домены */
    var domainPanel = panel('Срез по доменам', data.mistakes.length ? 'Что просело' : 'Разбивка');
    data.domains.sort(function (a, b) {
      return a.correct / a.total - b.correct / b.total;
    });
    for (var i = 0; i < data.domains.length; i++) {
      var d = data.domains[i];
      var share = Math.round((d.correct / d.total) * 100);
      var weak = share < 60;
      domainPanel.appendChild(
        barRow(
          d.name,
          d.correct + ' / ' + d.total,
          share,
          weak ? 'err' : share < 100 ? 'warn' : 'ok',
          weak ? 'слабое место' : null
        )
      );
    }
    root.appendChild(domainPanel);

    /* причины */
    if (data.reasons.length) {
      var reasonPanel = panel('Срез по причинам', 'Почему теряешь');
      // Бары считаем от всех ошибок сессии, а не от максимума: так видно долю каждой причины.
      var totalMistakes = data.total - data.correct;
      for (var j = 0; j < data.reasons.length; j++) {
        var r = data.reasons[j];
        reasonPanel.appendChild(
          barRow(
            r.reason.label,
            r.count + ' ' + plural(r.count, 'ошибка', 'ошибки', 'ошибок'),
            Math.round((r.count / totalMistakes) * 100),
            'brand',
            null
          )
        );
      }
      root.appendChild(reasonPanel);
    }

    /* рекомендации */
    var advicePanel = panel('Что делать дальше', 'Персонально');
    if (data.reasons.length) {
      var top2 = data.reasons.slice(0, 2);
      for (var k = 0; k < top2.length; k++) {
        var item = el('div', 'advice');
        item.appendChild(iconEl('zap', 'icon-box'));
        var adviceBody = el('div', 'advice__body');
        adviceBody.appendChild(el('h3', 'advice__title', top2[k].reason.label));
        adviceBody.appendChild(el('p', 'advice__text', REASON_ADVICE[top2[k].reason.id]));
        item.appendChild(adviceBody);
        advicePanel.appendChild(item);
      }
    } else {
      var clean = el('div', 'advice');
      clean.appendChild(iconEl('check', 'icon-box'));
      var cleanBody = el('div', 'advice__body');
      cleanBody.appendChild(el('h3', 'advice__title', 'Разбирать нечего'));
      cleanBody.appendChild(
        el(
          'p',
          'advice__text',
          'Шесть из шести без единой ошибки. Следующий шаг — не повтор того же уровня, а сессия с более тяжёлыми вопросами и жёстким контролем времени.'
        )
      );
      clean.appendChild(cleanBody);
      advicePanel.appendChild(clean);
    }
    root.appendChild(advicePanel);

    /* что ушло в колоду */
    if (data.mistakes.length) {
      var deckPanel = panel('Добавлено в колоду', 'Вернётся к тебе');
      var list = el('ul', 'added-list');
      for (var m = 0; m < data.mistakes.length; m++) {
        var mistake = data.mistakes[m];
        var li = el('li', 'added-item');
        var badges = el('div', 'badges badges--tight');
        badges.appendChild(pill(SECTION_LABEL[mistake.question.section], 'brand'));
        badges.appendChild(pill(mistake.question.domain, 'ghost'));
        badges.appendChild(pill(mistake.question.skill, 'ghost'));
        li.appendChild(badges);
        li.appendChild(el('p', 'added-item__stem', truncate(mistake.question.stem, 110)));
        var meta = el('div', 'added-item__meta');
        meta.appendChild(pill(mistake.question.trap, 'warn', 'alert-triangle'));
        var reason = reasonById(mistake.reasonId);
        if (reason) meta.appendChild(pill(reason.label, 'muted'));
        li.appendChild(meta);
        list.appendChild(li);
      }
      deckPanel.appendChild(list);
      root.appendChild(deckPanel);
    }

    var actions = el('div', 'actions');
    if (data.mistakes.length) {
      actions.appendChild(button('Разобрать ошибки', 'btn btn-primary btn-lg', renderDeck, 'arrow-right'));
    } else {
      actions.appendChild(button('Ещё сессия', 'btn btn-primary btn-lg', startDrill, 'refresh', true));
    }
    actions.appendChild(button('На главную', 'btn btn-secondary btn-lg', renderDashboard, 'arrow-left', true));
    root.appendChild(actions);

    showScreen('result');
    refreshHeader();
  }

  function finishDrill() {
    Store.commitSession(session.results);
    summary = buildSummary(session.results);
    session = null;
    renderResult();
  }

  function finishReview() {
    var correct = 0;
    for (var i = 0; i < session.results.length; i++) {
      if (session.results[i].isCorrect) correct += 1;
    }
    reviewNote = { total: session.results.length, correct: correct };
    session = null;
    renderDeck();
  }

  /* ------------------------------------- экран 4: колода ----------------------------------- */

  function cardStatus(card) {
    if (Store.isMastered(card)) return { text: 'Усвоено', variant: 'ok' };
    var days = Store.daysBetween(Store.dayKey(), card.dueAt);
    if (days <= 0) return { text: 'Сегодня', variant: 'brand' };
    if (days === 1) return { text: 'Завтра', variant: 'muted' };
    return { text: 'Через ' + days + ' ' + plural(days, 'день', 'дня', 'дней'), variant: 'muted' };
  }

  function deckCardNode(card) {
    var question = Store.questionById(card.questionId);
    if (!question) return null;

    var node = el('article', 'deck-card');
    var main = el('div', 'deck-card__main');

    var badges = el('div', 'badges badges--tight');
    badges.appendChild(pill(SECTION_LABEL[question.section], 'brand'));
    badges.appendChild(pill(question.domain, 'ghost'));
    main.appendChild(badges);

    main.appendChild(el('h3', 'deck-card__skill', question.skill));
    main.appendChild(el('p', 'deck-card__stem', truncate(question.stem, 130)));

    var meta = el('div', 'deck-card__meta');
    meta.appendChild(pill(question.trap, 'warn', 'alert-triangle'));
    var reason = reasonById(card.reasonId);
    if (reason) meta.appendChild(pill('Причина: ' + reason.label, 'muted'));
    main.appendChild(meta);
    node.appendChild(main);

    var side = el('div', 'deck-card__side');
    var status = cardStatus(card);
    side.appendChild(pill(status.text, status.variant, 'clock'));
    side.appendChild(
      el(
        'span',
        'deck-card__count',
        'Ошибался ' + card.wrongCount + ' ' + plural(card.wrongCount, 'раз', 'раза', 'раз')
      )
    );
    side.appendChild(deleteControl(card));
    node.appendChild(side);
    return node;
  }

  /** Удаление в два шага, без нативных диалогов. */
  function deleteControl(card) {
    var slot = el('div', 'deck-card__delete');
    showTrash(slot, card);
    return slot;
  }

  function showTrash(slot, card) {
    clear(slot);
    var trash = el('button', 'icon-btn');
    trash.type = 'button';
    trash.appendChild(iconEl('trash'));
    trash.setAttribute('aria-label', 'Удалить карточку из колоды');
    trash.setAttribute('title', 'Удалить карточку');
    trash.addEventListener('click', function () {
      showConfirm(slot, card);
    });
    slot.appendChild(trash);
  }

  function showConfirm(slot, card) {
    clear(slot);
    var box = el('div', 'confirm');
    box.appendChild(el('span', 'confirm__text', 'Удалить?'));
    box.appendChild(
      button('Да', 'btn btn-danger btn-sm', function () {
        Store.removeCard(card.questionId);
        renderDeck();
      })
    );
    box.appendChild(
      button('Нет', 'btn btn-ghost btn-sm', function () {
        showTrash(slot, card);
      })
    );
    slot.appendChild(box);
  }

  function renderDeck() {
    var root = $('screen-deck');
    clear(root);

    var state = Store.getState();
    var stats = Store.deckStats();

    var head = el('header', 'page-head');
    head.appendChild(eyebrow('Колода ошибок'));
    head.appendChild(el('h1', 'page-title', 'Твои ошибки на повторе'));
    head.appendChild(
      el(
        'p',
        'page-lead',
        state.deck.length
          ? 'Каждая карточка — вопрос, на котором ты споткнулся, и причина, которую ты сам назвал. ' +
              'Верный повтор отодвигает карточку дальше: сегодня, через день, через три, через неделю.'
          : 'Сюда попадают вопросы, на которых ты споткнулся, — вместе с причиной, которую ты сам назвал.'
      )
    );
    root.appendChild(head);

    if (reviewNote) {
      var note = el('div', 'callout callout--ok');
      note.appendChild(iconEl('check', 'icon-box'));
      var noteBody = el('div');
      noteBody.appendChild(el('h2', 'callout__title', 'Повтор завершён'));
      noteBody.appendChild(
        el(
          'p',
          'callout__text',
          reviewNote.correct +
            ' из ' +
            reviewNote.total +
            ' верно. Верные карточки ушли на следующий интервал, ошибочные вернутся сегодня же.'
        )
      );
      note.appendChild(noteBody);
      root.appendChild(note);
    }

    if (!state.deck.length) {
      root.appendChild(deckEmptyState());
      showScreen('deck');
      refreshHeader();
      return;
    }

    var bar = el('section', 'card deck-bar');
    var barMain = el('div', 'deck-bar__main');
    barMain.appendChild(eyebrow('К повторению сегодня'));
    barMain.appendChild(el('p', 'deck-bar__value', String(stats.due)));
    if (stats.due > 0) {
      barMain.appendChild(
        el('p', 'deck-bar__note', 'Ошибёшься на повторе — карточка вернётся на нулевую ступень и снова спросит причину.')
      );
    } else if (stats.nextDue) {
      var days = Store.daysBetween(Store.dayKey(), stats.nextDue);
      barMain.appendChild(
        el(
          'p',
          'deck-bar__note',
          'Сегодня всё разобрано. Ближайший повтор ' +
            (days <= 1 ? 'завтра' : 'через ' + days + ' ' + plural(days, 'день', 'дня', 'дней')) +
            ' — возвращайся, интервал работает только если его соблюдать.'
        )
      );
    } else {
      barMain.appendChild(
        el('p', 'deck-bar__note', 'Все карточки усвоены. Новые появятся из ошибок следующей сессии.')
      );
    }
    bar.appendChild(barMain);

    var barActions = el('div', 'deck-bar__actions');
    var figures = el('div', 'deck-bar__figures');
    figures.appendChild(figure(stats.total, 'всего'));
    figures.appendChild(figure(stats.mastered, 'усвоено'));
    barActions.appendChild(figures);
    if (stats.due > 0) {
      barActions.appendChild(button('Повторить сейчас', 'btn btn-primary btn-lg', startReview, 'refresh', true));
    } else {
      barActions.appendChild(button('Новая сессия', 'btn btn-secondary btn-lg', startDrill, 'arrow-right'));
    }
    bar.appendChild(barActions);
    root.appendChild(bar);

    var list = el('div', 'deck-list');
    var deck = state.deck.slice().sort(function (a, b) {
      // Сначала то, что нужно повторить сегодня, усвоенное — в конце.
      var aDue = Store.isDue(a) ? 0 : Store.isMastered(a) ? 2 : 1;
      var bDue = Store.isDue(b) ? 0 : Store.isMastered(b) ? 2 : 1;
      if (aDue !== bDue) return aDue - bDue;
      return b.wrongCount - a.wrongCount;
    });
    for (var i = 0; i < deck.length; i++) {
      var node = deckCardNode(deck[i]);
      if (node) list.appendChild(node);
    }
    root.appendChild(list);

    var actions = el('div', 'actions');
    actions.appendChild(button('На главную', 'btn btn-secondary btn-lg', renderDashboard, 'arrow-left', true));
    root.appendChild(actions);

    showScreen('deck');
    refreshHeader();
  }

  function deckEmptyState() {
    var box = el('section', 'card empty');
    box.appendChild(iconEl('layers', 'icon-box icon-box--lg'));
    box.appendChild(el('h2', 'empty__title', 'Колода пуста'));
    box.appendChild(
      el(
        'p',
        'empty__text',
        'Карточки появляются здесь сами: каждая ошибка в дрилле уходит в колоду вместе с причиной, ' +
          'которую ты указал. Дальше она возвращается по интервалам — сегодня, через день, через три, через неделю.'
      )
    );
    box.appendChild(button('Начать разбор', 'btn btn-primary btn-lg', startDrill, 'arrow-right'));
    return box;
  }

  /* ---------------------------------------- запуск ----------------------------------------- */

  function init() {
    $('locap-icon').innerHTML = ICONS.target;
    $('deck-link-icon').innerHTML = ICONS.layers;
    $('drill-timer-icon').innerHTML = ICONS.clock;

    $('nav-home').addEventListener('click', function () {
      session = null;
      renderDashboard();
    });
    $('nav-deck').addEventListener('click', renderDeck);
    $('btn-answer').addEventListener('click', onAnswer);
    $('btn-next').addEventListener('click', onNext);
    $('drill-exit').addEventListener('click', exitSession);
    $('drill-exit').setAttribute('aria-label', 'Выйти из сессии без сохранения');

    if (!Store.isPersistent()) $('storage-note').hidden = false;

    renderDashboard();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
