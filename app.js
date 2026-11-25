const APP_CONFIG = window.APP_CONFIG || {};

const STORAGE_KEYS = {
  token: 'genesysChecker.token',
  tokenType: 'genesysChecker.tokenType',
  expiresAt: 'genesysChecker.expiresAt',
  pkceVerifier: 'genesysChecker.pkceVerifier',
  oauthState: 'genesysChecker.oauthState',
  // Only kept while the browser is redirected to Genesys Cloud and back.
  clientId: 'genesysChecker.clientId'
};

const CLIENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VOICE_ACTIONS = [
  'Continue',
  'Disconnect',
  'Transfer_flow',
  'Transfer_service',
  'Callback',
  'BPO',
  'Transfer_number'
];

const DNIS_ACTIONS = [
  'Transfer_number',
  'Transfer_service',
  'Transfer_flow',
  'BPO',
  'Callback',
  'Disconnect'
];

const COUNTRY_CONFIG = {
  PRT: {
    label: 'Portugal',
    configured: true,
    datatableIdConfig: 'bbbd340f-4556-42ac-8bbe-b414a5f9dfd6',
    datatableIdRouting: 'eac10d92-b18c-4c0d-adee-d54e49f6b432',
    langAudio: 'pt-pt'
  },
  ESP: {
    label: 'Spain',
    configured: true,
    datatableIdConfig: '2cd844ac-7547-40f6-b27a-58c252eba625',
    datatableIdRouting: '28b9b648-34cb-4a6b-966c-aa2f5cec4c83',
    langAudio: 'es-es'
  },
  FRA: {
    label: 'France',
    configured: true,
    datatableIdConfig: '33802a90-3935-4a8e-a808-6a0ac770ee54',
    datatableIdRouting: 'd9437318-9897-465a-a617-f9111557df22',
    langAudio: 'fr-fr'
  },
  ITA: { label: 'Italy', 
        configured: true,
 datatableIdConfig: '29d7f750-8857-4c29-b845-3fcafd459a8a',
    datatableIdRouting: '131a869e-b378-4677-a083-8681c212e163',
    langAudio: 'it-it'
       },
  GBR: { label: 'United Kingdom', configured: false },
  IRL: { label: 'Ireland', configured: false },
  BRA: {
    label: 'Brazil',
    configured: true,
    datatableIdConfig: '0e2e4e1a-8919-42b3-9ee2-27757f626541',
    datatableIdRouting: 'fa028c5a-13b8-4041-a3cc-426dc876af8b',
    langAudio: 'pt-br'
  },
  ARG: { label: 'Argentina', configured: false },
  PER: { label: 'Peru', configured: false },
  CHL: { label: 'Chile', configured: false },
  MEX: { 
    label: 'Mexico',
    configured: true,
    datatableIdConfig: '5e36ee83-253f-4495-9e39-d3671e3f72d9',
    datatableIdRouting: '8ed36ead-e5b8-4a28-ace6-9dd500b3e050',
    langAudio: 'es-mx'
       },
  TST: { label: 'Test',
        configured: false
       }
};

const elements = {
  authStatus: document.getElementById('authStatus'),
  loginDialog: document.getElementById('loginDialog'),
  loginForm: document.getElementById('loginForm'),
  clientIdInput: document.getElementById('clientIdInput'),
  clientIdError: document.getElementById('clientIdError'),
  cancelLoginBtn: document.getElementById('cancelLoginBtn'),
  loginEnv: document.getElementById('loginEnv'),
  loginRedirect: document.getElementById('loginRedirect'),
  countOk: document.getElementById('countOk'),
  countWarn: document.getElementById('countWarn'),
  countErr: document.getElementById('countErr'),
  copyBtn: document.getElementById('copyBtn'),
  issuesOnly: document.getElementById('issuesOnly'),
  loginBtn: document.getElementById('loginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  clearBtn: document.getElementById('clearBtn'),
  groupMembersForm: document.getElementById('groupMembersForm'),
  groupSelect: document.getElementById('groupSelect'),
  groupFilter: document.getElementById('groupFilter'),
  groupsStatus: document.getElementById('groupsStatus'),
  reloadGroupsBtn: document.getElementById('reloadGroupsBtn'),
  groupMembersFile: document.getElementById('groupMembersFile'),
  runGroupMembersBtn: document.getElementById('runGroupMembersBtn'),
  dnisForm: document.getElementById('dnisForm'),
  dnisCountry: document.getElementById('dnisCountry'),
  dnisNumber: document.getElementById('dnisNumber'),
  runDnisBtn: document.getElementById('runDnisBtn'),
  checkerForm: document.getElementById('checkerForm'),
  country: document.getElementById('country'),
  service: document.getElementById('service'),
  runBtn: document.getElementById('runBtn'),
  output: document.getElementById('output'),
  summary: document.getElementById('summary'),
  csvForm: document.getElementById('csvForm'),
  csvFile: document.getElementById('csvFile'),
  runCsvBtn: document.getElementById('runCsvBtn'),
  scheduleCsvForm: document.getElementById('scheduleCsvForm'),
  scheduleCsvFile: document.getElementById('scheduleCsvFile'),
  runScheduleCsvBtn: document.getElementById('runScheduleCsvBtn'),
  ExternalContactCsvForm: document.getElementById('ExternalContactCsvForm'),
  ExternalContactCsvFile: document.getElementById('ExternalContactCsvFile'),
  runExternalContactCsvBtn: document.getElementById('runExternalContactCsvBtn'),
  cannedForm: document.getElementById('cannedForm'),
  cannedFile: document.getElementById('cannedFile'),
  cannedReplaceQuestion: document.getElementById('cannedReplaceQuestion'),
  runCannedBtn: document.getElementById('runCannedBtn'),
  utilizationForm: document.getElementById('utilizationForm'),
  utilChannels: document.getElementById('utilChannels'),
  utilJson: document.getElementById('utilJson'),
  utilError: document.getElementById('utilError'),
  resetUtilBtn: document.getElementById('resetUtilBtn'),
  utilizationFile: document.getElementById('utilizationFile'),
  runUtilizationBtn: document.getElementById('runUtilizationBtn'),
  roleAssignForm: document.getElementById('roleAssignForm'),
  divisionSelect: document.getElementById('divisionSelect'),
  divisionFilter: document.getElementById('divisionFilter'),
  divisionsStatus: document.getElementById('divisionsStatus'),
  reloadDivisionsBtn: document.getElementById('reloadDivisionsBtn'),
  roleSelect: document.getElementById('roleSelect'),
  roleFilter: document.getElementById('roleFilter'),
  rolesStatus: document.getElementById('rolesStatus'),
  reloadRolesBtn: document.getElementById('reloadRolesBtn'),
  rolesEmailsFile: document.getElementById('rolesEmailsFile'),
  runRoleAssignBtn: document.getElementById('runRoleAssignBtn')
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTabs);
} else {
  initTabs();
}

const counters = {
  errors: 0,
  warnings: 0,
  success: 0
};

const LOG_ICONS = { info: 'i', success: '\u2713', warning: '!', error: '\u2715' };
const LOG_LABELS = { info: 'Info', success: 'OK', warning: 'Warning', error: 'Error' };

function nowText() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function renderCounters() {
  const items = [
    [elements.countOk, counters.success],
    [elements.countWarn, counters.warnings],
    [elements.countErr, counters.errors]
  ];

  for (const [element, value] of items) {
    if (!element) continue;
    element.textContent = String(value);
    element.parentElement.classList.toggle('has-value', value > 0);

    const label = element.nextElementSibling;
    if (label && label.dataset.one) {
      label.textContent = value === 1 ? label.dataset.one : label.dataset.many;
    }
  }
}

function appendLog(message, level = 'info') {
  if (level === 'error') counters.errors += 1;
  if (level === 'warning') counters.warnings += 1;
  if (level === 'success') counters.success += 1;
  renderCounters();

  const time = nowText();
  const line = document.createElement('div');
  line.className = `log-line log-${level}`;
  line.dataset.plain = `[${time}] ${(LOG_LABELS[level] || level).toUpperCase()}: ${message}`;

  const timeEl = document.createElement('span');
  timeEl.className = 'log-time';
  timeEl.textContent = time;

  const icon = document.createElement('span');
  icon.className = 'log-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = LOG_ICONS[level] || LOG_ICONS.info;

  const label = document.createElement('span');
  label.className = 'sr-only';
  label.textContent = `${LOG_LABELS[level] || level}: `;

  const text = document.createElement('span');
  text.className = 'log-msg';
  text.textContent = message;

  line.append(timeEl, icon, label, text);
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
  counters.success = 0;
  renderCounters();
  elements.summary.textContent = '';
}

async function copyOutput() {
  const lines = Array.from(elements.output.querySelectorAll('.log-line')).map((line) => line.dataset.plain || line.textContent);
  if (!lines.length) return;

  const original = elements.copyBtn.textContent;
  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    elements.copyBtn.textContent = 'Copied';
  } catch {
    elements.copyBtn.textContent = 'Copy failed';
  }
  setTimeout(() => {
    elements.copyBtn.textContent = original;
  }, 1500);
}

function updateSummary(text = '') {
  elements.summary.textContent = text;
}

