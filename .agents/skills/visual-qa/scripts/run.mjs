#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { constants as fsConstants } from "node:fs";
import { access, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ANALYTICS_CONFIG,
  ANALYTICS_CONSENT_STORAGE_KEY,
  ANALYTICS_CONSENT_VERSION,
} from "../../../../src/analytics.js";

const SCRIPT_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIRECTORY, "../../../..");
const FIXED_DATE_KEY = "2026-08-29";
const FIXED_NOW = Date.parse("2026-08-29T08:00:00.000Z");
const SOCIAL_ART_DATE_KEY = "2026-08-12";
const SOCIAL_ART_NOW = Date.parse("2026-08-12T08:00:00.000Z");
const COMMAND_TIMEOUT = 15_000;

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function terminateProcess(childProcess) {
  if (
    !childProcess ||
    childProcess.exitCode !== null ||
    childProcess.signalCode !== null
  ) {
    return;
  }

  const exited = new Promise((resolve) => childProcess.once("exit", resolve));
  childProcess.kill("SIGTERM");
  await Promise.race([exited, delay(2_000)]);

  if (childProcess.exitCode === null && childProcess.signalCode === null) {
    childProcess.kill("SIGKILL");
    await Promise.race([exited, delay(2_000)]);
  }
}

function elapsedSeconds(value) {
  const [minutes, seconds] = value.split(":").map(Number);
  return minutes * 60 + seconds;
}

function findAdjacentBodyCollision(solution) {
  for (let tailIndex = 3; tailIndex < solution.length; tailIndex += 1) {
    const tail = solution[tailIndex];

    for (let bodyIndex = 0; bodyIndex < tailIndex - 1; bodyIndex += 1) {
      const body = solution[bodyIndex];
      const distance =
        Math.abs(tail.row - body.row) + Math.abs(tail.col - body.col);

      if (distance === 1) {
        return { bodyIndex, tailIndex };
      }
    }
  }

  throw new Error("The daily Visual QA board has no adjacent path-body collision.");
}

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" ? address?.port : null;

      server.close((error) => {
        if (error) {
          reject(error);
        } else if (!port) {
          reject(new Error("Could not reserve a local HTTP port."));
        } else {
          resolve(port);
        }
      });
    });
  });
}

async function waitForHttp(url, processState) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (processState.exited) {
      throw new Error(
        `Local server exited before it was ready: ${processState.stderr}`,
      );
    }

    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // The server is still starting.
    }

    await delay(50);
  }

  throw new Error(`Timed out waiting for ${url}.`);
}

async function findBrowserExecutable() {
  const configured = process.env.TWAIN_BROWSER_PATH;
  const candidates = [
    configured,
    process.platform === "darwin"
      ? "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
      : null,
    process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : null,
    process.platform === "darwin"
      ? "/Applications/Chromium.app/Contents/MacOS/Chromium"
      : null,
    process.platform === "linux" ? "/usr/bin/microsoft-edge" : null,
    process.platform === "linux" ? "/usr/bin/google-chrome" : null,
    process.platform === "linux" ? "/usr/bin/chromium" : null,
    process.platform === "linux" ? "/usr/bin/chromium-browser" : null,
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      await access(candidate, fsConstants.X_OK);
      return candidate;
    } catch {
      // Try the next supported Chromium executable.
    }
  }

  throw new Error(
    "No supported Chromium browser was found. Set TWAIN_BROWSER_PATH to a Chrome, Chromium, or Edge executable.",
  );
}

