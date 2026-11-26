/* ==========================================================================
   Call analyzer
   Given a conversation id, downloads the flow execution history of the call and
   shows the flows it went through, data table lookups (key sent / values received),
   menus (what the customer chose) and the final destination.

   Sections:
     1. Analysis (pure functions, no DOM)    -> window.CallAnalyzer
     2. Genesys Cloud download chain
     3. Rendering
     4. Wiring (view switch, form, file loader)
   Uses helpers defined in app.js: apiGet, apiSend, getStoredToken, getAuthorizationHeaders,
   openLoginDialog, sleep, asTrimmedString.
   ========================================================================== */

(function (global) {
  'use strict';

  /* ------------------------------------------------------------------------
     1. ANALYSIS
     ------------------------------------------------------------------------ */

  const isObj = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  const asArray = (value) => (Array.isArray(value) ? value : value === null || value === undefined ? [] : [value]);
  const str = (value) => (value === null || value === undefined ? '' : String(value));
  const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function fmtValue(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (isObj(value)) {
      if (value.valueIsRedacted) return '[redacted]';
      if (typeof value.name === 'string') return value.name;
      if (typeof value.raw === 'string') return value.raw;
      if (typeof value.uri === 'string') return value.uri;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  function isEmptyValue(value) {
    if (value === null || value === undefined) return true;
    const text = typeof value === 'string' ? value.trim() : '';
    return typeof value === 'string' && (text === '' || text.toUpperCase() === 'NOT_SET');
  }

  function pathLabel(id) {
    const text = str(id);
    if (!text || GUID.test(text)) return '';
    return text.replace(/^_+|_+$/g, '').replace(/_+/g, ' ').trim();
  }

  function humanize(type) {
    return str(type)
      .replace(/^action/i, '')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ')
      .trim() || str(type);
  }

  // "errorMessage" -> "Error message"
  function labelize(key) {
    const text = humanize(key).toLowerCase();
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function errorText(entry) {
    if (typeof entry === 'string') return entry;
    if (isObj(entry)) return str(entry.message || entry.errorMessage || entry.errorType || JSON.stringify(entry));
    return str(entry);
  }

  function variablesToMap(list) {
    const map = {};
    for (const entry of asArray(list)) {
      if (isObj(entry) && entry.variableName) map[entry.variableName] = entry.value;
    }
    return map;
  }

  function unwrapEvent(entry) {
    if (!isObj(entry)) return null;
    const keys = Object.keys(entry);
    if (!keys.length) return null;
    return { type: keys[0], payload: isObj(entry[keys[0]]) ? entry[keys[0]] : {} };
  }

  function outputPathText(payload) {
    return str(
      payload.outputPathName ||
      pathLabel(payload.outputPathId) ||
      payload.endingOutputPath?.outputPathName ||
      pathLabel(payload.endingOutputPath?.outputPathId)
    );
  }

  /* ---- transfers -------------------------------------------------------- */

  const TRANSFER_KINDS = [
    [/acd/i, 'queue'],
    [/secureflow/i, 'flow'],
    [/flow/i, 'flow'],
    [/user/i, 'user'],
    [/number/i, 'number'],
    [/group/i, 'group'],
    [/voicemail/i, 'voicemail'],
    [/menu/i, 'menu']
  ];

  const KIND_LABELS = {
    queue: 'Queue',
    flow: 'Flow',
    user: 'User',
    number: 'Phone number',
    group: 'Group',
    voicemail: 'Voicemail',
    menu: 'Menu',
    other: 'Transfer'
  };

  function transferKind(type) {
    const rest = str(type).replace(/^actionTransferTo/i, '');
    for (const [pattern, kind] of TRANSFER_KINDS) {
      if (pattern.test(rest)) return kind;
    }
    return 'other';
  }

  function findNamed(input, keyPattern) {
    for (const [key, value] of Object.entries(input)) {
      if (!keyPattern.test(key)) continue;
      if (isObj(value) && typeof value.name === 'string' && value.name) return value.name;
      if (typeof value === 'string' && value && !GUID.test(value)) return value;
    }
    return '';
  }

  function firstScalar(input, keyPattern) {
    for (const [key, value] of Object.entries(input)) {
      if (!keyPattern.test(key)) continue;
      const text = fmtValue(value);
      if (text) return text;
    }
    return '';
  }

  function genericDetails(input, skipPattern = /audio|prompt|dateTime|bargeIn/i) {
    const rows = [];
    for (const [key, value] of Object.entries(input)) {
      if (skipPattern.test(key) || value === null || value === undefined) continue;
      if (Array.isArray(value)) {
        const items = value.map((item) => fmtValue(isObj(item) ? item.skill || item.user || item : item)).filter(Boolean);
        if (items.length) rows.push([labelize(key), items.join(', ')]);
      } else if (!isObj(value) || typeof value.name === 'string' || typeof value.raw === 'string') {
        const text = fmtValue(value);
        if (text !== '') rows.push([labelize(key), text]);
      }
    }
    return rows.slice(0, 12);
  }

  function extractTransfer(type, payload) {
    const input = isObj(payload.inputData) ? payload.inputData : {};
    const kind = transferKind(type);
    let name = '';
    let details = [];

    if (kind === 'queue') {
      name = input.targetQueue?.name || input.queue?.name || findNamed(input, /queue/i);
      const skills = asArray(input.acdSkills).map((item) => fmtValue(item?.skill || item)).filter(Boolean);
      const languageSkill = fmtValue(input.languageSkill) || asArray(input.languageSkills).map((item) => fmtValue(item?.skill || item)).join(', ');
      if (skills.length) details.push(['Skills', skills.join(', ')]);
      if (languageSkill) details.push(['Language skill', languageSkill]);
      if (input.priority !== undefined && input.priority !== null) details.push(['Priority', fmtValue(input.priority)]);
      const preferred = asArray(input.preferredAgents).map((item) => fmtValue(item?.user || item)).filter(Boolean);
      if (preferred.length) details.push(['Preferred agents', preferred.join(', ')]);
      if (input.directAgent) details.push(['Direct agent', fmtValue(input.directAgent)]);
    } else {
      if (kind === 'flow') name = input.targetFlow?.name || input.flow?.name || input.callFlow?.name || str(input.flowName) || findNamed(input, /flow/i);
      else if (kind === 'user') name = input.targetUser?.name || input.user?.name || findNamed(input, /user|agent/i);
      else if (kind === 'group') name = input.targetGroup?.name || input.group?.name || findNamed(input, /group/i);
      else if (kind === 'voicemail') name = findNamed(input, /user|mailbox|voicemail/i);
      else if (kind === 'number') name = firstScalar(input, /number|phone|destination|address|e164|uri/i);
      else if (kind === 'menu') name = findNamed(input, /menu/i);
      details = genericDetails(input);
    }

    const destination = str(name);
    details = details.filter(([, value]) => value !== destination);
    return { destKind: kind, name: destination, details };
  }

  /* ---- menus / collect input ------------------------------------------- */

  const PROMPT_KEYS = ['promptName', 'ttsText', 'tts', 'text', 'spokenText', 'audioText'];
  const SPEECH_KEYS = ['transcript', 'text', 'utterance', 'value', 'displayText', 'phrase'];

  function promptNames(items) {
    const names = [];
    for (const item of asArray(items)) {
      if (!isObj(item)) continue;
      for (const key of PROMPT_KEYS) {
        if (typeof item[key] === 'string' && item[key].trim()) {
          names.push(item[key].trim());
          break;
        }
      }
    }
    return names;
  }

  // One entry per customer turn: what was played and what the customer entered / said.
  function extractTurns(events) {
    const turns = [];
    const scan = (list) => {
      for (const entry of asArray(list)) {
        const event = unwrapEvent(entry);
        if (!event) continue;
        if (event.type === 'turn') {
          const audio = event.payload.fromParticipant?.audio;
          let input = null;
          if (isObj(audio)) {
            if (isObj(audio.dtmf) && audio.dtmf.value !== undefined && audio.dtmf.value !== null && audio.dtmf.value !== '') {
              input = { mode: 'DTMF', value: audio.dtmf.valueIsRedacted ? '[redacted]' : fmtValue(audio.dtmf.value) };
            }
            const alternate = asArray(audio.alternates)[0];
            if (!input && isObj(alternate)) {
              const key = SPEECH_KEYS.find((candidate) => typeof alternate[candidate] === 'string' && alternate[candidate]);
              input = { mode: 'Speech', value: key ? alternate[key] : fmtValue(alternate) };
            }
          }
          turns.push({
            prompts: promptNames(event.payload.toParticipant?.audioItems),
            input,
            purpose: str(event.payload.purpose)
          });
        } else if (isObj(event.payload) && Array.isArray(event.payload.execution)) {
          scan(event.payload.execution);
        }
      }
    };
    scan(events);
    return turns;
  }

  // Used for menu events ("menuMenu") and for menu-like actions (Collect Input...).
  function extractMenu(type, payload) {
    const turns = extractTurns(payload.execution);
    const prompts = promptNames(payload.inputData?.inputAudio?.audioItems);
    for (const turn of turns) prompts.push(...turn.prompts);

    const output = isObj(payload.outputData) ? payload.outputData : {};
    const outputValue = fmtValue(output.inputData ?? output.choice ?? output.selectedOption ?? output.result ?? '');

    // The last non-empty input is the customer's final choice (earlier turns may be retries).
    const lastInput = [...turns].reverse().map((turn) => turn.input).find((input) => input && input.value !== '');
    const customer = lastInput || (outputValue ? { mode: 'Input', value: outputValue } : null);

    const variables = variablesToMap([...asArray(payload.outputVariables), ...asArray(payload.variables)]);
    const mode = fmtValue(variables['Call.LastCollectionMode']);

    return {
      subtype: /collectinput/i.test(type) ? 'collect' : 'menu',
      prompts: Array.from(new Set(prompts.filter(Boolean))),
      customer,
      turns,
      noMatch: variables['Menu.LastCollectionNoMatch'] === true,
      noInput: variables['Menu.LastCollectionNoInput'] === true,
      collectionMode: mode
    };
  }

  /* ---- data actions ------------------------------------------------------ */

  const isDataAction = (type) => !/datatable/i.test(type) && (/dataaction/i.test(type) || /^actioncalldata/i.test(type));
  const isJumpToMenu = (type) => /^action(jumpto|goto|previous|repeat)menu/i.test(type) || /^actionjump.*menu/i.test(type);

  const WRAPPER_KEYS = /^(inputs?|outputs?|result|results|data|response|body|parameters)$/i;
  const REF_KEYS = /^(dataaction|action|integration)$/i;

  // Turns a payload section into [name, value] rows, whatever shape it has:
  //   [{ inputName|outputName|name|key, value }]   or   { name: value, ... }   or a wrapper around either.
  function collectPairs(section) {
    const rows = [];
    const addList = (list) => {
      for (const item of list) {
        if (!isObj(item)) continue;
        const name = item.inputName ?? item.outputName ?? item.name ?? item.key ?? item.variableName;
        if (name !== undefined) rows.push([str(name), item.value]);
      }
    };

    if (Array.isArray(section)) {
      addList(section);
      return rows;
    }
    if (!isObj(section)) return rows;

    for (const [key, value] of Object.entries(section)) {
      if (REF_KEYS.test(key) && isObj(value)) continue;
      if (Array.isArray(value) && value.length && value.every((item) => isObj(item) && ('value' in item))) {
        addList(value);
      } else if (isObj(value) && WRAPPER_KEYS.test(key)) {
        rows.push(...collectPairs(value));
      } else if (!Array.isArray(value) && value !== undefined) {
        rows.push([key, value]);
      }
    }
    return rows;
  }

  function extractDataAction(payload) {
    const input = isObj(payload.inputData) ? payload.inputData : {};
    const output = isObj(payload.outputData) ? payload.outputData : {};

    const reference = input.dataAction?.name || input.action?.name || str(input.dataActionName) || findNamed(input, /dataaction|integration/i);
    const inputs = collectPairs(input).filter(([, value]) => value !== null);
    // Error details are shown separately, not as if they were returned values.
    const ERROR_KEYS = /^(errortype|errormessage|errorcode)$/i;
    let outputs = collectPairs(output).filter(([name]) => !ERROR_KEYS.test(name));
    let outputsFromVariables = false;
    if (!outputs.length) {
      outputs = collectPairs(asArray(payload.outputVariables));
      outputsFromVariables = outputs.length > 0;
    }

    const pathId = str(payload.outputPathId).toUpperCase();
    const failed = /FAIL|ERROR|TIMEOUT/.test(pathId);
    const errorInfo = ['errorType', 'errorMessage', 'errorCode', 'message']
      .map((key) => (output[key] !== undefined ? [labelize(key), fmtValue(output[key])] : null))
      .filter(Boolean);

    return {
      reference: str(reference),
      inputs,
      outputs,
      outputsFromVariables,
      failed,
      errorInfo,
      result: failed ? 'failure' : /SUCCESS/.test(pathId) ? 'success' : 'unknown'
    };
  }

  /* ---- data tables ------------------------------------------------------ */

  function extractDataTable(payload) {
    const input = isObj(payload.inputData) ? payload.inputData : {};
    const output = isObj(payload.outputData) ? payload.outputData : {};
    const groups = [];

    for (const [key, value] of Object.entries(output)) {
      if (Array.isArray(value) && value.some((item) => isObj(item) && 'outputName' in item)) {
        groups.push({ label: key, items: value.map((item) => ({ name: str(item.outputName), value: item.value })) });
      }
    }

    const pathId = str(payload.outputPathId).toUpperCase();
    let result = 'unknown';
    if (/NOT_?FOUND/.test(pathId)) result = 'not-found';
    else if (/FOUND/.test(pathId)) result = 'found';
    else if (/FAIL|ERROR/.test(pathId)) result = 'error';
    else if (groups.length) result = 'found';

    return {
      table: str(input.dataTableName) || str(input.dataTableId),
      tableId: str(input.dataTableId),
      key: fmtValue(input.lookupValue),
      result,
      groups
    };
  }

  /* ---- common modules left out of the analysis -------------------------- */

  // Logging modules add a lot of noise and little information.
  // A module is skipped when its name (or its action name) STARTS WITH one of these, ignoring case,
  // spaces, hyphens and underscores, so "MCT_Common_Logging_IVR", "mct common logging" or
  // "MCT_Common_Logging_IVR v2" all match.
  const BUILD = '4';
  const IGNORED_MODULES = ['MCT_Common_Logging_IVR', 'MCT_Common_Logging'];
  const normalizeName = (name) => str(name).toLowerCase().replace(/[^a-z0-9]/g, '');
  const ignoredPrefixes = IGNORED_MODULES.map(normalizeName);
  const isIgnoredModule = (...names) =>
    names.some((name) => {
      const normalized = normalizeName(name);
      return normalized !== '' && ignoredPrefixes.some((prefix) => normalized.startsWith(prefix));
    });

  // Never hide a real problem: a skipped module that reports errors/warnings is kept.
  function subtreeHasProblems(payload) {
    if (!isObj(payload)) return false;
    if (asArray(payload.errors).length || asArray(payload.warnings).length) return true;
    return asArray(payload.execution).some((child) => {
      const event = unwrapEvent(child);
      return event ? subtreeHasProblems(event.payload) : false;
    });
  }

  /* ---- walking the execution tree -------------------------------------- */

  function analyzeExecution(doc) {
    const flow = doc && doc.flow;
    if (!isObj(flow) || !Array.isArray(flow.execution)) {
      const keys = isObj(doc) ? Object.keys(doc) : [Array.isArray(doc) ? 'array' : typeof doc];
      throw new Error(`Unrecognised execution document (top-level keys: ${keys.join(', ') || 'none'}). Expected { flow: { execution: [...] } }.`);
    }

    const ctx = { steps: [], task: '', startMs: Date.parse(flow.startDateTime), startVars: {}, omittedModules: 0, modules: new Map() };

    const makeStep = (kind, type, payload, depth, scope, extra) => {
      const timeMs = Date.parse(payload.dateTime || payload.timestamp);
      return {
        kind,
        type,
        name: str(payload.actionName) || humanize(type),
        time: str(payload.dateTime || payload.timestamp),
        relMs: Number.isFinite(timeMs) && Number.isFinite(ctx.startMs) ? timeMs - ctx.startMs : null,
        tracking: payload.trackingId ?? null,
        task: ctx.task,
        module: scope.module,
        depth,
        path: outputPathText(payload),
        pathId: str(payload.outputPathId || payload.endingOutputPath?.outputPathId),
        errors: asArray(payload.errors).map(errorText),
        warnings: asArray(payload.warnings).map(errorText),
        raw: payload,
        ...extra
      };
    };

    const walk = (events, depth, scope) => {
      for (const entry of asArray(events)) {
        const event = unwrapEvent(entry);
        if (!event) continue;
        const { type, payload } = event;

        if (type === 'startedFlow') {
          ctx.startVars = variablesToMap(payload.variables);
          ctx.steps.push(makeStep('start', type, payload, depth, scope, {
            name: 'Flow started',
            ani: fmtValue(ctx.startVars['Call.Ani']).replace(/^tel:/i, ''),
            dnis: fmtValue(ctx.startVars['Call.CalledAddress']).replace(/^tel:/i, ''),
            remoteName: fmtValue(ctx.startVars['Call.RemoteName']),
            language: str(payload.languageTag)
          }));
        } else if (type === 'endedFlow') {
          ctx.steps.push(makeStep('end', type, payload, depth, scope, { name: 'Flow ended', exitReason: str(payload.flowExitReason) }));
        } else if (type === 'startedTask') {
          ctx.task = str(payload.taskName);
          ctx.steps.push(makeStep('task', type, payload, depth, scope, { name: str(payload.taskName) || 'Task' }));
        } else if (type === 'endedTask') {
          ctx.task = '';
        } else if (type === 'startedCommonModule' || type === 'endedCommonModule' || type === 'turn') {
          // Represented by the parent action (module call / menu).
        } else if (/^menu/i.test(type)) {
          // Menu events (e.g. "menuMenu"): the prompt played and what the customer entered.
          ctx.steps.push(makeStep('menu', type, payload, depth, scope, {
            ...extractMenu(type, payload),
            name: str(payload.menuName) || humanize(type),
            menuId: str(payload.menuId)
          }));
        } else if (/^action/i.test(type)) {
          handleAction(type, payload, depth, scope);
        } else {
          ctx.steps.push(makeStep('other', type, payload, depth, scope, { name: humanize(type) }));
        }
      }
    };

    const handleAction = (type, payload, depth, scope) => {
      const input = isObj(payload.inputData) ? payload.inputData : {};

      if (/^actionDataTableLookup$/i.test(type)) {
        ctx.steps.push(makeStep('datatable', type, payload, depth, scope, extractDataTable(payload)));
      } else if (/^actionTransfer/i.test(type)) {
        const transfer = extractTransfer(type, payload);
        const failed = /FAIL|ERROR/i.test(str(payload.outputPathId));
        ctx.steps.push(makeStep('transfer', type, payload, depth, scope, { ...transfer, failed }));
      } else if (/^actionDisconnect$/i.test(type)) {
        ctx.steps.push(makeStep('disconnect', type, payload, depth, scope, {}));
      } else if (isJumpToMenu(type)) {
        const target = input.targetMenu?.name || input.menu?.name || str(input.menuName) || findNamed(input, /menu/i);
        ctx.steps.push(makeStep('jump', type, payload, depth, scope, { target: str(target) }));
        const children = asArray(payload.execution).filter((child) => {
          const kid = unwrapEvent(child);
          return kid && kid.type !== 'turn';
        });
        if (children.length) walk(children, depth + 1, scope);
      } else if (isDataAction(type)) {
        ctx.steps.push(makeStep('dataaction', type, payload, depth, scope, extractDataAction(payload)));
      } else if (/menu/i.test(type) || /^actionCollectInput$/i.test(type)) {
        ctx.steps.push(makeStep('menu', type, payload, depth, scope, extractMenu(type, payload)));
      } else if (/^actionCallCommonModule$/i.test(type)) {
        const module = input.commonModule || {};
        const name = str(module.flowName) || str(payload.actionName) || 'Common module';
        const ignorable = isIgnoredModule(module.flowName, payload.actionName, name);
        const keptForProblems = ignorable && subtreeHasProblems(payload);
        const seen = ctx.modules.get(name) || { name, count: 0, omitted: ignorable && !keptForProblems, keptForProblems };
        seen.count += 1;
        ctx.modules.set(name, seen);

        if (ignorable && !keptForProblems) {
          ctx.omittedModules += 1;
          return;
        }
        ctx.steps.push(makeStep('module', type, payload, depth, scope, {
          name,
          version: str(module.flowVersion),
          note: keptForProblems ? 'Normally omitted (logging module). Shown because it reports errors or warnings.' : ''
        }));
        walk(payload.execution, depth + 1, { module: name });
      } else {
        ctx.steps.push(makeStep('other', type, payload, depth, scope, {}));
        const children = asArray(payload.execution).filter((child) => {
          const kid = unwrapEvent(child);
          return kid && kid.type !== 'turn';
        });
        if (children.length) walk(children, depth + 1, scope);
      }
    };

    walk(flow.execution, 0, { module: '' });

    const steps = ctx.steps;
    const startStep = steps.find((step) => step.kind === 'start');
    const endStep = [...steps].reverse().find((step) => step.kind === 'end');
    const terminal = [...steps].reverse().find((step) => (step.kind === 'transfer' && !step.failed) || step.kind === 'disconnect');

    return {
      meta: {
        executionId: str(flow.executionId),
        conversationId: str(flow.conversationId),
        flowId: str(flow.flowId),
        flowName: str(flow.flowName),
        flowType: str(flow.flowType),
        flowVersion: str(flow.flowVersion),
        startDateTime: str(flow.startDateTime),
        endDateTime: str(flow.endDateTime),
        isTruncated: Boolean(flow.isTruncated),
        logLevel: str(flow.executionInfo?.logLevel)
      },
      ani: startStep?.ani || '',
      dnis: startStep?.dnis || '',
      remoteName: startStep?.remoteName || '',
      language: startStep?.language || '',
      exitReason: endStep?.exitReason || '',
      omittedModules: ctx.omittedModules,
      modules: Array.from(ctx.modules.values()),
      steps,
      counts: {
        datatables: steps.filter((step) => step.kind === 'datatable').length,
        menus: steps.filter((step) => step.kind === 'menu').length,
        dataActions: steps.filter((step) => step.kind === 'dataaction').length,
        transfers: steps.filter((step) => step.kind === 'transfer').length,
        errors: steps.reduce((total, step) => total + step.errors.length, 0),
        warnings: steps.reduce((total, step) => total + step.warnings.length, 0)
      },
      terminal: terminal || null
    };
  }

  /** Combines the analysed flow instances of one call (chronological) into a call-level summary. */
  function summarizeCall(instances) {
    const ordered = [...instances].sort((a, b) => Date.parse(a.meta.startDateTime) - Date.parse(b.meta.startDateTime));

    const starts = ordered.map((item) => Date.parse(item.meta.startDateTime)).filter(Number.isFinite);
    const ends = ordered.map((item) => Date.parse(item.meta.endDateTime)).filter(Number.isFinite);
    const startMs = starts.length ? Math.min(...starts) : null;
    const endMs = ends.length ? Math.max(...ends) : null;

    let finalStep = null;
    let finalFlow = null;
    for (const instance of ordered) {
      if (instance.terminal) {
        finalStep = instance.terminal;
        finalFlow = instance;
      }
    }

    const journey = [];
    for (const instance of ordered) {
      journey.push({ type: 'flow', label: instance.meta.flowName || 'Flow', title: instance.meta.flowType });
      for (const step of instance.steps) {
        if (step.kind === 'menu' && step.customer) {
          const menuName = /^collect input$/i.test(step.name) && step.module ? step.module : step.name;
          journey.push({ type: 'menu', label: `${menuName}: ${step.customer.value}`, title: step.task });
        } else if (step.kind === 'transfer' && !step.failed) {
          journey.push({ type: 'transfer', label: `${KIND_LABELS[step.destKind] || 'Transfer'}${step.name ? `: ${step.name}` : ''}`, title: humanize(step.type) });
        } else if (step.kind === 'disconnect') {
          journey.push({ type: 'disconnect', label: 'Disconnect', title: step.name });
        }
      }
    }

    return {
      instances: ordered,
      ani: ordered.map((item) => item.ani).find(Boolean) || '',
      dnis: ordered.map((item) => item.dnis).find(Boolean) || '',
      startMs,
      endMs,
      durationMs: startMs !== null && endMs !== null ? endMs - startMs : null,
      journey,
      destination: finalStep ? describeDestination(finalStep, finalFlow) : null
    };
  }

  function describeDestination(step, instance) {
    if (step.kind === 'disconnect') {
      return {
        label: 'Call disconnected by the flow',
        kind: 'disconnect',
        details: [],
        flowName: instance.meta.flowName,
        action: step.name,
        time: step.time
      };
    }
    return {
      label: `${KIND_LABELS[step.destKind] || 'Transfer'}${step.name ? `: ${step.name}` : ''}`,
      kind: step.destKind,
      details: step.details,
      flowName: instance.meta.flowName,
      action: step.type ? humanize(step.type) : step.name,
      time: step.time
    };
  }

  /* ---- plain-text summary (for tickets) -------------------------------- */

  function formatClock(ms) {
    if (!Number.isFinite(ms)) return '';
    const date = new Date(ms);
    const pad = (n, size = 2) => String(n).padStart(size, '0');
    return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`;
  }

  function formatDuration(ms) {
    if (!Number.isFinite(ms) || ms < 0) return '';
    if (ms < 1000) return `${Math.round(ms)} ms`;
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)} s`;
    return `${Math.floor(seconds / 60)} min ${Math.round(seconds % 60)} s`;
  }

  function buildTextSummary(conversationId, summary) {
    const lines = [];
    lines.push(`Conversation: ${conversationId || '(from file)'}`);
    if (summary.ani || summary.dnis) lines.push(`From ${summary.ani || '?'} to ${summary.dnis || '?'}`);
    if (summary.durationMs !== null) lines.push(`Duration: ${formatDuration(summary.durationMs)}`);
    lines.push(`Final destination: ${summary.destination ? summary.destination.label : 'not determined'}`);
    if (summary.journey.length) lines.push(`Journey: ${summary.journey.map((item) => item.label).join(' > ')}`);

    for (const instance of summary.instances) {
      lines.push('');
      lines.push(`== Flow: ${instance.meta.flowName} (${instance.meta.flowType} ${instance.meta.flowVersion}) exit: ${instance.exitReason || 'n/a'}`);
      for (const step of instance.steps) {
        const time = formatClock(Date.parse(step.time));
        if (step.kind === 'datatable') {
          const outputs = step.groups.flatMap((group) => group.items).filter((item) => !isEmptyValue(item.value));
          lines.push(`[${time}] DATA TABLE ${step.table} | key sent: ${step.key} | ${step.result.replace('-', ' ').toUpperCase()}`);
          for (const item of outputs) lines.push(`    ${item.name} = ${fmtValue(item.value)}`);
        } else if (step.kind === 'menu') {
          const choice = step.customer ? `${step.customer.mode}: ${step.customer.value}` : 'no input recorded';
          const prompts = step.prompts && step.prompts.length ? ` | prompt: ${step.prompts.join(', ')}` : '';
          lines.push(`[${time}] MENU ${step.name}${prompts} | ${choice}${step.path ? ` | path: ${step.path}` : ''}`);
        } else if (step.kind === 'dataaction') {
          lines.push(`[${time}] DATA ACTION ${step.reference || step.name} | ${step.result.toUpperCase()}`);
          for (const [name, value] of step.inputs) lines.push(`    in  ${name} = ${fmtValue(value)}`);
          for (const [name, value] of step.outputs) lines.push(`    out ${name} = ${fmtValue(value)}`);
        } else if (step.kind === 'jump') {
          lines.push(`[${time}] JUMP TO MENU${step.target ? `: ${step.target}` : ''}`);
        } else if (step.kind === 'transfer') {
          lines.push(`[${time}] TRANSFER ${KIND_LABELS[step.destKind] || 'Transfer'}: ${step.name || '(unknown)'}${step.failed ? ' (FAILED)' : ''}`);
        } else if (step.kind === 'disconnect') {
          lines.push(`[${time}] DISCONNECT`);
        }
        for (const message of step.errors) lines.push(`    ERROR: ${message}`);
        for (const message of step.warnings) lines.push(`    WARNING: ${message}`);
      }
    }
    return lines.join('\n');
  }

  global.CallAnalyzer = {
    analyzeExecution,
    summarizeCall,
    buildTextSummary,
    fmtValue,
    isEmptyValue,
    formatClock,
    formatDuration,
    KIND_LABELS,
    IGNORED_MODULES,
    BUILD
  };
})(typeof window !== 'undefined' ? window : globalThis);