function setBusy(isBusy) {
  [
    elements.loginBtn,
    elements.logoutBtn,
    elements.runBtn,
    elements.clearBtn,
    elements.country,
    elements.service,
    elements.dnisCountry,
    elements.dnisNumber,
    elements.runDnisBtn,
    elements.csvFile,
    elements.runCsvBtn,
    elements.scheduleCsvFile,
    elements.ExternalContactCsvFile,
    elements.runScheduleCsvBtn,
    elements.runExternalContactCsvBtn,
    elements.cannedFile,
    elements.cannedReplaceQuestion,
    elements.runCannedBtn,
    elements.utilChannels,
    elements.utilJson,
    elements.resetUtilBtn,
    elements.utilizationFile,
    elements.runUtilizationBtn,
    elements.divisionSelect,
    elements.divisionFilter,
    elements.reloadDivisionsBtn,
    elements.roleSelect,
    elements.roleFilter,
    elements.reloadRolesBtn,
    elements.rolesEmailsFile,
    elements.runRoleAssignBtn,
    elements.groupSelect,
    elements.groupFilter,
    elements.reloadGroupsBtn,
    elements.groupMembersFile,
    elements.runGroupMembersBtn
  ]
    .filter(Boolean)
    .forEach((element) => {
      element.disabled = isBusy;
    });
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

    // DNIS lookup only needs the country code ({code}_V_DNIS), so every country is selectable.
    // A Transfer_service result for a country without service datatables stops with a clear message.
    const dnisOption = document.createElement('option');
    dnisOption.value = code;
    dnisOption.textContent = `${code} - ${value.label}`;
    elements.dnisCountry.appendChild(dnisOption);
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
  sessionStorage.removeItem(STORAGE_KEYS.clientId);
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

async function startLogin(clientId) {
  if (!validateAppConfig()) return;

  const cleanClientId = asTrimmedString(clientId);
  if (!CLIENT_ID_PATTERN.test(cleanClientId)) {
    throw new Error('Enter a valid Client ID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).');
  }

  const verifier = randomString(64);
  const state = randomString(24);
  const challenge = await buildCodeChallenge(verifier);

  sessionStorage.setItem(STORAGE_KEYS.pkceVerifier, verifier);
  sessionStorage.setItem(STORAGE_KEYS.oauthState, state);
  sessionStorage.setItem(STORAGE_KEYS.clientId, cleanClientId);

  const url = new URL(`https://login.${APP_CONFIG.environment}/oauth/authorize`);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', cleanClientId);
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

  const clientId = sessionStorage.getItem(STORAGE_KEYS.clientId);
  if (!clientId) {
    throw new Error('Missing Client ID in session storage. Start sign in again.');
  }

  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('client_id', clientId);
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

function openLoginDialog() {
  if (!validateAppConfig()) return;

  if (elements.loginEnv) elements.loginEnv.textContent = APP_CONFIG.environment;
  if (elements.loginRedirect) elements.loginRedirect.textContent = APP_CONFIG.redirectUri;
  setClientIdError('');
  elements.clientIdInput.value = '';

  if (typeof elements.loginDialog.showModal === 'function') {
    if (!elements.loginDialog.open) elements.loginDialog.showModal();
  } else {
    elements.loginDialog.setAttribute('open', '');
  }
  elements.clientIdInput.focus();
}

function closeLoginDialog() {
  elements.clientIdInput.value = '';
  if (typeof elements.loginDialog.close === 'function') {
    elements.loginDialog.close();
  } else {
    elements.loginDialog.removeAttribute('open');
  }
}

function setClientIdError(message) {
  elements.clientIdError.textContent = message;
  elements.clientIdError.hidden = !message;
  elements.clientIdInput.setAttribute('aria-invalid', message ? 'true' : 'false');
}

async function submitLoginDialog(event) {
  event.preventDefault();

  const clientId = asTrimmedString(elements.clientIdInput.value);
  if (!clientId) {
    setClientIdError('Enter the Client ID of your Genesys Cloud OAuth client.');
    return;
  }
  if (!CLIENT_ID_PATTERN.test(clientId)) {
    setClientIdError('That does not look like a Client ID. It should be a UUID, like the example shown.');
    return;
  }

  setClientIdError('');
  try {
    await startLogin(clientId);
  } catch (err) {
    setClientIdError(err.message || String(err));
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
  resetPickers();
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

async function apiSend(method, path, body) {
  const url = `https://api.${APP_CONFIG.environment}${path}`;

  const response = await fetch(url, {
    method,
    headers: {
      ...getAuthorizationHeaders(),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
    },
    body: body === undefined ? undefined : JSON.stringify(body)
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

async function apiPost(path, body) {
  return apiSend('POST', path, body);
}

async function apiPatch(path, body) {
  return apiSend('PATCH', path, body);
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

async function getDatatableRow(datatableId, rowKey, label, keyLabel = 'service') {
  const response = await apiGet(`/api/v2/flows/datatables/${datatableId}/rows/${encodeURIComponent(rowKey)}`, {
    showbrief: 'false'
  });

  if (!response.ok) {
    if (response.status === 404) {
      logError(`${label} row not found for ${keyLabel}: ${rowKey}`);
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

  logSuccess(`${label} ${name} OK`);
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

  logSuccess(`${label} ${promptName} OK`);
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

  logSuccess(`${label} ${action} OK`);
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

async function runServiceCheck(countryCode, serviceId, { keepOutput = false } = {}) {
  if (!keepOutput) clearOutput();
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

function getRowField(row, columnName) {
  if (!row || typeof row !== 'object') return undefined;
  const target = columnName.toLowerCase();
  const key = Object.keys(row).find((candidate) => candidate.toLowerCase() === target);
  return key === undefined ? undefined : row[key];
}

async function findDatatableByName(tableName) {
  const response = await apiGet('/api/v2/flows/datatables', { name: tableName, pageSize: 100 });
  if (!response.ok) {
    logError(`Datatable lookup failed (${response.status}): ${response.raw || response.statusText}`);
    return null;
  }

  const entities = Array.isArray(response.data?.entities) ? response.data.entities : [];
  const match = exactEntityByName(entities, tableName);
  if (!match) {
    logError(`Datatable ${tableName} doesn't exist.`);
    return null;
  }

  logSuccess(`Datatable ${tableName} found.`);
  return match;
}

async function validateFlowByName(flowName) {
  const value = asTrimmedString(flowName);
  if (!value) {
    logError('Flow name empty!');
    return false;
  }

  const response = await apiGet('/api/v2/flows', { name: value, pageSize: 100 });
  if (!response.ok) {
    logError(`Error Flow request endpoint (${response.status}).`);
    return false;
  }

  const entities = Array.isArray(response.data?.entities) ? response.data.entities : [];
  const exact = exactEntityByName(entities, value);
  if (exact) {
    const type = exact.type ? ` (${exact.type})` : '';
    logSuccess(`Flow ${value}${type} exists in Architect.`);
    return true;
  }

  const sameIgnoringCase = entities.find((entity) => asTrimmedString(entity?.name).toLowerCase() === value.toLowerCase());
  if (sameIgnoringCase) {
    logError(`Flow name differs only in letter case. Found: ${sameIgnoringCase.name} / Expected: ${value}.`);
    return false;
  }

  logError(`Flow doesn't exist in Architect: ${value}. Please correct before continuing.`);
  return false;
}

async function runDnisCheck(countryCode, rawNumber) {
  clearOutput();
  updateSummary('Running DNIS check...');
  setBusy(true);
  refreshAuthState();

  try {
    const dnis = String(rawNumber || '').replace(/\s+/g, '');
    const tableName = `${countryCode}_V_DNIS`;

    logInfo(`Starting DNIS check for ${countryCode} / ${dnis}`);
    logInfo(`Environment: ${APP_CONFIG.environment}`);

    const table = await findDatatableByName(tableName);
    if (!table) {
      updateSummary('Stopped: DNIS datatable was not found.');
      return;
    }

    const row = await getDatatableRow(table.id, dnis, `Datatable ${tableName}`, 'DNIS');
    if (!row) {
      logInfo('The key must match the datatable exactly (for example, with or without a leading +).');
      updateSummary('Stopped: DNIS was not found.');
      return;
    }

    const action = asTrimmedString(getRowField(row, 'action'));
    const destination = asTrimmedString(getRowField(row, 'destination'));

    logInfo(`DNIS ${dnis} -> action: ${action || '(empty)'} / destination: ${destination || '(empty)'}`);

    if (!action) {
      logError('DNIS action empty!');
      updateSummary(`Finished with ${counters.errors} error(s) and ${counters.warnings} warning(s).`);
      return;
    }

    if (!DNIS_ACTIONS.includes(action)) {
      logError(`DNIS action wrong spelling: ${action}. Allowed values: ${DNIS_ACTIONS.join(', ')}.`);
      updateSummary(`Finished with ${counters.errors} error(s) and ${counters.warnings} warning(s).`);
      return;
    }

    logSuccess(`DNIS action ${action} OK`);

    if (action === 'Transfer_service') {
      if (!destination) {
        logError('DNIS destination empty! A service is required for Transfer_service.');
        updateSummary(`Finished with ${counters.errors} error(s) and ${counters.warnings} warning(s).`);
        return;
      }

      logInfo(`Destination is a service. Running the service check for ${countryCode} / ${destination}...`);
      await runServiceCheck(countryCode, destination, { keepOutput: true });
      return;
    }

    if (action === 'Transfer_flow') {
      await validateFlowByName(destination);
      logInfo('DNIS check completed.');
      updateSummary(`Finished with ${counters.errors} error(s) and ${counters.warnings} warning(s).`);
      return;
    }

    // Transfer_number, BPO, Callback, Disconnect: informational only.
    if (destination) {
      logInfo(`Destination (${action}): ${destination}. Not auto-validated; verify it manually.`);
    } else if (action === 'Disconnect') {
      logInfo('Disconnect has no destination.');
    } else {
      logWarning(`DNIS destination is empty for action ${action}.`);
    }

    logInfo('DNIS check completed.');
    updateSummary(`Finished with ${counters.errors} error(s) and ${counters.warnings} warning(s).`);
  } catch (err) {
    logError(err.message || String(err));
    updateSummary(`Stopped with ${counters.errors} error(s) and ${counters.warnings} warning(s).`);
  } finally {
    refreshAuthState();
    setBusy(false);
  }
}

// ---------------------------------------------------------------------------
// Bulk: add users to a group
// ---------------------------------------------------------------------------

const GROUP_ADD_DELAY_MS = 500;
const GROUP_MAX_RETRIES_429 = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Dropdown filled from a paged Genesys Cloud list endpoint (groups, divisions, roles).
 * Loads lazily (when its tab is opened), supports a text filter and a manual reload.
 */
function createListPicker({ select, filter, status, reloadBtn, path, query = {}, noun, nounPlural, toItem }) {
  const state = { items: [], loaded: false, loading: false };

  function setStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
  }

  function setPlaceholder(text) {
    select.innerHTML = '';
    const option = document.createElement('option');
    option.value = '';
    option.textContent = text;
    select.appendChild(option);
  }

  function render() {
    const needle = asTrimmedString(filter.value).toLowerCase();
    const previous = select.value;
    const matches = state.items.filter((item) => !needle || item.name.toLowerCase().includes(needle));

    setPlaceholder(matches.length ? `Select a ${noun}` : `No ${nounPlural} match the filter`);

    for (const item of matches) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.label;
      select.appendChild(option);
    }

    if (previous && matches.some((item) => item.id === previous)) {
      select.value = previous;
    }

    const total = state.items.length;
    setStatus(
      needle
        ? `${matches.length} of ${total} ${nounPlural} match.`
        : `${total} ${total === 1 ? noun : nounPlural} loaded.`
    );
  }

  function reset() {
    state.items = [];
    state.loaded = false;
    state.loading = false;
    filter.value = '';
    setPlaceholder(`Sign in to load ${nounPlural}`);
    setStatus('');
  }

  async function load({ force = false } = {}) {
    if (state.loading) return;

    if (!getStoredToken()) {
      reset();
      setStatus(`Sign in to load the ${noun} list.`);
      return;
    }

    if (state.loaded && !force) return;

    state.loading = true;
    setPlaceholder(`Loading ${nounPlural}...`);
    setStatus(`Loading ${nounPlural}...`);

    try {
      const collected = [];
      let pageNumber = 1;
      let pageCount = 1;

      while (pageNumber <= pageCount && pageNumber <= 100) {
        const response = await apiGet(path, { ...query, pageSize: 100, pageNumber });
        if (!response.ok) {
          throw new Error(`${noun[0].toUpperCase()}${noun.slice(1)} list request failed (${response.status}) - ${response.raw || response.statusText}`);
        }

        const entities = Array.isArray(response.data?.entities) ? response.data.entities : [];
        collected.push(...entities);

        const total = Number(response.data?.total || 0);
        pageCount = Number(response.data?.pageCount) || Math.ceil(total / 100) || 1;
        if (!entities.length) break;
        pageNumber += 1;
      }

      const nameCounts = new Map();
      for (const entity of collected) {
        const key = asTrimmedString(entity?.name).toLowerCase();
        nameCounts.set(key, (nameCounts.get(key) || 0) + 1);
      }

      state.items = collected
        .filter((entity) => entity?.id && asTrimmedString(entity.name))
        .map((entity) => {
          const name = asTrimmedString(entity.name);
          const duplicated = nameCounts.get(name.toLowerCase()) > 1;
          return { ...toItem(entity, duplicated), id: entity.id, name, raw: entity };
        })
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

      state.loaded = true;
      render();
    } catch (err) {
      state.items = [];
      state.loaded = false;
      setPlaceholder(`Could not load ${nounPlural}`);
      setStatus(err.message || String(err), true);
      logError(err.message || String(err));
    } finally {
      state.loading = false;
    }
  }

  filter.addEventListener('input', () => {
    if (state.loaded) render();
  });

  reloadBtn.addEventListener('click', () => {
    load({ force: true });
  });

  return {
    load,
    reset,
    find: (id) => state.items.find((item) => item.id === id),
    invalidate: () => { state.loaded = false; }
  };
}

function idSuffix(entity, duplicated) {
  return duplicated ? ` [${String(entity.id).slice(0, 8)}]` : '';
}

const groupsPicker = createListPicker({
  select: elements.groupSelect,
  filter: elements.groupFilter,
  status: elements.groupsStatus,
  reloadBtn: elements.reloadGroupsBtn,
  path: '/api/v2/groups',
  noun: 'group',
  nounPlural: 'groups',
  toItem: (group, duplicated) => {
    const count = group.memberCount;
    const members = count !== undefined && Number.isFinite(Number(count))
      ? ` (${count} member${Number(count) === 1 ? '' : 's'})`
      : '';
    return { label: `${asTrimmedString(group.name)}${members}${idSuffix(group, duplicated)}` };
  }
});

const divisionsPicker = createListPicker({
  select: elements.divisionSelect,
  filter: elements.divisionFilter,
  status: elements.divisionsStatus,
  reloadBtn: elements.reloadDivisionsBtn,
  path: '/api/v2/authorization/divisions',
  noun: 'division',
  nounPlural: 'divisions',
  toItem: (division, duplicated) => ({
    label: `${asTrimmedString(division.name)}${division.homeDivision ? ' (home)' : ''}${idSuffix(division, duplicated)}`
  })
});

const rolesPicker = createListPicker({
  select: elements.roleSelect,
  filter: elements.roleFilter,
  status: elements.rolesStatus,
  reloadBtn: elements.reloadRolesBtn,
  path: '/api/v2/authorization/roles',
  noun: 'role',
  nounPlural: 'roles',
  toItem: (role, duplicated) => ({
    label: `${asTrimmedString(role.name)}${idSuffix(role, duplicated)}`
  })
});

function resetPickers() {
  groupsPicker.reset();
  divisionsPicker.reset();
  rolesPicker.reset();
}

// Shared by the bulk tools that take a list of emails: drops invalid lines and duplicates.
function prepareEmailList(rawEmails) {
  const seen = new Set();
  const emails = [];
  let skipped = 0;

  rawEmails.forEach((email, index) => {
    const key = email.toLowerCase();
    if (!/^\S+@\S+$/.test(email)) {
      logWarning(`Line ${index + 1}: "${email}" is not a valid email. Skipped.`);
      skipped += 1;
    } else if (seen.has(key)) {
      logWarning(`Line ${index + 1}: ${email} is duplicated. Skipped.`);
      skipped += 1;
    } else {
      seen.add(key);
      emails.push(email);
    }
  });

  return { emails, skipped };
}

function parseEmailList(text) {
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];

  // A CSV with an Email header is accepted too; a plain list has one email per line.
  const hasEmailHeader = /(^|[,;])\s*"?e-?mail"?\s*([,;]|$)/i.test(lines[0]);
  if (hasEmailHeader) {
    const rows = parseCsvText(clean);
    return rows.map((row) => getRowValueByHeader(row, ['Email', 'E-mail'])).filter(Boolean);
  }

  return lines;
}

async function sendWithRateLimitRetry(method, path, body) {
  let response = await apiSend(method, path, body);
  for (let attempt = 1; response.status === 429 && attempt <= GROUP_MAX_RETRIES_429; attempt += 1) {
    logWarning(`Rate limited by Genesys Cloud. Waiting ${attempt * 3}s before retrying...`);
    await sleep(attempt * 3000);
    response = await apiSend(method, path, body);
  }
  return response;
}

function postWithRateLimitRetry(path, body) {
  return sendWithRateLimitRetry('POST', path, body);
}

async function addUserToGroup(groupId, userId) {
  const path = `/api/v2/groups/${encodeURIComponent(groupId)}/members`;
  let response = await postWithRateLimitRetry(path, { memberIds: [userId] });

  // Some orgs require the current group version in the body. Retry once with it if the API asks for it.
  const mentionsVersion = /version/i.test(String(response.raw || ''));
  if (!response.ok && (response.status === 400 || response.status === 409) && mentionsVersion) {
    const group = await apiGet(`/api/v2/groups/${encodeURIComponent(groupId)}`);
    if (group.ok && group.data?.version !== undefined) {
      response = await postWithRateLimitRetry(path, { memberIds: [userId], version: group.data.version });
    }
  }

  return response;
}

async function processGroupMembersFile(file, group) {
  clearOutput();
  updateSummary('Adding users to group...');
  setBusy(true);
  refreshAuthState();

  try {
    const text = await file.text();
    const rawEmails = parseEmailList(text);

    if (!rawEmails.length) {
      logError('The file is empty. Provide one email per line.');
      updateSummary('Stopped: no emails found.');
      return;
    }

    const { emails, skipped } = prepareEmailList(rawEmails);

    logInfo(`File loaded: ${file.name}`);
    logInfo(`Target group: ${group.name} (${group.id})`);
    logInfo(`Emails to process: ${emails.length}`);

    let added = 0;
    let notFound = 0;
    let failed = 0;

    for (let index = 0; index < emails.length; index += 1) {
      const email = emails[index];

      try {
        const lookup = await findAgentEmail(email);
        if (!lookup.ok) {
          if (/not found/i.test(lookup.message)) {
            logError(`NOT FOUND: ${email}`);
            notFound += 1;
          } else {
            logError(`${email}: ${lookup.message}`);
            failed += 1;
          }
        } else {
          const response = await addUserToGroup(group.id, lookup.AgentId);
          if (response.ok) {
            logSuccess(`User added to group: ${email} (${lookup.AgentId})`);
            added += 1;
          } else {
            const detail = response.data?.message || response.raw || response.statusText;
            logError(`HTTP ERROR: ${email} -> ${response.status} -> ${detail}`);
            failed += 1;
          }
        }
      } catch (err) {
        logError(`GENERAL ERROR: ${email} -> ${err.message || err}`);
        failed += 1;
      }

      if (index < emails.length - 1) await sleep(GROUP_ADD_DELAY_MS);
    }

    logInfo('Group members processing completed.');
    updateSummary(`Group update finished: ${added} added, ${notFound} not found, ${failed} failed, ${skipped} skipped.`);

    // Member counts changed, so refresh the list the next time it is needed.
    groupsPicker.invalidate();
  } catch (err) {
    logError(err.message || String(err));
    updateSummary(`Group update stopped: ${counters.errors} error(s) and ${counters.warnings} warning(s).`);
  } finally {
    refreshAuthState();
    setBusy(false);
    if (elements.groupMembersFile) elements.groupMembersFile.value = '';
  }
}

async function processRoleAssignFile(file, division, role) {
  clearOutput();
  updateSummary('Assigning role...');
  setBusy(true);
  refreshAuthState();

  try {
    const text = await file.text();
    const rawEmails = parseEmailList(text);

    if (!rawEmails.length) {
      logError('The file is empty. Provide one email per line.');
      updateSummary('Stopped: no emails found.');
      return;
    }

    const { emails, skipped } = prepareEmailList(rawEmails);

    logInfo(`File loaded: ${file.name}`);
    logInfo(`Division: ${division.name} (${division.id})`);
    logInfo(`Role: ${role.name} (${role.id})`);
    logInfo(`Emails to process: ${emails.length}`);

    let assigned = 0;
    let notFound = 0;
    let failed = 0;

    for (let index = 0; index < emails.length; index += 1) {
      const email = emails[index];

      try {
        const lookup = await findAgentEmail(email);
        if (!lookup.ok) {
          if (/not found/i.test(lookup.message)) {
            logError(`NOT FOUND: ${email}`);
            notFound += 1;
          } else {
            logError(`${email}: ${lookup.message}`);
            failed += 1;
          }
        } else {
          const response = await postWithRateLimitRetry(
            `/api/v2/authorization/subjects/${encodeURIComponent(lookup.AgentId)}/divisions/${encodeURIComponent(division.id)}/roles/${encodeURIComponent(role.id)}`
          );

          if (response.ok) {
            logSuccess(`Role assigned to ${email} (${lookup.AgentId})`);
            assigned += 1;
          } else {
            const detail = response.data?.message || response.raw || response.statusText;
            logError(`HTTP ERROR: ${email} -> ${response.status} -> ${detail}`);
            failed += 1;
          }
        }
      } catch (err) {
        logError(`GENERAL ERROR: ${email} -> ${err.message || err}`);
        failed += 1;
      }

      if (index < emails.length - 1) await sleep(GROUP_ADD_DELAY_MS);
    }

    logInfo('Role assignment completed.');
    updateSummary(`Role update finished: ${assigned} assigned, ${notFound} not found, ${failed} failed, ${skipped} skipped.`);
  } catch (err) {
    logError(err.message || String(err));
    updateSummary(`Role update stopped: ${counters.errors} error(s) and ${counters.warnings} warning(s).`);
  } finally {
    refreshAuthState();
    setBusy(false);
    if (elements.rolesEmailsFile) elements.rolesEmailsFile.value = '';
  }
}

// ---------------------------------------------------------------------------
// Bulk: upload canned responses (Excel or CSV)
// ---------------------------------------------------------------------------

const CANNED_ROW_DELAY_MS = 1000;

function loadSpreadsheetLibrary() {
  if (window.XLSX) return Promise.resolve(window.XLSX);

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'vendor/xlsx.full.min.js?v=1';
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => reject(new Error('Could not load the Excel reader (vendor/xlsx.full.min.js is missing).'));
    document.head.appendChild(script);
  });
}

async function readSpreadsheetRows(file) {
  if (/\.csv$/i.test(file.name)) {
    return parseCsvText(await file.text());
  }

  const XLSX = await loadSpreadsheetLibrary();
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
}

// Same transformation as the original script: re-serialise the HTML (like BeautifulSoup),
// turn the agent first-name tag into the AGENT_ALIAS substitution and optionally drop "?".
function cleanCannedHtml(html, replaceQuestionMarks) {
  const template = document.createElement('template'); // inert: nothing is loaded or executed
  template.innerHTML = html;

  let result = template.innerHTML.replace(/&lt;\$Agent\.FirstName\$&gt;/g, '{{AGENT_ALIAS}}');
  if (replaceQuestionMarks) result = result.replace(/\?/g, ' ');
  return result;
}

async function findResponseLibrary(prefix, cache) {
  if (cache.has(prefix)) return cache.get(prefix);

  const response = await apiGet('/api/v2/responsemanagement/libraries', { libraryPrefix: prefix });
  let result;

  if (!response.ok) {
    result = { ok: false, message: `Failure getting library: ${response.status} - ${response.statusText} - ${response.raw || ''}` };
  } else {
    const entities = Array.isArray(response.data?.entities) ? response.data.entities : [];
    if (!entities.length) {
      result = { ok: false, message: `Library not found for prefix: ${prefix}` };
    } else {
      result = { ok: true, library: entities[0], matches: entities.length };
    }
  }

  cache.set(prefix, result);
  return result;
}

async function processCannedResponsesFile(file, replaceQuestionMarks) {
  clearOutput();
  updateSummary('Uploading canned responses...');
  setBusy(true);
  refreshAuthState();

  try {
    const rows = await readSpreadsheetRows(file);

    if (!rows.length) {
      logError('The file is empty or could not be parsed.');
      updateSummary('Stopped: no rows found.');
      return;
    }

    if (
      !hasCsvHeader(rows, ['TEMPLATENAMEFIN']) ||
      !hasCsvHeader(rows, ['libraryPrefix']) ||
      !hasCsvHeader(rows, ['BODY'])
    ) {
      logError('The file must contain the columns TEMPLATENAMEFIN, libraryPrefix and BODY.');
      updateSummary('Stopped: invalid columns.');
      return;
    }

    logInfo(`File loaded: ${file.name}`);
    logInfo(`Rows to process: ${rows.length}`);
    logInfo(replaceQuestionMarks ? 'Question marks in the body will be replaced with a space.' : 'Question marks in the body are kept.');

    const libraryCache = new Map();
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const rowNumber = index + 2;
      const row = rows[index];
      const name = getRowValueByHeader(row, ['TEMPLATENAMEFIN']);
      const prefix = getRowValueByHeader(row, ['libraryPrefix']);
      const bodyKey = Object.keys(row).find((key) => asTrimmedString(key).toLowerCase() === 'body');
      const html = bodyKey === undefined ? '' : String(row[bodyKey] ?? '');

      if (!name) {
        logWarning(`Row ${rowNumber}: TEMPLATENAMEFIN empty. Skipped.`);
        skipped += 1;
        continue;
      }
      if (!prefix) {
        logWarning(`Row ${rowNumber}: libraryPrefix empty. Skipped (${name}).`);
        skipped += 1;
        continue;
      }
      if (!html.trim()) {
        logWarning(`Row ${rowNumber}: BODY empty. Skipped (${name}).`);
        skipped += 1;
        continue;
      }

      try {
        const lookup = await findResponseLibrary(prefix, libraryCache);
        if (!lookup.ok) {
          logError(`Row ${rowNumber}: ${lookup.message} - Template: ${name}`);
          failed += 1;
          continue;
        }

        const library = lookup.library;
        if (lookup.matches > 1 && !lookup.reported) {
          lookup.reported = true;
          logWarning(`Prefix ${prefix} matches ${lookup.matches} libraries. Using the first one: ${library.name}.`);
        }

        const requestBody = {
          name,
          libraries: [{ id: library.id, name: library.name, selfUri: library.selfUri }],
          texts: [{ content: cleanCannedHtml(html, replaceQuestionMarks), contentType: 'text/html' }],
          substitutions: [{ id: 'AGENT_ALIAS' }],
          version: 0
        };

        const response = await postWithRateLimitRetry('/api/v2/responsemanagement/responses', requestBody);

        if (response.ok) {
          logSuccess(`Row ${rowNumber}: canned response created: ${name} (${library.name})`);
          created += 1;
        } else {
          const detail = response.data?.message || response.raw || response.statusText;
          logError(`Row ${rowNumber}: Failure ${response.status} - ${name} - ${detail}`);
          failed += 1;
        }
      } catch (err) {
        logError(`Row ${rowNumber}: ${name} -> ${err.message || err}`);
        failed += 1;
      }

      if (index < rows.length - 1) await sleep(CANNED_ROW_DELAY_MS);
    }

    logInfo('Canned responses processing completed.');
    updateSummary(`Canned responses finished: ${created} created, ${skipped} skipped, ${failed} failed.`);
  } catch (err) {
    logError(err.message || String(err));
    updateSummary(`Canned responses stopped: ${counters.errors} error(s) and ${counters.warnings} warning(s).`);
  } finally {
    refreshAuthState();
    setBusy(false);
    if (elements.cannedFile) elements.cannedFile.value = '';
  }
}

// ---------------------------------------------------------------------------
// Bulk: agent utilization
// ---------------------------------------------------------------------------

const UTIL_CHANNELS = [
  ['call', 'Call'],
  ['callback', 'Callback'],
  ['chat', 'Chat'],
  ['email', 'Email'],
  ['message', 'Message'],
  ['workitem', 'Workitem']
];

// Same body as the original script.
function defaultUtilizationBody() {
  return {
    utilization: {
      callback: { maximumCapacity: 1, interruptableMediaTypes: [], includeNonAcd: false },
      message: { maximumCapacity: 2, interruptableMediaTypes: [], includeNonAcd: false },
      email: { maximumCapacity: 1, interruptableMediaTypes: [], includeNonAcd: false },
      call: { maximumCapacity: 1, interruptableMediaTypes: [], includeNonAcd: false },
      workitem: {
        maximumCapacity: 4,
        interruptableMediaTypes: ['call', 'callback', 'chat', 'email', 'message'],
        includeNonAcd: true
      }
    },
    labelUtilizations: {},
    level: 'Agent'
  };
}

let utilBody = defaultUtilizationBody();
let utilJsonInvalid = false;

function validateUtilizationBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return 'The body must be a JSON object.';

  const utilization = body.utilization;
  if (!utilization || typeof utilization !== 'object' || Array.isArray(utilization)) {
    return 'The body needs a "utilization" object.';
  }

  const entries = Object.entries(utilization);
  if (!entries.length) return 'Enable at least one channel.';

  for (const [channel, config] of entries) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return `${channel}: the configuration must be an object.`;
    }
    if (!Number.isInteger(config.maximumCapacity) || config.maximumCapacity < 0) {
      return `${channel}: maximum capacity must be a whole number (0 or more).`;
    }
    if (
      config.interruptableMediaTypes !== undefined &&
      (!Array.isArray(config.interruptableMediaTypes) || config.interruptableMediaTypes.some((type) => typeof type !== 'string'))
    ) {
      return `${channel}: interruptableMediaTypes must be a list of channel names.`;
    }
    if (config.includeNonAcd !== undefined && typeof config.includeNonAcd !== 'boolean') {
      return `${channel}: includeNonAcd must be true or false.`;
    }
  }

  return '';
}

function setUtilError(message) {
  elements.utilError.textContent = message;
  elements.utilError.hidden = !message;
}

function showUtilValidation() {
  if (utilJsonInvalid) return;
  setUtilError(validateUtilizationBody(utilBody));
}

function syncUtilJson() {
  elements.utilJson.value = JSON.stringify(utilBody, null, 2);
  utilJsonInvalid = false;
}

function renderUtilForm() {
  const container = elements.utilChannels;
  container.innerHTML = '';

  for (const [key, label] of UTIL_CHANNELS) {
    const config = utilBody.utilization?.[key];
    const enabled = Boolean(config) && typeof config === 'object';

    const block = document.createElement('div');
    block.className = `util-channel${enabled ? '' : ' is-off'}`;
    block.dataset.channel = key;

    // Header: include toggle + capacity
    const head = document.createElement('div');
    head.className = 'util-head';

    const includeLabel = document.createElement('label');
    includeLabel.className = 'check util-name';
    const include = document.createElement('input');
    include.type = 'checkbox';
    include.dataset.role = 'include';
    include.checked = enabled;
    const includeText = document.createElement('span');
    includeText.textContent = label;
    includeLabel.append(include, includeText);

    const capLabel = document.createElement('label');
    capLabel.className = 'util-cap';
    const capText = document.createElement('span');
    capText.textContent = 'Max capacity';
    const cap = document.createElement('input');
    cap.type = 'number';
    cap.min = '0';
    cap.step = '1';
    cap.inputMode = 'numeric';
    cap.dataset.role = 'cap';
    cap.disabled = !enabled;
    cap.value = enabled && config.maximumCapacity !== null && config.maximumCapacity !== undefined ? String(config.maximumCapacity) : '';
    capLabel.append(capText, cap);

    head.append(includeLabel, capLabel);
    block.appendChild(head);

    // Details: interruptible by + non-ACD
    const body = document.createElement('div');
    body.className = 'util-body';

    const interruptBy = document.createElement('div');
    interruptBy.className = 'util-interrupt';
    const interruptTitle = document.createElement('span');
    interruptTitle.className = 'util-interrupt-title';
    interruptTitle.textContent = 'Can be interrupted by';
    const chips = document.createElement('div');
    chips.className = 'chips';

    const current = enabled && Array.isArray(config.interruptableMediaTypes) ? config.interruptableMediaTypes : [];
    for (const [otherKey, otherLabel] of UTIL_CHANNELS) {
      if (otherKey === key) continue;
      const chip = document.createElement('label');
      chip.className = 'chip-check';
      const box = document.createElement('input');
      box.type = 'checkbox';
      box.dataset.role = 'int';
      box.dataset.type = otherKey;
      box.checked = current.includes(otherKey);
      box.disabled = !enabled;
      const text = document.createElement('span');
      text.textContent = otherLabel;
      chip.append(box, text);
      chips.appendChild(chip);
    }
    interruptBy.append(interruptTitle, chips);

    const nonAcdLabel = document.createElement('label');
    nonAcdLabel.className = 'check';
    const nonAcd = document.createElement('input');
    nonAcd.type = 'checkbox';
    nonAcd.dataset.role = 'nonacd';
    nonAcd.checked = enabled && config.includeNonAcd === true;
    nonAcd.disabled = !enabled;
    const nonAcdText = document.createElement('span');
    nonAcdText.textContent = 'Include non-ACD interactions';
    nonAcdLabel.append(nonAcd, nonAcdText);

    body.append(interruptBy, nonAcdLabel);
    block.appendChild(body);
    container.appendChild(block);
  }
}

function handleUtilFormEvent(event) {
  const target = event.target;
  const block = target.closest?.('.util-channel');
  const role = target.dataset?.role;
  if (!block || !role) return;
  if (event.type === 'input' && role !== 'cap') return;

  const key = block.dataset.channel;
  if (!utilBody.utilization || typeof utilBody.utilization !== 'object') utilBody.utilization = {};

  if (role === 'include') {
    if (target.checked) {
      utilBody.utilization[key] = { maximumCapacity: 1, interruptableMediaTypes: [], includeNonAcd: false };
    } else {
      delete utilBody.utilization[key];
    }
    renderUtilForm();
  } else {
    const config = utilBody.utilization[key];
    if (!config) return;

    if (role === 'cap') {
      const raw = target.value.trim();
      config.maximumCapacity = raw === '' ? null : Number(raw);
    } else if (role === 'nonacd') {
      config.includeNonAcd = target.checked;
    } else if (role === 'int') {
      const list = Array.isArray(config.interruptableMediaTypes) ? config.interruptableMediaTypes : [];
      const type = target.dataset.type;
      config.interruptableMediaTypes = target.checked
        ? (list.includes(type) ? list : [...list, type])
        : list.filter((candidate) => candidate !== type);
    }
  }

  syncUtilJson();
  showUtilValidation();
}

function handleUtilJsonInput() {
  try {
    const parsed = JSON.parse(elements.utilJson.value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('the body must be a JSON object.');
    }
    utilBody = parsed;
    utilJsonInvalid = false;
    renderUtilForm();
    showUtilValidation();
  } catch (err) {
    utilJsonInvalid = true;
    setUtilError(`Invalid JSON: ${err.message}`);
  }
}

function initUtilizationForm() {
  renderUtilForm();
  syncUtilJson();
  showUtilValidation();

  elements.utilChannels.addEventListener('change', handleUtilFormEvent);
  elements.utilChannels.addEventListener('input', handleUtilFormEvent);
  elements.utilJson.addEventListener('input', handleUtilJsonInput);

  elements.resetUtilBtn.addEventListener('click', () => {
    utilBody = defaultUtilizationBody();
    renderUtilForm();
    syncUtilJson();
    showUtilValidation();
  });
}

async function processUtilizationFile(file, body) {
  clearOutput();
  updateSummary('Updating utilization...');
  setBusy(true);
  refreshAuthState();

  try {
    const rawEmails = parseEmailList(await file.text());

    if (!rawEmails.length) {
      logError('The file is empty. Provide one email per line.');
      updateSummary('Stopped: no emails found.');
      return;
    }

    const { emails, skipped } = prepareEmailList(rawEmails);

    logInfo(`File loaded: ${file.name}`);
    logInfo(`Utilization body: ${JSON.stringify(body)}`);
    logInfo(`Emails to process: ${emails.length}`);

    let updated = 0;
    let notFound = 0;
    let failed = 0;

    for (let index = 0; index < emails.length; index += 1) {
      const email = emails[index];

      try {
        const lookup = await findAgentEmail(email);
        if (!lookup.ok) {
          if (/not found/i.test(lookup.message)) {
            logError(`NOT FOUND: ${email}`);
            notFound += 1;
          } else {
            logError(`${email}: ${lookup.message}`);
            failed += 1;
          }
        } else {
          const response = await sendWithRateLimitRetry(
            'PUT',
            `/api/v2/routing/users/${encodeURIComponent(lookup.AgentId)}/utilization`,
            body
          );

          if (response.ok) {
            logSuccess(`Utilization assigned to ${email} (${lookup.AgentId})`);
            updated += 1;
          } else {
            const detail = response.data?.message || response.raw || response.statusText;
            logError(`HTTP ERROR: ${email} -> ${response.status} -> ${detail}`);
            failed += 1;
          }
        }
      } catch (err) {
        logError(`GENERAL ERROR: ${email} -> ${err.message || err}`);
        failed += 1;
      }

      if (index < emails.length - 1) await sleep(GROUP_ADD_DELAY_MS);
    }

    logInfo('Utilization processing completed.');
    updateSummary(`Utilization finished: ${updated} updated, ${notFound} not found, ${failed} failed, ${skipped} skipped.`);
  } catch (err) {
    logError(err.message || String(err));
    updateSummary(`Utilization stopped: ${counters.errors} error(s) and ${counters.warnings} warning(s).`);
  } finally {
    refreshAuthState();
    setBusy(false);
    if (elements.utilizationFile) elements.utilizationFile.value = '';
  }
}

async function ensureAuthenticated() {
  if (!validateAppConfig()) return false;

  const token = getStoredToken();
  if (token) {
    refreshAuthState();
    return true;
  }

  logInfo('No valid browser session found. Enter your Client ID to sign in, then run the action again.');
  openLoginDialog();
  return false;
}
function hasCsvHeader(rows, headerNames) {
  const headers = Object.keys(rows[0] || {}).map((key) => asTrimmedString(key).toLowerCase());
  return headerNames.some((name) => headers.includes(name.toLowerCase()));
}

function getRowValueByHeader(row, headerNames) {
  for (const [key, value] of Object.entries(row || {})) {
    if (headerNames.some((name) => asTrimmedString(key).toLowerCase() === name.toLowerCase())) {
      return asTrimmedString(value);
    }
  }
  return '';
}

function detectCsvDelimiter(text) {
  const firstLine = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .find((line) => line.trim() !== '') || '';

  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;

  return semicolonCount > commaCount ? ';' : ',';
}

function parseCsvText(text) {
  const input = text.replace(/^\uFEFF/, '');
  const delimiter = detectCsvDelimiter(input);
  const rows = [];
  let currentRow = [];
  let currentValue = '';
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const nextChar = input[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i += 1;
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  currentRow.push(currentValue);
  if (currentRow.some((cell) => asTrimmedString(cell) !== '')) {
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => asTrimmedString(header));

  return rows
    .slice(1)
    .filter((row) => row.some((cell) => asTrimmedString(cell) !== ''))
    .map((row) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = asTrimmedString(row[index] ?? '');
      });
      return record;
    });
}

async function processCsvUserRow(row, rowNumber) {
  const email = getRowValueByHeader(row, ['Email', 'E-mail']);
  const matricula = getRowValueByHeader(row, ['Matricula', 'Matrícula']);

  if (!email) {
    logWarning(`Row ${rowNumber}: Email empty. Skipped.`);
    return { updated: 0, skipped: 1, failed: 0 };
  }

  if (!matricula) {
    logWarning(`Row ${rowNumber}: Matricula empty for ${email}. Skipped.`);
    return { updated: 0, skipped: 1, failed: 0 };
  }

  logInfo(`Row ${rowNumber}: processing ${email}`);

  const searchBody = {
    pageSize: 100,
    pageNumber: 1,
    query: [
      {
        type: 'EXACT',
        fields: ['state'],
        values: ['active', 'inactive']
      },
      {
        type: 'QUERY_STRING',
        fields: ['email'],
        value: email
      }
    ]
  };

  const searchResponse = await apiPost('/api/v2/users/search', searchBody);

  if (!searchResponse.ok) {
    logError(`Row ${rowNumber}: user search failed (${searchResponse.status}) - ${searchResponse.raw || searchResponse.statusText}`);
    return { updated: 0, skipped: 0, failed: 1 };
  }

  const results = Array.isArray(searchResponse.data?.results) ? searchResponse.data.results : [];

  if (results.length === 0) {
    logWarning(`Row ${rowNumber}: user not found for ${email}.`);
    return { updated: 0, skipped: 1, failed: 0 };
  }

  const matchedUser =
    results.find((item) => asTrimmedString(item.email).toLowerCase() === email.toLowerCase()) ||
    results[0];

  if (matchedUser.version === undefined || matchedUser.version === null) {
    logError(`Row ${rowNumber}: version not returned for ${email}. Cannot update user.`);
    return { updated: 0, skipped: 0, failed: 1 };
  }

  if (results.length > 1) {
    logWarning(`Row ${rowNumber}: multiple users returned for ${email}. Using ${matchedUser.id}.`);
  } else {
    logSuccess(`Row ${rowNumber}: user found ${matchedUser.id}`);
  }

  const patchBody = {
    employerInfo: {
      employeeId: matricula
    },
    version: matchedUser.version
  };
  
await new Promise(resolve => setTimeout(resolve, 1000));
  
  const updateResponse = await apiPatch(
    `/api/v2/users/${encodeURIComponent(matchedUser.id)}`,
    patchBody
  );

  if (!updateResponse.ok) {
    logError(`Row ${rowNumber}: update failed (${updateResponse.status}) - ${updateResponse.raw || updateResponse.statusText}`);
    return { updated: 0, skipped: 0, failed: 1 };
  }

  logSuccess(`Row ${rowNumber}: user updated with Matricula ${matricula}`);
  return { updated: 1, skipped: 0, failed: 0 };
}

async function processCsvFile(file) {
  clearOutput();
  updateSummary('Processing CSV...');
  setBusy(true);
  refreshAuthState();

  try {
    const text = await file.text();
    const rows = parseCsvText(text);

    if (!rows.length) {
      logError('The CSV file is empty or could not be parsed.');
      updateSummary('Stopped: no rows found.');
      return;
    }

    if (!hasCsvHeader(rows, ['Email', 'E-mail']) || !hasCsvHeader(rows, ['Matricula', 'Matrícula'])) {
      logError('CSV must contain the headers Email and Matricula.');
      updateSummary('Stopped: invalid CSV headers.');
      return;
    }

    logInfo(`CSV loaded: ${file.name}`);
    logInfo(`Rows to process: ${rows.length}`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const result = await processCsvUserRow(rows[index], index + 2);
      updated += result.updated;
      skipped += result.skipped;
      failed += result.failed;
    }

    logInfo('CSV processing completed.');
    updateSummary(`CSV finished: ${updated} updated, ${skipped} skipped, ${failed} failed.`);
  } catch (err) {
    logError(err.message || String(err));
    updateSummary(`CSV stopped: ${counters.errors} error(s) and ${counters.warnings} warning(s).`);
  } finally {
    refreshAuthState();
    setBusy(false);
    if (elements.csvForm) elements.csvForm.reset();
  }
}
const SCHEDULE_DAY_MAP = {
  monday: 'MO',
  tuesday: 'TU',
  wednesday: 'WE',
  thursday: 'TH',
  friday: 'FR',
  saturday: 'SA',
  sunday: 'SU'
};

const SCHEDULE_DAY_ORDER = Object.keys(SCHEDULE_DAY_MAP);

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatLocalDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function parseScheduleDefinition(scheduleText) {
  const value = asTrimmedString(scheduleText).toLowerCase();
  const parts = value.split(':');

  if (parts.length !== 2) {
    throw new Error(`Invalid Schedule format: ${scheduleText}. Expected day/day-range:HHMM-HHMM`);
  }

  const dayPart = asTrimmedString(parts[0]);
  const timePart = asTrimmedString(parts[1]);
  const timePieces = timePart.split('-');

  if (timePieces.length !== 2) {
    throw new Error(`Invalid time range in Schedule: ${scheduleText}`);
  }

  const startRaw = asTrimmedString(timePieces[0]);
  const endRaw = asTrimmedString(timePieces[1]);

  if (!/^\d{4}$/.test(startRaw) || !/^\d{4}$/.test(endRaw)) {
    throw new Error(`Invalid time format in Schedule: ${scheduleText}. Expected HHMM-HHMM`);
  }

  const startTime = `${startRaw.slice(0, 2)}:${startRaw.slice(2)}:00`;
  const endTime = `${endRaw.slice(0, 2)}:${endRaw.slice(2)}:00`;

  let byDay;

  if (dayPart.includes('-')) {
    const rangeParts = dayPart.split('-');
    if (rangeParts.length !== 2) {
      throw new Error(`Invalid day range in Schedule: ${scheduleText}`);
    }

    const startDay = asTrimmedString(rangeParts[0]).toLowerCase();
    const endDay = asTrimmedString(rangeParts[1]).toLowerCase();

    if (!SCHEDULE_DAY_MAP[startDay] || !SCHEDULE_DAY_MAP[endDay]) {
      throw new Error(`Invalid weekday in Schedule: ${scheduleText}`);
    }

    const startIndex = SCHEDULE_DAY_ORDER.indexOf(startDay);
    const endIndex = SCHEDULE_DAY_ORDER.indexOf(endDay);

    const daysInRange = startIndex <= endIndex
      ? SCHEDULE_DAY_ORDER.slice(startIndex, endIndex + 1)
      : [
          ...SCHEDULE_DAY_ORDER.slice(startIndex),
          ...SCHEDULE_DAY_ORDER.slice(0, endIndex + 1)
        ];

    byDay = daysInRange.map((day) => SCHEDULE_DAY_MAP[day]).join(',');
  } else {
    if (!SCHEDULE_DAY_MAP[dayPart]) {
      throw new Error(`Invalid weekday in Schedule: ${scheduleText}`);
    }

    byDay = SCHEDULE_DAY_MAP[dayPart];
  }

  return {
    startTime,
    endTime,
    byDay
  };
}

async function findDivisionByName(divisionName) {
  const value = asTrimmedString(divisionName);

  if (!value) {
    return { ok: false, message: 'Division empty.' };
  }

  const response = await apiGet('/api/v2/authorization/divisions', { name: value });

  if (!response.ok) {
    return {
      ok: false,
      message: `Division lookup failed (${response.status}) - ${response.raw || response.statusText}`
    };
  }

  const entities = Array.isArray(response.data?.entities) ? response.data.entities : [];
  const division = exactEntityByName(entities, value);

  if (!division) {
    return {
      ok: false,
      message: `Division not found: ${value}`
    };
  }

  return { ok: true, division };
}

async function findAgentEmail(email) {
  const value = asTrimmedString(email);

  if (!value) {
    return { ok: false, message: 'Email empty.' };
  }

  const requestBody = {
    query: [
      {
        fields: ["email"],
        value: value,
        type: "EXACT",
      }
    ]
  };

  const response = await apiPost('/api/v2/users/search', requestBody);

  if (!response.ok) {
    return {
      ok: false,
      message: `Email lookup failed (${response.status}) - ${response.raw || response.statusText}`
    };
  }

  const result = response.data;
  
  if (!result || result.total === 0) {
    return {
      ok: false,
      message: `agent not found: ${value}`
    };
  }

  const AgentId = result.results[0].id;

  return { ok: true, AgentId };
}

async function processScheduleCsvRow(row, rowNumber) {
  const divisionName = getRowValueByHeader(row, ['Division']);
  const scheduleText = getRowValueByHeader(row, ['Schedule']);
  const scheduleName = getRowValueByHeader(row, ['Nombre', 'Name']);

  if (!divisionName) {
    logWarning(`Row ${rowNumber}: Division empty. Skipped.`);
    return { created: 0, skipped: 1, failed: 0 };
  }

  if (!scheduleText) {
    logWarning(`Row ${rowNumber}: Schedule empty. Skipped.`);
    return { created: 0, skipped: 1, failed: 0 };
  }

  if (!scheduleName) {
    logWarning(`Row ${rowNumber}: Nombre empty. Skipped.`);
    return { created: 0, skipped: 1, failed: 0 };
  }

  logInfo(`Row ${rowNumber}: processing schedule "${scheduleName}"`);

  const divisionLookup = await findDivisionByName(divisionName);

  if (!divisionLookup.ok) {
    logError(`Row ${rowNumber}: ${divisionLookup.message}`);
    return { created: 0, skipped: 0, failed: 1 };
  }

  let parsedSchedule;

  try {
    parsedSchedule = parseScheduleDefinition(scheduleText);
  } catch (err) {
    logError(`Row ${rowNumber}: ${err.message}`);
    return { created: 0, skipped: 0, failed: 1 };
  }

  const today = new Date();
  const startDate = formatLocalDate(today);
  const endDate = parsedSchedule.endTime === '00:00:00'
    ? formatLocalDate(addDays(today, 1))
    : formatLocalDate(today);

  const division = divisionLookup.division;

  const requestBody = {
    start: `${startDate}T${parsedSchedule.startTime}`,
    end: `${endDate}T${parsedSchedule.endTime}`,
    rrule: `FREQ=WEEKLY;WKST=SU;BYDAY=${parsedSchedule.byDay}`,
    name: scheduleName,
    division: {
      id: division.id,
      name: division.name || divisionName,
      selfUri: division.selfUri || `/api/v2/authorization/divisions/${division.id}`
    }
  };

  logInfo(`Row ${rowNumber}: BYDAY=${parsedSchedule.byDay}`);
  logInfo(`Row ${rowNumber}: creating schedule "${scheduleName}"`);

  const createResponse = await apiPost('/api/v2/architect/schedules', requestBody);

  if (!createResponse.ok) {
    logError(`Row ${rowNumber}: Failure ${createResponse.status} - ${createResponse.statusText} - ${createResponse.raw || ''}`);
    return { created: 0, skipped: 0, failed: 1 };
  }

  logSuccess(`Row ${rowNumber}: schedule created: ${scheduleName}`);
  return { created: 1, skipped: 0, failed: 0 };
}

async function processScheduleCsvFile(file) {
  clearOutput();
  updateSummary('Processing schedules CSV...');
  setBusy(true);
  refreshAuthState();

  try {
    const text = await file.text();
    const rows = parseCsvText(text);

    if (!rows.length) {
      logError('The schedules CSV file is empty or could not be parsed.');
      updateSummary('Stopped: no rows found.');
      return;
    }

    if (
      !hasCsvHeader(rows, ['Division']) ||
      !hasCsvHeader(rows, ['Schedule']) ||
      !hasCsvHeader(rows, ['Nombre', 'Name'])
    ) {
      logError('CSV must contain the headers Division, Schedule and Nombre.');
      updateSummary('Stopped: invalid CSV headers.');
      return;
    }

    logInfo(`CSV loaded: ${file.name}`);
    logInfo(`Rows to process: ${rows.length}`);

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const result = await processScheduleCsvRow(rows[index], index + 2);
      created += result.created;
      skipped += result.skipped;
      failed += result.failed;
    }

    logInfo('Schedules CSV processing completed.');
    updateSummary(`Schedules CSV finished: ${created} created, ${skipped} skipped, ${failed} failed.`);
  } catch (err) {
    logError(err.message || String(err));
    updateSummary(`Schedules CSV stopped: ${counters.errors} error(s) and ${counters.warnings} warning(s).`);
  } finally {
    refreshAuthState();
    setBusy(false);
    if (elements.scheduleCsvForm) elements.scheduleCsvForm.reset();
  }
}


