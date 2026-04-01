const APP_CONFIG = window.APP_CONFIG || {};

const STORAGE_KEYS = {
  token: 'genesysChecker.token',
  tokenType: 'genesysChecker.tokenType',
  expiresAt: 'genesysChecker.expiresAt',
  pkceVerifier: 'genesysChecker.pkceVerifier',
  oauthState: 'genesysChecker.oauthState'
};

const VOICE_ACTIONS = [
  'Continue',
  'Disconnect',
  'Transfer_flow',
  'Transfer_service',
  'Callback',
  'BPO',
  'Transfer_number'
];

const COUNTRY_CONFIG = {
  PRT: {
    label: 'Portugal',
    configured: true,
    datatableIdConfig: '92f1665b-cb1f-4f83-af19-f55546d4b43d',
    datatableIdRouting: 'a75c3725-c299-4a18-a736-8644fb75f87f',
    langAudio: 'pt-pt'
  },
  ESP: {
    label: 'Spain',
    configured: true,
    datatableIdConfig: '4fa10087-325b-4039-8861-977a23cb167d',
    datatableIdRouting: '935ed5a9-bdd9-461b-9245-83f8bbaba952',
    langAudio: 'es-es'
  },
  FRA: {
    label: 'France',
    configured: true,
    datatableIdConfig: '33802a90-3935-4a8e-a808-6a0ac770ee54',
    datatableIdRouting: 'd9437318-9897-465a-a617-f9111557df22',
    langAudio: 'fr-fr'
  },
  ITA: { label: 'Italy', configured: false },
  GBR: { label: 'United Kingdom', configured: false },
  IRL: { label: 'Ireland', configured: false },
  BRA: {
    label: 'Brazil',
    configured: true,
    datatableIdConfig: '09dc8f76-01c8-46b1-be31-477f12d329ec',
    datatableIdRouting: '7e641552-8f7e-4ed4-916a-cd5e987ba383',
    langAudio: 'pt-br'
  },
  ARG: { label: 'Argentina', configured: false },
  PER: { label: 'Peru', configured: false },
  CHL: { label: 'Chile', configured: false },
  MEX: { label: 'Mexico', configured: false },
  TST: { label: 'Test', configured: false }
};

const elements = {
  authStatus: document.getElementById('authStatus'),
  loginBtn: document.getElementById('loginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  clearBtn: document.getElementById('clearBtn'),
  checkerForm: document.getElementById('checkerForm'),
  country: document.getElementById('country'),
  service: document.getElementById('service'),
  runBtn: document.getElementById('runBtn'),
  output: document.getElementById('output'),
  summary: document.getElementById('summary')
};

const counters = {
  errors: 0,
  warnings: 0
};

function nowText() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function appendLog(message, level = 'info') {
  if (level === 'error') counters.errors += 1;
  if (level === 'warning') counters.warnings += 1;

  const line = document.createElement('div');
  line.className = `log-line log-${level}`;
  line.textContent = `[${nowText()}] ${message}`;
  elements.output.appendChild(line);
  elements.output.scrollTop = elements.output.scrollHeight;
}

function logInfo(message) {
  appendLog(message, 'info');
}

function logSuccess(message) {
  appendLog(message, 'success');
}

function logWarning(message) {
  appendLog(message, 'warning');
}

function logError(message) {
  appendLog(message, 'error');
}

function clearOutput() {
  elements.output.innerHTML = '';
  counters.errors = 0;
  counters.warnings = 0;
  elements.summary.textContent = '';
}

function updateSummary(text = '') {
  elements.summary.textContent = text;
}

function setBusy(isBusy) {
  elements.loginBtn.disabled = isBusy;
  elements.logoutBtn.disabled = isBusy;
  elements.runBtn.disabled = isBusy;
  elements.clearBtn.disabled = isBusy;
  elements.country.disabled = isBusy;
  elements.service.disabled = isBusy;
}

function setAuthStatus(text, kind) {
  elements.authStatus.textContent = text;
  elements.authStatus.className = `status-pill ${kind}`;
}

function isPlaceholder(value) {
  return !value || /YOUR_/i.test(value);
}

function validateAppConfig() {
  const missing = [];

  if (isPlaceholder(APP_CONFIG.clientId)) missing.push('clientId');
  if (isPlaceholder(APP_CONFIG.environment)) missing.push('environment');
  if (isPlaceholder(APP_CONFIG.redirectUri)) missing.push('redirectUri');

  if (missing.length > 0) {
    logError(`Update config.js before using the app. Missing or placeholder values: ${missing.join(', ')}`);
    return false;
  }

  return true;
}

function populateCountries() {
  const entries = Object.entries(COUNTRY_CONFIG);
  for (const [code, value] of entries) {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = value.configured ? `${code} - ${value.label}` : `${code} - ${value.label} (not configured yet)`;
    option.disabled = !value.configured;
    elements.country.appendChild(option);
  }
}

function base64UrlEncode(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomString(byteLength = 64) {
  const bytes = new Uint8Array(byteLength);
  window.crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes.buffer);
}

async function sha256(value) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  return window.crypto.subtle.digest('SHA-256', data);
}

