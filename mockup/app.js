/* Standalone UI mockup. No model, network, bank API or real research is used. */
(() => {
  'use strict';
  const {companies, events, trace} = window.ALFA_DEMO;
  const paths = {
    grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    spark:'<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z"/>',
    chart:'<path d="M4 20V10m6 10V4m6 16v-7m5 7H2"/>',
    file:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8m-8 4h5"/>',
    flow:'<rect x="8" y="2" width="8" height="5" rx="1"/><path d="M12 7v5M5 16v-4h14v4"/><rect x="2" y="16" width="6" height="5" rx="1"/><rect x="16" y="16" width="6" height="5" rx="1"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    down:'<path d="m7 10 5 5 5-5"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>',
    external:'<path d="M14 3h7v7M21 3l-9 9m-2-7H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/>',
    refresh:'<path d="M20 7a9 9 0 1 0 1 8M20 3v5h-5"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
    alert:'<path d="M10.3 4 2 18a1 1 0 0 0 1 1.5h18a1 1 0 0 0 1-1.5L13.7 4a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 3v.1"/>',
    trend:'<path d="m3 17 6-6 4 4 8-10m-6 0h6v6"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z"/>',
    box:'<path d="m12 3 9 5v9l-9 5-9-5V8Zm0 19V12M3 8l9 4 9-4M7 5.8l9 4.5"/>',
    wallet:'<path d="M20 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h15V7H5a2 2 0 0 1 0-4"/><path d="M20 12h-5v5h5m-4-2.5h1"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    send:'<path d="m3 11 18-8-8 18-2-8Zm8 2L21 3"/>',
    thumb:'<path d="M7 21H3V10h4m0 11h10a2 2 0 0 0 2-1.6l2-9A2 2 0 0 0 19 8h-6V4a2 2 0 0 0-2-2L7 10Z"/>',
    close:'<path d="m6 6 12 12M6 18 18 6"/>',
    sort:'<path d="M4 6h16M7 12h10m-7 6h4"/>',
    back:'<path d="M19 12H5m6-6-6 6 6 6"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.file}</svg>`;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => `${new Intl.NumberFormat('ru-RU', {maximumFractionDigits:0}).format(n)} ₽`;
  const million = n => `${new Intl.NumberFormat('ru-RU', {minimumFractionDigits:2,maximumFractionDigits:2}).format(n / 1e6)} млн`;
  const percent = n => new Intl.NumberFormat('ru-RU', {maximumFractionDigits:2}).format(n);
  const defaults = () => ({principal:'100', days:'90', base:'16', fixed:'15.5', fee:'150', maxFee:'200', shift:'2', objective:'worst'});
  const state = {company:'north', role:'cfo', view:'insights', layer:2, filter:'all', selected:'rates', answers:[], feedback:{}, drawer:null, run:1, stage:6, retry:false, running:false, inputVersion:1, inputs:defaults(), comparisons:{}, customEvents:[]};
  let toastTimer, analysisTimer, lastFocus;
  const company = () => companies.find(c => c.id === state.company);
  const event = () => [...events, ...state.customEvents].find(e => e.id === state.selected) || events[0];
  const main = document.getElementById('main');
  const ranked = () => [...events,...state.customEvents].map(e => ({...e,score:Math.min(99,(company().scores[e.id] || 64) + (state.role === 'treasury' ? (['rates','deposit'].includes(e.id) ? 3 : -7) : 0))})).sort((a,b) => b.score-a.score);
  const feedbackKey = () => `${state.company}:${state.role}:${state.selected}`;

  function notify(text) {
    const toast = document.getElementById('toast');
    toast.textContent = text;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 4500);
  }

  function navigation() {
    document.getElementById('navigation').innerHTML = [
      ['home','grid','Главная'], ['insights','spark','Бизнес-инсайты'], ['decision','chart','Сравнение решений'], ['sources','file','Источники'], ['agent','flow','Логика анализа']
    ].map(([id, glyph, title]) => `<button class="nav-item ${state.view===id ? 'active' : ''}" data-action="nav" data-view="${id}" ${state.view===id?'aria-current="page"':''} aria-label="${title}" title="${title}"><span class="icon">${icon(glyph)}</span><span>${title}</span>${id==='insights'?`<span class="nav-badge">${events.length+state.customEvents.length}</span>`:''}</button>`).join('');
  }

  function heading() {
    return `<div class="eyebrow"><span class="tiny-line"></span>ОТ СОБЫТИЙ — К БИЗНЕС-РЕШЕНИЯМ</div><div class="page-heading"><div><h1>${state.view==='home'?'Ваш бизнес. В фокусе.':'Бизнес-инсайты'}</h1><p>Важные события, их влияние на вашу компанию и обоснованные следующие шаги.</p></div><button class="btn" data-action="refresh" ${state.running?'disabled':''}>${icon('refresh')}<span class="refresh-label">${state.running?'Анализируем…':'Обновить анализ'}</span></button></div>`;
  }

  function companyBar() {
    const c = company();
    return `<section class="company-bar" aria-label="Контекст компании"><div class="company-identity"><span class="company-logo">${esc(c.short)}</span><div><select id="company" class="company-select" aria-label="Компания">${companies.map(item=>`<option value="${item.id}" ${c.id===item.id?'selected':''}>${esc(item.name)}</option>`).join('')}</select><div class="company-subline">${esc(c.sector)} <span aria-hidden="true">·</span> Выручка ${esc(c.revenue)}</div></div></div><div class="company-tools"><button class="profile-link" data-action="profile">Профиль компании ${icon('external')}</button><div class="role-field"><label for="role">Моя роль</label><select id="role"><option value="cfo" ${state.role==='cfo'?'selected':''}>Финансовый директор</option><option value="treasury" ${state.role==='treasury'?'selected':''}>Руководитель казначейства</option></select></div></div></section>`;
  }

  function layers() {
    return `<nav class="layers" aria-label="Три уровня аналитики">${[
      ['Intelligence','Что происходит','Компания, новости, аналитика'],
      ['Business Impact','Как влияет на бизнес','Риски, возможности, доказательства'],
      ['Decision Intelligence','Какое решение принять','Варианты, сценарии, компромиссы']
    ].map(([name,title,sub],i)=>`<button class="layer ${state.layer===i+1?'current':''}" data-action="layer" data-layer="${i+1}" aria-label="${name}: ${title}" ${state.layer===i+1?'aria-current="step"':''}><span class="layer-number">0${i+1}</span><div><h3>${title}</h3><p>${sub}</p></div>${i===2?'<span class="layer-label">НАШ ФОКУС</span>':`<span class="layer-arrow">${icon('chevron')}</span>`}</button>`).join('')}</nav>`;
  }

  function render() {
    navigation();
    document.getElementById('page-crumb').textContent = ({home:'Главная',insights:'Бизнес-инсайты',decision:'Сравнение решений',sources:'Источники'})[state.view];
    main.innerHTML = heading() + companyBar() + (state.view==='home' ? homeView() : state.view==='sources' ? sourcesView() : layers() + (state.view==='decision' ? decisionView() : insightsView()));
    if(state.view==='decision') updateScenarioResults();
  }

  function insightsView() {
    const all = ranked();
    const filtered = all.filter(e => state.filter==='all' || e.category===state.filter);
    return `<div class="overview-stats"><span><strong>${all.filter(e=>e.score>=75).length}</strong> важных событий</span><span class="stat-divider"></span><span><strong>3</strong> канала влияния</span><span class="stat-divider"></span><span><strong>2</strong> примера источников</span><span class="snapshot"><span class="pulse-dot"></span>Синтетический срез · 12 сентября 2026</span></div><div class="insights-grid"><section class="feed-panel" aria-label="Персонализированные события"><div class="section-line"><h2>В вашей повестке</h2><span class="sort-label">${icon('sort')}По значимости</span></div><div class="filters" aria-label="Фильтр событий">${[['all','Все'],['financing','Финансы'],['supply','Поставки'],['market','Рынок']].map(([id,label])=>`<button class="filter-chip ${state.filter===id?'active':''}" data-action="filter" data-filter="${id}" aria-pressed="${state.filter===id}">${label}</button>`).join('')}</div><div class="news-list">${filtered.map(e=>newsCard(e)).join('') || '<div class="empty-state">Для этого фильтра нет событий.</div>'}</div><div class="feed-note">${icon('info')}<span>Значимость зависит от профиля компании и вашей роли. Оценка — демонстрационная, не вероятность риска.</span></div><button class="btn btn-text" data-action="import">${icon('file')}Добавить демо-новость</button></section><div><article class="detail-card" aria-label="Интерпретация выбранного события">${detailView()}</article><div class="feedback"><span>Помогло разобраться в ситуации?</span><div>${[['yes','Полезно'],['no','Не очень']].map(([value,label])=>`<button data-action="feedback" data-value="${value}" class="${state.feedback[feedbackKey()]===value?'chosen':''}" aria-pressed="${state.feedback[feedbackKey()]===value}">${icon(value==='yes'?'thumb':'info')}${label}</button>`).join('')}</div></div></div></div>`;
  }

  function newsCard(e) {
    return `<button class="news-card ${e.id===state.selected?'selected':''}" data-action="event" data-id="${esc(e.id)}" aria-pressed="${e.id===state.selected}"><div class="card-top"><span class="category-label">${esc(e.tag)}</span><span class="score ${e.score<75?'medium':''}" title="Демонстрационная оценка значимости">${e.score}% значимость</span></div><h3>${esc(e.title)}</h3><p>${esc(e.short)}</p><div class="card-bottom"><span>${esc(e.date)}</span><span class="source-count">${icon('file')}${e.id.startsWith('custom')?'1 источник':'2 источника'}</span></div></button>`;
  }

  function impactText(e,c) {
    if(e.id==='rates' && c.deposits && c.credit!==true) return `В профиле компании <strong>«${esc(c.name)}»</strong> указаны депозиты, а кредитная нагрузка неизвестна. В первую очередь стоит оценить доходность и доступность ликвидности. Отсутствие данных о кредите не означает отсутствия долга.`;
    if(e.id==='rates') return `У компании <strong>«${esc(c.name)}»</strong> отмечены кредитные продукты${c.imports?' и импортные закупки':''}. Пауза в снижении ставки может повлиять на стоимость оборотного финансирования. <strong>Размер долга и условия переоценки неизвестны</strong> — количественный эффект требует дополнительных данных.`;
    if(e.id==='fx') return c.imports ? `В профиле компании <strong>«${esc(c.name)}»</strong> отмечена внешнеторговая деятельность. Это делает валютный канал потенциально значимым. Валюта обязательств, хеджирование и график платежей пока неизвестны.` : `Для компании <strong>«${esc(c.name)}»</strong> прямая импортная экспозиция не подтверждена. Событие может влиять через поставщиков, но для такого вывода нужно проверить контракты и структуру затрат.`;
    if(e.id==='deposit') return c.deposits ? `У компании <strong>«${esc(c.name)}»</strong> отмечен депозитный продукт. Событие релевантно размещению временно свободных средств, однако сумма остатка и платёжный календарь неизвестны.` : `У компании <strong>«${esc(c.name)}»</strong> свободный остаток и размещения не подтверждены. Сначала нужно проверить наличие ликвидности и предстоящие платежи.`;
    return `Для компании <strong>«${esc(c.name)}»</strong> важно сопоставить событие с реальными контрагентами, продуктами и сроками. Отраслевой сигнал указывает направление проверки, но не доказывает влияние на конкретную компанию.`;
  }

  function detailView() {
    const e=event(),c=company();
    return `<div class="detail-kicker"><span class="insight-label">${icon('spark')}${state.layer===1?'INTELLIGENCE':'ПЕРСОНАЛЬНЫЙ ИНСАЙТ'}</span><span class="detail-meta">Демо-анализ · ${state.role==='cfo'?'Финансовый директор':'Казначейство'}</span></div><h2 class="detail-title">${esc(e.headline)}</h2><p class="relevance-reason">Компания ${esc(c.name)} · ${esc(c.sector.toLowerCase())} · ${esc(c.region)}</p><section class="source-block"><div class="label">ЧТО ПРОИЗОШЛО · СИНТЕТИЧЕСКИЙ ФАКТ</div><p>${esc(e.fact)}</p><button class="inline-source" data-action="sources">${icon('file')}${esc(e.sourceTitle)} ${icon('external')}</button></section><h3 class="impact-heading">Почему это важно для вас</h3><div class="exposure-tags">${c.profiles.map(p=>`<span class="exposure-tag">${esc(p)}</span>`).join('')}</div><p class="impact-copy">${impactText(e,c)}</p><div class="risk-grid"><section class="impact-box"><h4>${icon('alert')}Возможный риск</h4><p>${esc(e.id==='rates' && c.credit!==true?'Кредитная экспозиция неизвестна. Нельзя делать вывод о расходах на долг без данных о договорах.':e.risk)}</p></section><section class="impact-box positive"><h4>${icon('trend')}Возможность</h4><p>${esc(e.id==='rates' && c.deposits && c.credit!==true?'Проверить условия размещения свободных средств и их соответствие платёжному календарю.':e.opportunity)}</p></section></div><section class="bank-view"><div class="label"><span>Аналитический взгляд банка</span><span class="simulated-tag">СМОДЕЛИРОВАНО</span></div><p>${esc(e.bank)}</p></section>${state.layer===1?`<section class="intelligence-extra"><h3>Как связаны материалы</h3><div class="search-map"><span>${esc(c.profiles[0])}</span><span class="connector">→</span><span>${esc(e.tag.toLowerCase())}</span><span class="connector">→</span><span>Релевантный фрагмент исследования</span></div><p class="impact-copy" style="margin-top:12px">В реализации поиск и ссылки на первоисточники будут выполняться инструментами агента. Здесь показана связь на синтетическом примере.</p></section>`:''}${e.id==='rates'?`<section class="decision-banner"><div class="label">DECISION INTELLIGENCE</div><h3>От понимания — к выбору</h3><p>Плавающая или фиксированная ставка? Сравните стоимость двух вариантов в трёх сценариях.</p><button class="btn btn-primary" data-action="decision">Сравнить варианты ${icon('arrow')}</button></section>`:`<section class="decision-banner"><div class="label">СЛЕДУЮЩИЙ ШАГ</div><h3>Сначала уточните экспозицию</h3><p>Проверьте контракты, суммы и сроки, прежде чем оценивать денежный эффект. В макете количественная модель доступна для финансирования.</p><button class="btn btn-sm" data-action="event" data-id="rates">Пример сравнения финансирования ${icon('arrow')}</button></section>`}<div class="detail-actions"><button class="btn btn-sm" data-action="sources">${icon('file')}Источники и доказательства</button><button class="btn btn-sm" data-action="agent">${icon('flow')}Как работает анализ</button></div><section class="followup"><h3>Посмотреть под другим углом</h3><p>Задайте вопрос по событию и контексту компании.</p><form id="question-form" class="question-form"><input id="question" aria-label="Уточняющий вопрос" placeholder="Например: какие данные ещё нужны?" maxlength="400" required autocomplete="off"><button class="send" type="submit" aria-label="Задать вопрос">${icon('send')}</button></form><div class="suggestions">${['Какие данные нужны?','Что меняется для казначейства?','Что проверить в первую очередь?'].map(q=>`<button class="suggestion" data-action="question" data-question="${esc(q)}">${esc(q)}</button>`).join('')}</div>${state.answers.map(answer=>`<div class="answer"><div class="label">ДЕМО-ОТВЕТ · БЕЗ ВЫЗОВА МОДЕЛИ</div><p><strong>${esc(answer.question)}</strong></p><p>${esc(answer.text)}</p><button class="inline-source" data-action="sources">Основание: профиль и демо-источники ${icon('external')}</button></div>`).join('')}</section>`;
  }

  function homeView() {
    return `<section class="home-welcome"><div class="eyebrow" style="color:#b8bbc5">ДОБРО ПОЖАЛОВАТЬ</div><h2>Александра, добрый день.</h2><p>Важное для вашей компании — в одном рабочем пространстве.</p></section><section class="home-tile"><div class="eyebrow">${icon('spark')}БИЗНЕС-ИНСАЙТЫ</div><h2>Новости с контекстом.<br>Решения с обоснованием.</h2><p>Узнайте, что меняется для компании «${esc(company().name)}», как это влияет на бизнес и какие варианты стоит рассмотреть.</p><div class="home-meta"><span>Персональная повестка</span><span>Прозрачные источники</span><span>Сравнение сценариев</span></div><button class="btn btn-primary" data-action="nav" data-view="insights">Открыть бизнес-инсайты ${icon('arrow')}</button></section>`;
  }

  function sourcesView() {
    return `<div class="decision-heading"><div><h2>Источники и происхождение выводов</h2><p>В рабочем сервисе сюда попадут новости и предоставленные материалы банка. В макете все тексты и связи смоделированы.</p></div><button class="btn" data-action="import">${icon('file')}Добавить демо-новость</button></div><div class="source-list-grid"><section class="source-overview"><div class="label">ВНЕШНИЕ СОБЫТИЯ</div><h3>Новостная повестка</h3><p>Примеры публикаций с темой, временем, исходным текстом и привязкой к событию. Реальные RSS-источники не подключены.</p><button class="btn btn-sm" data-action="sources">Посмотреть пример ${icon('arrow')}</button></section><section class="source-overview"><div class="label">ЭКСПЕРТНАЯ АНАЛИТИКА</div><h3>Материалы Альфа-Банка</h3><p>Реальные материалы банка не загружены. Примеры в макете демонстрируют только представление и происхождение аналитики.</p><button class="btn btn-sm" data-action="sources">Посмотреть формат ${icon('arrow')}</button></section></div>`;
  }

  function numberField(id,label,unit,step='1') {
    return `<label class="form-group"><span>${label}</span><span class="input-wrap"><input type="number" id="${id}" data-scenario="${id}" value="${esc(state.inputs[id])}" min="${id==='principal'?'0.01':id==='days'?'1':'0'}" step="${step}" aria-label="${label}"><span class="unit">${unit}</span></span></label>`;
  }

  function decisionView() {
    return `<div class="decision-heading"><div><h2>Плавающая или фиксированная ставка?</h2><p>Один горизонт, общие допущения, два варианта. Посмотрите, как меняется выбор при разных целях и сценариях.</p></div><button class="btn btn-sm" data-action="nav" data-view="insights">${icon('back')}К инсайту</button></div><div class="scenario-disclaimer">${icon('info')}Все суммы, ставки и условия ниже — синтетические примеры. Это не предложение банка и не прогноз. Они не получены из профиля компании.</div><div class="decision-grid"><section class="input-card" aria-label="Входные параметры сценария"><h3>Ваши допущения</h3><p>Измените значения — сравнение обновится.</p><div class="scenario-inputs">${numberField('principal','Остаток долга','млн ₽','0.1')}${numberField('days','Горизонт сравнения','дней')}${numberField('base','Текущая плавающая ставка','% годовых','0.1')}${numberField('shift','Изменение ставки в сценариях','п. п.','0.1')}<div class="input-section"><h4>Альтернатива: фиксированная ставка</h4><div class="form-pair">${numberField('fixed','Ставка','%','0.1')}${numberField('fee','Комиссия за переход','тыс. ₽')}</div></div><div class="input-section"><h4>Что для вас важнее?</h4><label class="form-group full-width"><span>Цель сравнения</span><select id="objective" data-scenario="objective"><option value="worst" ${state.inputs.objective==='worst'?'selected':''}>Снизить худшие затраты в сценариях</option><option value="unchanged" ${state.inputs.objective==='unchanged'?'selected':''}>Минимум затрат при прежней ставке</option></select></label>${numberField('maxFee','Допустимая разовая комиссия','тыс. ₽')}</div></div><button class="btn btn-text btn-sm" data-action="reset-inputs">Сбросить допущения</button><p class="input-footnote">Источники значений: синтетические данные / ваш ввод. Платежи не выполняются.</p></section><div class="results-stack" id="scenario-results" aria-live="polite"></div></div><div class="decision-bottom"><span id="scenario-version">Версия допущений ${state.inputVersion}</span><button class="btn btn-text btn-sm" data-action="agent">${icon('flow')}Логика подготовки решения</button></div>`;
  }

  function calculate(inputs) {
    const keys=['principal','days','base','fixed','fee','maxFee','shift'];
    if(keys.some(k=>String(inputs[k]).trim()==='' || !Number.isFinite(Number(inputs[k])))) return {error:'Заполните все числовые параметры. Отсутствующее значение нельзя заменить нулём.'};
    const v=Object.fromEntries(keys.map(k=>[k,Number(inputs[k])]));
    if(v.principal<=0 || v.days<=0 || v.days>3650 || !Number.isInteger(v.days) || v.fee<0 || v.maxFee<0 || v.shift<0 || v.base-v.shift<0 || v.base+v.shift>100 || v.fixed<0 || v.fixed>100) return {error:'Проверьте параметры: долг и целое число дней должны быть положительными, ставки в сценариях — от 0 до 100%, комиссии — неотрицательными. Максимальный горизонт: 3 650 дней.'};
    const principal=v.principal*1e6, fee=v.fee*1000;
    const fixedCost=principal*(v.fixed/100)*v.days/365+fee;
    const rows=[['Снижение ставки',v.base-v.shift],['Без изменений',v.base],['Рост ставки',v.base+v.shift]].map(([label,rate])=>({label,rate,floating:principal*(rate/100)*v.days/365,fixed:fixedCost}));
    const target=inputs.objective==='worst'?Math.max(...rows.map(r=>r.floating)):rows[1].floating;
    const feasible=v.fee<=v.maxFee;
    const choice=!feasible?'floating':Math.abs(target-fixedCost)<.005?'tie':fixedCost<target?'fixed':'floating';
    return {rows,fixedCost,target,feasible,choice,fee,breakEven:v.fixed+(fee*365/(principal*v.days))*100,saving:Math.abs(target-fixedCost),values:v};
  }

  function updateScenarioResults() {
    const root=document.getElementById('scenario-results');
    if(!root)return;
    const r=calculate(state.inputs);
    document.getElementById('scenario-version').textContent=`Версия допущений ${state.inputVersion} · расчёт по текущим значениям`;
    if(r.error) {root.innerHTML=`<div class="comparison-error" role="alert">${esc(r.error)}</div>`;return;}
    const max=Math.max(...r.rows.map(row=>Math.max(row.floating,row.fixed)),1);
    const objective=state.inputs.objective==='worst'?'снижение худших затрат в трёх сценариях':'минимум затрат при неизменной ставке';
    const preferred=r.choice==='fixed'?'fixed':r.choice==='tie'?'tie':'floating';
    const title=r.choice==='fixed'?'Фиксация снижает худшие затраты':r.choice==='tie'?'При этой цели затраты одинаковы':!r.feasible?'Переход не проходит ограничение по комиссии':state.inputs.objective==='unchanged'?'При прежней ставке выгоднее остаться':'В этих сценариях плавающая ставка дешевле';
    const explanation=!r.feasible?`Разовая комиссия ${money(r.fee)} превышает ваш лимит ${money(r.values.maxFee*1000)}. Текущий вариант остаётся допустимым, но чувствительность к росту ставки сохраняется.`:r.choice==='fixed'?`При цели «${objective}» фиксированный вариант дешевле на ${money(r.saving)}. За защиту от роста ставки вы отказываетесь от экономии при её снижении и платите комиссию в начале периода.`:r.choice==='tie'?`При выбранной цели денежные затраты совпадают. Проверьте ликвидность, условия договора и чувствительность к изменению ставки — они могут изменить предпочтение.`:`При цели «${objective}» текущий вариант дешевле на ${money(r.saving)}. Это условный результат для заданных допущений, а не гарантия будущей стоимости долга.`;
    root.innerHTML=`<section class="result-card"><div class="chart-top"><h3>Стоимость за ${r.values.days} дней</h3><div class="legend"><span><i class="legend-dot"></i>Плавающая</span><span><i class="legend-dot red"></i>Фиксированная</span></div></div><div class="bars-chart" role="img" aria-label="Сравнение стоимости финансирования в трёх сценариях. Точные значения приведены в таблице ниже.">${r.rows.map(row=>`<div class="chart-group"><div class="bars"><div class="bar" style="height:${Math.max(1,row.floating/max*120)}px"><span>${million(row.floating)}</span></div><div class="bar fixed" style="height:${Math.max(1,row.fixed/max*120)}px"><span>${million(row.fixed)}</span></div></div><div class="chart-caption">${row.label}<small>${percent(row.rate)}% годовых</small></div></div>`).join('')}</div><table class="scenario-table"><caption class="visually-hidden">Затраты на проценты и комиссию, рубли</caption><thead><tr><th>Сценарий</th><th>Плавающая</th><th>Фиксированная</th><th>Разница¹</th></tr></thead><tbody>${r.rows.map((row,i)=>`<tr><td>${esc(row.label)}</td><td data-testid="floating-${i}" data-value="${row.floating}">${money(row.floating)}</td><td data-testid="fixed-${i}" data-value="${row.fixed}">${money(row.fixed)}</td><td class="${row.fixed<=row.floating?'good':'bad'}">${row.fixed<=row.floating?'−':'+'}${money(Math.abs(row.fixed-row.floating))}</td></tr>`).join('')}</tbody></table><div class="break-even"><span>Порог равной стоимости · плавающая ставка</span><strong id="breakeven-value" data-value="${r.breakEven}">${new Intl.NumberFormat('ru-RU',{maximumFractionDigits:4}).format(r.breakEven)}%</strong></div><p style="font-size:8px;color:#a1a6af;margin:12px 0 0;line-height:1.8">¹ Фиксированная минус плавающая, включая разовую комиссию. Меньшее значение затрат предпочтительнее.</p></section><section class="result-card recommendation ${!r.feasible?'warning':''}" data-testid="recommendation"><div class="label">${icon('spark')}УСЛОВНЫЙ ВЫВОД · НЕ ПОЗИЦИЯ БАНКА</div><h3 data-testid="preferred-option" data-choice="${preferred}">${title}</h3><p>${esc(explanation)}</p><div class="recommendation-meta"><div><small>Худшие затраты · плавающая</small><strong>${million(Math.max(...r.rows.map(row=>row.floating)))} ₽</strong></div><div><small>Худшие затраты · фиксированная</small><strong>${million(r.fixedCost)} ₽</strong></div></div><p style="margin:16px 0 0;font-size:10px">Следующий шаг: подтвердить действительную котировку, сроки переоценки и допустимую нагрузку на ликвидность перед выбором.</p></section><section class="result-card assumptions"><details><summary>Допущения и формулы <span>+</span></summary><ul><li>Остаток долга постоянен. Простые проценты, ACT/365.</li><li>Сценарная ставка действует сразу и весь горизонт. Спред неизменен.</li><li>Погашение основного долга, налоги, дисконтирование и прочие расходы не учитываются.</li><li>«Худшие затраты» — только среди трёх показанных сценариев. Вероятности не назначены.</li><li>Все исходные значения синтетические или введены вами; реальная банковская котировка отсутствует.</li></ul><code>Плавающая: долг × годовая ставка × дни / 365<br>Фиксированная: долг × фикс. ставка × дни / 365 + комиссия</code></details></section>`;
  }

  function evidenceBody() {
    const e=event(),c=company(),custom=e.id.startsWith('custom');
    return `<div class="drawer-notice">${custom?'Введённый текст не проверен. Реальные материалы банка не подключены.':'Все фрагменты ниже синтетические. Они показывают формат доказательств, но не являются реальными новостями или материалами Альфа-Банка.'}</div><section class="evidence-card"><div class="label">${custom?'ПОЛЬЗОВАТЕЛЬСКИЙ ВВОД · НЕ ПРОВЕРЕН':'ВНЕШНЯЯ НОВОСТЬ · СИНТЕТИЧЕСКИЙ ПРИМЕР'}</div><h3>${esc(e.sourceTitle)}</h3><blockquote>${esc(e.fact)}</blockquote><div class="evidence-id">news:${esc(e.id)}:paragraph-1 · демонстрационный фрагмент</div><p class="evidence-warning">Подлинность, актуальность и первоисточник не подтверждены.</p></section>${!custom?`<section class="evidence-card"><div class="label">АНАЛИТИКА БАНКА · СМОДЕЛИРОВАНО</div><h3>${esc(e.bankTitle)}</h3><blockquote>${esc(e.bank)}</blockquote><div class="evidence-id">research:demo-${esc(e.id)}:paragraph-1</div><p class="evidence-warning">Не цитата из реального исследования. Не отражает действительную позицию банка.</p></section>`:''}<section class="evidence-card"><div class="label">КЛИЕНТСКИЕ ПРИЗНАКИ · СИНТЕТИЧЕСКИЙ ПРОФИЛЬ</div><h3>${esc(c.name)}</h3><blockquote>${esc(c.profiles.join(' · '))}. Кредитный остаток, ставки и договорные сроки неизвестны.</blockquote><div class="evidence-id">company:${c.id}:profile-v1</div></section>`;
  }

  function agentDiagram() {
    return `<div class="trace-diagram" data-testid="agent-diagram"><div class="diagram-top"><strong>Свой оркестратор · общий контекст</strong><span>Без агентного фреймворка</span></div><div class="flow-node"><strong>01 · Планирование</strong><small>Какие данные нужны для этого события?</small></div><div class="flow-arrow" aria-hidden="true">↓</div><div class="flow-node"><strong>02 · Профиль компании</strong><small>Признаки, связи и неизвестные параметры</small></div><div class="flow-arrow" aria-hidden="true">↓</div><div class="flow-parallel"><div class="flow-node"><strong>Новости</strong><small>Факты и первоисточники</small></div><div class="flow-node"><strong>Аналитика банка</strong><small>Датированные фрагменты</small></div></div><div class="flow-arrow" aria-hidden="true">↓</div><div class="flow-node red"><strong>03 · Интерпретация влияния</strong><small>Экспозиция → риск / возможность → доказательства</small></div><div class="flow-arrow" aria-hidden="true">↓</div><div class="flow-node"><strong>04 · Проверка обоснованности</strong><small>Источники существуют? Вывод поддержан? Что неизвестно?</small></div><div class="flow-loop">↶ Недостаточно данных → уточнить запрос и повторить поиск<br>Лимит исчерпан → условный ответ или отказ от вывода</div><div class="flow-node green"><strong>05 · Сценарный расчёт → следующий шаг</strong><small>Явные параметры · детерминированные формулы · условный выбор</small></div><p class="flow-legend">Схема показывает целевую логику. В макете вызовы инструментов и модели имитируются. Расчёт в сравнении вариантов работает по введённым значениям.</p></div>`;
  }

  function agentBody() {
    return `<div class="drawer-notice">Это демонстрация последовательности работы, без вызовов LLM, реального поиска или проверки источников. В реализации роли будут функциями и промптами собственного Python-оркестратора.</div>${agentDiagram()}<div class="trace-title"><h3>Пример хода анализа</h3><small>Демо-прогон № ${state.run}</small></div><div class="trace-list">${trace.map((step,i)=>`<div class="trace-step"><span class="step-marker ${i>=state.stage?(state.running&&i===state.stage?'running':'pending'):''}">${i<state.stage?'✓':String(i+1).padStart(2,'0')}</span><div><h4>${esc(step.title)}</h4><p>${esc(step.detail)}</p><code>${esc(step.tool)}</code></div></div>`).join('')}</div><section class="retry-demo"><h3>Что происходит, если данных не хватает?</h3><p>${state.retry?'Симуляция: проверка обнаружила отсутствие параметров кредита. Оркестратор уточняет запрос и повторяет поиск. Договор не найден — количественный вывод остаётся недоступен, а интерпретация условной.':'Покажите ветку самопроверки: в профиле есть кредитный продукт, но нет остатка долга и условий договора.'}</p><button class="btn btn-sm" data-action="retry" data-testid="retry-demo">${state.retry?'Сбросить пример':'Показать ветку повторного поиска'} ${icon('refresh')}</button>${state.retry?'<div class="flow-loop" data-testid="retry-result">Проверка → новый запрос по условиям кредита → нет подтверждённых параметров → запрос данных у пользователя. Сценарий только иллюстративный.</div>':''}</section><button class="btn btn-dark" data-action="refresh" ${state.running?'disabled':''}>${icon('refresh')}${state.running?'Демо-прогон идёт…':'Воспроизвести демо-прогон'}</button>`;
  }

  function profileBody() {
    const c=company();
    return `<div class="drawer-notice">Компания, значения и права демо-пользователя вымышлены. Наличие продукта не раскрывает остаток, ставку или дату переоценки.</div><div class="profile-grid">${[['Компания',c.name],['Отрасль',c.sector],['Выручка',c.revenue],['Регион',c.region],['Кредитные продукты',c.credit===true?'Отмечены в демо-профиле':'Неизвестно'],['Внешняя торговля',c.imports?'Отмечена в демо-профиле':'Не подтверждена'],['Депозиты',c.deposits?'Отмечены в демо-профиле':'Не подтверждены'],['Роль пользователя',state.role==='cfo'?'Финансовый директор':'Руководитель казначейства']].map(([label,value])=>`<div class="profile-fact"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`).join('')}</div><div class="profile-note">Доля рынка, остаток долга и сроки кредитов неизвестны. Числа в сравнении сценариев — отдельные синтетические допущения, а не извлечённые параметры этой компании.</div>`;
  }

  function guideBody() {
    return `<div class="drawer-notice">Макет показывает пользовательский сценарий и работающие вычисления. Модели, сбор новостей, поиск и банковские интеграции не подключены.</div>${[
      ['Выберите компанию и роль','Сравните «Северную мануфактуру» и «Вектор Индустрия»: обе в промышленности, но их демонстрационные экспозиции различаются.'],
      ['Откройте событие','В ленте меняются ранжирование и персональный контекст. Посмотрите риск, возможность и отдельно обозначенный аналитический комментарий.'],
      ['Проверьте происхождение','Откройте источники и схему «Как работает анализ». Попробуйте ветку повторного поиска при нехватке данных.'],
      ['Сравните варианты','В событии про ставку откройте сравнение. Измените цель с худших затрат на стоимость при прежней ставке: предпочтение изменится. Затем поставьте лимит комиссии 0.'],
      ['Уточните и дайте обратную связь','Задайте вопрос, отметьте полезность или добавьте свою демо-новость. Ответы и классификация в макете шаблонные.']
    ].map(([title,text],i)=>`<section class="guide-step"><span>0${i+1}</span><div><h3>${title}</h3><p>${text}</p></div></section>`).join('')}`;
  }

  function importBody() {
    return `<div class="drawer-notice">Текст останется только в памяти этой вкладки и исчезнет после перезагрузки. Классификация здесь выполняется простым правилом по словам, без модели. Не вводите чувствительные данные.</div><form id="import-form" class="import-form"><label for="import-title">Заголовок</label><input type="text" id="import-title" maxlength="180" required placeholder="Например: меняются сроки поставок"><label for="import-text">Текст публикации</label><textarea id="import-text" required maxlength="6000" placeholder="Вставьте текст для проверки интерфейса…"></textarea><button class="btn btn-primary" type="submit">Добавить в демо-ленту ${icon('arrow')}</button></form>`;
  }

  function openDrawer(kind) {
    lastFocus=document.activeElement;
    state.drawer=kind;
    document.body.style.overflow='hidden';
    document.querySelector('.workspace').inert=true;
    document.querySelector('.sidebar').inert=true;
    renderDrawer();
    document.querySelector('.close-button').focus();
  }

  function renderDrawer() {
    if(!state.drawer)return;
    const oldScroll=document.querySelector('.drawer')?.scrollTop || 0;
    const titles={sources:['Основания для вывода','Фрагменты, клиентские признаки и происхождение'],agent:['Как работает анализ','Планирование, инструменты, самопроверка и решение'],profile:['Контекст компании','Что известно и какие данные ещё нужны'],guide:['Знакомство с макетом','Пройдите путь от события к решению'],import:['Добавить демо-новость','Проверка интерфейса на новом тексте']};
    const [title,sub]=titles[state.drawer];
    const tabs=['sources','agent'].includes(state.drawer)?`<div class="drawer-tabs"><button class="drawer-tab ${state.drawer==='sources'?'active':''}" data-action="drawer-tab" data-tab="sources">Источники</button><button class="drawer-tab ${state.drawer==='agent'?'active':''}" data-action="drawer-tab" data-tab="agent">Логика и ход анализа</button></div>`:'<div style="height:24px"></div>';
    document.getElementById('overlay-root').innerHTML=`<div class="overlay"><section class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title"><div class="drawer-top"><div><h2 id="drawer-title">${title}</h2><p>${sub}</p></div><button class="close-button" data-action="close" aria-label="Закрыть">${icon('close')}</button></div>${tabs}${({sources:evidenceBody,agent:agentBody,profile:profileBody,guide:guideBody,import:importBody})[state.drawer]()}</section></div>`;
    document.querySelector('.drawer').scrollTop=oldScroll;
  }

  function closeDrawer() {
    state.drawer=null;
    document.getElementById('overlay-root').replaceChildren();
    document.body.style.overflow='';
    document.querySelector('.workspace').inert=false;
    document.querySelector('.sidebar').inert=false;
    if(lastFocus?.isConnected)lastFocus.focus();
    else main.focus();
  }

  function go(view) {
    if(view==='agent'){openDrawer('agent');return;}
    if(state.drawer)closeDrawer();
    state.view=view;
    if(view==='decision'){state.layer=3;state.selected='rates';state.filter='all';state.answers=[];}
    if(view==='insights' && state.layer===3)state.layer=2;
    render();
    window.scrollTo({top:0,behavior:'instant'});
  }

  function ask(question) {
    const q=question.trim();
    if(!q)return;
    const c=company(),e=event();
    let answer=`Для компании «${c.name}» сначала проверьте подтверждённую связь события «${e.title}» с договорами, контрагентами и платежами. Сейчас доступны только синтетические признаки. Вывод о денежном эффекте без сумм и сроков будет преждевременным.`;
    if(/данн|нужн|первую/i.test(q)) answer=`Для компании «${c.name}» нужны остаток обязательств, фиксированная или плавающая база ставки, дата переоценки, график платежей и возможная комиссия за переход. Продуктовый флаг этого не раскрывает. В сравнении можно проверить гипотезу на явно заданных допущениях.`;
    if(/казнач|ликвид|кассов/i.test(q))answer=`В роли казначейства для ${c.name} в фокусе доступная ликвидность, сроки обязательных платежей и разовая комиссия. Уточните минимальный остаток и платёжный календарь; более низкая стоимость процентов не всегда означает подходящий денежный график.`;
    state.answers.push({question:q,text:answer});
    render();
    document.querySelector('.answer:last-child')?.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function refresh() {
    if(state.running)return;
    state.running=true;state.stage=0;state.run++;state.retry=false;
    if(!state.drawer)openDrawer('agent');
    else {state.drawer='agent';renderDrawer();}
    analysisTimer=setInterval(()=>{
      state.stage++;
      if(state.stage>=trace.length){clearInterval(analysisTimer);state.running=false;render();notify('Демо-прогон завершён. Вызовы модели и инструментов имитировались.');}
      if(state.drawer==='agent')renderDrawer();
    },300);
  }

  document.addEventListener('click', e=>{
    if(e.target.classList.contains('overlay')){closeDrawer();return;}
    const button=e.target.closest('[data-action]');
    if(!button)return;
    const {action}=button.dataset;
    if(action==='nav')go(button.dataset.view);
    if(action==='close')closeDrawer();
    if(['profile','guide','import','sources','agent'].includes(action))openDrawer(action);
    if(action==='drawer-tab'){state.drawer=button.dataset.tab;renderDrawer();document.querySelector(`.drawer-tab[data-tab="${state.drawer}"]`)?.focus();}
    if(action==='filter'){state.filter=button.dataset.filter;const visible=ranked().filter(item=>state.filter==='all'||item.category===state.filter);if(visible.length&&!visible.some(item=>item.id===state.selected)){state.selected=visible[0].id;state.answers=[];}render();}
    if(action==='event'){state.selected=button.dataset.id;state.answers=[];state.view='insights';if(state.layer===3)state.layer=2;render();if(innerWidth<=740)document.querySelector('.detail-card').scrollIntoView({behavior:'smooth',block:'start'});}
    if(action==='decision')go('decision');
    if(action==='layer'){state.layer=Number(button.dataset.layer);if(state.layer===3)go('decision');else{state.view='insights';render();}}
    if(action==='question')ask(button.dataset.question);
    if(action==='feedback'){state.feedback[feedbackKey()]=button.dataset.value;render();notify('Обратная связь отмечена в этой вкладке.');}
    if(action==='reset-inputs'){state.inputs=defaults();state.inputVersion++;render();notify('Восстановлены синтетические допущения.');}
    if(action==='retry'){state.retry=!state.retry;renderDrawer();document.querySelector('[data-testid="retry-demo"]')?.focus();}
    if(action==='refresh')refresh();
  });

  document.addEventListener('change', e=>{
    if(e.target.id==='company'){
      state.comparisons[state.company]={inputs:{...state.inputs},version:state.inputVersion};
      state.company=e.target.value;
      const stored=state.comparisons[state.company];
      state.inputs=stored?{...stored.inputs}:defaults();state.inputVersion=stored?.version || 1;
      state.answers=[];state.selected=state.view==='decision'?'rates':ranked()[0].id;
      clearInterval(analysisTimer);state.running=false;state.stage=6;
      render();document.getElementById('company').focus();
      notify('Повестка и интерпретация изменены для выбранной компании.');
    }
    if(e.target.id==='role'){state.role=e.target.value;state.answers=[];render();document.getElementById('role').focus();notify('Приоритеты изменены. Факты и профиль компании сохранены.');}
    if(e.target.dataset.scenario==='objective'){state.inputs.objective=e.target.value;state.inputVersion++;updateScenarioResults();}
  });

  document.addEventListener('input', e=>{
    const key=e.target.dataset.scenario;
    if(key && key!=='objective'){state.inputs[key]=e.target.value;state.inputVersion++;updateScenarioResults();}
  });

  document.addEventListener('submit', e=>{
    if(e.target.id==='question-form'){e.preventDefault();ask(document.getElementById('question').value);}
    if(e.target.id==='import-form'){
      e.preventDefault();
      const title=document.getElementById('import-title').value.trim(),text=document.getElementById('import-text').value.trim();
      if(!title||!text)return;
      const content=(title+' '+text).toLowerCase();
      const category=/ставк|кредит|депозит|финанс/.test(content)?'financing':/постав|валют|импорт|логист/.test(content)?'supply':'market';
      const id=`custom-${Date.now()}`;
      state.customEvents.push({id,category,tag:'ДОБАВЛЕНО ВРУЧНУЮ · НЕ ПРОВЕРЕНО',date:'В этой вкладке',title,short:text.length>110?text.slice(0,110)+'…':text,headline:title,fact:text,bank:'Релевантная аналитика банка не подключена. До поиска по реальным материалам нельзя формировать позицию банка.',risk:'Влияние на компанию не проверено. Уточните экспозицию, источник и условия события.',opportunity:'Проверить источник и связь с конкретными договорами или контрагентами.',sourceTitle:'Введённый пользователем текст',bankTitle:'Аналитика не найдена'});
      state.selected=id;state.filter='all';state.answers=[];closeDrawer();state.view='insights';state.layer=1;render();notify('Текст добавлен в демо-ленту. Классификация по словам, без LLM.');
    }
  });

  document.addEventListener('keydown', e=>{
    if(!state.drawer)return;
    if(e.key==='Escape'){e.preventDefault();closeDrawer();return;}
    if(e.key==='Tab'){
      const nodes=[...document.querySelectorAll('.drawer button:not(:disabled), .drawer input, .drawer select, .drawer textarea, .drawer a[href]')].filter(n=>n.getClientRects().length);
      const first=nodes[0],last=nodes[nodes.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });

  document.querySelector('.brand').addEventListener('click', e=>{e.preventDefault();go('home');});
  render();
})();