class CdpPipe {
  constructor(input, output) {
    this.input = input;
    this.output = output;
    this.buffer = "";
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = new Set();
    this.listeners = new Set();

    output.setEncoding("utf8");
    output.on("data", (chunk) => this.#receive(chunk));
    output.on("error", (error) => this.#close(error));
    output.on("close", () => this.#close(new Error("Browser CDP pipe closed.")));
  }

  call(method, params = {}, sessionId = undefined) {
    const id = this.nextId;
    this.nextId += 1;
    const message = { id, method, params };

    if (sessionId) {
      message.sessionId = sessionId;
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out after ${COMMAND_TIMEOUT}ms.`));
      }, COMMAND_TIMEOUT);

      this.pending.set(id, { resolve, reject, timeout, method });
      this.input.write(`${JSON.stringify(message)}\0`);
    });
  }

  waitFor(method, sessionId, predicate = () => true) {
    return new Promise((resolve, reject) => {
      const waiter = {
        method,
        sessionId,
        predicate,
        resolve,
        reject,
        timeout: null,
      };

      waiter.timeout = setTimeout(() => {
        this.waiters.delete(waiter);
        reject(new Error(`${method} event timed out after ${COMMAND_TIMEOUT}ms.`));
      }, COMMAND_TIMEOUT);

      this.waiters.add(waiter);
    });
  }

  onEvent(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  #receive(chunk) {
    this.buffer += chunk;
    const messages = this.buffer.split("\0");
    this.buffer = messages.pop() ?? "";

    for (const source of messages) {
      if (source) {
        this.#dispatch(JSON.parse(source));
      }
    }
  }

  #dispatch(message) {
    if (message.id) {
      const pending = this.pending.get(message.id);

      if (!pending) {
        return;
      }

      clearTimeout(pending.timeout);
      this.pending.delete(message.id);

      if (message.error) {
        pending.reject(
          new Error(`${pending.method}: ${message.error.message ?? "CDP error"}`),
        );
      } else {
        pending.resolve(message.result ?? {});
      }

      return;
    }

    for (const listener of this.listeners) {
      listener(message);
    }

    for (const waiter of this.waiters) {
      if (
        waiter.method === message.method &&
        waiter.sessionId === message.sessionId &&
        waiter.predicate(message.params ?? {})
      ) {
        clearTimeout(waiter.timeout);
        this.waiters.delete(waiter);
        waiter.resolve(message.params ?? {});
      }
    }
  }

  #close(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timeout);
      pending.reject(error);
    }

    this.pending.clear();

    for (const waiter of this.waiters) {
      clearTimeout(waiter.timeout);
      waiter.reject(error);
    }

    this.waiters.clear();
  }
}

function parseOutputDirectory() {
  const outputIndex = process.argv.indexOf("--output");

  if (outputIndex >= 0 && process.argv[outputIndex + 1]) {
    return path.resolve(process.argv[outputIndex + 1]);
  }

  const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
  return path.join(tmpdir(), `twain-visual-qa-${timestamp}`);
}

function keyDefinition(key) {
  const definitions = {
    ArrowDown: { code: "ArrowDown", virtualKey: 40 },
    ArrowLeft: { code: "ArrowLeft", virtualKey: 37 },
    ArrowRight: { code: "ArrowRight", virtualKey: 39 },
    ArrowUp: { code: "ArrowUp", virtualKey: 38 },
    Backspace: { code: "Backspace", virtualKey: 8 },
    Enter: { code: "Enter", virtualKey: 13 },
    End: { code: "End", virtualKey: 35 },
    Escape: { code: "Escape", virtualKey: 27 },
    Home: { code: "Home", virtualKey: 36 },
    Tab: { code: "Tab", virtualKey: 9 },
    h: { code: "KeyH", virtualKey: 72 },
    l: { code: "KeyL", virtualKey: 76 },
    n: { code: "KeyN", virtualKey: 78 },
    r: { code: "KeyR", virtualKey: 82 },
  };

  return definitions[key] ?? { code: key, virtualKey: 0 };
}

async function main() {
  const outputDirectory = parseOutputDirectory();
  const browserExecutable = await findBrowserExecutable();
  const profileDirectory = await mkdtemp(
    path.join(tmpdir(), "twain-visual-qa-profile-"),
  );
  const port = await findFreePort();
  const repositoryName = encodeURIComponent(path.basename(PROJECT_ROOT));
  const baseUrl = `http://127.0.0.1:${port}/${repositoryName}/`;
  const screenshots = [];
  const checks = [];
  const pageErrors = [];
  const analyticsRequests = [];
  let serverProcess = null;
  let browserProcess = null;

  await mkdir(outputDirectory, { recursive: true });

  try {
    const serverState = { exited: false, stderr: "" };
    serverProcess = spawn(
      "python3",
      ["-m", "http.server", String(port), "--bind", "127.0.0.1"],
      {
        cwd: path.dirname(PROJECT_ROOT),
        stdio: ["ignore", "ignore", "pipe"],
      },
    );
    serverProcess.stderr.setEncoding("utf8");
    serverProcess.stderr.on("data", (chunk) => {
      serverState.stderr += chunk;
    });
    serverProcess.once("exit", () => {
      serverState.exited = true;
    });
    await waitForHttp(`${baseUrl}index.html`, serverState);

    browserProcess = spawn(
      browserExecutable,
      [
        "--headless=new",
        "--remote-debugging-pipe",
        `--user-data-dir=${profileDirectory}`,
        "--disable-background-networking",
        "--disable-component-update",
        "--disable-default-apps",
        "--disable-extensions",
        "--disable-sync",
        "--metrics-recording-only",
        "--mute-audio",
        "--no-default-browser-check",
        "--no-first-run",
        "about:blank",
      ],
      { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] },
    );

    let browserStderr = "";
    browserProcess.stderr.setEncoding("utf8");
    browserProcess.stderr.on("data", (chunk) => {
      browserStderr += chunk;
    });

    const cdp = new CdpPipe(browserProcess.stdio[3], browserProcess.stdio[4]);
    await cdp.call("Browser.getVersion");
    const { targetId } = await cdp.call("Target.createTarget", {
      url: "about:blank",
    });
    const { sessionId } = await cdp.call("Target.attachToTarget", {
      targetId,
      flatten: true,
    });

    await Promise.all([
      cdp.call("Page.enable", {}, sessionId),
      cdp.call("Runtime.enable", {}, sessionId),
      cdp.call("Log.enable", {}, sessionId),
      cdp.call("Network.enable", {}, sessionId),
      cdp.call(
        "Fetch.enable",
        {
          patterns: [
            { urlPattern: "*googletagmanager.com*" },
            { urlPattern: "*google-analytics.com*" },
          ],
        },
        sessionId,
      ),
    ]);
    await cdp.call(
      "Page.addScriptToEvaluateOnNewDocument",
      {
        source: `(() => {
          const NativeDate = Date;
          const requestedNow = new URLSearchParams(globalThis.location.search).get('qaNow');
          const requestedConsent = new URLSearchParams(globalThis.location.search).get('qaConsent');
          const parsedNow = Number(requestedNow);
          globalThis.__twainVisualNow = requestedNow !== null && Number.isFinite(parsedNow)
            ? parsedNow
            : ${FIXED_NOW};
          class FixedDate extends NativeDate {
            constructor(...args) {
              super(...(args.length === 0 ? [globalThis.__twainVisualNow] : args));
            }
            static now() {
              return globalThis.__twainVisualNow;
            }
          }
          globalThis.Date = FixedDate;
          try {
            const consentKey = ${JSON.stringify(ANALYTICS_CONSENT_STORAGE_KEY)};
            const legacyConsentKey = 'twain:analytics-consent:v1';
            localStorage.removeItem(legacyConsentKey);
            sessionStorage.removeItem(legacyConsentKey);
            if (requestedConsent === 'granted' || requestedConsent === 'denied') {
              const consentRecord = JSON.stringify({
                version: ${ANALYTICS_CONSENT_VERSION},
                state: requestedConsent,
                updatedAt: new NativeDate(globalThis.__twainVisualNow).toISOString(),
              });
              if (requestedConsent === 'granted') {
                sessionStorage.removeItem(consentKey);
                localStorage.setItem(consentKey, consentRecord);
              } else {
                localStorage.removeItem(consentKey);
                sessionStorage.setItem(consentKey, consentRecord);
              }
            } else if (requestedConsent === 'unset') {
              localStorage.removeItem(consentKey);
              sessionStorage.removeItem(consentKey);
            }
          } catch {
            // about:blank and locked-down contexts may not expose storage.
          }
        })();`,
      },
      sessionId,
    );

    cdp.onEvent((message) => {
      if (message.sessionId !== sessionId) {
        return;
      }

      if (message.method === "Runtime.exceptionThrown") {
        pageErrors.push(
          message.params?.exceptionDetails?.exception?.description ??
            message.params?.exceptionDetails?.text ??
            "Unknown runtime exception",
        );
      }

      if (
        message.method === "Log.entryAdded" &&
        message.params?.entry?.level === "error"
      ) {
        pageErrors.push(message.params.entry.text);
      }

      if (message.method === "Fetch.requestPaused") {
        const requestId = message.params?.requestId;
        const url = message.params?.request?.url ?? "";

        if (
          requestId &&
          /google-analytics\.com|googletagmanager\.com/.test(url)
        ) {
          analyticsRequests.push(url);
          const isTagScript = /googletagmanager\.com\/gtag\/js/.test(url);
          const response = {
            requestId,
            responseCode: isTagScript ? 200 : 204,
            responseHeaders: isTagScript
              ? [{ name: "Content-Type", value: "application/javascript" }]
              : [],
          };

          if (isTagScript) {
            response.body = "";
          }

          void cdp
            .call("Fetch.fulfillRequest", response, sessionId)
            .catch((error) =>
              pageErrors.push(`Analytics interception failed: ${error.message}`),
            );
        }
      }
    });

    const evaluate = async (expression) => {
      const response = await cdp.call(
        "Runtime.evaluate",
        {
          expression,
          awaitPromise: true,
          returnByValue: true,
          userGesture: true,
        },
        sessionId,
      );

      if (response.exceptionDetails) {
        throw new Error(
          response.exceptionDetails.exception?.description ??
            response.exceptionDetails.text ??
            "Page evaluation failed.",
        );
      }

      return response.result?.value;
    };

    const configureViewport = async ({
      width,
      height,
      mobile = false,
      reduced = false,
    }) => {
      await cdp.call(
        "Emulation.setDeviceMetricsOverride",
        {
          width,
          height,
          deviceScaleFactor: 1,
          mobile,
          screenWidth: width,
          screenHeight: height,
        },
        sessionId,
      );
      await cdp.call(
        "Emulation.setTouchEmulationEnabled",
        { enabled: mobile, maxTouchPoints: mobile ? 5 : 1 },
        sessionId,
      );
      await cdp.call(
        "Emulation.setEmulatedMedia",
        {
          media: "screen",
          features: [
            {
              name: "prefers-reduced-motion",
              value: reduced ? "reduce" : "no-preference",
            },
          ],
        },
        sessionId,
      );
    };

    const navigate = async (url) => {
      const loaded = cdp.waitFor("Page.loadEventFired", sessionId);
      await cdp.call("Page.navigate", { url }, sessionId);
      await loaded;
    };

    let navigationSequence = 0;
    const loadViewport = async ({
      width,
      height,
      mobile = false,
      reduced = false,
      fresh = true,
      query = "",
      now = FIXED_NOW,
      consent = "denied",
    }) => {
      await configureViewport({ width, height, mobile, reduced });

      if (fresh) {
        await navigate("about:blank");
        await cdp.call(
          "Storage.clearDataForOrigin",
          {
            origin: new URL(baseUrl).origin,
            storageTypes: "local_storage",
          },
          sessionId,
        );
      }

      navigationSequence += 1;
      const parameters = new URLSearchParams(query);
      parameters.set("qa", String(navigationSequence));
      parameters.set("qaNow", String(now));
      parameters.set("qaConsent", consent);
      await navigate(`${baseUrl}?${parameters}`);

      for (let attempt = 0; attempt < 100; attempt += 1) {
        const ready = await evaluate(
          "document.readyState === 'complete' && Boolean(document.querySelector('#board .cell-hit'))",
        );

        if (ready) {
          await delay(60);
          return;
        }

        await delay(25);
      }

      throw new Error(`Twain did not render at ${width}x${height}.`);
    };

    const capture = async (
      name,
      { centerSelector = null, fullPage = false } = {},
    ) => {
      let scrollPosition = null;
      const parameters = { format: "png", fromSurface: true };

      if (fullPage || centerSelector) {
        scrollPosition = await evaluate(
          "({ x: window.scrollX, y: window.scrollY })",
        );
      }

      if (fullPage) {
        await evaluate("window.scrollTo(0, 0)");
        await delay(30);
        const metrics = await cdp.call("Page.getLayoutMetrics", {}, sessionId);
        const content = metrics.cssContentSize;
        parameters.captureBeyondViewport = true;
        parameters.clip = {
          x: 0,
          y: 0,
          width: Math.ceil(content.width),
          height: Math.ceil(content.height),
          scale: 1,
        };
      } else if (centerSelector) {
        await evaluate(
          `document.querySelector(${JSON.stringify(centerSelector)}).scrollIntoView({ block: 'center', inline: 'nearest' })`,
        );
        await delay(30);
      }

      const response = await cdp.call(
        "Page.captureScreenshot",
        parameters,
        sessionId,
      );
      const filename = path.join(outputDirectory, `${name}.png`);
      await writeFile(filename, Buffer.from(response.data, "base64"));
      screenshots.push(filename);

      if (scrollPosition) {
        await evaluate(`window.scrollTo(${scrollPosition.x}, ${scrollPosition.y})`);
      }
    };

    const seekConfetti = async (milliseconds) => {
      await evaluate(`(() => {
        for (const piece of document.querySelectorAll('.celebration-burst span')) {
          for (const animation of piece.getAnimations()) {
            animation.pause();
            animation.currentTime = ${JSON.stringify(milliseconds)};
          }
        }
      })()`);
      await delay(30);
    };

    const state = () =>
      evaluate(`(() => {
        const hits = [...document.querySelectorAll('#board .cell-hit')];
        const occupied = hits.filter((hit) => hit.dataset.occupiedLine).length;
        const numberLineClue = document.querySelector('.clue-slot.line-a');
        const letterLineClue = document.querySelector('.clue-slot.line-b');
        const gameCard = document.querySelector('.game-card');
        const gameCardStyle = getComputedStyle(gameCard);
        const rootStyle = getComputedStyle(document.documentElement);
        const board = document.querySelector('#board');
        const brandMark = document.querySelector('.brand-mark');
        const brandMarkRect = brandMark.getBoundingClientRect();
        const brandText = document.querySelector('.brand > span:last-child');
        const headerDateStyle = getComputedStyle(document.querySelector('#dailyDate'));
        const helpButton = document.querySelector('#helpButton');
        const helpButtonStyle = getComputedStyle(helpButton);
        const helpButtonRect = helpButton.getBoundingClientRect();
        const timerIcon = document.querySelector('#dailyTimer svg');
        const storedJson = (storage, key) => {
          try {
            const value = storage.getItem(key);
            return value === null ? null : JSON.parse(value);
          } catch {
            return null;
          }
        };
        const analyticsPersistentConsent = storedJson(
          localStorage,
          ${JSON.stringify(ANALYTICS_CONSENT_STORAGE_KEY)},
        );
        const analyticsSessionConsent = storedJson(
          sessionStorage,
          ${JSON.stringify(ANALYTICS_CONSENT_STORAGE_KEY)},
        );
        return {
          activeElement: document.activeElement?.id || document.activeElement?.className || document.activeElement?.tagName,
          activeLanguageOption: document.activeElement?.dataset?.locale ?? null,
          activeLine: board.dataset.activeLine,
          boardAnimationName: getComputedStyle(board).animationName,
          brandMarkLoaded: brandMark.complete && brandMark.naturalWidth > 0,
          brandMarkSource: brandMark.getAttribute('src'),
          brandMarkSquare: Math.abs(brandMarkRect.width - brandMarkRect.height) < 0.5,
          brandTextVisible: getComputedStyle(brandText).display !== 'none' && brandText.getBoundingClientRect().width > 0,
          clearDisabled: document.querySelector('#clearButton').disabled,
          clearLabel: document.querySelector('#clearButton').textContent.trim(),
          completionCountdown: document.querySelector('#completionCountdown').textContent.trim(),
          completionCountdownHidden: document.querySelector('#completionCountdown').hidden,
          completionHidden: document.querySelector('#completionOverlay').hidden,
          completionKickerPresent: Boolean(document.querySelector('#completionKicker, .completion-kicker')),
          completionStats: document.querySelector('#completionStats').textContent.trim(),
          completionTitle: document.querySelector('#completionTitle').textContent.trim(),
          continueHidden: document.querySelector('#continueButton').hidden,
          continueLabel: document.querySelector('#continueButton').textContent.trim(),
          dailyDate: document.querySelector('#dailyDate').textContent.trim(),
          dailyDateAriaLabel: document.querySelector('#dailyDate').getAttribute('aria-label'),
          dailyProgress: document.querySelector('#dailyProgress').getAttribute('aria-valuetext'),
          dailyProgressCopyPresent: Boolean(document.querySelector('.daily-progress-copy, #dailyProgressValue')),
          dailyProgressMax: document.querySelector('#dailyProgress').getAttribute('aria-valuemax'),
          dailyProgressNow: document.querySelector('#dailyProgress').getAttribute('aria-valuenow'),
          dailySchedule: [...document.querySelectorAll('[data-daily-step]')].map((step) => step.title.toLowerCase()),
          difficulty: document.querySelector('#board').dataset.difficulty,
          documentLanguage: document.documentElement.lang,
          documentTitle: document.title,
          difficultySelectorPresent: Boolean(document.querySelector('[data-difficulty]:not(#board)')),
          footerPresent: Boolean(document.querySelector('footer')),
          releaseVersion: document.querySelector('#releaseVersion')?.textContent.trim() ?? null,
          headerDateColor: headerDateStyle.color,
          headerDateFontSize: headerDateStyle.fontSize,
          headerDateLetterSpacing: headerDateStyle.letterSpacing,
          helpButtonPresent: Boolean(document.querySelector('#helpButton')),
          helpButtonBackground: helpButtonStyle.backgroundColor,
          helpButtonColor: helpButtonStyle.color,
          helpButtonIsRound: helpButtonStyle.borderRadius === '50%' && Math.abs(helpButtonRect.width - helpButtonRect.height) < 0.5,
          helpDialogOpen: document.querySelector('#howToDialog').open,
          howToTitle: document.querySelector('#howToTitle').textContent.trim(),
          headerShareCopyLabel: document.querySelector('#copyHeaderShareButton').textContent.trim(),
          headerShareInstructions: document.querySelector('#headerShareInstructions').textContent.trim(),
          headerShareOpen: document.querySelector('#headerShareDialog').open,
          headerShareQrModuleCount: document.querySelector('#headerShareQr').dataset.moduleCount ?? null,
          headerShareQrValue: document.querySelector('#headerShareQr').dataset.value ?? null,
          headerShareTitle: document.querySelector('#headerShareTitle').textContent.trim(),
          headerShareUrl: document.querySelector('#headerShareUrl').value,
          hintDisabled: document.querySelector('#hintButton').disabled,
          inlineHowToPresent: Boolean(document.querySelector('details.how-to')),
          introCopyPresent: Boolean(document.querySelector('#introCopy')),
          letterLineOpacity: letterLineClue ? getComputedStyle(letterLineClue).opacity : null,
          languageButtonPresent: Boolean(document.querySelector('#languageButton')),
          languageExpanded: document.querySelector('#languageButton').getAttribute('aria-expanded'),
          languageMenuHidden: document.querySelector('#languageMenu').hidden,
          languageMenuOptions: [...document.querySelectorAll('.language-option')].map((option) => ({
            checked: option.getAttribute('aria-checked'),
            label: option.querySelector('span:last-child').textContent.trim(),
            locale: option.dataset.locale,
          })),
          languageOverride: localStorage.getItem('twain:locale:v1'),
          lineSelectorPresent: Boolean(document.querySelector('.line-selector')),
          modeSelectorPresent: Boolean(document.querySelector('[data-mode]')),
          newButtonPresent: Boolean(document.querySelector('#newBoardButton, #newPuzzleButton')),
          numberLineOpacity: numberLineClue ? getComputedStyle(numberLineClue).opacity : null,
          analyticsConfiguration: (() => {
            if (!Array.isArray(window.dataLayer)) return null;
            const command = window.dataLayer.find((entry) => entry?.[0] === 'config');
            return command
              ? { measurementId: command[1], parameters: command[2] }
              : null;
          })(),
          analyticsConsent: analyticsSessionConsent ?? analyticsPersistentConsent,
          analyticsDataLayerPresent: Array.isArray(window.dataLayer),
          analyticsPersistentConsent,
          analyticsSessionConsent,
          analyticsTagPresent: Boolean(document.querySelector('#twain-google-tag')),
          privacyBannerCopy: document.querySelector('#privacyBannerCopy').textContent.trim(),
          privacyBannerHidden: document.querySelector('#privacyBanner').hidden,
          privacyBannerTitle: document.querySelector('#privacyBannerTitle').textContent.trim(),
          privacyBodyClass: document.body.classList.contains('has-privacy-banner'),
          privacyDialogOpen: document.querySelector('#privacyDialog').open,
          privacyDialogIntro: document.querySelector('#privacyDialogIntro').textContent.trim(),
          privacyDialogTitle: document.querySelector('#privacyDialogTitle').textContent.trim(),
          privacyCollectCopy: document.querySelector('#privacyCollectCopy').textContent.trim(),
          privacyAvoidCopy: document.querySelector('#privacyAvoidCopy').textContent.trim(),
          privacyPreferencesLabel: document.querySelector('#privacyPreferencesButton').textContent.trim(),
          privacyStatus: document.querySelector('#privacyStatus').textContent.trim(),
          progress: \`\${occupied}/\${hits.length}\`,
          progressEyebrowPresent: Boolean(document.querySelector('.daily-progress-label')),
          puzzleMetaPresent: Boolean(document.querySelector('#puzzleMeta, .puzzle-meta')),
          query: window.location.search,
          routeAAccent: gameCardStyle.getPropertyValue('--route-a-accent').trim(),
          routeBAccent: gameCardStyle.getPropertyValue('--route-b-accent').trim(),
          routePalette: gameCard.dataset.routePalette,
          rulesRouteAAccent: rootStyle.getPropertyValue('--route-a-accent').trim(),
          rulesRouteBAccent: rootStyle.getPropertyValue('--route-b-accent').trim(),
          scrollY: window.scrollY,
          shareResultHidden: document.querySelector('#shareResultButton').hidden,
          shareResultLabel: document.querySelector('#shareResultButton').textContent.trim(),
          shareButtonPresent: Boolean(document.querySelector('#shareButton')),
          shareFallbackOpen: document.querySelector('#shareFallbackDialog').open,
          shareFallbackInstructions: document.querySelector('#shareFallbackInstructions').textContent.trim(),
          shareFallbackText: document.querySelector('#shareFallbackText').value,
          shareFeedbackHidden: document.querySelector('#shareFeedback').hidden,
          shareFeedbackText: document.querySelector('#shareFeedback').textContent.trim(),
          status: document.querySelector('#liveAnnouncer').textContent,
          statusMessagePresent: Boolean(document.querySelector('#statusMessage')),
          statusPanelPresent: Boolean(document.querySelector('.status-panel')),
          streak: storedJson(localStorage, 'twain:streak:v1'),
          timer: document.querySelector('#timerValue').textContent,
          timerIconDisplay: getComputedStyle(timerIcon).display,
          timerLabel: document.querySelector('#dailyTimer').getAttribute('aria-label'),
          undoDisabled: document.querySelector('#undoButton').disabled,
        };
      })()`);

    const assertLayout = async (label) => {
      await evaluate("window.scrollTo(0, 0)");
      await delay(30);
      const layout = await evaluate(`(() => {
        const selectors = 'button, .brand, .clue-disc, .board, #dailyDate, .site-footer';
        const overflow = [...document.querySelectorAll(selectors)]
          .filter((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== 'none' && rect.width > 0 && rect.height > 0;
          })
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return { label: element.id || element.textContent.trim() || element.className, left: rect.left, right: rect.right };
          })
          .filter((rect) => rect.left < -0.5 || rect.right > window.innerWidth + 0.5);
        const board = document.querySelector('#board').getBoundingClientRect();
        const gameCard = document.querySelector('.game-card').getBoundingClientRect();
        const footerElement = document.querySelector('.site-footer');
        const footer = footerElement.getBoundingClientRect();
        const footerStyle = getComputedStyle(footerElement);
        const headerDate = document.querySelector('#dailyDate');
        const headerDateRect = headerDate.getBoundingClientRect();
        const headerDateStyle = getComputedStyle(headerDate);
        const brand = document.querySelector('.brand').getBoundingClientRect();
        const brandMark = document.querySelector('.brand-mark');
        const brandMarkRect = brandMark.getBoundingClientRect();
        const brandText = document.querySelector('.brand > span:last-child');
        const helpButtonStyle = getComputedStyle(document.querySelector('#helpButton'));
        const helpButton = document.querySelector('#helpButton').getBoundingClientRect();
        const shareButton = document.querySelector('#shareButton').getBoundingClientRect();
        const languageButton = document.querySelector('#languageButton').getBoundingClientRect();
        const timerIconDisplay = getComputedStyle(document.querySelector('#dailyTimer svg')).display;
        const timer = document.querySelector('#dailyTimer').getBoundingClientRect();
        const progress = document.querySelector('#dailyProgress').getBoundingClientRect();
        const clear = document.querySelector('#clearButton').getBoundingClientRect();
        const clues = [...document.querySelectorAll('.clue-disc')].map((disc) => {
          const discRect = disc.getBoundingClientRect();
          const discStyle = getComputedStyle(disc);
          const valueRect = disc.querySelector('.clue-value').getBoundingClientRect();
          return {
            glyphCount: Number(disc.dataset.glyphCount),
            horizontalOffset: (valueRect.left + valueRect.width / 2) - (discRect.left + discRect.width / 2),
            isWide: disc.classList.contains('is-wide'),
            label: disc.textContent.trim(),
            lineId: disc.closest('.clue-slot').dataset.lineId,
            leftInset: valueRect.left - discRect.left - Number.parseFloat(discStyle.borderLeftWidth),
            rightInset: discRect.right - Number.parseFloat(discStyle.borderRightWidth) - valueRect.right,
            verticalOffset: (valueRect.top + valueRect.height / 2) - (discRect.top + discRect.height / 2),
          };
        });
        return {
          board: { left: board.left, right: board.right, top: board.top, bottom: board.bottom, width: board.width, height: board.height },
          gameCard: { bottom: gameCard.bottom },
          footer: {
            bottom: footer.bottom,
            color: footerStyle.color,
            fontSize: footerStyle.fontSize,
            left: footer.left,
            right: footer.right,
            top: footer.top,
          },
          releaseVersion: footerElement.textContent.trim(),
          clues,
          documentWidth: document.documentElement.scrollWidth,
          innerHeight: window.innerHeight,
          innerWidth: window.innerWidth,
          overflow,
          headerDate: headerDate.textContent.trim(),
          headerDateStyle: {
            color: headerDateStyle.color,
            fontSize: headerDateStyle.fontSize,
            fontStyle: headerDateStyle.fontStyle,
            fontWeight: headerDateStyle.fontWeight,
            letterSpacing: headerDateStyle.letterSpacing,
          },
          helpButtonBackground: helpButtonStyle.backgroundColor,
          helpButtonColor: helpButtonStyle.color,
          headerActions: {
            help: { left: helpButton.left, right: helpButton.right },
            share: { left: shareButton.left, right: shareButton.right },
            language: { left: languageButton.left, right: languageButton.right },
          },
          headerContent: {
            brand: { left: brand.left, right: brand.right },
            date: { left: headerDateRect.left, right: headerDateRect.right },
          },
          brandMarkLoaded: brandMark.complete && brandMark.naturalWidth > 0,
          brandMarkSource: brandMark.getAttribute('src'),
          brandMarkSquare: Math.abs(brandMarkRect.width - brandMarkRect.height) < 0.5,
          brandTextVisible: getComputedStyle(brandText).display !== 'none' && brandText.getBoundingClientRect().width > 0,
          timerIconDisplay,
          toolbar: {
            timer: { left: timer.left, right: timer.right },
            progress: { left: progress.left, right: progress.right },
            clear: { left: clear.left, right: clear.right },
          },
          title: document.title,
          documentLanguage: document.documentElement.lang,
        };
      })()`);

      const localizedIdentity = {
        en: { title: "Twain — Never the twain shall meet", date: "#4 | Aug 29" },
        "zh-TW": { title: "Twain — 兩條路線，永不相交", date: "#4 | 8月29日" },
        "zh-CN": { title: "Twain — 两条路线，永不相交", date: "#4 | 8月29日" },
        ja: { title: "Twain — 2本のラインは交わらない", date: "#4 | 8月29日" },
        ko: { title: "Twain — 두 선은 만나지 않습니다", date: "#4 | 8월 29일" },
        es: { title: "Twain — Dos líneas que nunca se encuentran", date: "#4 | 29 ago" },
        "pt-BR": { title: "Twain — Duas linhas que nunca se encontram", date: "#4 | 29 de ago." },
      }[layout.documentLanguage];
      assert.ok(localizedIdentity, `${label} has an unsupported document language`);
      assert.equal(layout.title, localizedIdentity.title);
      assert.equal(layout.headerDate, localizedIdentity.date);
      assert.doesNotMatch(layout.headerDate, /GMT|UTC/);
      assert.equal(
        layout.headerDateStyle.fontSize,
        layout.innerWidth <= 360 ? "14px" : "16px",
      );
      assert.equal(layout.headerDateStyle.fontStyle, "normal");
      assert.equal(layout.headerDateStyle.fontWeight, "760");
      assert.equal(layout.headerDateStyle.letterSpacing, "normal");
      assert.equal(layout.brandMarkLoaded, true);
      assert.equal(layout.brandMarkSource, "./assets/twain-mark.svg");
      assert.equal(layout.brandMarkSquare, true);
      assert.equal(layout.brandTextVisible, true);
      assert.equal(layout.helpButtonBackground, "rgb(25, 25, 25)");
      assert.equal(layout.helpButtonColor, "rgb(255, 255, 255)");
      assert.notEqual(layout.timerIconDisplay, "none");
      assert.ok(
        layout.headerActions.help.right <= layout.headerActions.share.left + 0.5 &&
          layout.headerActions.share.right <= layout.headerActions.language.left + 0.5 &&
          layout.headerActions.language.right <= layout.innerWidth + 0.5,
        `${label} does not keep Help, Share, Language in order: ${JSON.stringify(layout.headerActions)}`,
      );
      assert.ok(
        layout.headerContent.brand.right <= layout.headerContent.date.left + 0.5 &&
          layout.headerContent.date.right <= layout.headerActions.help.left + 0.5,
        `${label} has overlapping header content: ${JSON.stringify({ ...layout.headerContent, actions: layout.headerActions })}`,
      );

      assert.equal(layout.headerDateStyle.color, "rgb(25, 25, 25)");
      assert.ok(
        layout.documentWidth <= layout.innerWidth,
        `${label} has horizontal page overflow: ${JSON.stringify(layout)}`,
      );
      assert.deepEqual(layout.overflow, [], `${label} has clipped controls or clues`);
      assert.match(layout.releaseVersion, /^v\d{6}r[1-9]\d*$/);
      assert.equal(layout.footer.color, "rgb(139, 135, 130)");
      assert.equal(layout.footer.fontSize, "11px");
      assert.ok(
        layout.footer.top >= layout.gameCard.bottom - 0.5,
        `${label} footer overlaps the game card: ${JSON.stringify(layout.footer)}`,
      );
      assert.deepEqual(
        layout.clues.filter((clue) => clue.glyphCount > 1 && !clue.isWide),
        [],
        `${label} has an unclassified multi-glyph clue`,
      );
      assert.deepEqual(
        layout.clues.filter(
          (clue) => clue.leftInset < -0.5 || clue.rightInset < -0.5,
        ),
        [],
        `${label} has a clue glyph crossing its inner border`,
      );
      assert.deepEqual(
        layout.clues.filter((clue) => Math.abs(clue.verticalOffset) > 1.25),
        [],
        `${label} has a vertically misaligned clue glyph`,
      );
      assert.deepEqual(
        layout.clues.filter(
          (clue) => clue.glyphCount === 1 && Math.abs(clue.horizontalOffset) > 1.25,
        ),
        [],
        `${label} has a horizontally misaligned single-glyph clue`,
      );
      assert.deepEqual(
        layout.clues.filter(
          (clue) =>
            clue.isWide &&
            clue.lineId === "a" &&
            (clue.horizontalOffset > -0.25 || clue.horizontalOffset < -1.75),
        ),
        [],
        `${label} is missing the numeric multi-glyph optical correction`,
      );
      assert.ok(
        Math.abs(layout.board.width - layout.board.height) < 1,
        `${label} board is not square`,
      );
      assert.ok(
        layout.board.top >= -0.5 && layout.board.bottom <= layout.innerHeight + 0.5,
        `${label} board is not fully above the fold: ${JSON.stringify(layout)}`,
      );
      assert.ok(
        layout.toolbar.timer.right <= layout.toolbar.progress.left + 0.5 &&
          layout.toolbar.progress.right <= layout.toolbar.clear.left + 0.5,
        `${label} toolbar is not ordered timer, daily progress, Clear: ${JSON.stringify(layout.toolbar)}`,
      );
      checks.push(
        `${label}: no overflow, aligned clue glyphs, square board above the fold, quiet release footer, and timer/progress/Clear toolbar order`,
      );
    };

    const puzzle = async (stageIndex = 0, dateKey = FIXED_DATE_KEY) =>
      evaluate(`(async () => {
        const { generatePuzzle } = await import('./src/generator.js');
        const { dailyDifficultyAt, dailyStageSeed } = await import('./src/daily.js');
        const difficulty = dailyDifficultyAt(${JSON.stringify(dateKey)}, ${stageIndex});
        return generatePuzzle(difficulty, { seed: dailyStageSeed(${JSON.stringify(dateKey)}, difficulty) });
      })()`);

    const cellPoint = async (cell, currentPuzzle) => {
      const board = await evaluate(`(() => {
        const rect = document.querySelector('#board').getBoundingClientRect();
        return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
      })()`);

      return {
        x: board.left + ((cell.col + 0.5) * board.width) / currentPuzzle.cols,
        y: board.top + ((cell.row + 0.5) * board.height) / currentPuzzle.rows,
      };
    };

    const mouseClickPoint = async ({ x, y }) => {
      await cdp.call(
        "Input.dispatchMouseEvent",
        { type: "mouseMoved", x, y },
        sessionId,
      );
      await cdp.call(
        "Input.dispatchMouseEvent",
        {
          type: "mousePressed",
          x,
          y,
          button: "left",
          buttons: 1,
          clickCount: 1,
        },
        sessionId,
      );
      await cdp.call(
        "Input.dispatchMouseEvent",
        {
          type: "mouseReleased",
          x,
          y,
          button: "left",
          buttons: 0,
          clickCount: 1,
        },
        sessionId,
      );
    };

    const clickCell = async (cell, currentPuzzle) => {
      await mouseClickPoint(await cellPoint(cell, currentPuzzle));
    };

    const clickSelector = async (selector) => {
      const point = await evaluate(`(() => {
        const element = document.querySelector(${JSON.stringify(selector)});
        element.scrollIntoView({ block: 'center', inline: 'nearest' });
        const rect = element.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })()`);
      await mouseClickPoint(point);
    };

    const mouseDragCells = async (cells, currentPuzzle) => {
      const points = [];

      for (const cell of cells) {
        points.push(await cellPoint(cell, currentPuzzle));
      }

      const first = points[0];
      await cdp.call(
        "Input.dispatchMouseEvent",
        { type: "mouseMoved", x: first.x, y: first.y },
        sessionId,
      );
      await cdp.call(
        "Input.dispatchMouseEvent",
        {
          type: "mousePressed",
          x: first.x,
          y: first.y,
          button: "left",
          buttons: 1,
          clickCount: 1,
        },
        sessionId,
      );

      for (const point of points.slice(1)) {
        await cdp.call(
          "Input.dispatchMouseEvent",
          {
            type: "mouseMoved",
            x: point.x,
            y: point.y,
            button: "left",
            buttons: 1,
          },
          sessionId,
        );
      }

      const last = points.at(-1);
      await cdp.call(
        "Input.dispatchMouseEvent",
        {
          type: "mouseReleased",
          x: last.x,
          y: last.y,
          button: "left",
          buttons: 0,
          clickCount: 1,
        },
        sessionId,
      );
    };

    const dispatchKey = async (key) => {
      const definition = keyDefinition(key);

      for (const type of ["keyDown", "keyUp"]) {
        await cdp.call(
          "Input.dispatchKeyEvent",
          {
            type,
            key,
            code: definition.code,
            windowsVirtualKeyCode: definition.virtualKey,
            nativeVirtualKeyCode: definition.virtualKey,
          },
          sessionId,
        );
      }
    };

    const directionKey = (from, to) => {
      if (to.row < from.row) return "ArrowUp";
      if (to.row > from.row) return "ArrowDown";
      if (to.col < from.col) return "ArrowLeft";
      return "ArrowRight";
    };

    const solveStage = async (currentPuzzle) => {
      await evaluate(
        "document.querySelector('#board').scrollIntoView({ block: 'center' })",
      );

      for (const line of currentPuzzle.lines) {
        await mouseDragCells(line.solution, currentPuzzle);
      }

      await delay(450);
    };

    const domPuzzleSignature = () =>
      evaluate(`JSON.stringify({
        clues: [...document.querySelectorAll('.clue-slot')].map((slot) => [slot.dataset.lineId, slot.dataset.clueValue, slot.style.gridRow, slot.style.gridColumn]),
        walls: [...document.querySelectorAll('.wall-line')].map((wall) => ['x1', 'y1', 'x2', 'y2'].map((name) => wall.getAttribute(name))),
      })`);

    const privacyViewports = [
      { width: 1440, height: 1000, mobile: false },
      { width: 768, height: 1024, mobile: false },
      { width: 390, height: 844, mobile: true },
      { width: 320, height: 800, mobile: true },
    ];

    assert.deepEqual(ANALYTICS_CONFIG, {
      enabled: true,
      measurementId: "G-BBJX7TJD6W",
      debug: false,
    });

    for (const viewport of privacyViewports) {
      await loadViewport({ ...viewport, consent: "unset" });
      const privacyState = await state();
      assert.equal(privacyState.privacyBannerHidden, false);
      assert.equal(privacyState.privacyBodyClass, true);
      assert.equal(privacyState.privacyBannerTitle, "Privacy & analytics");
      assert.match(privacyState.privacyBannerCopy, /stays off until you allow it/);
      assert.equal(privacyState.analyticsConsent, null);
      assert.equal(privacyState.analyticsPersistentConsent, null);
      assert.equal(privacyState.analyticsSessionConsent, null);
      assert.equal(privacyState.analyticsTagPresent, false);
      assert.equal(privacyState.analyticsDataLayerPresent, false);
      const privacyLayout = await evaluate(`(() => {
        const bounds = (element) => {
          const rect = element.getBoundingClientRect();
          return { bottom: rect.bottom, left: rect.left, right: rect.right, top: rect.top };
        };
        return {
          accept: bounds(document.querySelector('#bannerAcceptButton')),
          banner: bounds(document.querySelector('#privacyBanner')),
          decline: bounds(document.querySelector('#bannerDeclineButton')),
          documentWidth: document.documentElement.scrollWidth,
          footer: bounds(document.querySelector('.site-footer')),
          footerVisibility: getComputedStyle(document.querySelector('.site-footer')).visibility,
          releaseVersion: bounds(document.querySelector('#releaseVersion')),
          innerHeight: window.innerHeight,
          innerWidth: window.innerWidth,
        };
      })()`);
      assert.ok(Math.abs(privacyLayout.banner.bottom - privacyLayout.innerHeight) < 1);
      assert.ok(privacyLayout.banner.left >= -0.5);
      assert.ok(privacyLayout.banner.right <= privacyLayout.innerWidth + 0.5);
      assert.ok(privacyLayout.documentWidth <= privacyLayout.innerWidth);
      if (viewport.width > 620) {
        assert.equal(privacyLayout.footerVisibility, "hidden");
      } else {
        assert.equal(privacyLayout.footerVisibility, "visible");
        assert.ok(
          privacyLayout.releaseVersion.bottom <= privacyLayout.banner.top + 0.5,
          `${viewport.width}x${viewport.height} release version overlaps the privacy banner`,
        );
      }
      for (const action of [privacyLayout.decline, privacyLayout.accept]) {
        assert.ok(action.left >= privacyLayout.banner.left - 0.5);
        assert.ok(action.right <= privacyLayout.banner.right + 0.5);
        assert.ok(action.top >= privacyLayout.banner.top - 0.5);
        assert.ok(action.bottom <= privacyLayout.banner.bottom + 0.5);
      }
      if (viewport.width <= 360) {
        assert.ok(privacyLayout.accept.top >= privacyLayout.decline.bottom - 0.5);
      } else {
        assert.ok(privacyLayout.decline.right <= privacyLayout.accept.left + 0.5);
      }
      await capture(`${viewport.width}x${viewport.height}-privacy-banner`);

      await clickSelector("#privacyDetailsButton");
      await delay(180);
      const privacyDetailsState = await state();
      assert.equal(privacyDetailsState.privacyDialogOpen, true);
      assert.equal(privacyDetailsState.privacyDialogTitle, "Privacy & analytics");
      assert.equal(
        privacyDetailsState.privacyStatus,
        "Current choice: not selected.",
      );
      assert.match(privacyDetailsState.privacyDialogIntro, /browsing session/);
      assert.match(privacyDetailsState.privacyCollectCopy, /Enhanced Measurement/);
      assert.match(
        privacyDetailsState.privacyCollectCopy,
        /outbound-link clicks/,
      );
      assert.match(privacyDetailsState.privacyAvoidCopy, /custom gameplay events/);
      assert.equal(privacyDetailsState.activeElement, "closePrivacyButton");
      const privacyDialogLayout = await evaluate(`(() => {
        const panel = document.querySelector('.privacy-panel');
        const rect = panel.getBoundingClientRect();
        return {
          bottom: rect.bottom,
          clientHeight: panel.clientHeight,
          innerHeight: window.innerHeight,
          innerWidth: window.innerWidth,
          left: rect.left,
          right: rect.right,
          scrollHeight: panel.scrollHeight,
          top: rect.top,
        };
      })()`);
      assert.ok(
        privacyDialogLayout.left >= 0 &&
          privacyDialogLayout.right <= privacyDialogLayout.innerWidth,
      );
      assert.ok(
        privacyDialogLayout.top >= 0 &&
          privacyDialogLayout.bottom <= privacyDialogLayout.innerHeight,
      );
      await capture(`${viewport.width}x${viewport.height}-privacy-dialog`);
      if (viewport.width === 320) {
        await evaluate(
          "document.querySelector('.privacy-panel').scrollTop = document.querySelector('.privacy-panel').scrollHeight",
        );
        await delay(30);
        await capture("320x800-privacy-dialog-bottom");
        await evaluate("document.querySelector('.privacy-panel').scrollTop = 0");
      }
      await clickSelector("#closePrivacyButton");
      await delay(30);
      assert.equal((await state()).activeElement, "privacyDetailsButton");
    }

    await loadViewport({
      width: 390,
      height: 844,
      mobile: true,
      consent: "unset",
    });
    await clickSelector("#bannerDeclineButton");
    let privacyState = await state();
    assert.equal(privacyState.privacyBannerHidden, true);
    assert.equal(privacyState.privacyBodyClass, false);
    assert.equal(privacyState.analyticsConsent.state, "denied");
    assert.equal(
      privacyState.analyticsConsent.version,
      ANALYTICS_CONSENT_VERSION,
    );
    assert.equal(privacyState.analyticsPersistentConsent, null);
    assert.equal(privacyState.analyticsSessionConsent.state, "denied");
    assert.equal(privacyState.analyticsTagPresent, false);
    assert.equal(privacyState.analyticsDataLayerPresent, false);
    assert.deepEqual(analyticsRequests, []);

    await loadViewport({
      width: 390,
      height: 844,
      mobile: true,
      fresh: false,
      consent: "preserve",
    });
    privacyState = await state();
    assert.equal(privacyState.privacyBannerHidden, true);
    assert.equal(privacyState.analyticsConsent.state, "denied");
    assert.equal(privacyState.analyticsPersistentConsent, null);
    assert.equal(privacyState.analyticsSessionConsent.state, "denied");
    await clickSelector("#helpButton");
    assert.equal((await state()).privacyPreferencesLabel, "Privacy choices");
    await clickSelector("#privacyPreferencesButton");
    await delay(180);
    privacyState = await state();
    assert.equal(privacyState.helpDialogOpen, false);
    assert.equal(privacyState.privacyDialogOpen, true);
    assert.equal(privacyState.privacyStatus, "Current choice: analytics declined.");
    assert.match(privacyState.privacyDialogIntro, /browsing session/);
    assert.match(privacyState.privacyCollectCopy, /Enhanced Measurement/);
    await capture("390x844-privacy-dialog-declined");
    await clickSelector("#closePrivacyButton");
    await evaluate(
      `sessionStorage.removeItem(${JSON.stringify(ANALYTICS_CONSENT_STORAGE_KEY)})`,
    );

    await loadViewport({
      width: 390,
      height: 844,
      mobile: true,
      fresh: false,
      consent: "preserve",
    });
    privacyState = await state();
    assert.equal(privacyState.privacyBannerHidden, false);
    assert.equal(privacyState.analyticsConsent, null);
    assert.equal(privacyState.analyticsPersistentConsent, null);
    assert.equal(privacyState.analyticsSessionConsent, null);
    assert.equal(privacyState.analyticsTagPresent, false);
    assert.equal(privacyState.analyticsDataLayerPresent, false);
    assert.deepEqual(analyticsRequests, []);

    await clickSelector("#bannerAcceptButton");
    await delay(30);
    privacyState = await state();
    assert.equal(privacyState.privacyBannerHidden, true);
    assert.equal(privacyState.analyticsConsent.state, "granted");
    assert.equal(
      privacyState.analyticsPersistentConsent.state,
      "granted",
    );
    assert.equal(privacyState.analyticsSessionConsent, null);
    assert.equal(privacyState.analyticsTagPresent, true);
    assert.equal(privacyState.analyticsDataLayerPresent, true);
    assert.deepEqual(privacyState.analyticsConfiguration, {
      measurementId: ANALYTICS_CONFIG.measurementId,
      parameters: {
        send_page_view: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      },
    });
    for (let attempt = 0; attempt < 50 && analyticsRequests.length === 0; attempt += 1) {
      await delay(20);
    }
    assert.deepEqual(analyticsRequests, [
      `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.measurementId}`,
    ]);

    await loadViewport({
      width: 390,
      height: 844,
      mobile: true,
      fresh: false,
      consent: "preserve",
    });
    privacyState = await state();
    assert.equal(privacyState.analyticsConsent.state, "granted");
    assert.equal(privacyState.analyticsPersistentConsent.state, "granted");
    assert.equal(privacyState.analyticsSessionConsent, null);
    assert.equal(privacyState.analyticsTagPresent, true);
    assert.equal(privacyState.analyticsDataLayerPresent, true);

    await clickSelector("#helpButton");
    await clickSelector("#privacyPreferencesButton");
    const reloadedAfterRevocation = cdp.waitFor(
      "Page.loadEventFired",
      sessionId,
    );
    const requestsBeforeRevocation = analyticsRequests.length;
    await clickSelector("#privacyDeclineButton");
    await reloadedAfterRevocation;
    await delay(100);
    privacyState = await state();
    assert.equal(privacyState.analyticsConsent.state, "denied");
    assert.equal(privacyState.analyticsPersistentConsent, null);
    assert.equal(privacyState.analyticsSessionConsent.state, "denied");
    assert.equal(privacyState.analyticsTagPresent, false);
    assert.equal(privacyState.analyticsDataLayerPresent, false);
    assert.equal(analyticsRequests.length, requestsBeforeRevocation);
    checks.push(
      "privacy banner and Enhanced Measurement details fit all maintained viewports; session-only denial stays tag-free across reload, a new page session asks again, persistent consent initializes only the configured intercepted GA tag, and active revocation reloads tag-free",
    );

    await loadViewport({
      width: 1440,
      height: 1000,
      now: SOCIAL_ART_NOW,
    });
    const socialArtPuzzle = await puzzle(0, SOCIAL_ART_DATE_KEY);
    assert.equal((await state()).difficulty, "easy");
    const nearCompletePaths = socialArtPuzzle.lines.map((line) =>
      line.solution.slice(0, -1),
    );
    for (const path of nearCompletePaths) {
      await mouseDragCells(path, socialArtPuzzle);
    }
    let currentState = await state();
    assert.equal(currentState.progress, "23/25");
    assert.equal(currentState.completionHidden, true);
    assert.deepEqual(
      await evaluate(`[
        document.querySelector('[data-route-line="a"]').getAttribute('points').trim().split(/\\s+/).length,
        document.querySelector('[data-route-line="b"]').getAttribute('points').trim().split(/\\s+/).length,
      ]`),
      [14, 9],
    );
    await capture("1440x1000-og-near-complete", {
      centerSelector: "#board",
    });
    checks.push(
      "the social-art source uses a pre-launch board and captures both real witness paths one move from their final clues without revealing completion",
    );

    await loadViewport({
      width: 1440,
      height: 1000,
      query: "difficulty=ultra&seed=ignored",
    });
    await assertLayout("1440x1000 daily Easy fresh");
    currentState = await state();
    assert.equal(currentState.streak, null);
    const installMetadata = await evaluate(`(async () => {
      const inspectImage = (src) => new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 40;
          canvas.height = 21;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
          const colorBuckets = new Set();
          let darkPixels = 0;
          for (let index = 0; index < pixels.length; index += 4) {
            const red = pixels[index];
            const green = pixels[index + 1];
            const blue = pixels[index + 2];
            colorBuckets.add([red >> 4, green >> 4, blue >> 4].join(','));
            if ((red * 299 + green * 587 + blue * 114) / 1000 < 128) {
              darkPixels += 1;
            }
          }
          resolve({
            darkPixels,
            height: image.naturalHeight,
            sampledColorBuckets: colorBuckets.size,
            src: image.currentSrc,
            width: image.naturalWidth,
          });
        };
        image.onerror = () => reject(new Error(\`Unable to load \${src}\`));
        image.src = src;
      });
      const manifestUrl = document.querySelector('link[rel="manifest"]').href;
      const manifestResponse = await fetch(manifestUrl);
      const manifest = await manifestResponse.json();
      const manifestIcons = await Promise.all(
        manifest.icons.map(async (icon) => ({
          ...icon,
          image: await inspectImage(new URL(icon.src, manifestUrl).href),
        })),
      );
      return {
        appleIcon: await inspectImage(document.querySelector('link[rel="apple-touch-icon"]').href),
        appleTitle: document.querySelector('meta[name="apple-mobile-web-app-title"]').content,
        canonical: document.querySelector('link[rel="canonical"]').href,
        manifest: {
          contentType: manifestResponse.headers.get('content-type'),
          display: manifest.display,
          icons: manifestIcons,
          ok: manifestResponse.ok,
          shortName: manifest.short_name,
          startUrl: manifest.start_url,
        },
        ogImage: await inspectImage('./assets/social/twain-og-v2.png'),
        ogImageMeta: document.querySelector('meta[property="og:image"]').content,
        twitterCard: document.querySelector('meta[name="twitter:card"]').content,
      };
    })()`);
    assert.equal(installMetadata.canonical, "https://danchen6.github.io/twain/");
    assert.equal(installMetadata.appleTitle, "Twain");
    assert.deepEqual(
      { width: installMetadata.appleIcon.width, height: installMetadata.appleIcon.height },
      { width: 180, height: 180 },
    );
    assert.equal(installMetadata.manifest.ok, true);
    assert.match(installMetadata.manifest.contentType, /(?:manifest|json)/);
    assert.equal(installMetadata.manifest.display, "standalone");
    assert.equal(installMetadata.manifest.shortName, "Twain");
    assert.equal(installMetadata.manifest.startUrl, "./");
    assert.deepEqual(
      installMetadata.manifest.icons.map(({ sizes, purpose, image }) => ({
        sizes,
        purpose,
        width: image.width,
        height: image.height,
      })),
      [
        { sizes: "192x192", purpose: "any maskable", width: 192, height: 192 },
        { sizes: "512x512", purpose: "any maskable", width: 512, height: 512 },
      ],
    );
    assert.deepEqual(
      { width: installMetadata.ogImage.width, height: installMetadata.ogImage.height },
      { width: 1200, height: 630 },
    );
    assert.ok(installMetadata.ogImage.sampledColorBuckets >= 24);
    assert.ok(installMetadata.ogImage.darkPixels >= 24);
    assert.equal(
      installMetadata.ogImageMeta,
      "https://danchen6.github.io/twain/assets/social/twain-og-v2.png",
    );
    assert.equal(installMetadata.twitterCard, "summary_large_image");
    checks.push(
      "versioned nonblank OG art, canonical social metadata, Apple touch icon, and maskable standalone manifest assets load under the nested Pages path",
    );
    assert.equal(currentState.difficulty, "easy");
    assert.equal(currentState.progress, "0/25");
    assert.equal(currentState.dailyProgress, "0 complete; Easy, stage 1 of 5");
    assert.equal(currentState.dailyProgressCopyPresent, false);
    assert.equal(currentState.dailyProgressMax, "5");
    assert.equal(currentState.dailyProgressNow, "0");
    assert.deepEqual(currentState.dailySchedule, [
      "easy",
      "ultra",
      "hard",
      "medium",
      "extra",
    ]);
    assert.equal(currentState.dailyDate, "#4 | Aug 29");
    assert.equal(
      currentState.dailyDateAriaLabel,
      "Today's puzzle is Twain number 4, Aug 29",
    );
    assert.equal(currentState.query, "");
    assert.equal(currentState.modeSelectorPresent, false);
    assert.equal(currentState.difficultySelectorPresent, false);
    assert.equal(currentState.newButtonPresent, false);
    assert.equal(currentState.lineSelectorPresent, false);
    assert.equal(currentState.statusPanelPresent, false);
    assert.equal(currentState.statusMessagePresent, false);
    assert.equal(currentState.puzzleMetaPresent, false);
    assert.equal(currentState.progressEyebrowPresent, false);
    assert.equal(currentState.helpButtonPresent, true);
    assert.equal(currentState.helpButtonBackground, "rgb(25, 25, 25)");
    assert.equal(currentState.helpButtonColor, "rgb(255, 255, 255)");
    assert.equal(currentState.helpButtonIsRound, true);
    assert.equal(currentState.brandMarkLoaded, true);
    assert.equal(currentState.brandMarkSource, "./assets/twain-mark.svg");
    assert.equal(currentState.brandMarkSquare, true);
    assert.equal(currentState.shareButtonPresent, true);
    assert.equal(currentState.inlineHowToPresent, false);
    assert.equal(currentState.helpDialogOpen, false);
    assert.equal(currentState.footerPresent, true);
    assert.match(currentState.releaseVersion, /^v\d{6}r[1-9]\d*$/);
    assert.equal(currentState.introCopyPresent, false);
    assert.equal(currentState.activeLine, "a");
    assert.equal(currentState.numberLineOpacity, "1");
    assert.equal(currentState.letterLineOpacity, "0.45");
    assert.equal(currentState.brandTextVisible, true);
    assert.equal(currentState.headerDateFontSize, "16px");
    assert.equal(currentState.headerDateLetterSpacing, "normal");
    assert.equal(currentState.headerDateColor, "rgb(25, 25, 25)");
    assert.notEqual(currentState.timerIconDisplay, "none");
    assert.notEqual(currentState.routeAAccent, currentState.routeBAccent);
    assert.equal(currentState.rulesRouteAAccent, currentState.routeAAccent);
    assert.equal(currentState.rulesRouteBAccent, currentState.routeBAccent);
    const visualContract = await evaluate(`(() => {
      const board = document.querySelector('#board');
      const lineA = document.querySelector('.clue-slot.line-a .clue-disc');
      const lineB = document.querySelector('.clue-slot.line-b .clue-disc');
      const valuesA = [...document.querySelectorAll('.clue-slot.line-a .clue-value')].map((node) => node.textContent.trim());
      const valuesB = [...document.querySelectorAll('.clue-slot.line-b .clue-value')].map((node) => node.textContent.trim());
      return {
        boardRadius: getComputedStyle(board).borderRadius,
        fontWeight: getComputedStyle(lineB).fontWeight,
        lineABackground: getComputedStyle(lineA).backgroundColor,
        lineAColor: getComputedStyle(lineA).color,
        lineBBackground: getComputedStyle(lineB).backgroundColor,
        lineBColor: getComputedStyle(lineB).color,
        lineBRadius: getComputedStyle(lineB).borderRadius,
        roundedBoardRect: [...board.querySelectorAll('rect')].some((rect) => Number(rect.getAttribute('rx')) > 0),
        valuesA,
        valuesB,
      };
    })()`);
    assert.equal(visualContract.boardRadius, "0px");
    assert.equal(visualContract.lineBRadius, "0px");
    assert.equal(visualContract.roundedBoardRect, false);
    assert.equal(visualContract.fontWeight, "600");
    assert.equal(visualContract.lineABackground, "rgb(41, 32, 24)");
    assert.equal(visualContract.lineBBackground, visualContract.lineABackground);
    assert.equal(visualContract.lineAColor, "rgb(255, 255, 255)");
    assert.equal(visualContract.lineBColor, visualContract.lineAColor);
    assert.ok(visualContract.valuesA.every((value) => /^\d+$/.test(value)));
    assert.ok(visualContract.valuesB.every((value) => /^[A-Z]+$/.test(value)));
    checks.push(
      "daily-only chrome, deterministic shuffled schedule, two-line Twain logo, black numbered header identity, canonical URL, distinct route hues, and Twain clue shapes/colors render correctly",
    );
    await capture("1440x1000-daily-easy-fresh", { fullPage: true });

    assert.equal(currentState.languageButtonPresent, true);
    assert.equal(currentState.documentLanguage, "en");
    assert.equal(currentState.languageOverride, null);
    assert.equal(currentState.languageMenuHidden, true);
    assert.equal(currentState.languageExpanded, "false");
    await clickSelector("#languageButton");
    await delay(80);
    currentState = await state();
    assert.equal(currentState.languageMenuHidden, false);
    assert.equal(currentState.languageExpanded, "true");
    assert.equal(currentState.activeLanguageOption, "auto");
    assert.deepEqual(
      currentState.languageMenuOptions.map(({ locale }) => locale),
      ["auto", "zh-TW", "en", "zh-CN", "ja", "ko", "es", "pt-BR"],
    );
    assert.equal(currentState.languageMenuOptions[0].label, "Automatic · English");
    assert.equal(currentState.languageMenuOptions[0].checked, "true");
    assert.equal(currentState.languageMenuOptions[1].label, "繁體中文");
    assert.equal(currentState.languageMenuOptions[2].label, "English");
    await capture("1440x1000-language-menu-en");
    await dispatchKey("End");
    assert.equal((await state()).activeLanguageOption, "pt-BR");
    await dispatchKey("Home");
    assert.equal((await state()).activeLanguageOption, "auto");
    await dispatchKey("Escape");
    currentState = await state();
    assert.equal(currentState.languageMenuHidden, true);
    assert.equal(currentState.activeElement, "languageButton");

    await clickSelector("#languageButton");
    await clickSelector('.language-option[data-locale="zh-TW"]');
    currentState = await state();
    assert.equal(currentState.documentLanguage, "zh-TW");
    assert.equal(currentState.documentTitle, "Twain — 兩條路線，永不相交");
    assert.equal(currentState.languageOverride, "zh-TW");
    assert.equal(currentState.dailyDate, "#4 | 8月29日");
    assert.equal(currentState.clearLabel, "清除");
    assert.equal(currentState.howToTitle, "玩法");
    assert.equal(currentState.privacyPreferencesLabel, "隱私設定");
    assert.equal(currentState.shareResultLabel, "分享");
    assert.equal(currentState.dailySchedule[0], "簡單");
    assert.equal(
      currentState.languageMenuOptions.find(({ locale }) => locale === "zh-TW").checked,
      "true",
    );
    await loadViewport({ width: 1440, height: 1000, fresh: false });
    currentState = await state();
    assert.equal(currentState.documentLanguage, "zh-TW");
    assert.equal(currentState.languageOverride, "zh-TW");
    await configureViewport({ width: 390, height: 844, mobile: true });
    await assertLayout("390x844 Traditional Chinese fresh");
    await clickSelector("#helpButton");
    await delay(250);
    await capture("390x844-zh-tw-how-to-dialog");
    await clickSelector("#closeHowToButton");
    await clickSelector("#shareButton");
    await delay(250);
    currentState = await state();
    assert.equal(currentState.headerShareTitle, "分享 Twain #4");
    assert.equal(currentState.headerShareCopyLabel, "複製連結");
    await capture("390x844-zh-tw-header-share-dialog");
    await clickSelector("#closeHeaderShareButton");
    await configureViewport({ width: 1440, height: 1000 });

    const localeIntegrationChecks = [
      { code: "zh-CN", clear: "清除", date: "#4 | 8月29日", howTo: "玩法", privacy: "隐私设置", share: "分享", stage: "简单" },
      { code: "ja", clear: "クリア", date: "#4 | 8月29日", howTo: "遊び方", privacy: "プライバシー設定", share: "共有", stage: "かんたん" },
      { code: "ko", clear: "지우기", date: "#4 | 8월 29일", howTo: "플레이 방법", privacy: "개인정보 설정", share: "공유", stage: "쉬움" },
      { code: "es", clear: "Borrar", date: "#4 | 29 ago", howTo: "Cómo jugar", privacy: "Opciones de privacidad", share: "Compartir", stage: "fácil" },
      { code: "pt-BR", clear: "Limpar", date: "#4 | 29 de ago.", howTo: "Como jogar", privacy: "Opções de privacidade", share: "Compartilhar", stage: "fácil" },
    ];

    for (const expectation of localeIntegrationChecks) {
      await clickSelector("#languageButton");
      await clickSelector(`.language-option[data-locale="${expectation.code}"]`);
      currentState = await state();
      assert.equal(currentState.documentLanguage, expectation.code);
      assert.equal(currentState.languageOverride, expectation.code);
      assert.equal(currentState.clearLabel, expectation.clear);
      assert.equal(currentState.dailyDate, expectation.date);
      assert.equal(currentState.howToTitle, expectation.howTo);
      assert.equal(currentState.privacyPreferencesLabel, expectation.privacy);
      assert.equal(currentState.shareResultLabel, expectation.share);
      assert.equal(currentState.dailySchedule[0], expectation.stage);
      assert.equal(
        currentState.languageMenuOptions.find(({ locale }) => locale === expectation.code).checked,
        "true",
      );
    }

    await configureViewport({ width: 320, height: 800, mobile: true });
    await assertLayout("320x800 Brazilian Portuguese fresh");
    await capture("320x800-pt-br-fresh");
    await loadViewport({
      width: 320,
      height: 800,
      mobile: true,
      fresh: false,
      consent: "unset",
    });
    currentState = await state();
    assert.equal(currentState.documentLanguage, "pt-BR");
    assert.equal(currentState.privacyBannerHidden, false);
    assert.equal(currentState.privacyBannerTitle, "Privacidade e análise");
    assert.match(currentState.privacyBannerCopy, /permanece desativado/);
    await capture("320x800-pt-br-privacy-banner");
    await clickSelector("#privacyDetailsButton");
    await delay(180);
    currentState = await state();
    assert.equal(currentState.privacyDialogOpen, true);
    assert.match(currentState.privacyDialogIntro, /sessão de navegação/);
    assert.match(currentState.privacyCollectCopy, /Enhanced Measurement/);
    const portuguesePrivacyLayout = await evaluate(`(() => {
      const panel = document.querySelector('.privacy-panel');
      const rect = panel.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        innerHeight: window.innerHeight,
        innerWidth: window.innerWidth,
        left: rect.left,
        right: rect.right,
        top: rect.top,
      };
    })()`);
    assert.ok(
      portuguesePrivacyLayout.left >= 0 &&
        portuguesePrivacyLayout.right <= portuguesePrivacyLayout.innerWidth,
    );
    assert.ok(
      portuguesePrivacyLayout.top >= 0 &&
        portuguesePrivacyLayout.bottom <= portuguesePrivacyLayout.innerHeight,
    );
    await capture("320x800-pt-br-privacy-dialog");
    await evaluate(
      "document.querySelector('.privacy-panel').scrollTop = document.querySelector('.privacy-panel').scrollHeight",
    );
    await delay(30);
    await capture("320x800-pt-br-privacy-dialog-bottom");
    await evaluate("document.querySelector('.privacy-panel').scrollTop = 0");
    await clickSelector("#closePrivacyButton");
    await clickSelector("#bannerDeclineButton");
    await clickSelector("#languageButton");
    const languageMenuLayout = await evaluate(`(() => {
      const menu = document.querySelector('#languageMenu').getBoundingClientRect();
      const options = [...document.querySelectorAll('.language-option')].map((option) => {
        const rect = option.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
      });
      return { menu: { left: menu.left, right: menu.right, top: menu.top, bottom: menu.bottom }, options };
    })()`);
    assert.ok(languageMenuLayout.menu.left >= 0 && languageMenuLayout.menu.right <= 320);
    assert.ok(languageMenuLayout.menu.top >= 0 && languageMenuLayout.menu.bottom <= 800);
    assert.equal(
      languageMenuLayout.options.every(
        (option) =>
          option.left >= languageMenuLayout.menu.left &&
          option.right <= languageMenuLayout.menu.right &&
          option.top >= languageMenuLayout.menu.top &&
          option.bottom <= languageMenuLayout.menu.bottom,
      ),
      true,
    );
    await capture("320x800-language-menu-pt-br");
    await dispatchKey("Escape");
    await configureViewport({ width: 1440, height: 1000 });

    await clickSelector("#languageButton");
    await clickSelector('.language-option[data-locale="auto"]');
    currentState = await state();
    assert.equal(currentState.documentLanguage, "en");
    assert.equal(currentState.languageOverride, null);
    assert.equal(currentState.dailyDate, "#4 | Aug 29");
    assert.equal(currentState.languageMenuOptions[0].checked, "true");

    const browserLocaleScript = await cdp.call(
      "Page.addScriptToEvaluateOnNewDocument",
      {
        source: `(() => {
          Object.defineProperty(navigator, 'languages', {
            configurable: true,
            get: () => ['zh-Hant-TW', 'zh-TW'],
          });
          Object.defineProperty(navigator, 'language', {
            configurable: true,
            get: () => 'zh-Hant-TW',
          });
        })();`,
      },
      sessionId,
    );
    await loadViewport({ width: 390, height: 844, mobile: true });
    currentState = await state();
    assert.equal(currentState.documentLanguage, "zh-TW");
    assert.equal(currentState.languageOverride, null);
    assert.equal(currentState.languageMenuOptions[0].checked, "true");
    assert.equal(currentState.languageMenuOptions[0].label, "自動 · 繁體中文");
    await capture("390x844-auto-zh-tw-fresh");
    await cdp.call(
      "Page.removeScriptToEvaluateOnNewDocument",
      { identifier: browserLocaleScript.identifier },
      sessionId,
    );
    await loadViewport({ width: 1440, height: 1000 });
    currentState = await state();
    assert.equal(currentState.documentLanguage, "en");
    assert.equal(currentState.languageOverride, null);
    checks.push(
      "rightmost Language menu supports keyboard navigation, seven localized UIs, browser-locale auto selection, and persisted explicit overrides",
    );

    await clickSelector("#helpButton");
    await delay(250);
    currentState = await state();
    assert.equal(currentState.helpDialogOpen, true);
    assert.equal(currentState.activeElement, "closeHowToButton");
    await capture("1440x1000-how-to-dialog");
    await configureViewport({ width: 390, height: 844, mobile: true });
    await assertLayout("390x844 how-to dialog");
    const tutorialLayout = await evaluate(`(() => {
      const panel = document.querySelector('.how-to-panel').getBoundingClientRect();
      return {
        bottom: panel.bottom,
        height: panel.height,
        left: panel.left,
        right: panel.right,
        top: panel.top,
      };
    })()`);
    assert.ok(tutorialLayout.left >= 0 && tutorialLayout.right <= 390);
    assert.ok(tutorialLayout.top >= 0 && tutorialLayout.bottom <= 844);
    assert.equal((await state()).brandTextVisible, true);
    await capture("390x844-how-to-dialog");
    await clickSelector("#closeHowToButton");
    assert.equal((await state()).helpDialogOpen, false);
    assert.equal((await state()).activeElement, "helpButton");
    await clickSelector("#helpButton");
    await dispatchKey("Escape");
    assert.equal((await state()).helpDialogOpen, false);
    await configureViewport({ width: 1440, height: 1000 });
    checks.push(
      "header help opens a responsive modal tutorial; Close and Escape return focus without hiding the mobile Twain wordmark",
    );

    const initialSignature = await domPuzzleSignature();
    const easyPuzzle = await puzzle(0);
    const [lineA, lineB] = easyPuzzle.lines;
    const clueCells = new Set(
      easyPuzzle.lines.flatMap((line) =>
        line.clues.map((clue) => `${clue.row},${clue.col}`),
      ),
    );
    let wrongStart = null;

    for (let row = 0; row < easyPuzzle.rows && !wrongStart; row += 1) {
      for (let col = 0; col < easyPuzzle.cols; col += 1) {
        if (!clueCells.has(`${row},${col}`)) {
          wrongStart = { row, col };
          break;
        }
      }
    }

    await clickCell(wrongStart, easyPuzzle);
    currentState = await state();
    assert.equal(currentState.progress, "0/25");
    assert.equal(currentState.timer, "00:00");
    assert.match(currentState.timerLabel, /paused/);
    assert.equal(currentState.boardAnimationName, "none");
    await capture("1440x1000-daily-invalid-start", {
      centerSelector: "#board",
    });
    checks.push(
      "an invalid opening neither starts the shared daily timer nor shakes the board",
    );

    await clickCell(lineA.solution[0], easyPuzzle);
    await clickCell(lineA.solution[1], easyPuzzle);
    await clickCell(lineB.solution[0], easyPuzzle);
    for (let attempt = 0; attempt < 50; attempt += 1) {
      currentState = await state();

      if (elapsedSeconds(currentState.timer) >= 1) {
        break;
      }

      await delay(50);
    }
    assert.equal(currentState.progress, "3/25");
    assert.equal(currentState.activeLine, "b");
    assert.match(currentState.timerLabel, /running/);
    const timerBeforeClear = currentState.timer;
    assert.ok(elapsedSeconds(timerBeforeClear) >= 1);
    await clickSelector("#undoButton");
    assert.equal((await state()).progress, "2/25");
    await clickSelector("#clearButton");
    currentState = await state();
    assert.equal(currentState.progress, "0/25");
    assert.ok(
      elapsedSeconds(currentState.timer) >= elapsedSeconds(timerBeforeClear),
    );
    assert.match(currentState.timerLabel, /running/);
    checks.push(
      "clue-driven line selection, global Undo, and timer-preserving current-board Clear work",
    );

    const straightClickCells = lineA.solution.slice(0, 3);
    const straightClickStart = straightClickCells[0];
    const straightClickTarget = straightClickCells.at(-1);
    assert.ok(
      straightClickCells.every((cell) => cell.row === straightClickStart.row) ||
        straightClickCells.every((cell) => cell.col === straightClickStart.col),
    );
    assert.equal(
      clueCells.has(`${straightClickTarget.row},${straightClickTarget.col}`),
      false,
    );
    await clickCell(straightClickStart, easyPuzzle);
    await clickCell(straightClickTarget, easyPuzzle);
    assert.equal((await state()).progress, "3/25");

    await mouseDragCells(lineA.solution.slice(2, 8), easyPuzzle);
    assert.equal((await state()).progress, "8/25");
    await clickCell(lineA.solution[5], easyPuzzle);
    assert.equal((await state()).progress, "6/25");
    await capture("1440x1000-daily-click-rewind", {
      centerSelector: "#board",
    });
    await clickSelector("#undoButton");
    assert.equal((await state()).progress, "8/25");
    await mouseDragCells(
      [lineA.solution[7], lineA.solution[6], lineA.solution[5]],
      easyPuzzle,
    );
    currentState = await state();
    assert.equal(currentState.progress, "6/25");
    await capture("1440x1000-daily-drag-backtracking", {
      centerSelector: "#board",
    });
    await clickSelector("#undoButton");
    assert.equal((await state()).progress, "7/25");

    await clickSelector("#clearButton");
    const collision = findAdjacentBodyCollision(lineA.solution);
    const prefix = lineA.solution.slice(0, collision.tailIndex + 1);
    await mouseDragCells(prefix, easyPuzzle);
    const collisionProgress = `${prefix.length}/25`;
    assert.equal((await state()).progress, collisionProgress);
    const bodyCollisionBefore = await state();
    await mouseDragCells(
      [lineA.solution[collision.tailIndex], lineA.solution[collision.bodyIndex]],
      easyPuzzle,
    );
    currentState = await state();
    assert.equal(currentState.progress, collisionProgress);
    assert.equal(currentState.status, bodyCollisionBefore.status);
    checks.push(
      "orthogonal clicks draw through intermediate cells, path clicks rewind directly, tail-first dragging backtracks cell by cell, and non-predecessor body collisions are quiet no-ops",
    );

    await clickSelector("#clearButton");
    const start = lineA.solution[0];
    const canonicalNext = lineA.solution[1];
    const nonStartClues = new Set(
      easyPuzzle.lines.flatMap((line) =>
        line.clues
          .slice(line.id === "a" ? 1 : 0)
          .map((clue) => `${clue.row},${clue.col}`),
      ),
    );
    const wallEdges = new Set(
      easyPuzzle.walls.map(({ a, b }) =>
        [`${a.row},${a.col}`, `${b.row},${b.col}`].sort().join("|"),
      ),
    );
    const detour = [
      { row: start.row - 1, col: start.col },
      { row: start.row + 1, col: start.col },
      { row: start.row, col: start.col - 1 },
      { row: start.row, col: start.col + 1 },
    ].find((cell) => {
      const key = `${cell.row},${cell.col}`;
      const edge = [`${start.row},${start.col}`, key].sort().join("|");
      return (
        cell.row >= 0 &&
        cell.row < easyPuzzle.rows &&
        cell.col >= 0 &&
        cell.col < easyPuzzle.cols &&
        (cell.row !== canonicalNext.row || cell.col !== canonicalNext.col) &&
        !nonStartClues.has(key) &&
        !wallEdges.has(edge)
      );
    });
    assert.ok(detour);
    await clickCell(start, easyPuzzle);
    await clickCell(detour, easyPuzzle);
    await clickSelector("#hintButton");
    currentState = await state();
    assert.equal(currentState.progress, "2/25");
    assert.match(currentState.status, /detours were cleared/);
    await capture("1440x1000-daily-hint-correction", {
      centerSelector: "#board",
    });
    checks.push("Hint corrects a divergent suffix without resetting daily time");

    await evaluate(`
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: () => {
          window.__twainUnexpectedHeaderNativeShare = true;
          return Promise.resolve();
        },
      });
    `);
    await clickSelector("#shareButton");
    await delay(220);
    currentState = await state();
    assert.equal(currentState.headerShareOpen, true);
    assert.equal(currentState.headerShareTitle, "Share Twain #4");
    assert.equal(currentState.headerShareUrl, baseUrl);
    assert.equal(currentState.headerShareQrValue, baseUrl);
    assert.match(currentState.headerShareInstructions, /Scan to play/);
    assert.ok(Number(currentState.headerShareQrModuleCount) >= 21);
    assert.equal(currentState.activeElement, "closeHeaderShareButton");
    assert.equal(currentState.shareFallbackOpen, false);
    assert.equal(
      await evaluate("window.__twainUnexpectedHeaderNativeShare ?? false"),
      false,
    );
    const qrContract = await evaluate(`(() => {
      const svg = document.querySelector('#headerShareQr svg');
      const background = svg.querySelector('rect');
      const modules = svg.querySelector('path');
      const size = Number(svg.getAttribute('viewBox').split(/\\s+/).at(-1));
      const runs = [...modules.getAttribute('d').matchAll(/M(\\d+) (\\d+)h(\\d+)/g)]
        .map((match) => ({ x: Number(match[1]), y: Number(match[2]), width: Number(match[3]) }));
      return {
        background: background.getAttribute('fill'),
        moduleFill: modules.getAttribute('fill'),
        modulePathLength: modules.getAttribute('d').length,
        quietBottom: size - Math.max(...runs.map((run) => run.y + 1)),
        quietLeft: Math.min(...runs.map((run) => run.x)),
        quietRight: size - Math.max(...runs.map((run) => run.x + run.width)),
        quietTop: Math.min(...runs.map((run) => run.y)),
        square: svg.getAttribute('viewBox') === '0 0 ' + size + ' ' + size,
      };
    })()`);
    assert.deepEqual(qrContract, {
      background: "#fff",
      moduleFill: "#000",
      modulePathLength: qrContract.modulePathLength,
      quietBottom: 4,
      quietLeft: 4,
      quietRight: 4,
      quietTop: 4,
      square: true,
    });
    assert.ok(qrContract.modulePathLength > 100);
    await capture("1440x1000-header-share-dialog");

    await configureViewport({ width: 768, height: 1024 });
    await assertLayout("768x1024 header share dialog");
    await capture("768x1024-header-share-dialog");
    await configureViewport({ width: 390, height: 844, mobile: true });
    await assertLayout("390x844 header share dialog");
    const headerShareLayout = await evaluate(`(() => {
      const panel = document.querySelector('.header-share-panel').getBoundingClientRect();
      const qr = document.querySelector('#headerShareQr').getBoundingClientRect();
      const link = document.querySelector('#headerShareUrl').getBoundingClientRect();
      const copy = document.querySelector('#copyHeaderShareButton').getBoundingClientRect();
      const bounds = (rect) => ({
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        width: rect.width,
      });
      return {
        copy: bounds(copy),
        link: bounds(link),
        panel: bounds(panel),
        qr: bounds(qr),
      };
    })()`);
    assert.ok(headerShareLayout.panel.left >= 0 && headerShareLayout.panel.right <= 390);
    assert.ok(headerShareLayout.panel.top >= 0 && headerShareLayout.panel.bottom <= 844);
    assert.ok(Math.abs(headerShareLayout.qr.width - headerShareLayout.qr.height) < 0.5);
    assert.ok(headerShareLayout.link.left >= headerShareLayout.panel.left);
    assert.ok(headerShareLayout.copy.right <= headerShareLayout.panel.right);
    await capture("390x844-header-share-dialog");

    await configureViewport({ width: 320, height: 800, mobile: true });
    await assertLayout("320x800 header share dialog");
    const compactShareLayout = await evaluate(`(() => {
      const link = document.querySelector('#headerShareUrl').getBoundingClientRect();
      const copy = document.querySelector('#copyHeaderShareButton').getBoundingClientRect();
      const panel = document.querySelector('.header-share-panel').getBoundingClientRect();
      const bounds = (rect) => ({
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        top: rect.top,
      });
      return { copy: bounds(copy), link: bounds(link), panel: bounds(panel) };
    })()`);
    assert.ok(compactShareLayout.panel.top >= 0 && compactShareLayout.panel.bottom <= 800);
    assert.ok(compactShareLayout.copy.top >= compactShareLayout.link.bottom);
    await capture("320x800-header-share-dialog");

    await configureViewport({ width: 390, height: 844, mobile: true });
    await evaluate(`
      Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (value) => { window.__twainCopiedUrl = value; } },
      });
    `);
    await clickSelector("#copyHeaderShareButton");
    await delay(25);
    assert.equal(await evaluate("window.__twainCopiedUrl"), baseUrl);
    currentState = await state();
    assert.match(currentState.status, /link copied/);
    assert.equal(currentState.headerShareCopyLabel, "Copied");
    assert.equal(currentState.shareFeedbackHidden, true);
    assert.equal(currentState.headerShareOpen, true);
    await capture("390x844-header-share-copied");
    await clickSelector("#closeHeaderShareButton");
    assert.equal((await state()).headerShareOpen, false);
    assert.equal((await state()).activeElement, "shareButton");

    await evaluate(`
      document.querySelector('#shareFeedback').hidden = true;
      Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async () => { window.__twainUnexpectedInsecureClipboard = true; },
        },
      });
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value: (command) => {
          window.__twainLegacyCopyCommand = command;
          window.__twainLegacyCopiedUrl = document.querySelector('.legacy-copy-source')?.value;
          return true;
        },
      });
    `);
    await clickSelector("#shareButton");
    await clickSelector("#copyHeaderShareButton");
    await delay(25);
    assert.equal(await evaluate("window.__twainLegacyCopyCommand"), "copy");
    assert.equal(await evaluate("window.__twainLegacyCopiedUrl"), baseUrl);
    assert.equal(
      await evaluate("window.__twainUnexpectedInsecureClipboard ?? false"),
      false,
    );
    await clickSelector("#closeHeaderShareButton");

    await evaluate(`
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value: () => false,
      });
    `);
    await configureViewport({ width: 320, height: 800, mobile: true });
    await evaluate("document.querySelector('#shareFeedback').hidden = true");
    await clickSelector("#shareButton");
    await delay(220);
    await clickSelector("#copyHeaderShareButton");
    await delay(80);
    currentState = await state();
    assert.equal(currentState.headerShareOpen, true);
    assert.match(currentState.headerShareInstructions, /copy it manually/);
    assert.equal(currentState.activeElement, "headerShareUrl");
    await capture("320x800-header-share-manual-copy");
    await clickSelector("#closeHeaderShareButton");
    await evaluate(`
      Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
      document.querySelector('#shareFeedback').hidden = true;
    `);
    await configureViewport({ width: 1440, height: 1000 });
    checks.push(
      "header Share stays in-app, renders a canonical black-and-white QR with quiet zone, and copies or selects the same URL across desktop and mobile",
    );

    await clickSelector("#clearButton");
    await evaluate("document.querySelector('#board').focus({ preventScroll: true })");
    await dispatchKey("Enter");
    await dispatchKey(directionKey(lineA.solution[0], lineA.solution[1]));
    assert.equal((await state()).progress, "2/25");
    await dispatchKey("Backspace");
    assert.equal((await state()).progress, "1/25");
    await dispatchKey("h");
    assert.equal((await state()).progress, "2/25");
    await dispatchKey("l");
    assert.equal((await state()).activeLine, "b");
    await dispatchKey("Enter");
    assert.equal((await state()).progress, "3/25");
    await dispatchKey("n");
    assert.equal((await state()).activeLine, "a");
    await dispatchKey("r");
    assert.equal((await state()).progress, "0/25");
    checks.push("N/L, Enter, arrows, Backspace, H, and R share the same game rules");

    await mouseDragCells(lineA.solution.slice(0, 3), easyPuzzle);
    await delay(350);
    const beforeReload = await state();
    await loadViewport({ width: 1440, height: 1000, fresh: false });
    const afterReload = await state();
    assert.equal(afterReload.progress, "3/25");
    assert.equal(afterReload.activeLine, "a");
    assert.ok(
      elapsedSeconds(afterReload.timer) >= elapsedSeconds(beforeReload.timer),
    );
    assert.match(afterReload.timerLabel, /paused/);
    assert.equal(await domPuzzleSignature(), initialSignature);
    await clickCell(lineA.solution[3], easyPuzzle);
    await delay(300);
    assert.equal((await state()).progress, "4/25");
    assert.match((await state()).timerLabel, /running/);
    checks.push(
      "reload restores today's deterministic board, path, active line, and elapsed time, then resumes on the next valid move",
    );

    await clickSelector("#clearButton");
    await solveStage(easyPuzzle);
    currentState = await state();
    assert.equal(currentState.progress, "25/25");
    assert.equal(
      currentState.dailyProgress,
      "1 of 5 stages complete; next level ready",
    );
    assert.equal(currentState.dailyProgressNow, "1");
    assert.equal(currentState.completionHidden, false);
    assert.equal(currentState.completionKickerPresent, false);
    assert.equal(currentState.completionTitle, "Nicely done!");
    assert.equal(currentState.completionStats, "2 hints");
    assert.equal(currentState.completionCountdownHidden, true);
    assert.equal(currentState.continueHidden, false);
    assert.equal(currentState.continueLabel, "Next level");
    assert.equal(currentState.shareResultHidden, true);
    assert.equal(currentState.streak, null);
    assert.match(currentState.timerLabel, /paused/);
    const overlayContract = await evaluate(`(() => {
      const board = document.querySelector('#board').getBoundingClientRect();
      const overlay = document.querySelector('#completionOverlay');
      const overlayRect = overlay.getBoundingClientRect();
      const burstPieces = [...document.querySelectorAll('.celebration-burst span')];
      const burstStyles = burstPieces.map((piece) => getComputedStyle(piece));
      const burstStyle = burstStyles[0];
      const burstDelays = burstStyles.map((style) => parseFloat(style.animationDelay));
      const burstDurations = burstStyles.map((style) => parseFloat(style.animationDuration));
      const origins = burstStyles.map((style) => [
        parseFloat(style.getPropertyValue('--origin-x')),
        parseFloat(style.getPropertyValue('--origin-y')),
      ]);
      const trajectories = burstStyles.map((style) => ['25', '50', '75', '100'].flatMap((point) => [
        style.getPropertyValue('--cheer-' + point + '-x').trim(),
        style.getPropertyValue('--cheer-' + point + '-y').trim(),
      ]).join(','));
      const ballisticCount = burstStyles.filter((style) => {
        const y25 = parseFloat(style.getPropertyValue('--cheer-25-y'));
        const y50 = parseFloat(style.getPropertyValue('--cheer-50-y'));
        const y75 = parseFloat(style.getPropertyValue('--cheer-75-y'));
        const y100 = parseFloat(style.getPropertyValue('--cheer-100-y'));
        const increments = [y25, y50 - y25, y75 - y50, y100 - y75];
        return increments.every((increment, index) => index === 0 || increment > increments[index - 1]);
      }).length;
      const overlayStyle = getComputedStyle(overlay);
      const panelStyle = getComputedStyle(document.querySelector('.completion-panel'));
      return {
        burstAnimation: burstStyle.animationName,
        ballisticCount,
        burstCount: burstPieces.length,
        burstDelayMaximum: Math.max(...burstDelays),
        burstDelayMinimum: Math.min(...burstDelays),
        burstDurationMaximum: Math.max(...burstDurations),
        burstDurationMinimum: Math.min(...burstDurations),
        burstIterationsAreSingle: burstStyles.every((style) => style.animationIterationCount === '1'),
        burstLargestPiece: Math.max(...burstStyles.map((style) => Math.max(parseFloat(style.width), parseFloat(style.height)))),
        burstShapeCount: new Set(burstPieces.map((piece) => piece.dataset.confettiShape)).size,
        originCount: new Set(origins.map(([x, y]) => x + ',' + y)).size,
        originsOnPerimeter: origins.every(([x, y]) => [0, 100].includes(x) || [0, 100].includes(y)),
        sectorCount: new Set(burstPieces.map((piece) => piece.dataset.confettiSector)).size,
        trajectoryCount: new Set(trajectories).size,
        isDailyComplete: overlay.classList.contains('is-daily-complete'),
        overlayAnimation: overlayStyle.animationName,
        overlayDuration: overlayStyle.animationDuration,
        panelAnimation: panelStyle.animationName,
        panelDuration: panelStyle.animationDuration,
        sameBounds:
          Math.abs(board.left - overlayRect.left) < 1 &&
          Math.abs(board.top - overlayRect.top) < 1 &&
          Math.abs(board.width - overlayRect.width) < 1 &&
          Math.abs(board.height - overlayRect.height) < 1,
      };
    })()`);
    assert.equal(overlayContract.sameBounds, true);
    assert.equal(overlayContract.overlayAnimation, "completion-veil");
    assert.equal(overlayContract.overlayDuration, "0.26s");
    assert.equal(overlayContract.panelAnimation, "completion-pop");
    assert.equal(overlayContract.panelDuration, "0.52s");
    assert.equal(overlayContract.burstAnimation, "celebration-pop");
    assert.equal(overlayContract.burstCount, 16);
    assert.ok(overlayContract.burstDurationMinimum >= 0.42);
    assert.ok(overlayContract.burstDurationMaximum <= 0.56);
    assert.ok(overlayContract.burstDelayMinimum >= 0.06);
    assert.ok(overlayContract.burstDelayMaximum <= 0.14);
    assert.equal(overlayContract.burstIterationsAreSingle, true);
    assert.ok(overlayContract.burstLargestPiece >= 22);
    assert.ok(overlayContract.burstLargestPiece <= 30);
    assert.equal(overlayContract.burstShapeCount, 3);
    assert.ok(overlayContract.originCount >= 14);
    assert.equal(overlayContract.originsOnPerimeter, true);
    assert.equal(overlayContract.sectorCount, 8);
    assert.equal(overlayContract.trajectoryCount, 16);
    assert.equal(overlayContract.ballisticCount, 16);
    assert.equal(overlayContract.isDailyComplete, false);
    await seekConfetti(330);
    await capture("1440x1000-daily-stage-complete", {
      centerSelector: "#completionOverlay",
    });
    await loadViewport({ width: 390, height: 844, mobile: true, fresh: false });
    await delay(480);
    await seekConfetti(330);
    await assertLayout("390x844 daily stage completion");
    await capture("390x844-daily-stage-complete");
    await loadViewport({ width: 320, height: 800, mobile: true, fresh: false });
    await delay(480);
    await seekConfetti(330);
    await assertLayout("320x800 daily stage completion");
    await capture("320x800-daily-stage-complete");
    await loadViewport({ width: 1440, height: 1000, fresh: false });
    checks.push(
      "finishing a stage pauses the shared timer and reveals a responsive animated board overlay with concise hint-only copy",
    );

    const scheduleLabels = ["Easy", "Ultra", "Hard", "Medium", "Extra"];
    let lastCompletedTimer = elapsedSeconds(currentState.timer);

    for (let stageIndex = 1; stageIndex < scheduleLabels.length; stageIndex += 1) {
      await clickSelector("#continueButton");
      const currentPuzzle = await puzzle(stageIndex);
      currentState = await state();
      const profileLabel = scheduleLabels[stageIndex];
      const stageCellCount = currentPuzzle.rows * currentPuzzle.cols;
      assert.equal(currentState.difficulty, profileLabel.toLowerCase());
      assert.equal(currentState.progress, `0/${stageCellCount}`);
      assert.equal(
        currentState.dailyProgress,
        `${stageIndex} complete; ${profileLabel}, stage ${stageIndex + 1} of 5`,
      );
      assert.equal(currentState.dailyProgressNow, String(stageIndex));
      assert.match(currentState.timerLabel, /paused/);
      assert.ok(elapsedSeconds(currentState.timer) >= lastCompletedTimer);

      if (currentState.difficulty === "ultra") {
        await assertLayout("1440x1000 daily Ultra fresh");
        await capture("1440x1000-daily-ultra-fresh", { fullPage: true });

        await configureViewport({ width: 390, height: 844, mobile: true });
        await assertLayout("390x844 daily Ultra fresh");
        await capture("390x844-daily-ultra-fresh");
        await evaluate(
          "document.querySelector('#board').scrollIntoView({ block: 'center' })",
        );
        const touchCells = currentPuzzle.lines[0].solution.slice(0, 6);
        const touchPoints = [];

        for (const cell of touchCells) {
          touchPoints.push(await cellPoint(cell, currentPuzzle));
        }

        const touchPayload = (point) => [
          {
            x: point.x,
            y: point.y,
            radiusX: 1,
            radiusY: 1,
            force: 1,
            id: 0,
          },
        ];
        await cdp.call(
          "Input.dispatchTouchEvent",
          { type: "touchStart", touchPoints: touchPayload(touchPoints[0]) },
          sessionId,
        );

        for (const point of touchPoints.slice(1)) {
          await cdp.call(
            "Input.dispatchTouchEvent",
            { type: "touchMove", touchPoints: touchPayload(point) },
            sessionId,
          );
        }

        await cdp.call(
          "Input.dispatchTouchEvent",
          { type: "touchEnd", touchPoints: [] },
          sessionId,
        );
        assert.equal((await state()).progress, "6/100");

        await cdp.call(
          "Input.dispatchTouchEvent",
          { type: "touchStart", touchPoints: touchPayload(touchPoints[5]) },
          sessionId,
        );
        for (const point of [touchPoints[4], touchPoints[3]]) {
          await cdp.call(
            "Input.dispatchTouchEvent",
            { type: "touchMove", touchPoints: touchPayload(point) },
            sessionId,
          );
        }
        await cdp.call(
          "Input.dispatchTouchEvent",
          { type: "touchEnd", touchPoints: [] },
          sessionId,
        );
        assert.equal((await state()).progress, "4/100");

        await cdp.call(
          "Input.dispatchTouchEvent",
          { type: "touchStart", touchPoints: touchPayload(touchPoints[2]) },
          sessionId,
        );
        await cdp.call(
          "Input.dispatchTouchEvent",
          { type: "touchEnd", touchPoints: [] },
          sessionId,
        );
        assert.equal((await state()).progress, "3/100");
        await capture("390x844-daily-ultra-tap-rewind");
        await clickSelector("#clearButton");
        assert.equal((await state()).progress, "0/100");

        await configureViewport({ width: 320, height: 800, mobile: true });
        await assertLayout("320x800 daily Ultra fresh");
        await capture("320x800-daily-ultra-fresh");
        await configureViewport({ width: 1440, height: 1000 });
        checks.push(
          "Ultra renders above the fold at desktop and narrow mobile widths, and touch drawing/tail backtracking/path-tap rewind/Clear preserve the stage",
        );
      }

      await solveStage(currentPuzzle);
      currentState = await state();
      assert.equal(
        currentState.progress,
        `${stageCellCount}/${stageCellCount}`,
      );
      assert.equal(currentState.dailyProgressNow, String(stageIndex + 1));
      assert.match(currentState.timerLabel, /paused/);
      assert.ok(elapsedSeconds(currentState.timer) >= lastCompletedTimer);
      lastCompletedTimer = elapsedSeconds(currentState.timer);
    }

    currentState = await state();
    assert.equal(currentState.dailyProgress, "All 5 daily stages complete");
    assert.equal(currentState.dailyProgressNow, "5");
    assert.equal(currentState.completionKickerPresent, false);
    assert.equal(currentState.completionTitle, "Well played!");
    assert.equal(
      currentState.completionStats,
      `Completed in ${currentState.timer} · 2 hints`,
    );
    assert.equal(currentState.completionCountdown, "Come back in 08:00:00");
    assert.equal(currentState.completionCountdownHidden, false);
    assert.equal(currentState.continueHidden, true);
    assert.equal(currentState.shareResultHidden, false);
    assert.equal(currentState.shareResultLabel, "Share");
    assert.equal(currentState.hintDisabled, true);
    assert.equal(currentState.clearDisabled, true);
    assert.equal(currentState.undoDisabled, true);
    assert.deepEqual(currentState.streak, {
      version: 1,
      currentStreak: 1,
      longestStreak: 1,
      totalCompletedDays: 1,
      lastCompletedDate: FIXED_DATE_KEY,
    });
    await loadViewport({ width: 1440, height: 1000, fresh: false });
    assert.deepEqual((await state()).streak, currentState.streak);
    await delay(480);
    await seekConfetti(330);
    const dailyCompleteAnimation = await evaluate(`(() => {
      const overlay = document.querySelector('#completionOverlay');
      const panel = document.querySelector('.completion-panel');
      const bursts = [...document.querySelectorAll('.celebration-burst span')];
      const burstStyles = bursts.map((burst) => getComputedStyle(burst));
      const origins = burstStyles.map((style) => [
        parseFloat(style.getPropertyValue('--origin-x')),
        parseFloat(style.getPropertyValue('--origin-y')),
      ]);
      const trajectories = burstStyles.map((style) => ['25', '50', '75', '100'].flatMap((point) => [
        style.getPropertyValue('--cheer-' + point + '-x').trim(),
        style.getPropertyValue('--cheer-' + point + '-y').trim(),
        style.getPropertyValue('--rotation-' + point).trim(),
      ]).join(','));
      const ballisticCount = burstStyles.filter((style) => {
        const y25 = parseFloat(style.getPropertyValue('--cheer-25-y'));
        const y50 = parseFloat(style.getPropertyValue('--cheer-50-y'));
        const y75 = parseFloat(style.getPropertyValue('--cheer-75-y'));
        const y100 = parseFloat(style.getPropertyValue('--cheer-100-y'));
        const increments = [y25, y50 - y25, y75 - y50, y100 - y75];
        return increments.every((increment, index) => index === 0 || increment > increments[index - 1]);
      }).length;
      const delays = burstStyles.map((style) => parseFloat(style.animationDelay));
      const durations = burstStyles.map((style) => parseFloat(style.animationDuration));
      return {
        burstCount: bursts.length,
        ballisticCount,
        burstDelayMaximum: Math.max(...delays),
        burstDelayMinimum: Math.min(...delays),
        burstDurationMaximum: Math.max(...durations),
        burstDurationMinimum: Math.min(...durations),
        burstIterationsAreSingle: burstStyles.every((style) => style.animationIterationCount === '1'),
        originCount: new Set(origins.map(([x, y]) => x + ',' + y)).size,
        originsOnPerimeter: origins.every(([x, y]) => [0, 100].includes(x) || [0, 100].includes(y)),
        sectorCount: new Set(bursts.map((burst) => burst.dataset.confettiSector)).size,
        trajectoryCount: new Set(trajectories).size,
        waveCounts: [0, 1, 2].map((wave) => bursts.filter((burst) => Number(burst.dataset.confettiWave) === wave).length),
        isDailyComplete: overlay.classList.contains('is-daily-complete'),
        overlayDuration: getComputedStyle(overlay).animationDuration,
        panelDuration: getComputedStyle(panel).animationDuration,
      };
    })()`);
    assert.equal(dailyCompleteAnimation.isDailyComplete, true);
    assert.equal(dailyCompleteAnimation.overlayDuration, "0.26s");
    assert.equal(dailyCompleteAnimation.panelDuration, "0.52s");
    assert.equal(dailyCompleteAnimation.burstCount, 48);
    assert.ok(dailyCompleteAnimation.burstDurationMinimum >= 0.42);
    assert.ok(dailyCompleteAnimation.burstDurationMaximum <= 0.56);
    assert.ok(dailyCompleteAnimation.burstDelayMinimum >= 0.06);
    assert.ok(dailyCompleteAnimation.burstDelayMaximum >= 1.18);
    assert.ok(dailyCompleteAnimation.burstDelayMaximum <= 1.26);
    assert.equal(dailyCompleteAnimation.burstIterationsAreSingle, true);
    assert.ok(dailyCompleteAnimation.originCount >= 40);
    assert.equal(dailyCompleteAnimation.originsOnPerimeter, true);
    assert.equal(dailyCompleteAnimation.sectorCount, 8);
    assert.equal(dailyCompleteAnimation.trajectoryCount, 48);
    assert.equal(dailyCompleteAnimation.ballisticCount, 48);
    assert.deepEqual(dailyCompleteAnimation.waveCounts, [16, 16, 16]);
    await capture("1440x1000-daily-complete-wave-1", {
      centerSelector: "#completionOverlay",
    });
    await seekConfetti(890);
    await capture("1440x1000-daily-complete-wave-2", {
      centerSelector: "#completionOverlay",
    });
    await seekConfetti(1450);
    await capture("1440x1000-daily-complete-wave-3", {
      centerSelector: "#completionOverlay",
    });
    await loadViewport({ width: 390, height: 844, mobile: true, fresh: false });
    await delay(480);
    await seekConfetti(330);
    await assertLayout("390x844 daily completion");
    await capture("390x844-daily-complete");
    await loadViewport({ width: 320, height: 800, mobile: true, fresh: false });
    await delay(480);
    await seekConfetti(330);
    await assertLayout("320x800 daily completion");
    await capture("320x800-daily-complete");
    await loadViewport({ width: 1440, height: 1000, fresh: false });

    const resultText = `I completed today's Twain #4 in ${currentState.timer} with 2 hints. Can you beat my time?`;
    await evaluate(`
      Object.defineProperty(navigator, 'canShare', {
        configurable: true,
        value: () => true,
      });
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: (payload) => {
          window.__twainResultShareActivation = navigator.userActivation?.isActive ?? null;
          window.__twainResultSharePayload = payload;
          return Promise.resolve();
        },
      });
    `);
    await clickSelector("#shareResultButton");
    await delay(25);
    const resultSharePayload = await evaluate("window.__twainResultSharePayload");
    assert.equal(resultSharePayload.title, "Twain");
    assert.equal(resultSharePayload.text, resultText);
    assert.equal(resultSharePayload.url, baseUrl);
    assert.equal(await evaluate("window.__twainResultShareActivation"), true);

    await evaluate(`
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: () => Promise.reject(new DOMException('Native share rejected', 'NotAllowedError')),
      });
    `);
    await clickSelector("#shareResultButton");
    await delay(220);
    currentState = await state();
    assert.equal(currentState.shareFallbackOpen, true);
    assert.equal(currentState.shareFallbackText, `${resultText} ${baseUrl}`);
    await configureViewport({ width: 390, height: 844, mobile: true });
    await assertLayout("390x844 result share fallback");
    await capture("390x844-result-share-fallback");
    await configureViewport({ width: 1440, height: 1000 });

    await evaluate(`
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (value) => { window.__twainResultCopiedText = value; } },
      });
    `);
    await clickSelector("#copyShareFallbackButton");
    await delay(25);
    assert.equal(
      await evaluate("window.__twainResultCopiedText"),
      `${resultText} ${baseUrl}`,
    );
    currentState = await state();
    assert.match(currentState.status, /result was copied/);
    assert.equal(currentState.shareFallbackOpen, false);
    assert.equal(currentState.shareFeedbackHidden, false);
    await evaluate("document.querySelector('#shareFeedback').hidden = true");

    await evaluate(`Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: () => Promise.reject(new DOMException('Share cancelled', 'AbortError')),
    })`);
    await clickSelector("#shareResultButton");
    await delay(50);
    assert.equal((await state()).shareFallbackOpen, false);

    await clickSelector("#languageButton");
    await clickSelector('.language-option[data-locale="zh-TW"]');
    currentState = await state();
    const localizedResultText = `我在 ${currentState.timer} 內完成了今天的 Twain #4，使用了 2 次提示。你能比我更快嗎？`;
    await evaluate(`Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: () => Promise.reject(new DOMException('Native share rejected', 'NotAllowedError')),
    })`);
    await clickSelector("#shareResultButton");
    await delay(220);
    currentState = await state();
    assert.equal(currentState.shareFallbackOpen, true);
    assert.equal(currentState.shareFallbackText, `${localizedResultText} ${baseUrl}`);
    await configureViewport({ width: 390, height: 844, mobile: true });
    await assertLayout("390x844 Traditional Chinese result share fallback");
    await capture("390x844-zh-tw-result-share-fallback");
    await clickSelector("#closeShareFallbackButton");
    await configureViewport({ width: 1440, height: 1000 });
    await clickSelector("#languageButton");
    await clickSelector('.language-option[data-locale="auto"]');
    assert.equal((await state()).documentLanguage, "en");
    checks.push(
      "result Share preserves direct activation, localizes numbered Hint-aware copy, exposes a copy dialog after native failure, and leaves cancellation silent",
    );

    await loadViewport({ width: 1440, height: 1000, fresh: false });
    currentState = await state();
    assert.equal(currentState.dailyProgress, "All 5 daily stages complete");
    assert.equal(currentState.completionHidden, false);
    assert.equal(currentState.completionTitle, "Well played!");
    assert.equal(currentState.shareResultHidden, false);
    assert.equal(currentState.completionCountdown, "Come back in 08:00:00");

    await evaluate("globalThis.__twainVisualNow += 2000");
    await delay(350);
    assert.equal((await state()).completionCountdown, "Come back in 07:59:58");

    await evaluate(`globalThis.__twainVisualNow = ${FIXED_NOW + 8 * 60 * 60 * 1000}`);
    for (let attempt = 0; attempt < 100; attempt += 1) {
      currentState = await state();

      if (currentState.dailyDate === "#5 | Aug 30") {
        break;
      }

      await delay(100);
    }
    assert.equal(currentState.dailyDate, "#5 | Aug 30");
    assert.equal(currentState.dailyProgressNow, "0");
    assert.equal(currentState.completionHidden, true);
    assert.equal(currentState.timer, "00:00");
    checks.push(
      "only full daily completion records one idempotent local streak day; the result overlay restores, shares numbered time and Hint count, counts down live, and rolls into the next numbered Taiwan day",
    );

    await loadViewport({ width: 768, height: 1024 });
    await assertLayout("768x1024 daily Easy fresh");
    await capture("768x1024-daily-easy-fresh", { fullPage: true });

    await loadViewport({ width: 390, height: 844, mobile: true });
    await assertLayout("390x844 daily Easy fresh");
    await capture("390x844-daily-easy-fresh");
    const zoomTarget = await evaluate(`(() => {
      const rect = document.querySelector('.daily-progress').getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    })()`);
    const scaleBeforeDoubleTap = await evaluate("visualViewport.scale");
    assert.equal(
      await evaluate("getComputedStyle(document.documentElement).touchAction"),
      "manipulation",
    );
    await cdp.call(
      "Input.synthesizeTapGesture",
      {
        x: zoomTarget.x,
        y: zoomTarget.y,
        tapCount: 2,
        gestureSourceType: "touch",
      },
      sessionId,
    );
    await delay(300);
    assert.ok(
      Math.abs((await evaluate("visualViewport.scale")) - scaleBeforeDoubleTap) <
        0.001,
    );
    const selectionPolicy = await evaluate(`(() => ({
      root: getComputedStyle(document.documentElement).userSelect,
      target: getComputedStyle(document.querySelector('.daily-progress')).userSelect,
    }))()`);
    assert.deepEqual(selectionPolicy, { root: "none", target: "none" });
    await evaluate("document.getSelection()?.removeAllRanges()");
    await cdp.call(
      "Input.synthesizeTapGesture",
      {
        x: zoomTarget.x,
        y: zoomTarget.y,
        duration: 800,
        tapCount: 1,
        gestureSourceType: "touch",
      },
      sessionId,
    );
    await delay(200);
    assert.equal(await evaluate("document.getSelection()?.toString() ?? ''"), "");
    checks.push("mobile double-tap zoom and long-press selection remain suppressed");

    await loadViewport({ width: 320, height: 800, mobile: true });
    await assertLayout("320x800 daily Easy fresh");
    await capture("320x800-daily-easy-fresh");

    await loadViewport({
      width: 390,
      height: 844,
      mobile: true,
      reduced: true,
    });
    const motion = await evaluate(`(() => ({
      matches: matchMedia('(prefers-reduced-motion: reduce)').matches,
      transitionDuration: getComputedStyle(document.querySelector('.route-line')).transitionDuration,
    }))()`);
    assert.equal(motion.matches, true);
    assert.ok(Number.parseFloat(motion.transitionDuration) <= 0.00001);
    await capture("390x844-daily-reduced-motion");
    checks.push("reduced-motion preference collapses route transition timing");

    await evaluate("document.activeElement?.blur(); window.scrollTo(0, 0)");
    for (let index = 0; index < 20; index += 1) {
      await dispatchKey("Tab");

      if ((await state()).activeElement === "board") {
        break;
      }
    }
    assert.equal((await state()).activeElement, "board");
    assert.equal(
      await evaluate(
        "getComputedStyle(document.querySelector('#board')).outlineStyle",
      ),
      "none",
    );
    checks.push("keyboard focus reaches the board without a blue outer outline");

    assert.ok(analyticsRequests.length >= 1, "Consented analytics made no tag request.");
    assert.deepEqual(
      [...new Set(analyticsRequests)],
      [`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.measurementId}`],
      "Analytics requested an unexpected endpoint.",
    );
    assert.deepEqual(pageErrors, [], `Browser errors: ${pageErrors.join("\n")}`);
    checks.push("no runtime or browser-console errors");

    const summary = {
      browser: browserExecutable,
      checks,
      dateKey: FIXED_DATE_KEY,
      outputDirectory,
      screenshots,
      url: baseUrl,
    };
    await writeFile(
      path.join(outputDirectory, "summary.json"),
      `${JSON.stringify(summary, null, 2)}\n`,
    );
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

    if (browserStderr.includes("DevToolsActivePort file doesn't exist")) {
      throw new Error(browserStderr);
    }
  } finally {
    await Promise.all([
      terminateProcess(browserProcess),
      terminateProcess(serverProcess),
    ]);

    const safeProfilePrefix = path.join(tmpdir(), "twain-visual-qa-profile-");

    if (profileDirectory.startsWith(safeProfilePrefix)) {
      await rm(profileDirectory, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 100,
      });
    }
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`);
  process.exitCode = 1;
});