async function buildCodeChallenge(verifier) {
  const digest = await sha256(verifier);
  return base64UrlEncode(digest);
}

function getStoredToken() {
  const accessToken = sessionStorage.getItem(STORAGE_KEYS.token);
  const tokenType = sessionStorage.getItem(STORAGE_KEYS.tokenType) || 'Bearer';
  const expiresAt = Number(sessionStorage.getItem(STORAGE_KEYS.expiresAt) || 0);

  if (!accessToken || !expiresAt) return null;
  if (Date.now() >= expiresAt) {
    clearStoredToken();
    return null;
  }

  return { accessToken, tokenType, expiresAt };
}

function storeToken(tokenData) {
  const accessToken = tokenData.access_token;
  const tokenType = tokenData.token_type || 'Bearer';
  const expiresIn = Number(tokenData.expires_in || 0);
  const expiresAt = Date.now() + Math.max(expiresIn - 60, 30) * 1000;

  sessionStorage.setItem(STORAGE_KEYS.token, accessToken);
  sessionStorage.setItem(STORAGE_KEYS.tokenType, tokenType);
  sessionStorage.setItem(STORAGE_KEYS.expiresAt, String(expiresAt));
}

function clearStoredToken() {
  sessionStorage.removeItem(STORAGE_KEYS.token);
  sessionStorage.removeItem(STORAGE_KEYS.tokenType);
  sessionStorage.removeItem(STORAGE_KEYS.expiresAt);
}

function clearPkceState() {
  sessionStorage.removeItem(STORAGE_KEYS.pkceVerifier);
  sessionStorage.removeItem(STORAGE_KEYS.oauthState);
}

function getAuthorizationHeaders() {
  const token = getStoredToken();
  if (!token) {
    throw new Error('No valid access token found. Please sign in again.');
  }

  return {
    Authorization: `${token.tokenType} ${token.accessToken}`,
    Accept: 'application/json'
  };
}

async function startLogin() {
  if (!validateAppConfig()) return;

  const verifier = randomString(64);
  const state = randomString(24);
  const challenge = await buildCodeChallenge(verifier);

  sessionStorage.setItem(STORAGE_KEYS.pkceVerifier, verifier);
  sessionStorage.setItem(STORAGE_KEYS.oauthState, state);

  const url = new URL(`https://login.${APP_CONFIG.environment}/oauth/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', APP_CONFIG.clientId);
  url.searchParams.set('redirect_uri', APP_CONFIG.redirectUri);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);

  if (Array.isArray(APP_CONFIG.scopes) && APP_CONFIG.scopes.length > 0) {
    url.searchParams.set('scope', APP_CONFIG.scopes.join(' '));
  }

  window.location.assign(url.toString());
}

async function exchangeCodeForToken(code) {
  const verifier = sessionStorage.getItem(STORAGE_KEYS.pkceVerifier);
  if (!verifier) {
    throw new Error('Missing PKCE code verifier in session storage. Start sign in again.');
  }

  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('client_id', APP_CONFIG.clientId);
  body.set('code_verifier', verifier);
  body.set('code', code);
  body.set('redirect_uri', APP_CONFIG.redirectUri);

  const response = await fetch(`https://login.${APP_CONFIG.environment}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  const raw = await response.text();
  let data;

  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = { message: raw };
  }

  if (!response.ok) {
    const description = data.error_description || data.message || response.statusText;
    throw new Error(`Token exchange failed (${response.status}): ${description}`);
  }

  storeToken(data);
  clearPkceState();
}