async function processExternalContactCsvRow(row, rowNumber) {
  const divisionName = getRowValueByHeader(row, ['Division']);
  const firstName = getRowValueByHeader(row, ['firstName']);
  const lastName = getRowValueByHeader(row, ['lastName']);
   const workPhone = getRowValueByHeader(row, ['workPhone']);
   const countryCode = getRowValueByHeader(row, ['countryCode']);

  if (!divisionName) {
    logWarning(`Row ${rowNumber}: Division empty. Skipped.`);
    return { created: 0, skipped: 1, failed: 0 };
  }

  if (!firstName) {
    logWarning(`Row ${rowNumber}: firstName empty. Skipped.`);
    return { created: 0, skipped: 1, failed: 0 };
  }

  if (!lastName) {
    logWarning(`Row ${rowNumber}: lastName empty. Skipped.`);
    return { created: 0, skipped: 1, failed: 0 };
  }

   if (!workPhone) {
    logWarning(`Row ${rowNumber}: workPhone empty. Skipped.`);
    return { created: 0, skipped: 1, failed: 0 };
  }

   if (!countryCode) {
    logWarning(`Row ${rowNumber}: countryCode empty. Skipped.`);
    return { created: 0, skipped: 1, failed: 0 };
  }

  logInfo(`Row ${rowNumber}: processing Contact "${firstName} ${lastName}"`);

  const divisionLookup = await findDivisionByName(divisionName);

  if (!divisionLookup.ok) {
    logError(`Row ${rowNumber}: ${divisionLookup.message}`);
    return { created: 0, skipped: 0, failed: 1 };
  }

  const division = divisionLookup.division;

const requestBody =  {
    firstName: firstName,
    lastName: lastName,
    division:{
     id: division.id },
    workPhone:{
      display: workPhone,
      countryCode: countryCode,
      normalizationCountryCode: countryCode}
}


  logInfo(`Row ${rowNumber}: creating Contact "${firstName} ${lastName}"`);

  const createResponse = await apiPost('/api/v2/externalcontacts/contacts', requestBody);

  if (!createResponse.ok) {
    logError(`Row ${rowNumber}: Failure ${createResponse.status} - ${createResponse.statusText} - ${createResponse.raw || ''}`);
    return { created: 0, skipped: 0, failed: 1 };
  }

  logSuccess(`Row ${rowNumber}: External contact created: "${firstName} ${lastName}"`);
  return { created: 1, skipped: 0, failed: 0 };
}

