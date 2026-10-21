(function () {
  'use strict';

  var STORE_DRAFT = 'ti_draft_v2';
  var STORE_RESP = 'ti_responses_v2';
  var STORE_INTAKE_DRAFT = 'ti_intake_draft_v2';
  var STORE_INTAKE_RESP = 'ti_intake_resp_v2';

  /* ---------------- 基础工具 ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  var toastTimer;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { toast('已复制，可直接粘贴到微信'); },
        function () { fallbackCopy(text); });
    } else { fallbackCopy(text); }
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    toast(ok ? '已复制，可直接粘贴到微信' : '复制失败，请长按下方文字手动选择');
  }
  function download(filename, content, mime) {
    var blob = new Blob([content], { type: (mime || 'text/plain') + ';charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 400);
  }
  function loadJSON(key, dft) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : dft; }
    catch (e) { return dft; }
  }
  function saveJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  /* ---------------- 字段索引 ---------------- */
  var FIELD_INDEX = {};
  var ALL_FIELDS = [];
  SURVEY.sections.forEach(function (sec) {
    sec.fields.forEach(function (f) {
      f._sec = sec.id;
      FIELD_INDEX[f.id] = f;
      ALL_FIELDS.push(f);
    });
  });
  function getField(id) { return FIELD_INDEX[id] || null; }
  function optLabel(f, val) {
    if (!f || !f.opts) return String(val);
    for (var i = 0; i < f.opts.length; i++) {
      if (f.opts[i][0] === val) return f.opts[i][2] || f.opts[i][1];
    }
    return String(val);
  }
  function answerText(fid, ans) {
    var f = getField(fid), v = ans[fid];
    if (!f) return '';
    if (v == null || v === '') return '';
    if (Array.isArray(v)) {
      if (!v.length) return '';
      return v.map(function (x) { return optLabel(f, x); }).join('、');
    }
    if (f.type === 'radio') return optLabel(f, v);
    if (f.type === 'number') return String(v) + (f.unit ? ' ' + f.unit : '');
    return String(v);
  }

  /* 学校行辅助：保证数组存在、清错、按 id 取团队版字段 */
  function ensureRows(id) {
    if (!Array.isArray(state.intake[id])) state.intake[id] = [{ name: '', deal: '' }];
    return state.intake[id];
  }
  function intakeField(id) {
    for (var i = 0; i < INTAKE.fields.length; i++) if (INTAKE.fields[i].id === id) return INTAKE.fields[i];
    return null;
  }
  function clearIntakeError(id, inp) {
    if (state.intakeErrors[id]) {
      delete state.intakeErrors[id];
      var fld = $('#fld-data-intake-' + id);
      if (fld) fld.classList.remove('invalid');
    }
    if (inp) {
      var p = inp.parentNode && inp.parentNode.classList.contains('field') ? inp.parentNode : null;
      if (p) p.classList.remove('invalid');
    }
  }
  function filledSchools(v) {
    return (Array.isArray(v) ? v : []).filter(function (r) {
      return r && typeof r === 'object' && String(r.name || '').trim();
    });
  }

  /* ---------------- 状态与路由 ---------------- */
  var state = {
    view: 'home',
    step: 0,
    ans: {},
    tab: 'summary',
    intake: {},
    lastRecord: null,
    lastIntake: null,
    expanded: null,
    errors: {},
    intakeErrors: {}
  };

  function parseParams() {
    var q = {};
    var s = location.search.replace(/^\?/, '');
    if (!s) return q;
    s.split('&').forEach(function (kv) {
      var p = kv.split('=');
      if (p[0]) q[decodeURIComponent(p[0])] = decodeURIComponent((p[1] || '').replace(/\+/g, ' '));
    });
    return q;
  }
  var PARAMS = parseParams();
  function go(hash) { location.hash = hash; }

  function route() {
    var h = (location.hash || '#/').replace(/^#/, '');
    if (h === '/s') state.view = 'survey';
    else if (h === '/done') state.view = 'done';
    else if (h === '/i') state.view = 'intake';
    else if (h === '/idone') state.view = 'idone';
    else if (h.indexOf('/admin') === 0) state.view = 'admin';
    else state.view = 'home';
    render();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  /* ===========================================================
     渲染入口
     =========================================================== */
  function render() {
    var app = $('#app');
    if (state.view === 'home') app.innerHTML = viewHome();
    else if (state.view === 'survey') app.innerHTML = viewSurvey();
    else if (state.view === 'done') app.innerHTML = viewDone();
    else if (state.view === 'intake') app.innerHTML = viewIntake();
    else if (state.view === 'idone') app.innerHTML = viewIntakeDone();
    else if (state.view === 'admin') app.innerHTML = viewAdmin();
    bind();
  }

  function topbar(right) {
    return '<div class="topbar">' +
      '<div class="brandmark"><div class="branddot"></div>' +
      '<div class="brandtext">ClassIn 客户培训 · 需求诊断</div></div>' +
      (right || '') + '</div>';
  }

  /* ===========================================================
     首页：两份问卷
     =========================================================== */
  function viewHome() {
    var s = PARAMS.s ? '<div style="margin:0 0 12px"><span class="pill"><span class="dot"></span>本次填报 · ' + esc(PARAMS.s) + '</span></div>' : '';
    return topbar('') +
      '<div class="hero">' +
      s +
      '<h1>在排培训之前，<br>先问对<em>问题</em></h1>' +
      '<p class="hero-lead">一场没做需求诊断的培训，最常见的结局是：讲的人很努力，听的人很客气，一个月后什么都没变。</p>' +
      '<p class="hero-lead">这套问诊单分两份：一份给学校填，问的是「你们现在到哪一步了」；一份给 ClassIn 团队填，记的是「这次合作的事实边界」。两份合起来，才够设计一场培训。</p>' +
      '</div>' +
      '<div class="entry">' +
      '<button class="entry-btn primary" data-go="#/s">' +
      '<span class="entry-icon">校</span>' +
      '<span><span class="entry-t">培训需求问诊单 · 学校版</span>' +
      '<span class="entry-d">给校内对接人、教研组长、参训教师 · 约 5 分钟</span></span>' +
      '<span class="arrow">›</span></button>' +
      '<button class="entry-btn" data-go="#/i">' +
      '<span class="entry-icon">团</span>' +
      '<span><span class="entry-t">培训需求问诊单 · 团队版</span>' +
      '<span class="entry-d">ClassIn 内部使用 · 商务与执行事实 · 约 4 分钟</span></span>' +
      '<span class="arrow">›</span></button>' +
      '</div>' +
      '<div class="notebox">' +
      '<h3>两份问卷分别解决什么</h3>' +
      '<ol>' +
      '<li>学校版：学校买到哪一步、用到什么程度、卡在哪一层、这次想要什么</li>' +
      '<li>团队版：本次涉及哪几所学校、各自签到哪一步、费用、差旅、场地、同场安排，以及客户需求的原话</li>' +
      '<li>两份答卷汇总后自动做一致性检查，指出「目标与条件不匹配」的地方</li>' +
      '</ol></div>' +
      '<div class="row" style="margin-top:18px">' +
      '<button class="mini-btn" data-go="#/admin">汇总与诊断</button>' +
      '<button class="mini-btn" data-go="#/admin?tab=sop">工作流 SOP</button>' +
      '</div>' +
      '<div class="footnote">' +
      '必答题用紫色标记，其余可以整段跳过。填写内容保存在本机浏览器、不会自动上传——填完请点「复制答复」发回对接人。<br>' +
      '在微信里打开时，请点右上角「···」，选「在浏览器打开」。</div>';
  }

  /* ===========================================================
     学校版填报
     =========================================================== */
  function currentSection() { return SURVEY.sections[state.step]; }
  var draftLoaded = false;

  function restoreDraft() {
    if (draftLoaded) return;
    draftLoaded = true;
    var d = loadJSON(STORE_DRAFT, null);
    if (d && d.answers) {
      state.ans = d.answers;
      state.step = Math.min(d.step || 0, SURVEY.sections.length - 1);
    }
    if (PARAMS.s && !state.ans.school) state.ans.school = PARAMS.s;
  }
  function saveDraft() {
    saveJSON(STORE_DRAFT, { answers: state.ans, step: state.step, at: Date.now() });
  }

  function viewSurvey() {
    restoreDraft();
    var sec = currentSection();
    var total = SURVEY.sections.length;
    var pct = Math.round(((state.step + 1) / total) * 100);
    var reqCount = sec.fields.filter(function (f) { return f.req; }).length;

    var html = topbar('<button class="topbar-link" data-go="#/">退出</button>');
    html += '<div class="sticky-head">' +
      '<div class="progress-row">' +
      '<span class="progress-label">学校版 · 第 <b>' + (state.step + 1) + '</b> / ' + total + ' 步</span>' +
      '<span class="progress-label">' + pct + '%</span>' +
      '</div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      '</div>';

    html += '<div class="section-head">' +
      '<span class="eyebrow">' + sec.id + ' · ' + esc(sec.title) + '</span>' +
      '<h2>' + esc(sec.title) + '</h2>' +
      '<p>' + esc(sec.desc) + '</p>' +
      '<div class="secmeta">本步 ' + sec.fields.length + ' 题 · 必答 ' + reqCount + ' 题' +
      (sec.fields.length > reqCount ? ' · 其余可跳过' : '') + '</div>' +
      '</div>';

    sec.fields.forEach(function (f, i) {
      html += renderField(f, i + 1, {
        get: function (id) { return state.ans[id]; },
        attr: 'data-f', pick: 'data-pick'
      });
    });

    var isLast = state.step === total - 1;
    html += '<div style="height:24px"></div>';
    html += '<div class="survey-actions"><div class="survey-actions-inner">' +
      (state.step > 0 ? '<button class="btn btn-ghost" data-act="prev">上一步</button>' : '') +
      '<button class="btn btn-main" data-act="' + (isLast ? 'submit' : 'next') + '">' +
      (isLast ? '提交问诊单' : '下一步') + '</button>' +
      '</div></div>';
    return html;
  }

  /* 学校 + 合同状态：逐行绑定。一所学校一行，状态跟着学校走 */
  function schoolRows(v) {
    var rows = Array.isArray(v) ? v.filter(function (r) { return r && typeof r === 'object'; }) : [];
    if (!rows.length) rows = [{ name: '', deal: '' }];
    return rows;
  }
  function renderSchoolRows(f, v) {
    var rows = schoolRows(v);
    var html = '<div class="school-rows">';
    rows.forEach(function (row, ri) {
      html += '<div class="school-row" data-srowwrap="' + ri + '">' +
        '<div class="school-row-head">' +
        '<span class="school-no">' + (ri + 1) + '</span>' +
        '<span class="school-row-t">学校全称与校区</span>' +
        (rows.length > 1 ? '<button type="button" class="school-del" data-srow-del="' + f.id +
          '" data-idx="' + ri + '">删除</button>' : '') +
        '</div>' +
        '<input class="inp" type="text" data-srow-name="' + f.id + '" data-idx="' + ri + '" value="' +
        esc(row.name || '') + '" placeholder="例：济南市历下区××实验学校（东校区）">' +
        '<div class="school-deal-title">这所学校的合同 / 报价状态</div>' +
        '<div class="opts cols-2 school-deal">';
      f.opts.forEach(function (op) {
        html += '<button type="button" class="opt' + (row.deal === op[0] ? ' on' : '') + '"' +
          ' data-srow-pick="' + f.id + '" data-idx="' + ri + '" data-val="' + esc(op[0]) + '">' +
          '<span class="mark"></span><span class="txt">' + esc(op[1]) + '</span></button>';
      });
      html += '</div></div>';
    });
    html += '</div>';
    html += '<button type="button" class="add-school" data-srow-add="' + f.id + '">' +
      esc(f.addText || '+ 再添加一所学校') + '</button>';
    return html;
  }

  /* 通用字段渲染 */
  function renderField(f, idx, o) {
    var v = o.get(f.id);
    var errStore = (o.attr === 'data-f') ? state.errors : state.intakeErrors;
    var html = '<div class="field' + (errStore[f.id] ? ' invalid' : '') + '" id="fld-' + o.attr + '-' + f.id + '">';
    html += '<div class="field-head"><div class="field-label"><span class="idx">' + idx + '.</span>' +
      esc(f.label) + '</div>' +
      '<span class="tag ' + (f.req ? 'req' : 'opt') + '">' + (f.req ? '必答' : '选填') + '</span></div>';
    if (f.hint) html += '<div class="field-hint">' + esc(f.hint) + '</div>';

    if (f.type === 'text') {
      html += '<input class="inp" type="text" ' + o.attr + '="' + f.id + '" value="' + esc(v || '') +
        '" placeholder="' + esc(f.ph || '') + '">';
    } else if (f.type === 'number') {
      html += '<input class="inp" type="number" inputmode="numeric" ' + o.attr + '="' + f.id + '" value="' +
        esc(v == null ? '' : v) + '" placeholder="' + esc(f.ph || '') + '">';
      if (f.unit) html += '<div class="counter">单位：' + esc(f.unit) + '</div>';
    } else if (f.type === 'textarea') {
      var maxlen = f.maxlen || 300;
      html += '<textarea class="inp" ' + o.attr + '="' + f.id + '" maxlength="' + maxlen +
        '" placeholder="' + esc(f.ph || '') + '">' + esc(v || '') + '</textarea>' +
        '<div class="counter" data-counter="' + f.id + '">' + (v || '').length + ' / ' + maxlen + '</div>';
    } else if (f.type === 'schools') {
      html += renderSchoolRows(f, v);
    } else {
      var shortAll = f.opts.every(function (x) { return x[1].length <= 8; });
      var cols = (shortAll && f.opts.length > 2 && f.opts.length <= 4) ? ' cols-2' : '';
      html += '<div class="opts' + cols + '">';
      f.opts.forEach(function (op) {
        var on = f.type === 'radio' ? v === op[0] : (Array.isArray(v) && v.indexOf(op[0]) > -1);
        html += '<button type="button" class="opt' + (on ? ' on' : '') + '" ' + o.pick + '="' + f.id +
          '" data-val="' + esc(op[0]) + '" data-mode="' + f.type + '">' +
          '<span class="mark' + (f.type === 'checkbox' ? ' sq' : '') + '"></span>' +
          '<span class="txt">' + esc(op[1]) + '</span></button>';
      });
      html += '</div>';
      if (f.max) html += '<div class="counter" data-pickcount="' + f.id + '">已选 ' +
        (Array.isArray(v) ? v.length : 0) + ' / 最多 ' + f.max + ' 项</div>';
    }
    html += '<div class="field-error">' + esc(f.errMsg || '这一题需要回答') + '</div>';
    html += '</div>';
    return html;
  }

  /* ===========================================================
     学校版完成页
     =========================================================== */
  function viewDone() {
    var r = state.lastRecord;
    if (!r) {
      var l = respList();
      if (l.length) { r = l[l.length - 1]; state.lastRecord = r; }
    }
    if (!r) return topbar('') + '<div class="done-wrap"><p>没有可显示的答卷。</p></div>';
    var a = r.answers;
    var summary = [
      ['学校', answerText('school', a)],
      ['参训人数', answerText('headcount', a)],
      ['采购状态', answerText('procure', a)],
      ['期望达成', answerText('endAction', a)],
      ['卡点', answerText('barriers', a)]
    ];
    var kvHtml = summary.filter(function (x) { return x[1]; }).map(function (x) {
      return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>';
    }).join('');

    return topbar('') +
      '<div class="done-wrap">' +
      '<div class="done-badge"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" ' +
      'stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>' +
      '<h2>填完了，谢谢</h2>' +
      '<p>还剩最后一步：把这份答卷发回给对接人。网页不会自动上传，需要你手动发一次。</p>' +
      '<p style="margin-top:10px;font-size:13px;color:var(--ink3)">文本末尾附了一串「答复码」，回传时请保留，对方用它自动导入。</p>' +
      '<div class="done-card"><h4>你的答卷</h4><dl class="kv">' + kvHtml + '</dl></div>' +
      '<div class="done-actions">' +
      '<button class="btn btn-main btn-block" data-act="copy">复制答复，发到微信</button>' +
      '<button class="mini-btn" data-act="export" style="width:100%;padding:13px">导出答卷文件（.json）</button>' +
      '</div>' +
      '<div class="done-card"><h4>纯文本答复（可长按选择复制）</h4>' +
      '<div class="pre-out" id="plainout">' + esc(plainText(r)) + '</div></div>' +
      '<div style="margin-top:22px"><button class="topbar-link" data-go="#/">返回首页</button></div>' +
      '</div>';
  }

  /* ===========================================================
     团队版问卷
     =========================================================== */
  var intakeLoaded = false;
  function viewIntake() {
    if (!intakeLoaded) {
      intakeLoaded = true;
      state.intake = loadJSON(STORE_INTAKE_DRAFT, {}) || {};
    }
    var reqCount = INTAKE.fields.filter(function (f) { return f.req; }).length;
    var html = topbar('<button class="topbar-link" data-go="#/">退出</button>');
    html += '<div class="sticky-head">' +
      '<div class="progress-row">' +
      '<span class="progress-label">团队版 · 共 ' + INTAKE.fields.length + ' 题</span>' +
      '<span class="progress-label">必答 ' + reqCount + '</span>' +
      '</div>' +
      '<div class="progress-track"><div class="progress-fill" style="width:100%"></div></div>' +
      '</div>';

    html += '<div class="section-head">' +
      '<span class="eyebrow">内部使用 · 客户无需看到</span>' +
      '<h2>' + esc(INTAKE.title) + ' <span class="h2-sub">· 团队版</span></h2>' +
      '<p>' + esc(INTAKE.desc) + '</p>' +
      '<div class="secmeta">共 ' + INTAKE.fields.length + ' 题 · 必答 ' + reqCount + ' 题' +
      (INTAKE.fields.length > reqCount ? ' · 其余可跳过' : '') + '</div>' +
      '</div>';

    INTAKE.fields.forEach(function (f, i) {
      html += renderField(f, i + 1, {
        get: function (id) { return state.intake[id]; },
        attr: 'data-intake', pick: 'data-ipick'
      });
    });

    html += '<div style="height:24px"></div>';
    html += '<div class="survey-actions"><div class="survey-actions-inner">' +
      '<button class="btn btn-main" data-act="submitintake">生成交接单</button>' +
      '</div></div>';
    return html;
  }

  function viewIntakeDone() {
    var r = state.lastIntake;
    if (!r) {
      var l = intakeRespList();
      if (l.length) { r = l[l.length - 1]; state.lastIntake = r; }
    }
    if (!r) return topbar('') + '<div class="done-wrap"><p>没有可显示的内容。</p></div>';
    return topbar('') +
      '<div class="done-wrap">' +
      '<div class="done-badge"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" ' +
      'stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg></div>' +
      '<h2>交接单已生成</h2>' +
      '<p>把它发给讲师，或自己留档。学校版答卷回收后，两份一起看，才够设计培训。</p>' +
      '<div class="done-actions">' +
      '<button class="btn btn-main btn-block" data-act="copyintake">复制交接单</button>' +
      '<button class="mini-btn" data-act="exportintake" style="width:100%;padding:13px">导出文件（.json）</button>' +
      '</div>' +
      '<div class="done-card"><h4>交接单内容</h4>' +
      '<div class="pre-out" id="intakeout">' + esc(intakePlain(r)) + '</div></div>' +
      '<div style="margin-top:22px"><button class="topbar-link" data-go="#/">返回首页</button></div>' +
      '</div>';
  }

  function intakeRespList() { return loadJSON(STORE_INTAKE_RESP, []); }

  function intakePlain(r) {
    var a = (r && r.answers) || {};
    var L = ['【培训需求问诊单 · ClassIn 团队填写】', '填写时间：' + ((r && r.submittedAt) || '').slice(0, 16).replace('T', ' '), ''];
    INTAKE.fields.forEach(function (f) {
      var v = a[f.id];
      if (v == null || v === '') return;
      if (f.type === 'schools') {
        var rows = filledSchools(v);
        if (!rows.length) return;
        L.push('· ' + f.label + '：共 ' + rows.length + ' 所');
        rows.forEach(function (row, i) {
          L.push('  ' + (i + 1) + '. ' + row.name + ' —— ' + (optLabel(f, row.deal) || '状态未填'));
        });
        return;
      }
      L.push('· ' + f.label + '：' + (f.type === 'radio' ? optLabel(f, v) : String(v)));
    });
    return L.join('\n');
  }

  /* ===========================================================
     汇总与诊断
     =========================================================== */
  function viewAdmin() {
    var wantTab = (location.hash.split('tab=')[1] || '').split('&')[0];
    if (wantTab === 'sop') state.tab = 'sop';
    var tabs = '<div class="tabs">' +
      '<button class="tab' + (state.tab === 'summary' ? ' on' : '') + '" data-tab="summary">答卷汇总</button>' +
      '<button class="tab' + (state.tab === 'sop' ? ' on' : '') + '" data-tab="sop">工作流 SOP</button>' +
      '</div>';
    var body = state.tab === 'sop' ? viewSop() : viewSummary();
    return topbar('<button class="topbar-link" data-go="#/">返回</button>') + tabs + body;
  }

  function respList() { return loadJSON(STORE_RESP, []); }
  function saveRespList(list) { saveJSON(STORE_RESP, list); }

  function viewSummary() {
    var list = respList();
    var html = '<div class="admin-head"><span class="eyebrow">汇总与诊断</span>' +
      '<h1>已收到的学校答卷</h1>' +
      '<p class="small muted">当前本机共 ' + list.length + ' 份。汇总端只做两件事：把答卷摊开，指出目标与条件冲突的地方——方案仍由人定。</p></div>';

    html += '<div class="dropzone" id="dz">' +
      '<h4>导入答卷</h4>' +
      '<p>把学校发回的答复码（TI2: 开头那串）或 .json 文件粘进来，支持一次粘贴多份。</p>' +
      '<div class="row" style="justify-content:center">' +
      '<button class="mini-btn solid" data-act="pickfile">选择文件</button>' +
      '<button class="mini-btn" data-act="pastemode">粘贴文本</button>' +
      '</div>' +
      '<input type="file" id="fileinput" accept=".json,application/json" multiple style="display:none">' +
      '<div class="paste-area hidden" id="pastearea">' +
      '<textarea class="inp" id="pastetext" placeholder="把微信里收到的答复整段粘贴进来——前面的文字和最后的答复码都可以，系统会自动识别。"></textarea>' +
      '<button class="mini-btn solid" data-act="dopaste" style="margin-top:10px">导入</button>' +
      '</div></div>';

    if (list.length) {
      html += '<div class="row" style="margin-top:14px">' +
        '<button class="mini-btn" data-act="csv">导出汇总表 CSV</button>' +
        '<button class="mini-btn" data-act="exportall">导出全部 JSON</button>' +
        '<button class="mini-btn" data-act="clearall">清空本机记录</button>' +
        '</div>';
      html += '<div class="resp-list">';
      list.forEach(function (r, i) {
        var a = r.answers || {};
        html += '<div class="resp-item">' +
          '<span class="ridx">' + (i + 1) + '</span>' +
          '<div class="rmain"><div class="rtitle">' + esc(a.school || '（未填学校）') + '</div>' +
          '<div class="rmeta">' + esc(a.name || answerText('role', a)) +
          ' · ' + esc(a.headcount ? a.headcount + ' 人' : '人数未填') +
          ' · ' + esc((r.submittedAt || '').slice(0, 16).replace('T', ' ')) + '</div></div>' +
          '<button class="del" data-act="expand" data-idx="' + i + '">诊断</button>' +
          '</div>';
        if (state.expanded === i) html += '<div>' + viewDiagnosis(r) + '</div>';
      });
      html += '</div>';
    } else {
      html += '<div class="card" style="margin-top:14px;padding:20px;text-align:center">' +
        '<p class="small muted" style="margin:0">还没有答卷。学校填完把答复码发回来，粘贴导入就能看到诊断。</p></div>';
    }
    return html;
  }

  function viewDiagnosis(r) {
    var d = diagnose(r.answers || {});
    var html = '<div class="diag-card">' +
      '<h3>一致性诊断</h3>' +
      '<div class="sub">以下不是结论，而是「必须在上方案前处理掉的矛盾」。共 ' + d.flags.length + ' 条。</div>';

    if (!d.flags.length) {
      html += '<p class="small muted">没有发现明显冲突。仍建议与学校负责人当面确认一次目标。</p>';
    } else {
      d.flags.forEach(function (f) {
        html += '<div class="flag ' + f.sev + '"><div class="sev"></div><div class="fbody">' +
          '<div class="ftitle">' + esc(f.title) + '</div>' +
          '<div class="ftext">' + esc(f.text) + '</div>' +
          (f.action ? '<div class="fact">方案动作：' + esc(f.action) + '</div>' : '') +
          '</div></div>';
      });
    }
    html += '</div>';

    html += '<div class="diag-card">' +
      '<h3>方案决策项</h3>' +
      '<div class="sub">把答卷翻译成方案里的六个必答项。空白项就是还需要追问的地方。</div>' +
      '<dl class="kv">' +
      '<dt>主目标</dt><dd>' + esc(d.plan.target) + '</dd>' +
      '<dt>对象</dt><dd>' + esc(d.plan.audience) + '</dd>' +
      '<dt>主线</dt><dd>' + esc(d.plan.mainline) + '</dd>' +
      '<dt>形式</dt><dd>' + esc(d.plan.form) + '</dd>' +
      '<dt>成果物</dt><dd>' + esc(d.plan.output) + '</dd>' +
      '<dt>后续</dt><dd>' + esc(d.plan.follow) + '</dd>' +
      '</dl></div>';

    if (d.gaps.length) {
      html += '<div class="diag-card"><h3>信息缺口</h3>' +
        '<div class="sub">这些项没填。缺哪一项，方案里对应模块就只能靠猜。</div>' +
        '<div class="tl-body"><ul>' +
        d.gaps.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') +
        '</ul></div></div>';
    }

    html += '<div class="diag-card"><h3>完整答卷</h3>' +
      SURVEY.sections.map(function (sec) {
        var rows = sec.fields.map(function (f) {
          var t = answerText(f.id, r.answers || {});
          if (!t) return '';
          return '<dt>' + esc(f.label.length > 12 ? f.label.slice(0, 12) + '…' : f.label) + '</dt><dd>' + esc(t) + '</dd>';
        }).join('');
        if (!rows) return '';
        return '<div style="margin-bottom:14px"><div class="eyebrow" style="margin-bottom:6px">' +
          esc(sec.id) + '</div><dl class="kv">' + rows + '</dl></div>';
      }).join('') +
      '</div>';
    return html;
  }

  /* ===========================================================
     诊断引擎
     =========================================================== */
  var ACTION_GOALS = ['run', 'fix', 'design', 'spread'];

  function diagnose(a) {
    var flags = [], gaps = [];
    function add(sev, title, text, action) {
      flags.push({ sev: sev, title: title, text: text, action: action });
    }
    var goal = a.endAction;
    var isAction = ACTION_GOALS.indexOf(goal) > -1;
    var dur = parseInt(a.duration, 10) || 0;
    var hc = parseInt(a.headcount, 10) || 0;
    var barriers = Array.isArray(a.barriers) ? a.barriers : (a.barriers ? [a.barriers] : []);
    var deployed = Array.isArray(a.deployed) ? a.deployed : (a.deployed ? [a.deployed] : []);
    var mid = (parseInt(a.nMid, 10) || 0) + (parseInt(a.nPrincipal, 10) || 0);
    var totalPeople = hc || ((parseInt(a.nTeacher, 10) || 0) + (parseInt(a.nGroup, 10) || 0) + mid);

    /* --- 采购状态 --- */
    if (a.procure === 'none') {
      add('high', '尚未采购，培训的落点只能是「看懂」',
        '学校还没买、这次是第一次接触。这种情况下任何「落地」「常态化」的说法都不成立——对方连账号都没有。',
        '目标压到「看见一次真实分析 + 说清它能解决什么」。成果物给「下一步怎么试」的三条路径，而不是操作手册。');
    }
    if (a.procure === 'signed') {
      add('mid', '已签约未部署，要预留开通时间',
        '合同已签但还没部署。培训当天的演示用谁的账号、谁的设备，要先落实。',
        '培训前确认交付排期；若培训早于部署，把「开通当天的第一次分析」做成一个明确约定，而不是当天的实操。');
    }
    if (a.procure === 'trial') {
      add('low', '试用期是关键窗口',
        '处在试用阶段，这时的培训本质是「决定要不要继续用」。',
        '内容要服务于一个决策：试用结束前，学校能不能拿出 3 个可复述的使用场景。');
    }

    /* --- 目标 vs 条件 --- */
    if (isAction && dur && dur < 120) {
      add('high', '目标与时长不匹配',
        '期望老师到达「' + answerText('endAction', a) + '」，但可用时长只有 ' + dur +
        ' 分钟。任何含动手环节的培训，从暖场到收束都压不进 120 分钟以内——实操本身要 40 分钟，加上演示、跟做、答疑、总结，实际需要 150–180 分钟。',
        '二选一：把时长谈到 150 分钟以上；或把目标下调到「读懂报告、说出结论」，动手部分改成讲师演示 + 全场跟做单步。');
    }
    if (goal === 'spread' && dur && dur < 150) {
      add('mid', '「带动同伴」这个目标偏重',
        '能带动同伴，前提是自己先跑通一遍，还要知道别人会卡在哪。这需要时间，也需要现场做一次「教别人」的演练。' + dur + ' 分钟内只能做到认知层面的动员。',
        '改为「本次先培养 3–5 位种子教师到能带人」，其余人参会只求看懂。');
    }
    if (isAction && (a.devices === 'phone' || a.devices === 'none')) {
      add('high', '现场缺设备，动手做不成',
        '目标是操作类，但老师现场' + (a.devices === 'none' ? '不带设备' : '只有手机') +
        '。AIC 的分析与报告解读在手机上体验极差，硬做只会制造挫败感。',
        '改为「双人一机」（一台笔记本两人共用）或申请机房；若都不行，坦白改成演示型培训，并把动手环节移到培训后的线上跟进。');
    }
    if (isAction && a.account && a.account !== 'yes') {
      add('high', '没有可用的真实账号',
        '操作类目标依赖真实账号，当前是「' + answerText('account', a) +
        '」。用演示环境做实操，老师回到自己账号会立刻发现不一样，信任成本很高。',
        '培训前 5 天开通 3–5 个真实测试账号，或让学校骨干教师用自己的账号现场演示。');
    }

    /* --- 场地 vs 形式 --- */
    if (a.seating === 'theater' && (isAction || barriers.indexOf('apart') > -1)) {
      add('mid', '固定座椅限制组织形式',
        '剧院式固定桌椅做不了小组共创，也无法让相邻的人互相看屏幕。',
        '改用「全场跟做 + 举手反馈 + 会后小组」，或申请换成岛式 / 可移动桌椅的场地。');
    }
    if (a.venue === 'hall' && dur >= 180) {
      add('low', '长时间报告厅，注意力会掉',
        '报告厅坐满 3 小时，第 90 分钟之后基本失效。',
        '按 40 分钟一段切分，每段结束插一个当场可完成的小任务或现场投票。');
    }

    /* --- 大班 + 零基础 --- */
    if (a.aiLevel === 'zero' && hc >= 60) {
      add('high', '0 基础 + 大班额，不能做全员实操',
        '参训 ' + hc + ' 人且基本没用过 AI 工具。这个组合下，一对一指导的需求会瞬间淹没讲师，实操环节会变成集体等待。',
        '分两层：主会场做演示与跟做（每人只完成一步），另设 20 人小灶给骨干；或提前 3 天发 5 分钟操作视频，现场只做答疑与改课。');
    }
    if (a.aiLevel === 'chat' && a.venue === 'hall' && hc >= 80) {
      add('low', '有聊天类 AI 经验，认知起点不低',
        '这批老师已经习惯了对话式 AI，会拿它跟 AIC 直接对比。开场如果还从「什么是 AI」讲起，会被判为浪费时间。',
        '开场直接用一份真实课堂报告切入，让他们先看到「聊天机器人给不了的东西」。');
    }

    /* --- 意愿 --- */
    if (a.voluntary === 'mandatory' || a.voluntary === 'arranged') {
      add('high', '参训不是自愿的',
        '「' + answerText('voluntary', a) + '」。这种情况下，老师的第一反应不是「能学到什么」，而是「又要多一件事」。上来就讲功能，抵触会贯穿全场。',
        '开场留足 10–15 分钟处理动机：先承认负担，再用同一节课的前后对比说明「它能替你省哪一步」，而不是「你还要多做哪一步」。');
    }

    /* --- 障碍类型决定主线 --- */
    if (barriers.indexOf('noreq') > -1) {
      add('high', '制度缺位，培训单独起作用有限',
        '学校自己判断「没有明确要求，用不用一个样」。这是管理问题，不是培训能解决的。只讲不动制度，热度通常两周内消退。',
        '现场增加一个动作：与校长确认一条最小制度——明确一个使用频次、一个检查点、一个负责人。只写一条，写多了执行不了。');
    }
    if (barriers.indexOf('fear') > -1 || barriers.indexOf('privacy') > -1) {
      add('high', '存在信任阻力，越讲功能越抵触',
        '教师对「被监控、被比较」或数据边界有顾虑。这个顾虑不先解掉，后面的所有演示都会被解读成「又来查我」。',
        '把数据归属、可见范围、用途边界放在最前面讲，用一页纸写清楚「谁看得到、用来做什么、不做什么」。这一页比任何功能演示都重要。');
    }
    if (barriers.indexOf('apart') > -1) {
      add('mid', '与教研流程两张皮',
        '工具游离在既有教研之外，用它是额外动作。',
        '把操作嵌进学校原有的教研动作里（集体备课、听评课、作业分析），不新增流程，只替换其中一个环节的做法。');
    }
    if (barriers.indexOf('act') > -1) {
      add('mid', '主线应落在「从报告到改课」',
        '学校自评卡在「看得懂报告，但不知道怎么改课」。这是从数据到教学决策的断点，也是本次培训最有价值的一段。',
        '主线定为「一份报告 → 三个追问 → 一个改动」：拿本校真实课例，当场把一个数据指标翻译成一个具体的教学调整。');
    }
    if (barriers.indexOf('read') > -1) {
      add('mid', '主线应落在「读报告」',
        '卡在解读层。培训前半段必须做报告结构拆解，不能跳到改课。',
        '用一份真实报告逐块讲：这一栏在说什么、什么算异常、异常说明什么。讲完当场让老师各读一份，互相说结论。');
    }
    if (barriers.indexOf('skill') > -1 && barriers.length === 1) {
      add('low', '单一障碍是操作，培训可以很短',
        '唯一卡点是「不会操作、没人教」。这类需求其实不需要一场大培训。',
        '考虑把主培训压到 60 分钟，其余转为一页纸操作卡 + 微信群答疑，把预算和时间省给跟进。');
    }
    if (barriers.indexOf('load') > -1) {
      add('mid', '「太费时间」是真实成本，要用替代关系回应',
        '老师判定它增加工作量。任何「再加上一件事」的说法都会失败。',
        '现场必须算一笔时间账：哪一步省了多少分钟。算不出来，就不要指望他们用。');
    }

    /* --- 落地引擎 --- */
    if ((a.owner === 'none' || a.owner === 'unknown' || !a.owner) &&
        (a.seeds === 'no' || a.seeds === 'unknown' || a.seeds === 'maybe' || !a.seeds)) {
      add('high', '缺校内引擎，培训结束即终点',
        '校内既没有明确推进负责人，也没有确定的种子教师。这种情况下，无论当天效果多好，两周后都会回到原点。',
        '把「指定种子教师」做成培训当天的产出物：现场点名 3–5 人，当众确认，写进 30 天行动计划，当天发给校长。');
    }
    if (a.priority === 'watch' && isAction) {
      add('high', '学校优先级与期望目标不匹配',
        '学校对这件事的定位是「暂时只是了解」，却期望老师达到操作水平。投入与期望错位，落地无人接。',
        '培训前必须与学校负责人对齐：要么提高定位（列入本学期教研计划），要么下调目标（本次只做认知与体验）。');
    }

    /* --- 听众结构 --- */
    if (totalPeople && mid / totalPeople > 0.3 && isAction) {
      add('mid', '听众结构偏管理，实操目标难达成',
        '中层与校领导占 ' + Math.round(mid / totalPeople * 100) + '%。管理层在场会改变老师的表达方式，动手环节容易变成「表演」。',
        '分层：主会场面向教师做实操，另安排 20 分钟单独与管理层谈推进条件与制度。');
    }

    /* --- 现场风险 --- */
    if (a.wifi && a.wifi !== 'good' && deployed.indexOf('aic') > -1) {
      add('mid', '网络不确定，在线演示有风险',
        '现场网络为「' + answerText('wifi', a) + '」。AIC 的报告加载与视频分析都依赖网络，卡顿会直接摧毁说服力。',
        '提前录制全流程演示视频作为兜底；关键页面截图做成离线包；不在现场做首次加载。');
    }
    if (a.realCase === 'no' || a.realCase === 'unknown' || !a.realCase) {
      add('mid', '没有本校真实课例，说服力打折',
        '培训若用通用样例，老师会认为「那是样板课，我们学校不一样」。这是 AIC 类工具落地最常见的阻抗。',
        '培训前 3 天务必向学校要一节常态课录屏（不用优课，越常态越好）。拿不到，就在现场用一位参训老师的课临时录 10 分钟。');
    }

    /* --- 信息缺口 --- */
    ALL_FIELDS.forEach(function (f) {
      if (f.req && !answerText(f.id, a)) gaps.push(f.label + '（必答，未填）');
    });
    ['priority', 'owner', 'seeds', 'realCase', 'devices', 'wifi', 'account', 'leaderExpect'].forEach(function (id) {
      var f = getField(id);
      if (f && !answerText(id, a)) gaps.push(f.label + '（选填，未填——影响方案精度）');
    });

    /* --- 决策项翻译 --- */
    var target;
    if (!goal) target = '未指定。这是最需要补的一项。';
    else if (goal === 'aware') target = '认知型：让老师知道 AIC 是什么、看到一次真实分析，产生试用意愿。形式可轻，但必须有「看见」的瞬间。';
    else if (goal === 'run') target = '操作型：每人独立完成一次分析并拿到报告。需要设备、账号、至少 40 分钟动手时间。';
    else if (goal === 'read') target = '解读型：读懂一份报告并说出关键结论。需要真实报告样本 + 逐块拆解。';
    else if (goal === 'fix') target = '转化型：从报告指向一处具体改课动作。这是从数据到教学决策的断点，价值最高，也最需要真实课例。';
    else if (goal === 'design') target = '设计型：现场产出一节用上 AIC 的课。需要分组、需要时间（≥150 分钟）、需要学科对应。';
    else target = '扩散型：培养能带人的种子教师。本质是培养内部讲师，不是普及培训。';

    var audience = [];
    if (hc) audience.push(hc + ' 人');
    if (a.nTeacher || a.nGroup || a.nMid || a.nPrincipal) {
      var parts = [];
      if (a.nTeacher) parts.push('一线教师 ' + a.nTeacher);
      if (a.nGroup) parts.push('组长 ' + a.nGroup);
      if (a.nMid) parts.push('中层 ' + a.nMid);
      if (a.nPrincipal) parts.push('校领导 ' + a.nPrincipal);
      audience.push(parts.join(' / '));
    }
    if (a.aiLevel) audience.push('基础：' + answerText('aiLevel', a));
    if (a.voluntary) audience.push('来源：' + answerText('voluntary', a));

    var mainline = '未判定';
    if (barriers.length) {
      var first = barriers[0];
      var map = {
        skill: '操作门槛——先把工具用顺，不做理念铺垫',
        read: '报告解读——先教会看，再谈改',
        act: '从报告到改课——断点在这里，重心放这里',
        load: '时间成本——用替代关系回应，不算清楚不动手',
        tech: '稳定性——先解决设备与网络，内容往后放',
        apart: '流程嵌入——不新增动作，只替换既有教研的一个环节',
        noreq: '制度先行——培训中必须产出一条校级要求',
        fear: '信任边界——先讲数据用途与可见范围',
        noleader: '引擎建设——现场指定种子教师与负责人',
        privacy: '合规边界——先讲数据归属'
      };
      mainline = '首要卡点：' + answerText('barriers', { barriers: [first] }) + '。主线应走「' + (map[first] || '待定') + '」。';
    }

    var form;
    if (a.venue === 'online') form = '线上直播。互动受限，实操只能靠「跟我做」，必须配一个可回看的录屏。';
    else if (dur && dur < 90) form = '短时段（' + dur + ' 分钟）：只能做单点突破，讲授 + 一次演示 + 一个当场任务。';
    else if (isAction && a.devices === 'laptop' && dur >= 120) form = '可做 hands-on：讲授 30% + 演示 20% + 动手 40% + 收束 10%，建议两人一组。';
    else if (isAction) form = '目标含操作但条件不足：改为「讲师演示 + 全场单步跟做 + 骨干小灶」。';
    else form = '演示型：以真实课例为主线做展示与解读，穿插现场问答，不做全员操作。';

    var output;
    if (a.deliver && (Array.isArray(a.deliver) ? a.deliver.length : a.deliver)) {
      output = answerText('deliver', a);
    } else output = '未指定。建议默认给三样：课件、一页纸操作卡、30 天行动计划模板。';

    var follow;
    if (a.followOwner) follow = '校内跟进人：' + a.followOwner;
    else if (a.owner === 'full' || a.owner === 'part') follow = '有推进负责人（' + answerText('owner', a) + '），但未指定具体人。需补。';
    else follow = '无跟进人。这是最严重的缺口——培训后无人承接，等于没发生。';

    var order = { high: 0, mid: 1, low: 2 };
    flags.sort(function (x, y) { return order[x.sev] - order[y.sev]; });

    return {
      flags: flags, gaps: gaps,
      plan: { target: target, audience: audience.join(' · ') || '待补', mainline: mainline, form: form, output: output, follow: follow }
    };
  }

  /* ---------------- 答复码 ---------------- */
  function b64enc(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function b64dec(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function encodeRecord(r) {
    var slim = {};
    ALL_FIELDS.forEach(function (f) {
      var v = r.answers[f.id];
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v)) { if (!v.length) return; slim[f.id] = v; }
      else slim[f.id] = v;
    });
    return 'TI2:' + b64enc(JSON.stringify({ v: SURVEY.version, i: r.id || '', t: r.submittedAt || '', a: slim }));
  }
  function decodeCode(code) {
    try {
      var obj = JSON.parse(b64dec(code));
      if (!obj || !obj.a) return null;
      return {
        id: obj.i || ('R' + Math.random().toString(36).slice(2, 8).toUpperCase()),
        submittedAt: obj.t || new Date().toISOString(),
        surveyVersion: obj.v || SURVEY.version,
        answers: obj.a
      };
    } catch (e) { return null; }
  }

  function plainText(r) {
    var a = r.answers || {};
    var L = ['【培训需求问诊单 · 学校填写】', '提交时间：' + (r.submittedAt || '').slice(0, 16).replace('T', ' '), ''];
    SURVEY.sections.forEach(function (sec) {
      var rows = [];
      sec.fields.forEach(function (f) {
        var t = answerText(f.id, a);
        if (t) rows.push('· ' + f.label + '：' + t);
      });
      if (rows.length) {
        L.push('— ' + sec.id + ' ' + sec.title + ' —');
        L.push(rows.join('\n'));
        L.push('');
      }
    });
    L.push('—— 以下为答复码，回传时请保留，用于自动导入 ——');
    L.push(encodeRecord(r));
    return L.join('\n');
  }

  /* ---------------- SOP ---------------- */
  function viewSop() {
    var html = '<div class="sop-wrap"><div class="admin-head">' +
      '<span class="eyebrow">标准工作流</span><h1>从收到需求到沉淀成果</h1>' +
      '<p class="small muted">这套流程解决的问题不是「怎么讲好一堂课」，而是「怎么不再靠聊天记录拼凑信息」。每一步都有产出物，交不出来就说明这一步没过。</p>' +
      '</div><div class="tl">';
    SOP.forEach(function (s) {
      html += '<div class="tl-item' + (s.key ? ' key' : '') + '">' +
        '<div class="tl-when">' + esc(s.when) + '</div>' +
        '<div class="tl-title">' + esc(s.title) + '</div>' +
        '<div class="tl-body">' + esc(s.body) +
        (s.list ? '<ul>' + s.list.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
        '</div></div>';
    });
    html += '</div>';
    html += '<div class="notebox" style="margin-top:8px">' +
      '<h3>三条硬规则</h3><ol>' +
      '<li>信息只走表单，不走微信聊天。聊天记录无法复用，也无法交接。</li>' +
      '<li>培训目标必须由学校负责人确认一次。对接人认可不等于学校认可。</li>' +
      '<li>每场培训必须留下四样东西：种子教师名单、30 天第一件事、疑问清单、前后对比数据。</li>' +
      '</ol></div></div>';
    return html;
  }

  /* ===========================================================
     事件绑定
     =========================================================== */
  function bind() {
    $$('[data-go]').forEach(function (b) {
      b.onclick = function () { go(b.getAttribute('data-go')); };
    });
    $$('[data-tab]').forEach(function (b) {
      b.onclick = function () { state.tab = b.getAttribute('data-tab'); state.expanded = null; render(); };
    });

    $$('[data-f]').forEach(function (inp) {
      var id = inp.getAttribute('data-f');
      inp.addEventListener('input', function () {
        state.ans[id] = inp.value;
        if (state.errors[id]) {
          delete state.errors[id];
          inp.parentNode.classList.remove('invalid');
        }
        var c = $('[data-counter="' + id + '"]');
        if (c) {
          var max = getField(id).maxlen || 300;
          c.textContent = inp.value.length + ' / ' + max;
          c.classList.toggle('over', inp.value.length >= max);
        }
        saveDraft();
      });
      inp.addEventListener('focus', function () { inp.parentNode.classList.add('focus'); });
      inp.addEventListener('blur', function () { inp.parentNode.classList.remove('focus'); });
    });

    $$('[data-intake]').forEach(function (inp) {
      var id = inp.getAttribute('data-intake');
      inp.addEventListener('input', function () {
        state.intake[id] = inp.value;
        if (state.intakeErrors[id]) {
          delete state.intakeErrors[id];
          inp.parentNode.classList.remove('invalid');
        }
        saveJSON(STORE_INTAKE_DRAFT, state.intake);
      });
      inp.addEventListener('focus', function () { inp.parentNode.classList.add('focus'); });
      inp.addEventListener('blur', function () { inp.parentNode.classList.remove('focus'); });
    });

    $$('[data-pick]').forEach(function (btn) {
      btn.onclick = function () {
        pickOption(btn, 'data-pick', state.ans, function (id) { return getField(id); }, saveDraft);
      };
    });
    $$('[data-ipick]').forEach(function (btn) {
      btn.onclick = function () {
        pickOption(btn, 'data-ipick', state.intake, function (id) {
          for (var i = 0; i < INTAKE.fields.length; i++) if (INTAKE.fields[i].id === id) return INTAKE.fields[i];
          return null;
        }, function () { saveJSON(STORE_INTAKE_DRAFT, state.intake); });
      };
    });

    $$('[data-srow-name]').forEach(function (inp) {
      var id = inp.getAttribute('data-srow-name');
      var idx = parseInt(inp.getAttribute('data-idx'), 10);
      inp.addEventListener('input', function () {
        var rows = ensureRows(id);
        if (!rows[idx]) rows[idx] = { name: '', deal: '' };
        rows[idx].name = inp.value;
        clearIntakeError(id, inp);
        saveJSON(STORE_INTAKE_DRAFT, state.intake);
      });
      inp.addEventListener('focus', function () { inp.parentNode.classList.add('focus'); });
      inp.addEventListener('blur', function () { inp.parentNode.classList.remove('focus'); });
    });

    $$('[data-srow-pick]').forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute('data-srow-pick');
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        var rows = ensureRows(id);
        if (!rows[idx]) rows[idx] = { name: '', deal: '' };
        rows[idx].deal = btn.getAttribute('data-val');
        var sib = btn.parentNode.children;
        for (var i = 0; i < sib.length; i++) sib[i].classList.remove('on');
        btn.classList.add('on');
        clearIntakeError(id, null);
        saveJSON(STORE_INTAKE_DRAFT, state.intake);
      };
    });

    $$('[data-srow-add]').forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute('data-srow-add');
        var rows = ensureRows(id);
        rows.push({ name: '', deal: '' });
        saveJSON(STORE_INTAKE_DRAFT, state.intake);
        render();
        var inputs = $$('[data-srow-name="' + id + '"]');
        var last = inputs[inputs.length - 1];
        if (last) {
          last.scrollIntoView({ behavior: 'smooth', block: 'center' });
          last.focus({ preventScroll: true });
        }
      };
    });

    $$('[data-srow-del]').forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.getAttribute('data-srow-del');
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        var rows = ensureRows(id);
        if (rows.length <= 1) return;
        rows.splice(idx, 1);
        saveJSON(STORE_INTAKE_DRAFT, state.intake);
        render();
      };
    });

    var fi = $('#fileinput');
    if (fi) fi.onchange = function () { handleFiles(fi.files); fi.value = ''; };
  }

  function pickOption(btn, attr, store, getF, after) {
    var id = btn.getAttribute(attr);
    var val = btn.getAttribute('data-val');
    var mode = btn.getAttribute('data-mode');
    var f = getF(id);
    if (!f) return;
    if (mode === 'radio') {
      store[id] = val;
      $$('[' + attr + '="' + id + '"]').forEach(function (b) { b.classList.remove('on'); });
      btn.classList.add('on');
    } else {
      var cur = Array.isArray(store[id]) ? store[id].slice() : [];
      var at = cur.indexOf(val);
      if (at > -1) cur.splice(at, 1);
      else {
        if (f.max && cur.length >= f.max) { toast('最多选 ' + f.max + ' 项'); return; }
        cur.push(val);
      }
      store[id] = cur;
      btn.classList.toggle('on', cur.indexOf(val) > -1);
      var cnt = $('[data-pickcount="' + id + '"]');
      if (cnt) {
        cnt.textContent = '已选 ' + cur.length + ' / 最多 ' + f.max + ' 项';
        cnt.classList.toggle('over', cur.length >= f.max);
      }
    }
    var fld = $('#fld-' + (attr === 'data-pick' ? 'data-f' : 'data-intake') + '-' + id);
    if (fld) fld.classList.remove('invalid');
    if (after) after();
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== document) {
      var act = t.getAttribute && t.getAttribute('data-act');
      if (act) {
        if (act === 'expand') {
          var i = parseInt(t.getAttribute('data-idx'), 10);
          state.expanded = (state.expanded === i) ? null : i;
          render();
          var items = document.querySelectorAll('.resp-item');
          if (state.expanded !== null && items[i]) {
            var top = items[i].getBoundingClientRect().top + window.scrollY - 70;
            window.scrollTo(0, Math.max(0, top));
          }
          return;
        }
        handleAct(act);
        return;
      }
      t = t.parentNode;
    }
  }, true);

  function handleAct(act) {
    if (act === 'next') return nextStep();
    if (act === 'prev') { state.step = Math.max(0, state.step - 1); render(); return; }
    if (act === 'submit') return submitSurvey();
    if (act === 'submitintake') return submitIntake();
    if (act === 'copy') return copyText(plainText(state.lastRecord));
    if (act === 'export') return exportOne(state.lastRecord);
    if (act === 'copyintake') return copyText(intakePlain(state.lastIntake));
    if (act === 'exportintake') return exportIntake(state.lastIntake);
    if (act === 'pickfile') { var fi = $('#fileinput'); if (fi) fi.click(); return; }
    if (act === 'pastemode') { var pa = $('#pastearea'); if (pa) pa.classList.toggle('hidden'); return; }
    if (act === 'dopaste') return doPaste();
    if (act === 'csv') return exportCSV();
    if (act === 'exportall') return download('培训问诊_全部答卷_' + stamp() + '.json', JSON.stringify(respList(), null, 2), 'application/json');
    if (act === 'clearall') return clearAll();
  }

  function nextStep() {
    var sec = currentSection();
    var bad = [];
    sec.fields.forEach(function (f) {
      if (f.req && !answerText(f.id, state.ans)) { state.errors[f.id] = true; bad.push(f); }
    });
    if (bad.length) {
      render();
      var el = $('#fld-data-f-' + bad[0].id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast('还有 ' + bad.length + ' 道必答题没填');
      return;
    }
    state.step++;
    saveDraft();
    render();
    window.scrollTo(0, 0);
  }

  function submitSurvey() {
    var sec = currentSection();
    var bad = [];
    sec.fields.forEach(function (f) {
      if (f.req && !answerText(f.id, state.ans)) { state.errors[f.id] = true; bad.push(f); }
    });
    if (bad.length) {
      render();
      var el = $('#fld-data-f-' + bad[0].id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast('还有 ' + bad.length + ' 道必答题没填');
      return;
    }
    var record = {
      id: 'R' + Date.now().toString(36).toUpperCase(),
      submittedAt: new Date().toISOString(),
      surveyVersion: SURVEY.version,
      answers: state.ans
    };
    var list = respList();
    list.push(record);
    saveRespList(list);
    try { localStorage.removeItem(STORE_DRAFT); } catch (e) {}
    state.lastRecord = record;
    location.hash = '#/done';
  }

  function submitIntake() {
    var bad = [], msg = '';
    INTAKE.fields.forEach(function (f) {
      var v = state.intake[f.id];
      if (f.type === 'schools') {
        var rows = filledSchools(v);
        if (f.req && !rows.length) { state.intakeErrors[f.id] = true; bad.push(f); return; }
        var noDeal = rows.filter(function (r) { return !r.deal; });
        if (noDeal.length) { state.intakeErrors[f.id] = true; bad.push(f); msg = '第 ' + (rows.indexOf(noDeal[0]) + 1) + ' 所学校还没选合同状态'; return; }
        return;
      }
      if (f.req && (v == null || v === '' || (Array.isArray(v) && !v.length))) {
        state.intakeErrors[f.id] = true; bad.push(f);
      }
    });
    if (bad.length) {
      render();
      var el = $('#fld-data-intake-' + bad[0].id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      toast(msg || ('还有 ' + bad.length + ' 道必答题没填'));
      return;
    }
    /* 只留填了校名的行，其余空行丢弃 */
    INTAKE.fields.forEach(function (f) {
      if (f.type === 'schools') {
        var rows = filledSchools(state.intake[f.id]).map(function (r) {
          return { name: String(r.name).trim(), deal: r.deal || '' };
        });
        state.intake[f.id] = rows;
      }
    });
    var record = {
      id: 'I' + Date.now().toString(36).toUpperCase(),
      submittedAt: new Date().toISOString(),
      answers: state.intake
    };
    var list = intakeRespList();
    list.push(record);
    saveJSON(STORE_INTAKE_RESP, list);
    state.lastIntake = record;
    location.hash = '#/idone';
  }

  function exportOne(r) {
    if (!r) return;
    var name = (r.answers.school || '答卷').replace(/[\\/:*?"<>|]/g, '') + '_培训问诊.json';
    download(name, JSON.stringify(r, null, 2), 'application/json');
  }
  function exportIntake(r) {
    if (!r) return;
    var rows = filledSchools(r.answers.i_schools);
    var base = rows.length ? rows[0].name + (rows.length > 1 ? '等' + rows.length + '校' : '') : '交接单';
    var name = base.replace(/[\\/:*?"<>|]/g, '') + '_团队版.json';
    download(name, JSON.stringify(r, null, 2), 'application/json');
  }
  function stamp() {
    var d = new Date();
    return '' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '_' + pad(d.getHours()) + pad(d.getMinutes());
  }

  function handleFiles(files) {
    if (!files || !files.length) return;
    var pending = files.length, added = 0;
    Array.prototype.forEach.call(files, function (file) {
      var reader = new FileReader();
      reader.onload = function () {
        if (ingestText(String(reader.result))) added++;
        pending--;
        if (pending === 0) finishImport(added);
      };
      reader.onerror = function () { pending--; if (pending === 0) finishImport(added); };
      reader.readAsText(file, 'utf-8');
    });
  }

  function doPaste() {
    var ta = $('#pastetext');
    if (!ta || !ta.value.trim()) { toast('请先粘贴内容'); return; }
    finishImport(ingestText(ta.value));
  }

  function finishImport(added) {
    if (added > 0) { render(); toast('已导入 ' + added + ' 份答卷'); }
    else toast('没有识别到有效答卷，请确认粘贴内容完整');
  }

  function ingestText(txt) {
    var list = respList();
    var added = 0;
    var codes = txt.match(/TI2:[A-Za-z0-9_-]{20,}/g);
    if (codes && codes.length) {
      codes.forEach(function (c) {
        var rec = decodeCode(c.slice(4));
        if (!rec) return;
        if (list.some(function (x) { return x.id === rec.id; })) return;
        list.push(rec);
        added++;
      });
      if (added) saveRespList(list);
      return added;
    }
    var data = null;
    try { data = JSON.parse(txt); } catch (e) {
      var m = txt.match(/\{[\s\S]*\}/);
      if (m) { try { data = JSON.parse(m[0]); } catch (e2) { return 0; } }
    }
    if (!data) return 0;
    var arr = Array.isArray(data) ? data : (data.responses ? data.responses : (data.answers ? [data] : []));
    if (!arr.length) return 0;
    arr.forEach(function (r) {
      if (!r || !r.answers) return;
      if (r.id && list.some(function (x) { return x.id === r.id; })) return;
      if (!r.id) r.id = 'R' + Math.random().toString(36).slice(2, 8).toUpperCase();
      if (!r.submittedAt) r.submittedAt = new Date().toISOString();
      list.push(r);
      added++;
    });
    if (added) saveRespList(list);
    return added;
  }

  function exportCSV() {
    var list = respList();
    if (!list.length) { toast('还没有答卷'); return; }
    var heads = ['提交时间', '答卷编号'].concat(ALL_FIELDS.map(function (f) { return f.label; }));
    var rows = [heads];
    list.forEach(function (r) {
      var a = r.answers || {};
      var row = [(r.submittedAt || '').slice(0, 16).replace('T', ' '), r.id || ''];
      ALL_FIELDS.forEach(function (f) { row.push(answerText(f.id, a)); });
      rows.push(row);
    });
    var csv = rows.map(function (r) {
      return r.map(function (c) {
        return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"';
      }).join(',');
    }).join('\r\n');
    download('培训问诊汇总_' + stamp() + '.csv', '\ufeff' + csv, 'text/csv');
    toast('已导出 CSV，可用 Excel 打开');
  }

  function clearAll() {
    if (!confirm('确定清空本机保存的全部答卷？此操作不可撤销，已导出的文件不受影响。')) return;
    saveRespList([]);
    state.expanded = null;
    render();
    toast('已清空');
  }

  /* ===========================================================
     启动
     =========================================================== */
  route();
})();