async function handleOAuthCallback() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  if (!code && !error) {
    refreshAuthState();
    return;
  }

  clearOutput();
  setBusy(true);

  try {
    if (error) {
      throw new Error(`${error}${errorDescription ? `: ${errorDescription}` : ''}`);
    }

    const expectedState = sessionStorage.getItem(STORAGE_KEYS.oauthState);
    if (!expectedState || expectedState !== returnedState) {
      throw new Error('OAuth state validation failed. Start sign in again.');
    }

    logInfo('Completing browser authentication...');
    await exchangeCodeForToken(code);
    logSuccess('Signed in successfully.');
  } catch (err) {
    clearStoredToken();
    clearPkceState();
    logError(err.message || String(err));
  } finally {
    history.replaceState({}, document.title, APP_CONFIG.redirectUri);
    refreshAuthState();
    setBusy(false);
  }
}

function refreshAuthState() {
  const token = getStoredToken();
  if (token) {
    const remainingSeconds = Math.max(0, Math.floor((token.expiresAt - Date.now()) / 1000));
    setAuthStatus(`Signed in (${remainingSeconds}s left)`, 'status-ok');
  } else {
    setAuthStatus('Not signed in', 'status-idle');
  }
}

function signOut() {
  clearStoredToken();
  clearPkceState();
  refreshAuthState();
  logInfo('Signed out.');
}

async function apiGet(path, query = {}) {
  const url = new URL(`https://api.${APP_CONFIG.environment}${path}`);

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: getAuthorizationHeaders()
  });

  const raw = await response.text();
  let data;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    data,
    raw
  };
}

function isEnabled(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return ['true', 'yes', 'on', '1', 'y'].includes(normalized);
  }
  return false;
}

function asTrimmedString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function exactEntityByName(entities, name) {
  const target = asTrimmedString(name);
  return (entities || []).find((entity) => asTrimmedString(entity?.name) === target) || null;
}

async function getDatatableRow(datatableId, rowKey, label) {
  const response = await apiGet(`/api/v2/flows/datatables/${datatableId}/rows/${encodeURIComponent(rowKey)}`, {
    showbrief: 'false'
  });

  if (!response.ok) {
    if (response.status === 404) {
      logError(`${label} row not found for service: ${rowKey}`);
    } else {
      logError(`${label} request failed (${response.status}): ${response.raw || response.statusText}`);
    }
    return null;
  }

  logSuccess(`${label} row loaded.`);
  return response.data;
}

async function validateNamedEntity({ label, path, name }) {
  const value = asTrimmedString(name);
  if (!value) {
    logError(`${label} empty!`);
    return false;
  }

  const response = await apiGet(path, { name: value });
  if (!response.ok) {
    logError(`Error ${label} request endpoint (${response.status}).`);
    return false;
  }

  const data = response.data || {};
  const total = Number(data.total || 0);
  const entities = Array.isArray(data.entities) ? data.entities : [];
  const exactMatch = exactEntityByName(entities, value);

  if (total < 1 || !exactMatch) {
    logError(`${label} doesn't exist: ${value}. Please correct before continuing.`);
    return false;
  }

  logSuccess(`${label} OK`);
  return true;
}

