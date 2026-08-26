import assert from "node:assert/strict";
import test from "node:test";

import {
  ANALYTICS_CONFIG,
  ANALYTICS_CONSENT_STORAGE_KEY,
  ANALYTICS_CONSENT_VERSION,
  createAnalyticsClient,
  isGoogleTagId,
  readAnalyticsConsent,
  writeAnalyticsConsent,
} from "../src/analytics.js";
import {
  dailyRunCompleteEvent,
  dailyRunStartEvent,
  hintUsedEvent,
  levelEndEvent,
  levelStartEvent,
} from "../src/telemetry.js";

test("production analytics targets the approved GA4 stream without debug mode", () => {
  assert.deepEqual(ANALYTICS_CONFIG, {
    enabled: true,
    measurementId: "G-BBJX7TJD6W",
    debug: false,
  });
  assert.equal(Object.isFrozen(ANALYTICS_CONFIG), true);
});

function fakeStorage(consent = null, version = ANALYTICS_CONSENT_VERSION) {
  const values = new Map();
  if (consent !== null) {
    values.set(
      ANALYTICS_CONSENT_STORAGE_KEY,
      JSON.stringify({
        version,
        state: consent,
        updatedAt: "2026-08-26T01:02:03.000Z",
      }),
    );
  }
  return {
    getItem: (key) => values.get(key) ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

function fakeEnvironment({
  persistentConsent = "granted",
  sessionConsent = null,
} = {}) {
  const scripts = [];
  return {
    documentObject: {
      createElement: () => ({}),
      head: { append: (script) => scripts.push(script) },
    },
    scripts,
    sessionStorage: fakeStorage(sessionConsent),
    storage: fakeStorage(persistentConsent),
    windowObject: {},
  };
}

test("analytics stays network-silent without all configuration gates", () => {
  for (const [config, consent] of [
    [{ enabled: false, measurementId: "G-ABC123" }, {}],
    [{ enabled: true, measurementId: "" }, {}],
    [
      { enabled: true, measurementId: "G-ABC123" },
      { persistentConsent: null },
    ],
    [
      { enabled: true, measurementId: "G-ABC123" },
      { persistentConsent: null, sessionConsent: "denied" },
    ],
  ]) {
    const environment = fakeEnvironment(consent);
    const client = createAnalyticsClient(config);
    assert.equal(client.initialize(environment), false);
    assert.equal(client.event("daily_run_start"), false);
    assert.deepEqual(environment.scripts, []);
    assert.equal(environment.windowObject.dataLayer, undefined);
  }
});

test("analytics grants persist while denials expire with the page session", () => {
  const persistentStorage = fakeStorage();
  const sessionStorage = fakeStorage();
  const granted = writeAnalyticsConsent("granted", {
    storage: persistentStorage,
    sessionStorage,
    now: new Date("2026-08-26T04:05:06.000Z"),
  });

  assert.deepEqual(granted, {
    version: ANALYTICS_CONSENT_VERSION,
    state: "granted",
    updatedAt: "2026-08-26T04:05:06.000Z",
  });
  assert.deepEqual(
    readAnalyticsConsent(persistentStorage, sessionStorage),
    granted,
  );
  assert.equal(
    sessionStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY),
    null,
  );

  const denied = writeAnalyticsConsent("denied", {
    storage: persistentStorage,
    sessionStorage,
    now: new Date("2026-08-26T05:06:07.000Z"),
  });
  assert.deepEqual(
    readAnalyticsConsent(persistentStorage, sessionStorage),
    denied,
  );
  assert.equal(
    persistentStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY),
    null,
  );
  assert.equal(
    readAnalyticsConsent(persistentStorage, fakeStorage()),
    null,
  );
});

test("analytics migrates misplaced persistent denials into the current session", () => {
  const persistentStorage = fakeStorage("denied");
  const sessionStorage = fakeStorage();
  const migrated = readAnalyticsConsent(persistentStorage, sessionStorage);

  assert.equal(migrated.state, "denied");
  assert.equal(
    persistentStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY),
    null,
  );
  assert.deepEqual(
    readAnalyticsConsent(persistentStorage, sessionStorage),
    migrated,
  );
  assert.equal(
    readAnalyticsConsent(persistentStorage, fakeStorage()),
    null,
  );
});

test("a session denial overrides and removes a persistent grant", () => {
  const persistentStorage = fakeStorage("granted");
  const sessionStorage = fakeStorage("denied");

  assert.equal(
    readAnalyticsConsent(persistentStorage, sessionStorage)?.state,
    "denied",
  );
  assert.equal(
    persistentStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY),
    null,
  );
});

test("v1 consent is discarded instead of authorizing the expanded data boundary", () => {
  const legacyKey = "twain:analytics-consent:v1";
  const persistentStorage = fakeStorage();
  const sessionStorage = fakeStorage();
  const legacyGrant = JSON.stringify({
    version: 1,
    state: "granted",
    updatedAt: "2026-08-26T01:02:03.000Z",
  });
  persistentStorage.setItem(legacyKey, legacyGrant);
  sessionStorage.setItem(legacyKey, legacyGrant);

  assert.equal(readAnalyticsConsent(persistentStorage, sessionStorage), null);
  assert.equal(persistentStorage.getItem(legacyKey), null);
  assert.equal(sessionStorage.getItem(legacyKey), null);
});

