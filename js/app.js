(() => {
  const $ = (id) => document.getElementById(id);

  const ICON_CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const ICON_CROSS = '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    },
  };

  const solved = new Set(store.get('profi.solved', []));
  let current = null;
  let busy = false;
  let checking = false;
  let pyReady = false;
  let checkResult = 'idle';

  const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const normalize = (s) => s.replace(/\r/g, '').split('\n').map((l) => l.trimEnd()).join('\n').trimEnd();
  const solvedCount = () => TASKS.filter((t) => solved.has(t.id)).length;

  const statusText = {
    loading: 'Python загружается...',
    ready: 'Python готов',
    busy: 'Выполняется...',
    error: 'Python не загрузился. Проверь интернет и обнови страницу',
  };
  function setStatus(state) {
    if (state === 'ready' && busy) state = 'busy';
    $('py-status').dataset.state = state;
    $('py-status').querySelector('.py-status-text').textContent = statusText[state];
    pyReady = state === 'ready' || state === 'busy';
    updateButtons();
  }

  const checkLabels = { loading: 'Загрузка...', running: 'Загрузка...', idle: 'Проверить', ok: 'Верно', fail: 'Ошибка' };
  const checkIcons = { loading: '', running: '', idle: '', ok: ICON_CHECK, fail: ICON_CROSS };
  function updateButtons() {
    $('btn-run').disabled = busy || !pyReady;
    const state = checking ? 'running' : !pyReady ? 'loading' : checkResult;
    const btn = $('btn-check');
    btn.dataset.state = state;
    btn.disabled = busy || !pyReady;
    btn.setAttribute('aria-busy', String(state === 'loading' || state === 'running'));
    $('btn-check-text').textContent = checkLabels[state];
    $('btn-check-icon').innerHTML = checkIcons[state];
  }
  function setCheckResult(value) {
    checkResult = value;
    updateButtons();
  }

  const runner = new PyRunner(setStatus);

  const editor = CodeMirror($('editor'), {
    mode: 'python',
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    matchBrackets: true,
    screenReaderLabel: 'Код решения на Python',
    extraKeys: {
      Tab: (cm) => (cm.somethingSelected() ? cm.indentSelection('add') : cm.replaceSelection('    ')),
      'Shift-Tab': (cm) => cm.indentSelection('subtract'),
      Esc: (cm) => cm.getInputField().blur(),
      'Ctrl-Enter': () => runCode(),
      'Cmd-Enter': () => runCode(),
      'Shift-Ctrl-Enter': () => checkCode(),
      'Shift-Cmd-Enter': () => checkCode(),
    },
  });

  let saveTimer = null;
  editor.on('change', (cm, change) => {
    if (!current || change.origin === 'setValue') return;
    if (checkResult !== 'idle') setCheckResult('idle');
    clearTimeout(saveTimer);
    const id = current.id;
    saveTimer = setTimeout(() => store.set('profi.code.' + id, editor.getValue()), 300);
  });

  function renderSidebar() {
    const nav = $('task-list');
    nav.innerHTML = '';
    const topics = [...new Set(TASKS.map((t) => t.topic))];
    topics.forEach((topic, ti) => {
      const h = document.createElement('h3');
      h.className = 'topic-title';
      h.innerHTML = `<span>${String(ti + 1).padStart(2, '0')}</span>${escapeHtml(topic)}`;
      nav.appendChild(h);

      const ul = document.createElement('ul');
      ul.className = 'task-list-group';
      TASKS.forEach((t, i) => {
        if (t.topic !== topic) return;
        const done = solved.has(t.id);
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'task-link' + (done ? ' solved' : '');
        a.href = '#' + t.id;
        if (current && current.id === t.id) a.setAttribute('aria-current', 'page');
        a.innerHTML = `<span class="task-status" aria-hidden="true">${done ? ICON_CHECK : i + 1}</span>
          <span>${escapeHtml(t.title)}<span class="visually-hidden">${done ? ', решено' : ''}</span></span>`;
        li.appendChild(a);
        ul.appendChild(li);
      });
      nav.appendChild(ul);
    });

    const done = solvedCount();
    $('progress-done').textContent = done;
    $('progress-total').textContent = TASKS.length;
    $('progress-fill').style.width = `${(done / TASKS.length) * 100}%`;
    const bar = $('progress-bar');
    bar.setAttribute('aria-valuemax', TASKS.length);
    bar.setAttribute('aria-valuenow', done);
  }

  function openTask(id, { scroll = true } = {}) {
    const task = TASKS.find((t) => t.id === id) || TASKS[0];
    if (current && saveTimer) {
      clearTimeout(saveTimer);
      store.set('profi.code.' + current.id, editor.getValue());
    }
    current = task;

    $('task-topic').textContent = task.topic;
    $('task-level').textContent = `Сложность: ${LEVELS[task.level].toLowerCase()}`;
    $('task-solved').hidden = !solved.has(task.id);
    $('task-title').textContent = task.title;
    $('task-text').innerHTML = task.text;
    $('task-input').innerHTML = task.input;
    $('task-output').innerHTML = task.output;
    $('task-theory-title').textContent = `Шпаргалка: ${task.topic}`;
    $('task-theory').innerHTML = THEORY[task.topic];
    $('task-theory-box').open = false;
    $('task-examples').innerHTML = task.examples
      .map(([i, o]) => `<div class="example">
          <div class="example-col"><span class="example-label">ввод</span><pre>${escapeHtml(i)}</pre></div>
          <div class="example-col"><span class="example-label">вывод</span><pre>${escapeHtml(o)}</pre></div>
        </div>`)
      .join('');

    editor.setValue(store.get('profi.code.' + task.id, task.starter));
    editor.clearHistory();
    $('stdin').value = task.examples[0][0];
    showOutputPlaceholder();
    $('results').hidden = true;
    setCheckResult('idle');

    renderSidebar();
    document.title = `${task.title} - PROFI`;
    if (scroll) {
      $('task').focus({ preventScroll: true });
      $('task').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function showOutputPlaceholder() {
    const out = $('stdout');
    out.className = 'out-empty';
    out.textContent = 'Нажми "Запустить", и здесь появится результат.';
  }

  function setBusy(value) {
    busy = value;
    setStatus(value ? 'busy' : pyReady ? 'ready' : 'loading');
  }

  async function runCode() {
    if (busy || !pyReady) return;
    setBusy(true);
    const out = $('stdout');
    out.className = '';
    out.textContent = 'Выполняется...';
    try {
      const res = await runner.run(editor.getValue(), $('stdin').value);
      let html = escapeHtml(res.stdout);
      if (res.timeout) html += `<span class="note">Программа работала дольше 4 секунд и была остановлена. Похоже, цикл не заканчивается.</span>`;
      if (res.error) html += `${html ? '\n' : ''}<span class="err">${escapeHtml(res.error)}</span>`;
      if (!html) {
        out.className = 'out-empty';
        html = 'Программа ничего не вывела. Проверь, есть ли в коде print().';
      }
      out.innerHTML = html;
    } catch (e) {
      out.innerHTML = `<span class="err">${escapeHtml(e.message)}</span>`;
    } finally {
      setBusy(false);
    }
  }

  async function checkCode() {
    if (busy || !pyReady) return;
    const task = current;
    const code = editor.getValue();
    const tests = [...task.examples, ...task.tests];
    const openCount = task.examples.length;

    checking = true;
    setBusy(true);
    $('results').hidden = false;
    $('success').hidden = true;
    $('test-detail').innerHTML = '';
    const summary = $('results-summary');
    summary.textContent = 'Идёт проверка...';
    summary.className = '';

    const box = $('tests');
    box.innerHTML = '';
    const chips = tests.map((_, i) => {
      const li = document.createElement('li');
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'test';
      c.innerHTML = `<b>Тест ${i + 1}</b><span class="test-state">${i < openCount ? 'пример' : 'скрытый'}</span>`;
      li.appendChild(c);
      box.appendChild(li);
      return c;
    });

    const results = [];
    let stopped = false;
    for (let i = 0; i < tests.length; i++) {
      const chip = chips[i];
      const state = chip.querySelector('.test-state');
      if (stopped) {
        state.textContent = 'пропущен';
        continue;
      }
      chip.classList.add('running');
      state.textContent = 'проверка...';
      const [input, expected] = tests[i];
      const res = await runner.run(code, input, 3000);
      chip.classList.remove('running');

      let verdict;
      if (res.timeout) verdict = 'Слишком долго';
      else if (res.error) verdict = 'Ошибка в коде';
      else if (normalize(res.stdout) !== normalize(expected)) verdict = 'Неверный ответ';
      else verdict = 'OK';

      const r = { i, input, expected, res, verdict, open: i < openCount };
      results.push(r);
      const ok = verdict === 'OK';
      chip.classList.add(ok ? 'ok' : 'fail');
      chip.insertAdjacentHTML('afterbegin', ok ? ICON_CHECK : ICON_CROSS);
      state.textContent = ok ? 'пройден' : verdict;
      if (!ok) {
        chip.setAttribute('aria-pressed', 'false');
        chip.addEventListener('click', () => showDetail(r, chips));
      }
      if (res.timeout) stopped = true;
    }

    const passed = results.filter((r) => r.verdict === 'OK').length;
    const allOk = passed === tests.length;
    summary.textContent = `Пройдено ${passed} из ${tests.length} тестов`;
    summary.className = allOk ? 'ok' : 'fail';

    checking = false;
    if (allOk) {
      solved.add(task.id);
      store.set('profi.solved', [...solved]);
      $('task-solved').hidden = false;
      const done = solvedCount();
      const left = TASKS.length - done;
      let text = `Решено ${done} из ${TASKS.length}. `;
      if (left === 0) text = 'Все задачи решены. Отличная работа!';
      else if (left <= 3) text += `Осталось всего ${left}, дожми.`;
      else text += 'Переходи к следующей.';
      $('success-text').textContent = text;
      $('btn-next').hidden = !nextTask();
      $('success').hidden = false;
      renderSidebar();
    } else {
      showDetail(results.find((r) => r.verdict !== 'OK'), chips);
    }
    checkResult = allOk ? 'ok' : 'fail';
    setBusy(false);
  }

  function showDetail(r, chips) {
    chips.forEach((c, i) => {
      if (c.hasAttribute('aria-pressed')) c.setAttribute('aria-pressed', String(i === r.i));
    });
    const detail = $('test-detail');
    const title = `<b>Тест ${r.i + 1}: ${r.verdict.toLowerCase()}.</b>`;

    if (r.verdict === 'Слишком долго') {
      detail.innerHTML = `<div class="detail-msg"><p>${title} Программа работала дольше 3 секунд. Проверь, меняется ли переменная из условия <code>while</code> внутри цикла.</p></div>`;
      return;
    }
    if (r.verdict === 'Ошибка в коде') {
      detail.innerHTML = `<div class="detail-msg"><p>${title} Python сообщает, в какой строке проблема:</p><pre>${escapeHtml(r.res.error)}</pre></div>`;
      return;
    }
    if (!r.open) {
      detail.innerHTML = `<div class="detail-msg"><p>${title} Это скрытый тест, его данные не показываются. Запусти программу с другими данными в поле "Ввод" и проверь, всё ли сходится.</p></div>`;
      return;
    }
    detail.innerHTML = `
      <div class="detail-msg"><p>${title} Сравни свой вывод с ожидаемым.</p></div>
      <div class="detail-grid">
        <div><h4>ввод</h4><pre>${escapeHtml(r.input)}</pre></div>
        <div><h4>ожидалось</h4><pre>${escapeHtml(r.expected)}</pre></div>
        <div><h4>твой вывод</h4><pre>${escapeHtml(r.res.stdout) || '<i>пусто</i>'}</pre></div>
      </div>`;
  }

  function nextTask() {
    const start = TASKS.indexOf(current);
    for (let k = 1; k < TASKS.length; k++) {
      const t = TASKS[(start + k) % TASKS.length];
      if (!solved.has(t.id)) return t;
    }
    return null;
  }

  $('btn-run').addEventListener('click', runCode);
  $('btn-check').addEventListener('click', checkCode);
  $('btn-reset').addEventListener('click', () => {
    editor.setValue(current.starter);
    store.set('profi.code.' + current.id, current.starter);
    setCheckResult('idle');
    editor.focus();
  });
  $('btn-next').addEventListener('click', () => {
    const next = nextTask();
    if (next) location.hash = next.id;
  });

  const sidebar = $('sidebar');
  $('btn-tasks').addEventListener('click', () => {
    const open = !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', open);
    $('btn-tasks').setAttribute('aria-expanded', String(open));
    if (open) sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const dialog = $('cheatsheet');
  $('cheatsheet-body').innerHTML = Object.entries(THEORY)
    .map(([topic, html]) => `<section><h3>${escapeHtml(topic)}</h3>${html}</section>`)
    .join('');
  $('btn-cheatsheet').addEventListener('click', () => dialog.showModal());
  $('btn-cheatsheet-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  window.addEventListener('hashchange', () => {
    sidebar.classList.remove('open');
    $('btn-tasks').setAttribute('aria-expanded', 'false');
    openTask(location.hash.slice(1));
  });

  const firstUnsolved = TASKS.find((t) => !solved.has(t.id)) || TASKS[0];
  openTask(location.hash.slice(1) || firstUnsolved.id, { scroll: false });
  updateButtons();
})();