async function validatePrompt(promptName, label, expectedLanguage, options = {}) {
  const value = asTrimmedString(promptName);
  const required = Boolean(options.required);
  const emptyMessage = options.emptyMessage || `${label} empty!`;

  if (!value) {
    if (required) {
      logError(emptyMessage);
      return false;
    }

    logWarning(emptyMessage);
    return true;
  }

  const response = await apiGet('/api/v2/architect/prompts', { name: value });
  if (!response.ok) {
    logError(`Error ${label} request endpoint (${response.status}).`);
    return false;
  }

  const data = response.data || {};
  const entities = Array.isArray(data.entities) ? data.entities : [];
  const promptEntity = exactEntityByName(entities, value);

  if (!promptEntity) {
    logError(`${label} doesn't exist: ${value}. Please correct before continuing.`);
    return false;
  }

  const languages = (promptEntity.resources || []).map((resource) => asTrimmedString(resource.language).toLowerCase());
  if (!languages.includes(asTrimmedString(expectedLanguage).toLowerCase())) {
    logError(`${label} exists but does not have audio in the correct language (${expectedLanguage}): ${value}.`);
    return false;
  }

  logSuccess(`${label} OK`);
  return true;
}

function validateAction(label, action, { required = false } = {}) {
  const value = asTrimmedString(action);
  if (!value) {
    if (required) {
      logError(`${label} empty!`);
      return false;
    }

    logWarning(`${label} empty!`);
    return true;
  }

  if (!VOICE_ACTIONS.includes(value)) {
    logError(`${label} wrong spelling: ${value}`);
    return false;
  }

  logSuccess(`${label} OK`);
  return true;
}

async function validateDestination(label, action, destination, datatableIdConfig) {
  const normalizedAction = asTrimmedString(action);
  const normalizedDestination = asTrimmedString(destination);

  if (!normalizedDestination) {
    logWarning(`${label} destination is empty.`);
    return false;
  }

  if (normalizedAction === 'Transfer_service') {
    const response = await apiGet(`/api/v2/flows/datatables/${datatableIdConfig}/rows/${encodeURIComponent(normalizedDestination)}`, {
      showbrief: 'false'
    });

    if (response.ok) {
      logSuccess(`${label} destination is a service and it seems OK`);
      return true;
    }

    logError(`${label} destination service not found: ${normalizedDestination}`);
    return false;
  }

  if (normalizedAction === 'Transfer_flow') {
    const response = await apiGet(`/api/v2/flows/${encodeURIComponent(normalizedDestination)}`);

    if (response.ok) {
      logSuccess(`${label} destination is a flow and it seems OK`);
      return true;
    }

    logError(`${label} destination flow not found: ${normalizedDestination}`);
    return false;
  }

  logInfo(`${label} destination is not auto-validated for action ${normalizedAction}. Verify it manually if it should be a number or external target.`);
  return true;
}