test("analytics consent records are versioned, timestamped, and validated", () => {
  const persistentStorage = fakeStorage();
  const sessionStorage = fakeStorage();

  assert.throws(
    () =>
      writeAnalyticsConsent("pending", {
        storage: persistentStorage,
        sessionStorage,
      }),
    RangeError,
  );
  persistentStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "not-json");
  assert.equal(
    readAnalyticsConsent(persistentStorage, sessionStorage),
    null,
  );
  persistentStorage.setItem(
    ANALYTICS_CONSENT_STORAGE_KEY,
    JSON.stringify({
      version: ANALYTICS_CONSENT_VERSION,
      state: "granted",
      updatedAt: "2026-08-26",
    }),
  );
  assert.equal(
    readAnalyticsConsent(persistentStorage, sessionStorage),
    null,
  );
  assert.equal(
    writeAnalyticsConsent("granted", {
      storage: null,
      sessionStorage,
    }),
    null,
  );
  assert.equal(
    writeAnalyticsConsent("denied", {
      storage: null,
      sessionStorage: null,
    }),
    null,
  );
});

test("analytics initializes one privacy-limited Google tag and queues events", () => {
  const environment = fakeEnvironment();
  const client = createAnalyticsClient({
    enabled: true,
    measurementId: "G-ABC123",
    debug: true,
  });

  assert.equal(client.initialize(environment), true);
  assert.equal(client.initialize(environment), true);
  assert.equal(client.event("daily_run_complete", { streak_days: 4 }), true);
  assert.equal(environment.scripts.length, 1);
  assert.deepEqual(environment.scripts[0], {
    async: true,
    id: "twain-google-tag",
    src: "https://www.googletagmanager.com/gtag/js?id=G-ABC123",
  });
  assert.deepEqual(environment.windowObject.dataLayer[0], [
    "consent",
    "default",
    {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    },
  ]);
  assert.equal(environment.windowObject.dataLayer[1][0], "js");
  assert.deepEqual(environment.windowObject.dataLayer[2], [
    "config",
    "G-ABC123",
    {
      send_page_view: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      debug_mode: true,
    },
  ]);
  assert.deepEqual(environment.windowObject.dataLayer[3], [
    "event",
    "daily_run_complete",
    { streak_days: 4 },
  ]);
  assert.equal(client.revoke(), true);
  assert.deepEqual(environment.windowObject.dataLayer.at(-1), [
    "consent",
    "update",
    {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    },
  ]);
  assert.equal(client.event("hint_used"), false);
  assert.equal(client.revoke(), false);
});

test("analytics enforces GA-compatible IDs, event names, and scalar parameters", () => {
  assert.equal(isGoogleTagId("G-ABC123"), true);
  assert.equal(isGoogleTagId("GT-ABC123"), true);
  assert.equal(isGoogleTagId("UA-123"), false);

  const environment = fakeEnvironment();
  const client = createAnalyticsClient({
    enabled: true,
    measurementId: "GT-ABC123",
  });
  client.initialize(environment);
  assert.equal(client.event("not valid", {}), false);
  assert.equal(
    client.event("hint_used", {
      valid_number: 2,
      valid_string: "x".repeat(101),
      invalid_object: { secret: true },
      invalid_number: Number.NaN,
      _reserved_shape: "drop",
    }),
    true,
  );
  assert.deepEqual(environment.windowObject.dataLayer.at(-1), [
    "event",
    "hint_used",
    {
      valid_number: 2,
      valid_string: "x".repeat(100),
    },
  ]);
});

test("Twain telemetry emits bounded game outcomes without paths or identifiers", () => {
  const common = {
    dailyNumber: 4,
    dailyRunVersion: 2,
    displayMode: "browser",
    locale: "zh-TW",
  };
  const events = [
    dailyRunStartEvent({
      ...common,
      difficulty: "easy",
      stageCount: 5,
      streakDays: 3,
    }),
    levelStartEvent({
      ...common,
      boardCells: 25,
      difficulty: "easy",
      stageCount: 5,
      stageNumber: 1,
    }),
    hintUsedEvent({
      ...common,
      boardCells: 25,
      corrected: true,
      dailyElapsedMs: 61_499,
      difficulty: "easy",
      hintNumber: 2,
      occupiedCells: 11,
      stageCount: 5,
      stageNumber: 1,
    }),
    levelEndEvent({
      ...common,
      boardCells: 25,
      dailyElapsedMs: 90_500,
      difficulty: "easy",
      hintsUsedTotal: 2,
      mistakesTotal: 3,
      stageCount: 5,
      stageElapsedMs: 90_500,
      stageHints: 2,
      stageMistakes: 3,
      stageNumber: 1,
    }),
    dailyRunCompleteEvent({
      ...common,
      dailyElapsedMs: 300_400,
      hintsUsedTotal: 4,
      mistakesTotal: 6,
      stageCount: 5,
      streak: {
        currentStreak: 3,
        longestStreak: 7,
        totalCompletedDays: 12,
      },
    }),
  ];

  assert.deepEqual(events.map(({ name }) => name), [
    "daily_run_start",
    "level_start",
    "hint_used",
    "level_end",
    "daily_run_complete",
  ]);
  assert.equal(events[2].parameters.daily_elapsed_seconds, 61);
  assert.equal(events[3].parameters.stage_elapsed_seconds, 91);
  assert.equal(events[4].parameters.streak_days, 3);
  for (const event of events) {
    assert.ok(Object.keys(event.parameters).length <= 25);
    assert.equal("dateKey" in event.parameters, false);
    assert.equal("seed" in event.parameters, false);
    assert.equal("paths" in event.parameters, false);
  }
});