async function processExternalContactCsvFile(file) {
  clearOutput();
  updateSummary('Processing External Contacts CSV...');
  setBusy(true);
  refreshAuthState();

  try {
    const text = await file.text();
    const rows = parseCsvText(text);

    if (!rows.length) {
      logError('The External Contacts CSV file is empty or could not be parsed.');
      updateSummary('Stopped: no rows found.');
      return;
    }

    if (
      !hasCsvHeader(rows, ['Division']) ||
      !hasCsvHeader(rows, ['firstName']) ||
      !hasCsvHeader(rows, ['lastName']) ||
      !hasCsvHeader(rows, ['workPhone']) ||
      !hasCsvHeader(rows, ['countryCode'])
    ) {
      logError('CSV must contain the headers Division, firstName, lastName, workPhone and countryCode.');
      updateSummary('Stopped: invalid CSV headers.');
      return;
    }

    logInfo(`CSV loaded: ${file.name}`);
    logInfo(`Rows to process: ${rows.length}`);

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (let index = 0; index < rows.length; index += 1) {
      const result = await processExternalContactCsvRow(rows[index], index + 2);
      created += result.created;
      skipped += result.skipped;
      failed += result.failed;
    }

    logInfo('External Contacts CSV processing completed.');
    updateSummary(`External Contacts CSV finished: ${created} created, ${skipped} skipped, ${failed} failed.`);
  } catch (err) {
    logError(err.message || String(err));
    updateSummary(`External Contacts CSV stopped: ${counters.errors} error(s) and ${counters.warnings} warning(s).`);
  } finally {
    refreshAuthState();
    setBusy(false);
    if (elements.ExternalContactCsvForm) elements.scheduleCsvForm.reset();
  }
}