function extractValues(config, routing) {
  return {
    msg: config['Msg'],
    inqueueMsg1: routing['InQueue Msg 1'],
    inqueueMsg2: routing['InQueue Msg 2'],
    inqueueMsg3: routing['InQueue Msg 3'],
    gdprMsg: config['GDPR Msg'],
    gdprMsgExtended: config['GDPR Msg extended'],
    msgTransfer: config['Msg Transfer'],
    msgAgent: config['Msg Agent'],
    timeoutMusic1: routing['Timeout Music 1'],
    timeoutMusic2: routing['Timeout Music 2'],
    timeoutMusic3: routing['Timeout Music 3'],
    survey: config['Survey'],
    surveyName: config['Survey name'],
    skill: config['Skill'],
    queue: config['Queue'],
    inqueueMusic: routing['InQueue Music'],
    gdpr: config['GDPR'],
    overflowFullqueueAction: routing['Overflow FullQueue Action'],
    overflowWaitingtimeSecs: routing['Overflow WaitingTime secs'],
    overflowNoagentsDestination: routing['Overflow NoAgents Destination'],
    holidaysMsg: config['Holidays Msg'],
    overflowFullqueueMsg: routing['Overflow FullQueue Msg'],
    holidaysDestination: config['Holidays Destination'],
    overflowWaitingtimeDestination: routing['Overflow WaitingTime Destination'],
    overflowFullqueueMaxcalls: routing['Overflow FullQueue MaxCalls'],
    emgcyMsg: config['Emgcy Msg'],
    scheduleGroup: config['Schedule Group'],
    overflowFullqueueDestination: routing['Overflow FullQueue Destination'],
    emgcyAction: config['Emgcy Action'],
    abandonCallback: config['Abandon Callback'],
    overflowFullqueue: routing['Overflow FullQueue'],
    overflowNoagentsAction: routing['Overflow NoAgents Action'],
    holidaysAction: config['Holidays Action'],
    overflowNoidleagentsDestination: routing['Overflow NoIdleAgents Destination'],
    overflowNoidleagentsMsg: routing['Overflow NoIdleAgents Msg'],
    overflowEwtAction: routing['Overflow EWT Action'],
    overflowWaitingtime: routing['Overflow WaitingTime'],
    closedMsg: config['Closed Msg'],
    closedAction: config['Closed Action'],
    overflowEwtDestination: routing['Overflow EWT Destination'],
    overflowNoidleagents: routing['Overflow NoIdleAgents'],
    emgcyDestination: config['Emgcy Destination'],
    closedDestination: config['Closed Destination'],
    overflowEwtMsg: routing['Overflow EWT Msg'],
    overflowEwt: routing['Overflow EWT'],
    emgcy: config['Emgcy'],
    overflowNoagentsMsg: routing['Overflow NoAgents Msg'],
    overflowWaitingtimeMsg: routing['Overflow WaitingTime Msg'],
    overflowEwtSecs: routing['Overflow EWT Secs'],
    overflowNoidleagentsAction: routing['Overflow NoIdleAgents Action'],
    overflowWaitingtimeAction: routing['Overflow WaitingTime Action'],
    overflowNoagents: routing['Overflow NoAgents'],
    recording: config['Recording'],
    recordingMsg: config['Recording Msg'],
    recordingMenu: config['Recording Menu'],
    recordingMenuMsg: config['Recording Menu Msg'],
    recordingOptOut: config['Recording OptOut'],
    recordingOptOutMsg: config['Recording OptOut Msg'],
    recordingPercentage: config['Recording percentage'],
    playEwt: config['Play EWT'],
    playEwtThreshold: config['Play EWT Threshold'],
    callbackMsg: config['Callback Msg']
  };
}

