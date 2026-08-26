export const ANALYTICS_CONSENT_STORAGE_KEY = "twain:analytics-consent:v1";
export const ANALYTICS_CONSENT_VERSION = 1;
export const ANALYTICS_CONSENT_STATES = Object.freeze([
  "granted",
  "denied",
]);
export const ANALYTICS_CONFIG = Object.freeze({
  enabled: false,
  measurementId: "",
  debug: false,
});

const EVENT_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;
const PARAMETER_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,39}$/;
const MAX_EVENT_PARAMETERS = 25;

export function isGoogleTagId(value) {
  return typeof value === "string" && /^(?:G|GT)-[A-Z0-9]+$/.test(value);
}

function sanitizeEventParameters(parameters) {
  if (!parameters || typeof parameters !== "object") {
    return {};
  }

  const sanitized = {};

  for (const [name, value] of Object.entries(parameters)) {
    if (
      Object.keys(sanitized).length >= MAX_EVENT_PARAMETERS ||
      !PARAMETER_NAME_PATTERN.test(name) ||
      value === null ||
      value === undefined
    ) {
      continue;
    }

    if (
      typeof value === "boolean" ||
      typeof value === "string" ||
      (typeof value === "number" && Number.isFinite(value))
    ) {
      sanitized[name] =
        typeof value === "string" ? value.slice(0, 100) : value;
    }
  }

  return sanitized;
}

function defaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function readAnalyticsConsent(storage = undefined) {
  try {
    const targetStorage = storage === undefined ? defaultStorage() : storage;
    if (typeof targetStorage?.getItem !== "function") {
      return null;
    }

    const stored = targetStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const candidate = JSON.parse(stored);
    const updatedAtTimestamp = Date.parse(candidate?.updatedAt);
    if (
      candidate?.version !== ANALYTICS_CONSENT_VERSION ||
      !ANALYTICS_CONSENT_STATES.includes(candidate?.state) ||
      typeof candidate?.updatedAt !== "string" ||
      !Number.isFinite(updatedAtTimestamp) ||
      new Date(updatedAtTimestamp).toISOString() !== candidate.updatedAt
    ) {
      return null;
    }

    return {
      version: ANALYTICS_CONSENT_VERSION,
      state: candidate.state,
      updatedAt: candidate.updatedAt,
    };
  } catch {
    return null;
  }
}

export function writeAnalyticsConsent(
  state,
  {
    storage = undefined,
    now = new Date(),
  } = {},
) {
  if (!ANALYTICS_CONSENT_STATES.includes(state)) {
    throw new RangeError(`Unsupported analytics consent state: ${state}`);
  }

  const updatedAt = now instanceof Date ? now.toISOString() : null;
  if (updatedAt === null) {
    throw new TypeError("Analytics consent time must be a Date.");
  }

  const record = {
    version: ANALYTICS_CONSENT_VERSION,
    state,
    updatedAt,
  };

  try {
    const targetStorage = storage === undefined ? defaultStorage() : storage;
    if (typeof targetStorage?.setItem !== "function") {
      return null;
    }

    targetStorage.setItem(
      ANALYTICS_CONSENT_STORAGE_KEY,
      JSON.stringify(record),
    );
  } catch {
    return null;
  }

  return record;
}

export function createAnalyticsClient(config = ANALYTICS_CONFIG) {
  let active = false;
  let gtag = null;

  function initialize({
    windowObject = globalThis.window,
    documentObject = globalThis.document,
    storage = undefined,
  } = {}) {
    if (active) {
      return true;
    }

    if (
      !config?.enabled ||
      !isGoogleTagId(config.measurementId) ||
      readAnalyticsConsent(storage)?.state !== "granted" ||
      !windowObject ||
      !documentObject?.head ||
      typeof documentObject.createElement !== "function"
    ) {
      return false;
    }

    windowObject.dataLayer = Array.isArray(windowObject.dataLayer)
      ? windowObject.dataLayer
      : [];
    gtag = (...args) => windowObject.dataLayer.push(args);
    windowObject.gtag = gtag;

    gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    gtag("js", new Date());

    const configuration = {
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    };

    if (config.debug) {
      configuration.debug_mode = true;
    }

    gtag("config", config.measurementId, configuration);

    const script = documentObject.createElement("script");
    script.async = true;
    script.id = "twain-google-tag";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      config.measurementId,
    )}`;
    documentObject.head.append(script);
    active = true;
    return true;
  }

  function event(name, parameters = {}) {
    if (!active || !EVENT_NAME_PATTERN.test(name)) {
      return false;
    }

    gtag("event", name, sanitizeEventParameters(parameters));
    return true;
  }

  function revoke() {
    if (!active) {
      return false;
    }

    gtag("consent", "update", {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    active = false;
    return true;
  }

  return Object.freeze({
    event,
    initialize,
    isActive: () => active,
    revoke,
  });
}

export const analytics = createAnalyticsClient();