function initTabs() {
  const tabWrappers = document.querySelectorAll('[data-tabs]');

  tabWrappers.forEach((wrapper) => {
    const buttons = Array.from(wrapper.querySelectorAll('.tab-btn[data-tab-target]'));
    const panels = Array.from(wrapper.querySelectorAll('.tab-panel'));

    function activateTab(targetId) {
      buttons.forEach((button) => {
        const isActive = button.dataset.tabTarget === targetId;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        button.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach((panel) => {
        const isActive = panel.id === targetId;
        panel.classList.toggle('active', isActive);
        panel.hidden = !isActive;
      });

      wrapper.dispatchEvent(new CustomEvent('tabchange', { detail: { id: targetId } }));
    }

    buttons.forEach((button, index) => {
      button.addEventListener('click', () => {
        activateTab(button.dataset.tabTarget);
      });

      button.addEventListener('keydown', (event) => {
        const keys = { ArrowRight: 1, ArrowLeft: -1, Home: 'first', End: 'last' };
        if (!(event.key in keys)) return;
        event.preventDefault();

        let nextIndex = index;
        if (keys[event.key] === 'first') nextIndex = 0;
        else if (keys[event.key] === 'last') nextIndex = buttons.length - 1;
        else nextIndex = (index + keys[event.key] + buttons.length) % buttons.length;

        activateTab(buttons[nextIndex].dataset.tabTarget);
        buttons[nextIndex].focus();
      });
    });

    const initialTab =
      buttons.find((button) => button.classList.contains('active'))?.dataset.tabTarget ||
      buttons[0]?.dataset.tabTarget;

    if (initialTab) {
      activateTab(initialTab);
    }
  });
}

function bindEvents() {
  elements.loginBtn.addEventListener('click', () => {
    openLoginDialog();
  });

  elements.loginForm.addEventListener('submit', submitLoginDialog);

  elements.cancelLoginBtn.addEventListener('click', () => {
    closeLoginDialog();
  });

  elements.loginDialog.addEventListener('close', () => {
    elements.clientIdInput.value = '';
  });

  elements.clientIdInput.addEventListener('input', () => {
    if (!elements.clientIdError.hidden) setClientIdError('');
  });

  elements.copyBtn.addEventListener('click', copyOutput);

  elements.issuesOnly.addEventListener('change', () => {
    elements.output.classList.toggle('only-issues', elements.issuesOnly.checked);
  });

  
  if (elements.scheduleCsvForm) {
    elements.scheduleCsvForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const file = elements.scheduleCsvFile?.files?.[0];

      if (!file) {
        clearOutput();
        logError('Select a schedules CSV file first.');
        return;
      }

      const isAuthenticated = await ensureAuthenticated();
      if (!isAuthenticated) return;

      await processScheduleCsvFile(file);
    });
  }

if (elements.ExternalContactCsvForm) {
    elements.ExternalContactCsvForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const file = elements.ExternalContactCsvFile?.files?.[0];

      if (!file) {
        clearOutput();
        logError('Select a External Contact CSV file first.');
        return;
      }

      const isAuthenticated = await ensureAuthenticated();
      if (!isAuthenticated) return;

      await processExternalContactCsvFile(file);
    });
  }
  
  elements.logoutBtn.addEventListener('click', () => {
    signOut();
  });

  elements.clearBtn.addEventListener('click', () => {
    clearOutput();
  });

  elements.csvForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const file = elements.csvFile.files?.[0];

    if (!file) {
      clearOutput();
      logError('Select a CSV file first.');
      return;
    }

    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) return;

    await processCsvFile(file);
  });
  
  elements.groupMembersForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const groupId = asTrimmedString(elements.groupSelect.value);
    const file = elements.groupMembersFile?.files?.[0];

    if (!groupId) {
      clearOutput();
      logError('Select a group first.');
      return;
    }

    if (!file) {
      clearOutput();
      logError('Select a file with the emails first.');
      return;
    }

    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) return;

    const group = groupsPicker.find(groupId);
    await processGroupMembersFile(file, group || { id: groupId, name: groupId });
  });

  initUtilizationForm();

  elements.cannedForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const file = elements.cannedFile?.files?.[0];
    if (!file) {
      clearOutput();
      logError('Select an Excel or CSV file first.');
      return;
    }

    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) return;

    await processCannedResponsesFile(file, elements.cannedReplaceQuestion.checked);
  });

  elements.utilizationForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const file = elements.utilizationFile?.files?.[0];

    if (utilJsonInvalid) {
      clearOutput();
      logError('The JSON body is not valid. Fix it before applying.');
      return;
    }

    const problem = validateUtilizationBody(utilBody);
    if (problem) {
      clearOutput();
      logError(problem);
      return;
    }

    if (!file) {
      clearOutput();
      logError('Select a file with the emails first.');
      return;
    }

    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) return;

    await processUtilizationFile(file, JSON.parse(JSON.stringify(utilBody)));
  });

  elements.roleAssignForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const divisionId = asTrimmedString(elements.divisionSelect.value);
    const roleId = asTrimmedString(elements.roleSelect.value);
    const file = elements.rolesEmailsFile?.files?.[0];

    if (!divisionId) {
      clearOutput();
      logError('Select a division first.');
      return;
    }

    if (!roleId) {
      clearOutput();
      logError('Select a role first.');
      return;
    }

    if (!file) {
      clearOutput();
      logError('Select a file with the emails first.');
      return;
    }

    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) return;

    const division = divisionsPicker.find(divisionId) || { id: divisionId, name: divisionId };
    const role = rolesPicker.find(roleId) || { id: roleId, name: roleId };
    await processRoleAssignFile(file, division, role);
  });

  document.querySelector('[data-tabs]').addEventListener('tabchange', (event) => {
    if (event.detail.id === 'tab-groups') groupsPicker.load();
    if (event.detail.id === 'tab-roles') {
      divisionsPicker.load();
      rolesPicker.load();
    }
  });

  elements.dnisForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const countryCode = asTrimmedString(elements.dnisCountry.value);
    const dnis = asTrimmedString(elements.dnisNumber.value);

    if (!countryCode) {
      clearOutput();
      logError('Select a country first.');
      return;
    }

    if (!dnis) {
      clearOutput();
      logError('Enter a phone number first.');
      return;
    }

    const isAuthenticated = await ensureAuthenticated();
    if (!isAuthenticated) return;

    await runDnisCheck(countryCode, dnis);
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
  setInterval(refreshAuthState, 15000);
  await handleOAuthCallback();
}

init().catch((err) => {
  clearOutput();
  logError(err.message || String(err));
  refreshAuthState();
});