async function runServiceCheck(countryCode, serviceId) {
  clearOutput();
  updateSummary('Running checks...');
  setBusy(true);
  refreshAuthState();

  try {
    const selectedCountry = COUNTRY_CONFIG[countryCode];
    if (!selectedCountry || !selectedCountry.configured) {
      logError(`Country ${countryCode} is not configured in the web app yet.`);
      updateSummary('Stopped: country not configured.');
      return;
    }

    logInfo(`Starting check for ${countryCode} / ${serviceId}`);
    logInfo(`Environment: ${APP_CONFIG.environment}`);

    const configRow = await getDatatableRow(selectedCountry.datatableIdConfig, serviceId, 'Datatable Service Config');
    if (!configRow) {
      updateSummary('Stopped: service config row was not found.');
      return;
    }

    const routingRow = await getDatatableRow(selectedCountry.datatableIdRouting, serviceId, 'Datatable Service Routing');
    if (!routingRow) {
      updateSummary('Stopped: service routing row was not found.');
      return;
    }

    const values = extractValues(configRow, routingRow);
    const lang = selectedCountry.langAudio;

    await validateNamedEntity({
      label: 'Queue',
      path: '/api/v2/routing/queues',
      name: values.queue
    });

    await validateNamedEntity({
      label: 'Skill',
      path: '/api/v2/routing/skills',
      name: values.skill
    });

    await validatePrompt(values.msg, 'Welcome prompt', lang, {
      required: false,
      emptyMessage: 'Warning: Welcome message empty!'
    });

    await validateNamedEntity({
      label: 'Schedule group',
      path: '/api/v2/architect/schedulegroups',
      name: values.scheduleGroup
    });

    validateAction('Closed action', values.closedAction);
    validateAction('Holiday action', values.holidaysAction);

    await validatePrompt(values.closedMsg, 'Closed prompt', lang, {
      required: false,
      emptyMessage: 'Warning: closed_msg empty!'
    });

    await validatePrompt(values.holidaysMsg, 'Holidays prompt', lang, {
      required: false,
      emptyMessage: 'Warning: holidays_msg empty!'
    });

    if (isEnabled(values.emgcy)) {
      logInfo('Emergency flow is enabled.');
      const emgcyActionOk = validateAction('Emergency action', values.emgcyAction, { required: true });
      await validatePrompt(values.emgcyMsg, 'Emergency prompt', lang, {
        required: false,
        emptyMessage: 'Warning: emgcy_msg empty!'
      });
      if (emgcyActionOk) {
        await validateDestination('Emergency', values.emgcyAction, values.emgcyDestination, selectedCountry.datatableIdConfig);
      }
    } else {
      logWarning('Emergency flow disabled.');
    }

    if (isEnabled(values.gdpr)) {
      logInfo('GDPR is enabled.');
      const gdprOk = await validatePrompt(values.gdprMsg, 'GDPR prompt', lang, {
        required: true,
        emptyMessage: 'GDPR enabled and GDPR message not configured!'
      });
      if (gdprOk) {
        await validatePrompt(values.gdprMsgExtended, 'GDPR extended prompt', lang, {
          required: true,
          emptyMessage: 'GDPR extended prompt missing!'
        });
      }
    } else {
      logWarning('GDPR disabled!');
    }

    if (isEnabled(values.recording)) {
      logInfo('Recording is enabled.');
      await validatePrompt(values.recordingMsg, 'Recording message prompt', lang, {
        required: false,
        emptyMessage: 'Warning: Recording message empty!'
      });

      if (isEnabled(values.recordingMenu)) {
        await validatePrompt(values.recordingMenuMsg, 'Recording menu prompt', lang, {
          required: true,
          emptyMessage: 'Recording menu is enabled and Recording_Menu_Msg is empty!'
        });
      }

      if (isEnabled(values.recordingOptOut)) {
        await validatePrompt(values.recordingOptOutMsg, 'Recording opt-out prompt', lang, {
          required: true,
          emptyMessage: 'Recording opt-out is enabled and Recording_OptOut_Msg is empty!'
        });
      }

      if (toNumber(values.recordingPercentage) > 0) {
        logSuccess(`Recording percentage is: ${values.recordingPercentage}`);
      } else {
        logWarning('Warning: Recording percentage is 0');
      }
    } else {
      logWarning('Recording disabled!');
    }

    await validatePrompt(values.callbackMsg, 'Callback prompt', lang, {
      required: false,
      emptyMessage: 'Warning: Callback_Msg empty!'
    });

    await validatePrompt(values.inqueueMusic, 'In-queue music prompt', lang, {
      required: false,
      emptyMessage: 'Warning: inqueue music empty!'
    });

    if (toNumber(values.timeoutMusic2) > 0) {
      await validatePrompt(values.inqueueMsg2, 'In-queue message 2 prompt', lang, {
        required: false,
        emptyMessage: 'Warning: inqueue_msg_2 empty while Timeout Music 2 is greater than 0!'
      });

      await validatePrompt(values.inqueueMsg3, 'In-queue message 3 prompt', lang, {
        required: false,
        emptyMessage: 'Warning: inqueue_msg_3 empty while Timeout Music 2 is greater than 0!'
      });
    } else {
      logInfo('Timeout Music 2 is 0 or empty, so inqueue_msg_2 and inqueue_msg_3 were not required.');
    }

    if (isEnabled(values.overflowNoagents)) {
      logInfo('Overflow no-agents rule is enabled.');
      const actionOk = validateAction('Overflow NoAgents action', values.overflowNoagentsAction, { required: true });
      await validatePrompt(values.overflowNoagentsMsg, 'Overflow NoAgents prompt', lang, {
        required: false,
        emptyMessage: 'Warning: overflow_noagents_msg empty!'
      });
      if (actionOk) {
        await validateDestination('Overflow NoAgents', values.overflowNoagentsAction, values.overflowNoagentsDestination, selectedCountry.datatableIdConfig);
      }
    }

    if (isEnabled(values.overflowNoidleagents)) {
      logInfo('Overflow no-idle-agents rule is enabled.');
      const actionOk = validateAction('Overflow NoIdleAgents action', values.overflowNoidleagentsAction, { required: true });
      await validatePrompt(values.overflowNoidleagentsMsg, 'Overflow NoIdleAgents prompt', lang, {
        required: false,
        emptyMessage: 'Warning: overflow_noidleagents_msg empty!'
      });
      if (actionOk) {
        await validateDestination('Overflow NoIdleAgents', values.overflowNoidleagentsAction, values.overflowNoidleagentsDestination, selectedCountry.datatableIdConfig);
      }
    }

    if (isEnabled(values.overflowFullqueue)) {
      logInfo('Overflow full-queue rule is enabled.');
      const actionOk = validateAction('Overflow FullQueue action', values.overflowFullqueueAction, { required: true });
      await validatePrompt(values.overflowFullqueueMsg, 'Overflow FullQueue prompt', lang, {
        required: false,
        emptyMessage: 'Warning: overflow_fullqueue_msg empty!'
      });
      if (actionOk) {
        await validateDestination('Overflow FullQueue', values.overflowFullqueueAction, values.overflowFullqueueDestination, selectedCountry.datatableIdConfig);
      }
    }

    if (isEnabled(values.overflowEwt)) {
      logInfo('Overflow EWT rule is enabled.');
      const actionOk = validateAction('Overflow EWT action', values.overflowEwtAction, { required: true });
      await validatePrompt(values.overflowEwtMsg, 'Overflow EWT prompt', lang, {
        required: false,
        emptyMessage: 'Warning: overflow_ewt_msg empty!'
      });
      if (actionOk) {
        await validateDestination('Overflow EWT', values.overflowEwtAction, values.overflowEwtDestination, selectedCountry.datatableIdConfig);
      }
    }

    if (isEnabled(values.overflowWaitingtime)) {
      logInfo('Overflow waiting-time rule is enabled.');
      const actionOk = validateAction('Overflow WaitingTime action', values.overflowWaitingtimeAction, { required: true });
      await validatePrompt(values.overflowWaitingtimeMsg, 'Overflow WaitingTime prompt', lang, {
        required: false,
        emptyMessage: 'Warning: overflow_waitingtime_msg empty!'
      });
      if (actionOk) {
        await validateDestination('Overflow WaitingTime', values.overflowWaitingtimeAction, values.overflowWaitingtimeDestination, selectedCountry.datatableIdConfig);
      }
    }

    logInfo('Check completed.');
    updateSummary(`Finished with ${counters.errors} error(s) and ${counters.warnings} warning(s).`);
  } catch (err) {
    logError(err.message || String(err));
    updateSummary(`Stopped with ${counters.errors} error(s) and ${counters.warnings} warning(s).`);
  } finally {
    refreshAuthState();
    setBusy(false);
  }
}

async function ensureAuthenticated() {
  if (!validateAppConfig()) return false;

  const token = getStoredToken();
  if (token) {
    refreshAuthState();
    return true;
  }

  logInfo('No valid browser session found. Redirecting to Genesys Cloud sign-in...');
  await startLogin();
  return false;
}

function bindEvents() {
  elements.loginBtn.addEventListener('click', async () => {
    clearOutput();
    logInfo('Starting sign-in...');
    await startLogin();
  });

  elements.logoutBtn.addEventListener('click', () => {
    signOut();
  });

  elements.clearBtn.addEventListener('click', () => {
    clearOutput();
  });

  elements.checkerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const countryCode = asTrimmedString(elements.country.value);
    const serviceId = asTrimmedString(elements.service.value);

    if (!countryCode) {
      clearOutput();
      logError('Select a country first.');
      return;
    }

    if (!serviceId) {
      clearOutput();
      logError('Enter a service first.');
      return;
    }

    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) return;

    await runServiceCheck(countryCode, serviceId);
  });
}

async function init() {
  populateCountries();
  bindEvents();
  refreshAuthState();
  await handleOAuthCallback();
}

init().catch((err) => {
  clearOutput();
  logError(err.message || String(err));
  refreshAuthState();
});
