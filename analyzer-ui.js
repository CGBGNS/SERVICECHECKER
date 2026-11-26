/* ==========================================================================
   Call analyzer: Genesys Cloud download chain, report rendering and wiring.
   Needs analyzer.js (analysis) and the helpers defined in app.js
   (apiGet, apiSend, getStoredToken, getAuthorizationHeaders, openLoginDialog, sleep).
   ========================================================================== */

(function () {
  'use strict';

  const A = window.CallAnalyzer;
  const VIEW_KEY = 'genesysChecker.view';
  const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const ui = {
    checkerView: document.getElementById('checkerView'),
    analyzerView: document.getElementById('analyzerView'),
    navChecker: document.getElementById('navChecker'),
    navAnalyzer: document.getElementById('navAnalyzer'),
    form: document.getElementById('analyzerForm'),
    conversationId: document.getElementById('conversationId'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    file: document.getElementById('analyzerFile'),
    status: document.getElementById('analyzerStatus'),
    result: document.getElementById('analyzerResult')
  };

  if (!A || !ui.form) return;

  const isObj = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  const str = (value) => (value === null || value === undefined ? '' : String(value));

  let lastRun = null; // { conversationId, docs, summary }

  /* ------------------------------------------------------------------------
     Small DOM helper (never uses innerHTML: every value comes from the API)
     ------------------------------------------------------------------------ */

  function el(tag, props, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
      if (value === null || value === undefined || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : value);
    }
    for (const child of children.flat()) {
      if (child === null || child === undefined || child === false) continue;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  /* ------------------------------------------------------------------------
     View switch
     ------------------------------------------------------------------------ */

  function showView(name) {
    const analyzer = name === 'analyzer';
    ui.checkerView.hidden = analyzer;
    ui.analyzerView.hidden = !analyzer;
    ui.navChecker.classList.toggle('active', !analyzer);
    ui.navAnalyzer.classList.toggle('active', analyzer);
    ui.navChecker.setAttribute('aria-current', analyzer ? 'false' : 'page');
    ui.navAnalyzer.setAttribute('aria-current', analyzer ? 'page' : 'false');
    try {
      sessionStorage.setItem(VIEW_KEY, analyzer ? 'analyzer' : 'checker');
    } catch {
      /* storage unavailable: the view just is not remembered */
    }
  }

  function setStatus(message, isError = false) {
    ui.status.textContent = message;
    ui.status.classList.toggle('is-error', Boolean(isError));
  }

  function setBusy(isBusy) {
    ui.analyzeBtn.disabled = isBusy;
    ui.conversationId.disabled = isBusy;
    ui.file.disabled = isBusy;
  }

  /* ------------------------------------------------------------------------
     Genesys Cloud: query -> job -> download
     ------------------------------------------------------------------------ */

  async function getJson(path, query) {
    let response = await apiGet(path, query);
    for (let attempt = 1; response.status === 429 && attempt <= 3; attempt += 1) {
      await sleep(attempt * 2000);
      response = await apiGet(path, query);
    }
    if (!response.ok) {
      const detail = (isObj(response.data) && response.data.message) || response.raw || response.statusText;
      throw new Error(`${path} -> ${response.status} ${detail}`.slice(0, 400));
    }
    return response.data;
  }

  async function queryInstances(conversationId) {
    const bodies = [
      { query: [{ and: [{ key: 'ConversationId', operator: 'eq', value: conversationId }] }] },
      { query: [{ criteria: { key: 'ConversationId', operator: 'eq', value: conversationId } }] }
    ];
    let bodyIndex = 0;
    const entities = [];
    let pageCount = 1;

    for (let page = 1; page <= pageCount && page <= 10; page += 1) {
      const path = `/api/v2/flows/instances/query?pageSize=100&pageNumber=${page}`;
      let response = await apiSend('POST', path, bodies[bodyIndex]);

      // Some orgs/API versions expect the criteria in a different shape: try the alternative once.
      if (!response.ok && response.status === 400 && page === 1 && bodyIndex === 0) {
        bodyIndex = 1;
        response = await apiSend('POST', path, bodies[bodyIndex]);
      }

      if (!response.ok) {
        const detail = (isObj(response.data) && response.data.message) || response.raw || response.statusText;
        throw new Error(`Flow instance query failed (${response.status}): ${detail}`.slice(0, 400));
      }

      entities.push(...(Array.isArray(response.data?.entities) ? response.data.entities : []));
      pageCount = Number(response.data?.pageCount || 1);
    }

    return entities;
  }

  function findDownloadUri(job) {
    if (!isObj(job)) return '';
    const direct = job.downloadURI || job.downloadUri || job.downloadUrl || job.uri;
    if (typeof direct === 'string' && direct) return direct;

    for (const entity of Array.isArray(job.entities) ? job.entities : []) {
      if (!isObj(entity) || entity.failed) continue;
      const uri = entity.downloadURI || entity.downloadUri || entity.downloadUrl || entity.uri;
      if (typeof uri === 'string' && uri) return uri;
    }

    for (const [key, value] of Object.entries(job)) {
      if (typeof value === 'string' && /download|uri|url/i.test(key) && /^https?:\/\//i.test(value)) return value;
    }
    return '';
  }

  function jobState(job) {
    return str(job?.jobState || job?.status || job?.state).toLowerCase();
  }

  async function fetchExecutionDocument(downloadUri) {
    let url = downloadUri;
    const match = /\/downloads\/([^/?#]+)/i.exec(downloadUri);

    if (match) {
      // Resolve the signed URL instead of following the redirect (a redirect would drop our headers).
      const resolved = await apiGet(`/api/v2/downloads/${encodeURIComponent(match[1])}`, { issueRedirect: 'false' });
      if (resolved.ok && isObj(resolved.data) && (resolved.data.url || resolved.data.uri)) {
        url = resolved.data.url || resolved.data.uri;
      }
    }

    const blocked = (cause) =>
      Object.assign(
        new Error('The browser could not download the execution file directly (usually a CORS restriction on the download host).'),
        { blocked: true, downloadUrl: url, cause }
      );

    let response;
    try {
      response = await fetch(url);
      if (response.status === 401 || response.status === 403) {
        response = await fetch(url, { headers: getAuthorizationHeaders() });
      }
    } catch (cause) {
      throw blocked(cause);
    }

    if (!response.ok) {
      throw Object.assign(new Error(`The download failed (${response.status}).`), { downloadUrl: url });
    }

    const text = (await response.text()).replace(/^\uFEFF/, '').trim();
    try {
      return JSON.parse(text);
    } catch {
      throw Object.assign(new Error('The downloaded file is not valid JSON.'), { downloadUrl: url });
    }
  }

  async function downloadExecution(instance, onStatus) {
    const label = instance.flowName || instance.id;
    onStatus(`Preparing the execution download for "${label}"...`);

    let job = await getJson(`/api/v2/flows/instances/${encodeURIComponent(instance.id)}`);
    const jobId = isObj(job) ? job.id || job.jobId : '';

    for (let attempt = 0; attempt < 60; attempt += 1) {
      const state = jobState(job);
      if (/fail|cancel|error/.test(state)) {
        throw new Error(`Genesys Cloud could not prepare the download (${state}).`);
      }
      const failedEntity = Array.isArray(job?.entities) ? job.entities.find((entity) => entity?.failed) : null;
      if (failedEntity) {
        throw new Error(str(failedEntity.error || failedEntity.message) || 'Genesys Cloud could not prepare the download.');
      }

      const uri = findDownloadUri(job);
      if (uri) {
        onStatus(`Downloading the execution of "${label}"...`);
        return fetchExecutionDocument(uri);
      }

      if (!jobId) throw new Error('The download job did not return an id.');
      await sleep(1500);
      onStatus(`Waiting for the download of "${label}" to be ready (${state || 'pending'})...`);
      job = await getJson(`/api/v2/flows/instances/jobs/${encodeURIComponent(jobId)}`);
    }

    throw new Error('Timed out waiting for Genesys Cloud to prepare the download.');
  }

  async function runPool(items, limit, worker) {
    const results = new Array(items.length);
    let next = 0;
    const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const index = next;
        next += 1;
        results[index] = await worker(items[index], index);
      }
    });
    await Promise.all(runners);
    return results;
  }

  /* ------------------------------------------------------------------------
     Analysis orchestration
     ------------------------------------------------------------------------ */

  const isWorkflow = (flowType) => /workflow/i.test(str(flowType));

  function buildRun(conversationId, loaded, skipped, failures) {
    const analyses = [];
    const docs = [];

    for (const item of loaded) {
      try {
        const analysis = A.analyzeExecution(item.doc);
        if (item.instance) {
          analysis.meta.flowName = analysis.meta.flowName || str(item.instance.flowName);
          analysis.meta.flowType = analysis.meta.flowType || str(item.instance.flowType);
          analysis.meta.flowVersion = analysis.meta.flowVersion || str(item.instance.flowVersion);
          analysis.meta.startDateTime = analysis.meta.startDateTime || str(item.instance.startDateTime);
          analysis.meta.endDateTime = analysis.meta.endDateTime || str(item.instance.endDateTime);
        }
        if (isWorkflow(analysis.meta.flowType)) {
          skipped.push({ name: analysis.meta.flowName, type: analysis.meta.flowType });
          continue;
        }
        analyses.push(analysis);
        docs.push(item.doc);
      } catch (error) {
        failures.push({ name: item.instance?.flowName || item.fileName || 'Execution', error: error.message });
      }
    }

    return {
      conversationId: conversationId || analyses.find((a) => a.meta.conversationId)?.meta.conversationId || '',
      docs,
      skipped,
      failures,
      summary: analyses.length ? A.summarizeCall(analyses) : null
    };
  }

  async function analyzeConversation(conversationId) {
    if (!getStoredToken()) {
      setStatus('Sign in first: your session is missing or has expired.', true);
      openLoginDialog();
      return;
    }

    setBusy(true);
    ui.result.replaceChildren();
    lastRun = null;

    try {
      setStatus('Searching the flow executions of this conversation...');
      const entities = await queryInstances(conversationId);

      if (!entities.length) {
        setStatus('');
        ui.result.append(
          renderNotice('No flow executions found', [
            'Check that the conversation id is correct.',
            'Execution history must be enabled in the organization and the flows republished afterwards.',
            'Genesys Cloud keeps execution history for 10 days only.'
          ], 'warning')
        );
        return;
      }

      const skipped = entities
        .filter((entity) => isWorkflow(entity.flowType))
        .map((entity) => ({ name: str(entity.flowName), type: str(entity.flowType) }));
      const candidates = entities
        .filter((entity) => !isWorkflow(entity.flowType))
        .sort((a, b) => Date.parse(a.startDateTime) - Date.parse(b.startDateTime));

      if (!candidates.length) {
        setStatus('');
        ui.result.append(renderNotice('Only workflow executions were found', ['Workflow flows are not analysed.'], 'warning'));
        return;
      }

      const outcomes = await runPool(candidates, 3, async (instance) => {
        try {
          const doc = await downloadExecution(instance, setStatus);
          return { instance, doc };
        } catch (error) {
          return { instance, error };
        }
      });

      const loaded = outcomes.filter((outcome) => outcome.doc);
      const failures = outcomes
        .filter((outcome) => outcome.error)
        .map((outcome) => ({
          name: str(outcome.instance.flowName) || outcome.instance.id,
          error: outcome.error.message,
          downloadUrl: outcome.error.downloadUrl,
          blocked: Boolean(outcome.error.blocked)
        }));

      lastRun = buildRun(conversationId, loaded, skipped, failures);
      renderRun(lastRun);
      setStatus(`Analysis completed: ${lastRun.summary ? lastRun.summary.instances.length : 0} flow execution(s).`);
    } catch (error) {
      setStatus(error.message || String(error), true);
    } finally {
      setBusy(false);
    }
  }

  async function analyzeFiles(files) {
    setBusy(true);
    ui.result.replaceChildren();
    lastRun = null;

    try {
      const loaded = [];
      const failures = [];

      for (const file of files) {
        try {
          const parsed = JSON.parse((await file.text()).replace(/^\uFEFF/, ''));
          for (const doc of Array.isArray(parsed) ? parsed : [parsed]) {
            loaded.push({ doc, fileName: file.name });
          }
        } catch {
          failures.push({ name: file.name, error: 'The file is not valid JSON.' });
        }
      }

      lastRun = buildRun('', loaded, [], failures);
      renderRun(lastRun);
      setStatus(lastRun.summary ? `Analysis completed from ${files.length} file(s).` : 'Nothing could be analysed from the selected file(s).', !lastRun.summary);
    } finally {
      setBusy(false);
      ui.file.value = '';
    }
  }

  /* ------------------------------------------------------------------------
     Rendering
     ------------------------------------------------------------------------ */

  function renderNotice(title, lines, tone = 'info') {
    return el('div', { class: `notice notice-${tone}`, role: tone === 'error' ? 'alert' : null },
      el('strong', { text: title }),
      lines.length ? el('ul', null, lines.map((line) => el('li', { text: line }))) : null
    );
  }

  function fact(label, value) {
    if (value === '' || value === null || value === undefined) return null;
    return el('div', null, el('dt', { text: label }), el('dd', { text: value }));
  }

  function formatDateTime(ms) {
    return Number.isFinite(ms) ? new Date(ms).toLocaleString([], { dateStyle: 'medium', timeStyle: 'medium' }) : '';
  }

  function kvList(rows, className = 'kv') {
    return el('dl', { class: className }, rows.map(([name, value, extraClass]) =>
      el('div', { class: extraClass || null }, el('dt', { text: name }), el('dd', { text: value }))
    ));
  }

  function rawDetails(raw) {
    const pre = el('pre');
    const details = el('details', { class: 'raw' }, el('summary', { text: 'Raw data' }), pre);
    details.addEventListener('toggle', () => {
      if (details.open && !pre.textContent) {
        const text = JSON.stringify(raw, null, 2);
        pre.textContent = text.length > 30000 ? `${text.slice(0, 30000)}\n... (truncated)` : text;
      }
    });
    return details;
  }

  function contextLine(step) {
    const parts = [step.task, step.module].filter(Boolean);
    return parts.length ? el('div', { class: 'ctx', text: parts.join('  >  ') }) : null;
  }

  function badge(text, tone) {
    return el('span', { class: `badge badge-${tone}`, text });
  }

  function renderDatatable(step) {
    const resultTone = { found: 'ok', 'not-found': 'warn', error: 'err', unknown: 'neutral' }[step.result];
    const resultText = { found: 'Found', 'not-found': 'Not found', error: 'Error', unknown: 'Unknown' }[step.result];

    const children = [
      el('div', { class: 'card-head' },
        el('span', { class: 'kind kind-data', text: 'Data table' }),
        el('strong', { text: step.table || '(unnamed table)' }),
        badge(resultText, resultTone)
      ),
      contextLine(step),
      kvList([['Key sent', step.key || '(empty)', 'kv-key']])
    ];

    const items = step.groups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));
    if (items.length) {
      const empty = items.filter((item) => A.isEmptyValue(item.value));
      children.push(el('div', { class: 'card-sub', text: 'Values received' }));
      children.push(
        kvList(
          items.map((item) => [item.name, A.fmtValue(item.value) || '(empty)', A.isEmptyValue(item.value) ? 'kv-empty' : null]),
          'kv kv-received'
        )
      );
      if (empty.length) {
        children.push(el('p', { class: 'empty-note', text: `${empty.length} of ${items.length} values are empty or NOT_SET and hidden.` }));
      }
    } else if (step.result === 'not-found') {
      children.push(el('p', { class: 'card-note', text: 'No row matched this key, so no values were returned.' }));
    }

    children.push(rawDetails(step.raw));
    return el('div', { class: 'card card-data' }, children);
  }

  function renderMenu(step) {
    const title = /^collect input$/i.test(step.name) && step.module ? `${step.module} (${step.name})` : step.name;
    const children = [
      el('div', { class: 'card-head' },
        el('span', { class: 'kind kind-menu', text: step.subtype === 'collect' ? 'Input' : 'Menu' }),
        el('strong', { text: title })
      ),
      contextLine(step)
    ];

    const rows = [];
    if (step.prompts.length) rows.push(['Prompts played', step.prompts.join(', ')]);
    if (step.customer) rows.push([`Customer ${step.customer.mode === 'Speech' ? 'said' : 'entered'}`, step.customer.value || '(empty)', 'kv-choice']);
    else rows.push(['Customer input', 'No input recorded']);
    if (step.path) rows.push(['Path taken', step.path]);
    children.push(kvList(rows));

    children.push(rawDetails(step.raw));
    return el('div', { class: 'card card-menu' }, children);
  }

  function renderTransfer(step) {
    const label = A.KIND_LABELS[step.destKind] || 'Transfer';
    const children = [
      el('div', { class: 'card-head' },
        el('span', { class: 'kind kind-transfer', text: 'Transfer' }),
        el('strong', { text: `${label}${step.name ? `: ${step.name}` : ''}` }),
        step.failed ? badge('Failed', 'err') : step.path ? badge(step.path, 'neutral') : null
      ),
      contextLine(step)
    ];
    if (step.details.length) children.push(kvList(step.details));
    children.push(rawDetails(step.raw));
    return el('div', { class: `card card-transfer${step.failed ? ' card-failed' : ''}` }, children);
  }

  function renderStepBody(step) {
    switch (step.kind) {
      case 'datatable':
        return renderDatatable(step);
      case 'menu':
        return renderMenu(step);
      case 'transfer':
        return renderTransfer(step);
      case 'disconnect':
        return el('div', { class: 'card card-disconnect' },
          el('div', { class: 'card-head' }, el('span', { class: 'kind kind-end', text: 'Disconnect' }), el('strong', { text: step.name })),
          contextLine(step)
        );
      case 'start':
        return el('div', { class: 'line line-strong' },
          el('strong', { text: 'Flow started' }),
          step.ani ? ` from ${step.ani}` : '',
          step.dnis ? ` to ${step.dnis}` : '',
          step.language ? el('span', { class: 'muted', text: `  (${step.language})` }) : ''
        );
      case 'end':
        return el('div', { class: 'line line-strong' },
          el('strong', { text: 'Flow ended' }),
          step.exitReason ? badge(step.exitReason, step.exitReason === 'ERROR' ? 'err' : 'neutral') : null
        );
      case 'task':
        return el('div', { class: 'line line-task', text: `Task: ${step.name}` });
      case 'module':
        return el('div', { class: 'line line-module' },
          el('span', { class: 'kind kind-module', text: 'Module' }),
          el('strong', { text: step.name }),
          step.version ? el('span', { class: 'muted', text: ` v${step.version}` }) : null
        );
      default:
        return el('div', { class: 'line line-other' },
          el('span', { class: 'muted', text: step.type.replace(/^action/i, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2') }),
          step.name && step.name !== step.type ? ` ${step.name}` : '',
          step.path ? el('span', { class: 'muted', text: `  > ${step.path}` }) : null
        );
    }
  }

  function renderStep(step) {
    const hasError = step.errors.length > 0;
    const hasWarning = step.warnings.length > 0;
    const time = Date.parse(step.time);

    const body = el('div', { class: 'step-main', style: `--depth:${step.depth}` }, renderStepBody(step));
    for (const message of step.errors) body.append(el('div', { class: 'step-msg step-msg-err', text: `Error: ${message}` }));
    for (const message of step.warnings) body.append(el('div', { class: 'step-msg step-msg-warn', text: `Warning: ${message}` }));

    return el('li', { class: `step step-${step.kind}${hasError ? ' has-error' : ''}${hasWarning ? ' has-warning' : ''}` },
      el('div', { class: 'step-time' },
        el('span', { text: A.formatClock(time) }),
        step.relMs !== null && step.relMs >= 0 ? el('span', { class: 'rel', text: `+${A.formatDuration(step.relMs)}` }) : null
      ),
      el('div', { class: 'step-rail', 'aria-hidden': 'true' }, el('span', { class: 'dot' })),
      body
    );
  }

  function exitTone(reason) {
    if (/error/i.test(reason)) return 'err';
    if (/transfer/i.test(reason)) return 'info';
    return 'neutral';
  }

  function renderFlowCard(instance) {
    const start = Date.parse(instance.meta.startDateTime);
    const end = Date.parse(instance.meta.endDateTime);
    const duration = Number.isFinite(start) && Number.isFinite(end) ? A.formatDuration(end - start) : '';

    const head = el('div', { class: 'flow-head' },
      el('div', null,
        el('h3', { text: instance.meta.flowName || 'Flow' }),
        el('p', { class: 'flow-sub', text: [formatDateTime(start), duration && `duration ${duration}`].filter(Boolean).join('  |  ') })
      ),
      el('div', { class: 'flow-badges' },
        instance.meta.flowType ? badge(instance.meta.flowType, 'neutral') : null,
        instance.meta.flowVersion ? badge(`v${instance.meta.flowVersion}`, 'neutral') : null,
        instance.exitReason ? badge(`Exit: ${instance.exitReason}`, exitTone(instance.exitReason)) : null,
        instance.counts.errors ? badge(`${instance.counts.errors} error(s)`, 'err') : null,
        instance.counts.warnings ? badge(`${instance.counts.warnings} warning(s)`, 'warn') : null
      )
    );

    const notices = [];
    if (instance.meta.isTruncated) notices.push('The execution history of this flow was truncated by Genesys Cloud (size limit reached).');
    if (instance.meta.logLevel && instance.meta.logLevel !== 'all') {
      notices.push(`The flow's execution log level is "${instance.meta.logLevel}". Input and output values (data table values, menu input) are only recorded at level "all".`);
    }

    return el('section', { class: 'panel flow-card' },
      head,
      notices.length ? renderNotice('Heads up', notices, 'warning') : null,
      el('ol', { class: 'timeline' }, instance.steps.map(renderStep))
    );
  }

  function renderDestination(summary) {
    if (!summary.destination) {
      return el('div', { class: 'dest dest-unknown' },
        el('div', { class: 'dest-title', text: 'Final destination' }),
        el('div', { class: 'dest-value', text: 'Not determined' }),
        el('p', { class: 'dest-note', text: 'No transfer or disconnect action was found in the executions.' })
      );
    }

    const destination = summary.destination;
    const meta = [destination.flowName && `from flow "${destination.flowName}"`, destination.action, A.formatClock(Date.parse(destination.time))].filter(Boolean);
    return el('div', { class: 'dest' },
      el('div', { class: 'dest-title', text: 'Final destination' }),
      el('div', { class: 'dest-value', text: destination.label }),
      destination.details.length ? kvList(destination.details, 'kv kv-compact') : null,
      el('p', { class: 'dest-note', text: meta.join('  |  ') })
    );
  }

  function renderJourney(summary) {
    if (!summary.journey.length) return null;
    const nodes = [];
    summary.journey.forEach((item, index) => {
      if (index) nodes.push(el('span', { class: 'journey-arrow', 'aria-hidden': 'true', text: '>' }));
      nodes.push(el('span', { class: `journey-chip journey-${item.type}`, title: item.title || null, text: item.label }));
    });
    return el('div', { class: 'journey', 'aria-label': 'Call journey' }, nodes);
  }

  function downloadJson(run) {
    const blob = new Blob([JSON.stringify(run.docs.length === 1 ? run.docs[0] : run.docs, null, 2)], { type: 'application/json' });
    const link = el('a', { href: URL.createObjectURL(blob), download: `flow-execution-${run.conversationId || 'file'}.json` });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
  }

  function renderSummary(run, root) {
    const summary = run.summary;

    const copyBtn = el('button', { type: 'button', class: 'secondary small' }, 'Copy summary');
    copyBtn.addEventListener('click', async () => {
      const original = copyBtn.textContent;
      try {
        await navigator.clipboard.writeText(A.buildTextSummary(run.conversationId, summary));
        copyBtn.textContent = 'Copied';
      } catch {
        copyBtn.textContent = 'Copy failed';
      }
      setTimeout(() => { copyBtn.textContent = original; }, 1500);
    });

    const downloadBtn = el('button', { type: 'button', class: 'secondary small' }, 'Download JSON');
    downloadBtn.addEventListener('click', () => downloadJson(run));

    const toggle = (label, className) => {
      const input = el('input', { type: 'checkbox' });
      input.addEventListener('change', () => root.classList.toggle(className, input.checked));
      return el('label', { class: 'check' }, input, el('span', { text: label }));
    };

    return el('section', { class: 'panel report-summary' },
      el('div', { class: 'summary-head' },
        el('h2', { text: 'Call summary' }),
        run.conversationId ? el('code', { class: 'conv-id', text: run.conversationId }) : null
      ),
      el('dl', { class: 'facts-grid' },
        fact('From', summary.ani),
        fact('To', summary.dnis),
        fact('Started', formatDateTime(summary.startMs)),
        fact('Duration', summary.durationMs !== null ? A.formatDuration(summary.durationMs) : ''),
        fact('Flow executions', String(summary.instances.length))
      ),
      renderDestination(summary),
      renderJourney(summary),
      el('div', { class: 'report-tools' },
        toggle('Show all actions', 'show-all'),
        toggle('Show empty values', 'show-empty'),
        el('div', { class: 'report-buttons' }, copyBtn, run.docs.length ? downloadBtn : null)
      )
    );
  }

  function renderFailure(failure) {
    const lines = [failure.error];
    const notice = renderNotice(`Could not load "${failure.name}"`, lines, 'error');

    if (failure.blocked && failure.downloadUrl) {
      notice.append(
        el('p', { class: 'notice-help' },
          'Open the link below, save the file and load it with "Analyze an execution JSON file" above. The link is temporary. ',
          el('a', { href: failure.downloadUrl, target: '_blank', rel: 'noopener noreferrer', text: 'Open download link' })
        )
      );
    }
    return notice;
  }

  function renderRun(run) {
    const root = el('div', { class: 'report' });
    ui.result.replaceChildren(root);

    if (run.skipped.length) {
      root.append(renderNotice(`${run.skipped.length} workflow execution(s) skipped`, [], 'info'));
    }
    for (const failure of run.failures) root.append(renderFailure(failure));

    if (!run.summary) {
      if (!run.failures.length) root.append(renderNotice('Nothing to show', ['No analysable flow execution was found.'], 'warning'));
      return;
    }

    root.prepend(renderSummary(run, root));
    for (const instance of run.summary.instances) root.append(renderFlowCard(instance));
  }

  /* ------------------------------------------------------------------------
     Wiring
     ------------------------------------------------------------------------ */

  ui.navChecker.addEventListener('click', () => showView('checker'));
  ui.navAnalyzer.addEventListener('click', () => showView('analyzer'));

  ui.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const conversationId = str(ui.conversationId.value).trim();
    if (!GUID.test(conversationId)) {
      setStatus('Enter a valid conversation id (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).', true);
      ui.conversationId.focus();
      return;
    }
    analyzeConversation(conversationId);
  });

  ui.file.addEventListener('change', () => {
    const files = Array.from(ui.file.files || []);
    if (files.length) analyzeFiles(files);
  });

  let initialView = 'checker';
  try {
    initialView = sessionStorage.getItem(VIEW_KEY) === 'analyzer' ? 'analyzer' : 'checker';
  } catch {
    /* ignore */
  }
  showView(initialView);
})();
