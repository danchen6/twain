export const DEFAULT_LOCALE = "en";
export const LOCALE_STORAGE_KEY = "twain:locale:v1";

export const SUPPORTED_LOCALES = Object.freeze([
  Object.freeze({ code: "zh-TW", label: "繁體中文" }),
  Object.freeze({ code: "en", label: "English" }),
  Object.freeze({ code: "zh-CN", label: "简体中文" }),
  Object.freeze({ code: "ja", label: "日本語" }),
  Object.freeze({ code: "ko", label: "한국어" }),
  Object.freeze({ code: "es", label: "Español" }),
  Object.freeze({ code: "pt-BR", label: "Português (Brasil)" }),
]);

const SUPPORTED_LOCALE_CODES = new Set(
  SUPPORTED_LOCALES.map(({ code }) => code),
);
const DEFAULT_LOCALE_LABEL =
  SUPPORTED_LOCALES.find(({ code }) => code === DEFAULT_LOCALE)?.label ??
  DEFAULT_LOCALE;

const ENGLISH = {
  metaTitle: "Twain — Never the twain shall meet",
  metaDescription:
    "Guide two paths through every cell without letting them meet. A new Twain puzzle run arrives every Taiwan day.",
  homeLabel: "Twain home",
  helpButtonLabel: "How to play",
  shareButtonLabel: "Share today's Twain",
  languageButtonLabel: "Choose language",
  gameLabel: "Twain puzzle",
  progressLabel: "Today's progress",
  clear: "Clear",
  boardLabel: "Daily Twain puzzle board",
  cellAria: ({ row, col }) => `Row ${row}, column ${col}`,
  cellClueAria: ({ row, col, line, clue }) =>
    `Row ${row}, column ${col}, ${line} clue ${clue}`,
  shareAction: "Share",
  undo: "Undo",
  hint: "Hint",
  boardInstructions:
    "Draw the Number line from 1 through its numbered clues and the Letter line from A through its lettered clues. The lines cannot share cells, and together they must fill every cell.",
  howToTitle: "How to play",
  closeHowTo: "Close how to play",
  guideTitle: "Guide both lines",
  guideCopy: "Start at 1 or A and follow each sequence in order.",
  fillTitle: "Fill together",
  fillCopy: "Cover every cell between both lines. They cannot share a cell or cross a wall.",
  keyboardHtml:
    'Keyboard: <kbd>N</kbd>/<kbd>L</kbd> selects a line, arrows move, Enter starts, Backspace undoes, <kbd>H</kbd> hints, and <kbd>R</kbd> clears.',
  shareTitle: "Share Twain",
  shareTitleNumbered: ({ number }) => `Share Twain #${number}`,
  closeShare: "Close sharing dialog",
  shareInstructions: "Scan to play on another device, or copy the link.",
  qrLabel: "QR code for today's Twain link",
  linkLabel: "Link",
  copyLink: "Copy link",
  copied: "Copied",
  shareFallbackTitle: "Share Twain",
  closeShareFallback: "Close sharing fallback",
  shareFallbackInstructions:
    "Native sharing is unavailable here. Copy this instead.",
  copy: "Copy",
  languageTitle: "Language",
  languageAutomatic: ({ language }) => `Automatic · ${language}`,
  languageChanged: ({ language }) => `Language changed to ${language}.`,
  privacyPreferences: "Privacy choices",
  privacyBannerTitle: "Privacy & analytics",
  privacyBannerCopy:
    "Twain stores game progress on this device. Optional Google Analytics helps us understand completions, play time, streaks, and hint use, and stays off until you allow it.",
  privacyDetails: "Privacy details",
  privacyDialogTitle: "Privacy & analytics",
  closePrivacy: "Close privacy choices",
  privacyDialogIntro:
    "Declining applies only to this browsing session; allowing analytics is saved in this browser. You can change your choice at any time.",
  privacyCollectTitle: "If you allow analytics",
  privacyCollectCopy:
    "With Google Analytics enabled, Twain sends gameplay milestones, completion and stage times, hints, mistakes, streak totals, and interface settings. Enhanced Measurement also records page views and, when applicable, scroll depth, outbound-link clicks, site searches, video engagement, file downloads, and form interactions. Google Analytics also receives page and link metadata, cookie-based pseudonymous identifiers, and basic device, browser, and approximate location data.",
  privacyAvoidTitle: "Custom gameplay event limits",
  privacyAvoidCopy:
    "Twain’s custom gameplay events exclude puzzle paths, individual moves, puzzle seeds, clue values, names, email addresses, account IDs, and free-text input. Enhanced Measurement may send the page and interaction metadata described above when applicable.",
  privacyStatusGranted: "Current choice: analytics allowed.",
  privacyStatusDenied: "Current choice: analytics declined.",
  privacyStatusUnset: "Current choice: not selected.",
  privacyDecline: "Decline",
  privacyAccept: "Allow analytics",
  privacySavedGranted: "Optional analytics allowed.",
  privacySavedDenied: "Optional analytics disabled.",
  privacySaveFailed:
    "Your privacy choice could not be saved. Analytics remains disabled.",
  lineNumber: "Number line",
  lineLetter: "Letter line",
  difficultyEasy: "Easy",
  difficultyMedium: "Medium",
  difficultyHard: "Hard",
  difficultyExtra: "Extra",
  difficultyUltra: "Ultra",
  dateAria: ({ date }) => `Today's puzzle date is ${date}`,
  dateNumberedAria: ({ date, number }) =>
    `Today's puzzle is Twain number ${number}, ${date}`,
  timerRunning: "running",
  timerPaused: "paused",
  timerAria: ({ state, time }) => `Daily elapsed time, ${state}, ${time}`,
  countdown: ({ time }) => `Come back in ${time}`,
  boardStageAria: ({ difficulty, stage, total, rows, cols }) =>
    `${difficulty} daily Twain puzzle, stage ${stage} of ${total}, ${rows} by ${cols}`,
  cellsLeft: ({ count }) => `${count} ${count === 1 ? "cell" : "cells"} left.`,
  statusDailyComplete: ({ total, time }) =>
    `Today's ${total}-board Twain run is complete in ${time}.`,
  statusStageComplete: ({ difficulty }) =>
    `${difficulty} complete. The daily timer is paused until the next stage begins.`,
  statusFirstStart:
    "Start at 1 or A. The daily timer begins with your first valid move.",
  statusReady: ({ difficulty }) =>
    `${difficulty} is ready. The daily timer resumes with your first valid move.`,
  statusLineComplete: ({ line, continuation, cells }) =>
    `${line} complete.${continuation} ${cells}`,
  statusContinueLine: ({ line }) => ` Continue with ${line}.`,
  statusNextClue: ({ line, clue }) => `${line}: next ${clue}.`,
  statusFinalClue: ({ line }) => `${line} has reached its final clue.`,
  progressAllComplete: ({ total }) => `All ${total} daily stages complete`,
  progressNextReady: ({ completed, total }) =>
    `${completed} of ${total} stages complete; next level ready`,
  progressCurrent: ({ completed, difficulty, stage, total }) =>
    `${completed} complete; ${difficulty}, stage ${stage} of ${total}`,
  completionWell: "Well played!",
  completionNice: "Nicely done!",
  nextLevel: "Next level",
  completionStats: ({ time, hints }) => `Completed in ${time} · ${hints}`,
  hintCount: ({ count }) => `${count} ${count === 1 ? "hint" : "hints"}`,
  newDay: "A new Taiwan day has begun. Today's first board is ready.",
  boardClearedPaused:
    "Board cleared. The daily timer will resume with your next move; start again at 1 or A.",
  boardClearedRunning:
    "Board cleared. The daily timer continues; start again at 1 or A.",
  undone: "One step undone.",
  hintCorrected:
    "Conflicting detours were cleared; one correct step was added.",
  hintAdded: ({ line }) => `One correct step added to ${line}.`,
  lineSelected: ({ line }) => `${line} selected.`,
  moveAdjacent: "Move to a neighboring cell.",
  moveWall: "A wall blocks that move.",
  moveOrder: "Follow this line's clues in order.",
  moveOccupied: "The two lines cannot share a cell.",
  moveVisited:
    "That cell is already part of this line. Backtrack along the route one cell at a time.",
  moveReserved: ({ line }) =>
    `That clue belongs to the other line. Use ${line}.`,
  moveWrongStart: ({ line, clue }) => `Start the ${line.toLowerCase()} on ${clue}.`,
  moveFinished: "That line already ends at its final clue.",
  moveSolved: "Both paths complete — beautifully done.",
  moveLineComplete: ({ line }) => `${line} complete. Continue the other line.`,
  qrUnavailable: "The QR code is unavailable here. Copy the link instead.",
  manualLink:
    "Automatic copying is unavailable. Select the link and copy it manually.",
  manualLinkAria:
    "Automatic copying is unavailable. The Twain link is selected for manual copying.",
  linkCopied: "Today's Twain link copied.",
  resultCopied: "Your Twain result was copied.",
  manualShare: "Select the text and copy it manually.",
  manualShareAria:
    "Automatic copying is unavailable. The share text is selected for manual copying.",
  shareHintNone: "no hints",
  shareHintCount: ({ count }) => `${count} ${count === 1 ? "hint" : "hints"}`,
  shareResultNumbered: ({ number, time, hints }) =>
    `I completed today's Twain #${number} in ${time} with ${hints}. Can you beat my time?`,
  shareResultUnnumbered: ({ time, hints }) =>
    `I completed today's Twain in ${time} with ${hints}. Can you beat my time?`,
};

const TRADITIONAL_CHINESE = {
  metaTitle: "Twain — 兩條路線，永不相交",
  metaDescription: "遊玩今天的 Twain 每日謎題。兩條路線，永不相交。",
  homeLabel: "Twain 首頁",
  helpButtonLabel: "查看玩法",
  shareButtonLabel: "分享今天的 Twain",
  languageButtonLabel: "選擇語言",
  gameLabel: "Twain 謎題",
  progressLabel: "今日進度",
  clear: "清除",
  boardLabel: "每日 Twain 謎題棋盤",
  cellAria: ({ row, col }) => `第 ${row} 列，第 ${col} 欄`,
  cellClueAria: ({ row, col, line, clue }) =>
    `第 ${row} 列，第 ${col} 欄，${line}提示 ${clue}`,
  shareAction: "分享",
  undo: "復原",
  hint: "提示",
  boardInstructions:
    "從 1 開始畫數字線，依序通過數字提示；從 A 開始畫字母線，依序通過字母提示。兩條線不能共用格子，並且必須共同填滿整個棋盤。",
  howToTitle: "玩法",
  closeHowTo: "關閉玩法說明",
  guideTitle: "引導兩條路線",
  guideCopy: "從 1 或 A 開始，依序連接各自的提示。",
  fillTitle: "共同填滿棋盤",
  fillCopy: "兩條路線必須填滿所有格子，不能共用格子或穿越牆壁。",
  keyboardHtml:
    '鍵盤：<kbd>N</kbd>/<kbd>L</kbd> 選擇路線，方向鍵移動，Enter 開始，Backspace 復原，<kbd>H</kbd> 提示，<kbd>R</kbd> 清除。',
  shareTitle: "分享 Twain",
  shareTitleNumbered: ({ number }) => `分享 Twain #${number}`,
  closeShare: "關閉分享視窗",
  shareInstructions: "掃描 QR code 在另一台裝置上遊玩，或複製連結。",
  qrLabel: "今天 Twain 連結的 QR code",
  linkLabel: "連結",
  copyLink: "複製連結",
  copied: "已複製",
  shareFallbackTitle: "分享 Twain",
  closeShareFallback: "關閉分享備援視窗",
  shareFallbackInstructions: "此處無法使用系統分享，請改為複製以下內容。",
  copy: "複製",
  languageTitle: "語言",
  languageAutomatic: ({ language }) => `自動 · ${language}`,
  languageChanged: ({ language }) => `語言已切換為${language}。`,
  privacyPreferences: "隱私設定",
  privacyBannerTitle: "隱私與分析",
  privacyBannerCopy:
    "Twain 會將遊戲進度儲存在這台裝置。選擇性的 Google Analytics 可協助我們了解完成情形、遊玩時間、連續天數與提示使用量，只有在你同意後才會啟用。",
  privacyDetails: "詳細資訊",
  privacyDialogTitle: "隱私與分析",
  closePrivacy: "關閉隱私設定",
  privacyDialogIntro:
    "拒絕只適用於這次瀏覽工作階段；允許分析則會儲存在這個瀏覽器中。你可以隨時變更選擇。",
  privacyCollectTitle: "同意分析後",
  privacyCollectCopy:
    "啟用 Google Analytics 後，Twain 會傳送遊戲里程碑、完成與各關時間、提示、錯誤、連續完成紀錄及介面設定。Enhanced Measurement 也會記錄頁面瀏覽，以及適用時的捲動深度、外部連結點擊、站內搜尋、影片互動、檔案下載與表單互動；Google Analytics 另會收到頁面與連結中繼資料、Cookie 型假名識別碼，以及基本裝置、瀏覽器與概略位置資料。",
  privacyAvoidTitle: "自訂遊戲事件的界線",
  privacyAvoidCopy:
    "Twain 的自訂遊戲事件不包含解題路徑、個別移動、謎題 seed、線索值、姓名、電子郵件地址、account ID 或自由文字輸入。適用時，Enhanced Measurement 仍可能傳送上述頁面與互動中繼資料。",
  privacyStatusGranted: "目前選擇：允許分析。",
  privacyStatusDenied: "目前選擇：不同意分析。",
  privacyStatusUnset: "目前選擇：尚未選擇。",
  privacyDecline: "不同意",
  privacyAccept: "允許分析",
  privacySavedGranted: "已允許選擇性分析。",
  privacySavedDenied: "已停用選擇性分析。",
  privacySaveFailed: "無法儲存你的隱私選擇，分析功能會維持停用。",
  lineNumber: "數字線",
  lineLetter: "字母線",
  difficultyEasy: "簡單",
  difficultyMedium: "中等",
  difficultyHard: "困難",
  difficultyExtra: "進階",
  difficultyUltra: "極限",
  dateAria: ({ date }) => `今天的謎題日期是 ${date}`,
  dateNumberedAria: ({ date, number }) => `今天是 Twain 第 ${number} 題，日期 ${date}`,
  timerRunning: "計時中",
  timerPaused: "已暫停",
  timerAria: ({ state, time }) => `每日計時，${state}，${time}`,
  countdown: ({ time }) => `距離下一題還有 ${time}`,
  boardStageAria: ({ difficulty, stage, total, rows, cols }) =>
    `每日 ${difficulty} Twain 謎題，第 ${stage} 關，共 ${total} 關，${rows} × ${cols} 格`,
  cellsLeft: ({ count }) => `還有 ${count} 格。`,
  statusDailyComplete: ({ total, time }) =>
    `今天共 ${total} 關的 Twain 已在 ${time} 完成。`,
  statusStageComplete: ({ difficulty }) =>
    `${difficulty}關卡完成。每日計時已暫停，進入下一關後繼續。`,
  statusFirstStart: "從 1 或 A 開始；第一次有效移動後開始每日計時。",
  statusReady: ({ difficulty }) =>
    `${difficulty}關卡已就緒；第一次有效移動後繼續每日計時。`,
  statusLineComplete: ({ line, continuation, cells }) =>
    `${line}已完成。${continuation}${cells}`,
  statusContinueLine: ({ line }) => `請繼續完成${line}。`,
  statusNextClue: ({ line, clue }) => `${line}：下一個是 ${clue}。`,
  statusFinalClue: ({ line }) => `${line}已抵達最後一個提示。`,
  progressAllComplete: ({ total }) => `今日 ${total} 關全部完成`,
  progressNextReady: ({ completed, total }) =>
    `已完成 ${completed}/${total} 關；下一關已就緒`,
  progressCurrent: ({ completed, difficulty, stage, total }) =>
    `已完成 ${completed} 關；${difficulty}，第 ${stage}/${total} 關`,
  completionWell: "漂亮完成！",
  completionNice: "做得好！",
  nextLevel: "下一關",
  completionStats: ({ time, hints }) => `完成時間 ${time} · ${hints}`,
  hintCount: ({ count }) => `${count} 次提示`,
  newDay: "台灣新的一天開始了，今天的第一關已就緒。",
  boardClearedPaused: "棋盤已清除。下一次移動後繼續計時；請重新從 1 或 A 開始。",
  boardClearedRunning: "棋盤已清除。每日計時持續進行；請重新從 1 或 A 開始。",
  undone: "已復原一步。",
  hintCorrected: "已清除衝突的岔路，並加入一個正確步驟。",
  hintAdded: ({ line }) => `已替${line}加入一個正確步驟。`,
  lineSelected: ({ line }) => `已選擇${line}。`,
  moveAdjacent: "請移動到相鄰格子。",
  moveWall: "牆壁擋住了這一步。",
  moveOrder: "請依序通過這條線的提示。",
  moveOccupied: "兩條線不能共用格子。",
  moveVisited: "這個格子已在線上，請沿路線一次退回一格。",
  moveReserved: ({ line }) => `這個提示屬於另一條線，請使用${line}。`,
  moveWrongStart: ({ line, clue }) => `${line}必須從 ${clue} 開始。`,
  moveFinished: "這條線已在最後一個提示結束。",
  moveSolved: "兩條路線都完成了，太漂亮了！",
  moveLineComplete: ({ line }) => `${line}已完成，請繼續另一條線。`,
  qrUnavailable: "目前無法產生 QR code，請改為複製連結。",
  manualLink: "無法自動複製，請選取連結後手動複製。",
  manualLinkAria: "無法自動複製，已選取 Twain 連結供手動複製。",
  linkCopied: "已複製今天的 Twain 連結。",
  resultCopied: "已複製你的 Twain 成績。",
  manualShare: "請選取文字後手動複製。",
  manualShareAria: "無法自動複製，已選取分享文字供手動複製。",
  shareHintNone: "沒有使用提示",
  shareHintCount: ({ count }) => `使用了 ${count} 次提示`,
  shareResultNumbered: ({ number, time, hints }) =>
    `我在 ${time} 內完成了今天的 Twain #${number}，${hints}。你能比我更快嗎？`,
  shareResultUnnumbered: ({ time, hints }) =>
    `我在 ${time} 內完成了今天的 Twain，${hints}。你能比我更快嗎？`,
};

const SIMPLIFIED_CHINESE = {
  ...TRADITIONAL_CHINESE,
  metaTitle: "Twain — 两条路线，永不相交",
  metaDescription: "游玩今天的 Twain 每日谜题。两条路线，永不相交。",
  homeLabel: "Twain 首页",
  helpButtonLabel: "查看玩法",
  shareButtonLabel: "分享今天的 Twain",
  languageButtonLabel: "选择语言",
  gameLabel: "Twain 谜题",
  progressLabel: "今日进度",
  clear: "清除",
  boardLabel: "每日 Twain 谜题棋盘",
  cellAria: ({ row, col }) => `第 ${row} 行，第 ${col} 列`,
  cellClueAria: ({ row, col, line, clue }) =>
    `第 ${row} 行，第 ${col} 列，${line}提示 ${clue}`,
  boardInstructions:
    "从 1 开始画数字线，依次通过数字提示；从 A 开始画字母线，依次通过字母提示。两条线不能共用格子，并且必须共同填满整个棋盘。",
  howToTitle: "玩法",
  closeHowTo: "关闭玩法说明",
  guideTitle: "引导两条路线",
  guideCopy: "从 1 或 A 开始，依次连接各自的提示。",
  fillTitle: "共同填满棋盘",
  fillCopy: "两条路线必须填满所有格子，不能共用格子或穿越墙壁。",
  keyboardHtml:
    '键盘：<kbd>N</kbd>/<kbd>L</kbd> 选择路线，方向键移动，Enter 开始，Backspace 撤销，<kbd>H</kbd> 提示，<kbd>R</kbd> 清除。',
  shareTitle: "分享 Twain",
  shareTitleNumbered: ({ number }) => `分享 Twain #${number}`,
  closeShare: "关闭分享窗口",
  shareInstructions: "扫描二维码，在另一台设备上游玩，或复制链接。",
  qrLabel: "今天 Twain 链接的二维码",
  linkLabel: "链接",
  copyLink: "复制链接",
  copied: "已复制",
  shareFallbackTitle: "分享 Twain",
  closeShareFallback: "关闭分享备用窗口",
  shareFallbackInstructions: "此处无法使用系统分享，请改为复制以下内容。",
  copy: "复制",
  languageTitle: "语言",
  languageAutomatic: ({ language }) => `自动 · ${language}`,
  languageChanged: ({ language }) => `语言已切换为${language}。`,
  privacyPreferences: "隐私设置",
  privacyBannerTitle: "隐私与分析",
  privacyBannerCopy:
    "Twain 会将游戏进度保存在此设备上。可选的 Google Analytics 可帮助我们了解完成情况、游玩时间、连续天数与提示使用量，只有在你同意后才会启用。",
  privacyDetails: "详细信息",
  privacyDialogTitle: "隐私与分析",
  closePrivacy: "关闭隐私设置",
  privacyDialogIntro:
    "拒绝仅适用于本次浏览会话；允许分析则会保存在此浏览器中。你可以随时更改选择。",
  privacyCollectTitle: "同意分析后",
  privacyCollectCopy:
    "启用 Google Analytics 后，Twain 会发送游戏里程碑、完成与各关时间、提示、错误、连续完成记录及界面设置。Enhanced Measurement 也会记录页面浏览，以及适用时的滚动深度、外部链接点击、站内搜索、视频互动、文件下载与表单互动；Google Analytics 还会收到页面与链接元数据、基于 Cookie 的假名标识符，以及基本设备、浏览器与大致位置数据。",
  privacyAvoidTitle: "自定义游戏事件的范围",
  privacyAvoidCopy:
    "Twain 的自定义游戏事件不包含解题路径、单步移动、谜题 seed、线索值、姓名、电子邮件地址、账号 ID 或自由文本输入。适用时，Enhanced Measurement 仍可能发送上述页面与互动元数据。",
  privacyStatusGranted: "当前选择：允许分析。",
  privacyStatusDenied: "当前选择：不同意分析。",
  privacyStatusUnset: "当前选择：尚未选择。",
  privacyDecline: "不同意",
  privacyAccept: "允许分析",
  privacySavedGranted: "已允许可选分析。",
  privacySavedDenied: "已停用可选分析。",
  privacySaveFailed: "无法保存你的隐私选择，分析功能将保持停用。",
  lineNumber: "数字线",
  lineLetter: "字母线",
  difficultyEasy: "简单",
  difficultyMedium: "中等",
  difficultyHard: "困难",
  difficultyExtra: "进阶",
  difficultyUltra: "极限",
  dateAria: ({ date }) => `今天的谜题日期是 ${date}`,
  dateNumberedAria: ({ date, number }) => `今天是 Twain 第 ${number} 题，日期 ${date}`,
  timerRunning: "计时中",
  timerPaused: "已暂停",
  timerAria: ({ state, time }) => `每日计时，${state}，${time}`,
  countdown: ({ time }) => `距离下一题还有 ${time}`,
  boardStageAria: ({ difficulty, stage, total, rows, cols }) =>
    `每日 ${difficulty} Twain 谜题，第 ${stage} 关，共 ${total} 关，${rows} × ${cols} 格`,
  cellsLeft: ({ count }) => `还有 ${count} 格。`,
  statusDailyComplete: ({ total, time }) =>
    `今天共 ${total} 关的 Twain 已在 ${time} 完成。`,
  statusStageComplete: ({ difficulty }) =>
    `${difficulty}关卡完成。每日计时已暂停，进入下一关后继续。`,
  statusFirstStart: "从 1 或 A 开始；第一次有效移动后开始每日计时。",
  statusReady: ({ difficulty }) =>
    `${difficulty}关卡已就绪；第一次有效移动后继续每日计时。`,
  statusLineComplete: ({ line, continuation, cells }) =>
    `${line}已完成。${continuation}${cells}`,
  statusContinueLine: ({ line }) => `请继续完成${line}。`,
  statusNextClue: ({ line, clue }) => `${line}：下一个是 ${clue}。`,
  statusFinalClue: ({ line }) => `${line}已到达最后一个提示。`,
  progressAllComplete: ({ total }) => `今日 ${total} 关全部完成`,
  progressNextReady: ({ completed, total }) =>
    `已完成 ${completed}/${total} 关；下一关已就绪`,
  progressCurrent: ({ completed, difficulty, stage, total }) =>
    `已完成 ${completed} 关；${difficulty}，第 ${stage}/${total} 关`,
  completionWell: "漂亮完成！",
  completionNice: "做得好！",
  nextLevel: "下一关",
  completionStats: ({ time, hints }) => `完成时间 ${time} · ${hints}`,
  hintCount: ({ count }) => `${count} 次提示`,
  newDay: "台湾新的一天开始了，今天的第一关已就绪。",
  boardClearedPaused: "棋盘已清除。下一次移动后继续计时；请重新从 1 或 A 开始。",
  boardClearedRunning: "棋盘已清除。每日计时继续进行；请重新从 1 或 A 开始。",
  undone: "已撤销一步。",
  hintCorrected: "已清除冲突的岔路，并加入一个正确步骤。",
  hintAdded: ({ line }) => `已为${line}加入一个正确步骤。`,
  lineSelected: ({ line }) => `已选择${line}。`,
  moveAdjacent: "请移动到相邻格子。",
  moveWall: "墙壁挡住了这一步。",
  moveOrder: "请依次通过这条线的提示。",
  moveOccupied: "两条线不能共用格子。",
  moveVisited: "这个格子已经在线上，请沿路线一次退回一格。",
  moveReserved: ({ line }) => `这个提示属于另一条线，请使用${line}。`,
  moveWrongStart: ({ line, clue }) => `${line}必须从 ${clue} 开始。`,
  moveFinished: "这条线已在最后一个提示结束。",
  moveSolved: "两条路线都完成了，太漂亮了！",
  moveLineComplete: ({ line }) => `${line}已完成，请继续另一条线。`,
  qrUnavailable: "目前无法生成二维码，请改为复制链接。",
  manualLink: "无法自动复制，请选择链接后手动复制。",
  manualLinkAria: "无法自动复制，已选择 Twain 链接供手动复制。",
  linkCopied: "已复制今天的 Twain 链接。",
  resultCopied: "已复制你的 Twain 成绩。",
  manualShare: "请选择文字后手动复制。",
  manualShareAria: "无法自动复制，已选择分享文字供手动复制。",
  shareHintNone: "没有使用提示",
  shareHintCount: ({ count }) => `使用了 ${count} 次提示`,
  shareResultNumbered: ({ number, time, hints }) =>
    `我用 ${time} 完成了今天的 Twain #${number}，${hints}。你能比我更快吗？`,
  shareResultUnnumbered: ({ time, hints }) =>
    `我用 ${time} 完成了今天的 Twain，${hints}。你能比我更快吗？`,
};

const JAPANESE = {
  ...ENGLISH,
  metaTitle: "Twain — 2本のラインは交わらない",
  metaDescription: "今日の Twain デイリーパズルに挑戦。2本のラインは交わりません。",
  homeLabel: "Twain ホーム",
  helpButtonLabel: "遊び方",
  shareButtonLabel: "今日の Twain を共有",
  languageButtonLabel: "言語を選択",
  gameLabel: "Twain パズル",
  progressLabel: "今日の進捗",
  clear: "クリア",
  boardLabel: "デイリー Twain パズル盤",
  cellAria: ({ row, col }) => `${row}行${col}列`,
  cellClueAria: ({ row, col, line, clue }) =>
    `${row}行${col}列、${line}の手がかり ${clue}`,
  shareAction: "共有",
  undo: "元に戻す",
  hint: "ヒント",
  boardInstructions:
    "数字ラインは 1 から数字の手がかりを順に、文字ラインは A から文字の手がかりを順にたどります。2本のラインは同じマスを使わず、合わせてすべてのマスを埋めます。",
  howToTitle: "遊び方",
  closeHowTo: "遊び方を閉じる",
  guideTitle: "2本のラインを導く",
  guideCopy: "1 または A から始め、それぞれの順番どおりに進みます。",
  fillTitle: "一緒に盤面を埋める",
  fillCopy: "2本で全マスを埋めます。同じマスの共有や壁の通過はできません。",
  keyboardHtml:
    'キーボード：<kbd>N</kbd>/<kbd>L</kbd> でライン選択、矢印キーで移動、Enter で開始、Backspace で戻す、<kbd>H</kbd> でヒント、<kbd>R</kbd> でクリア。',
  shareTitle: "Twain を共有",
  shareTitleNumbered: ({ number }) => `Twain #${number} を共有`,
  closeShare: "共有画面を閉じる",
  shareInstructions: "別の端末で QR コードを読み取るか、リンクをコピーしてください。",
  qrLabel: "今日の Twain リンクの QR コード",
  linkLabel: "リンク",
  copyLink: "リンクをコピー",
  copied: "コピー済み",
  shareFallbackTitle: "Twain を共有",
  closeShareFallback: "共有の代替画面を閉じる",
  shareFallbackInstructions: "この環境では共有できません。代わりにコピーしてください。",
  copy: "コピー",
  languageTitle: "言語",
  languageAutomatic: ({ language }) => `自動 · ${language}`,
  languageChanged: ({ language }) => `言語を${language}に変更しました。`,
  privacyPreferences: "プライバシー設定",
  privacyBannerTitle: "プライバシーと分析",
  privacyBannerCopy:
    "Twain はゲームの進行状況をこの端末に保存します。任意の Google Analytics は、クリア状況、プレイ時間、連続記録、ヒント利用の把握に役立ち、許可するまで無効です。",
  privacyDetails: "詳細を見る",
  privacyDialogTitle: "プライバシーと分析",
  closePrivacy: "プライバシー設定を閉じる",
  privacyDialogIntro:
    "拒否はこのブラウジングセッション中のみ有効です。分析の許可はこのブラウザーに保存され、選択はいつでも変更できます。",
  privacyCollectTitle: "分析を許可した場合",
  privacyCollectCopy:
    "Google Analytics を有効にすると、Twain はプレイの節目、クリア時間と各ステージの時間、ヒント、ミス、連続記録、画面設定を送信します。Enhanced Measurement はページビューに加え、該当する場合はスクロールの深さ、外部リンクのクリック、サイト内検索、動画の操作、ファイルのダウンロード、フォーム操作も記録します。また Google Analytics にはページやリンクのメタデータ、Cookie ベースの仮名識別子、基本的な端末・ブラウザー・おおよその位置情報が送信されます。",
  privacyAvoidTitle: "カスタムゲームイベントの範囲",
  privacyAvoidCopy:
    "Twain のカスタムゲームイベントには、パズルの経路、個々の手、パズル seed、手掛かりの値、氏名、メールアドレス、アカウント ID、自由入力テキストは含まれません。該当する場合、Enhanced Measurement は上記のページおよび操作のメタデータを送信することがあります。",
  privacyStatusGranted: "現在の選択：分析を許可。",
  privacyStatusDenied: "現在の選択：分析を拒否。",
  privacyStatusUnset: "現在の選択：未選択。",
  privacyDecline: "拒否する",
  privacyAccept: "分析を許可",
  privacySavedGranted: "任意の分析を許可しました。",
  privacySavedDenied: "任意の分析を無効にしました。",
  privacySaveFailed:
    "プライバシー設定を保存できませんでした。分析は無効のままです。",
  lineNumber: "数字ライン",
  lineLetter: "文字ライン",
  difficultyEasy: "かんたん",
  difficultyMedium: "ふつう",
  difficultyHard: "むずかしい",
  difficultyExtra: "上級",
  difficultyUltra: "超上級",
  dateAria: ({ date }) => `今日のパズルの日付は${date}です`,
  dateNumberedAria: ({ date, number }) => `今日は Twain #${number}、${date}です`,
  timerRunning: "計測中",
  timerPaused: "一時停止",
  timerAria: ({ state, time }) => `デイリー経過時間、${state}、${time}`,
  countdown: ({ time }) => `次のパズルまで ${time}`,
  boardStageAria: ({ difficulty, stage, total, rows, cols }) =>
    `${difficulty}のデイリー Twain パズル、全${total}ステージ中${stage}、${rows}×${cols}`,
  cellsLeft: ({ count }) => `残り${count}マス。`,
  statusDailyComplete: ({ total, time }) =>
    `今日の全${total}盤を ${time} でクリアしました。`,
  statusStageComplete: ({ difficulty }) =>
    `${difficulty}をクリアしました。次のステージまでタイマーは一時停止します。`,
  statusFirstStart: "1 または A から開始します。最初の有効な操作でタイマーが始まります。",
  statusReady: ({ difficulty }) =>
    `${difficulty}の準備完了。最初の有効な操作でタイマーが再開します。`,
  statusLineComplete: ({ line, continuation, cells }) =>
    `${line}が完成しました。${continuation}${cells}`,
  statusContinueLine: ({ line }) => `${line}を続けてください。`,
  statusNextClue: ({ line, clue }) => `${line}：次は ${clue}。`,
  statusFinalClue: ({ line }) => `${line}は最後の手がかりに到達しました。`,
  progressAllComplete: ({ total }) => `全${total}ステージ完了`,
  progressNextReady: ({ completed, total }) =>
    `${total}ステージ中${completed}完了。次のレベルの準備完了`,
  progressCurrent: ({ completed, difficulty, stage, total }) =>
    `${completed}完了。${difficulty}、全${total}ステージ中${stage}`,
  completionWell: "お見事！",
  completionNice: "よくできました！",
  nextLevel: "次のレベル",
  completionStats: ({ time, hints }) => `クリアタイム ${time} · ${hints}`,
  hintCount: ({ count }) => `ヒント${count}回`,
  newDay: "台湾時間で新しい日になりました。今日の最初の盤を始められます。",
  boardClearedPaused: "盤面をクリアしました。次の操作でタイマーを再開します。1 または A から始めてください。",
  boardClearedRunning: "盤面をクリアしました。タイマーは継続中です。1 または A から始めてください。",
  undone: "1手戻しました。",
  hintCorrected: "競合する寄り道を消し、正しい1手を追加しました。",
  hintAdded: ({ line }) => `${line}に正しい1手を追加しました。`,
  lineSelected: ({ line }) => `${line}を選択しました。`,
  moveAdjacent: "隣のマスへ移動してください。",
  moveWall: "壁がこの移動をさえぎっています。",
  moveOrder: "このラインの手がかりを順番どおりにたどってください。",
  moveOccupied: "2本のラインは同じマスを使えません。",
  moveVisited: "このマスはすでにライン上です。経路に沿って1マスずつ戻ってください。",
  moveReserved: ({ line }) => `この手がかりはもう一方のライン用です。${line}を使ってください。`,
  moveWrongStart: ({ line, clue }) => `${line}は ${clue} から始めてください。`,
  moveFinished: "このラインは最後の手がかりですでに終了しています。",
  moveSolved: "2本の経路が完成しました。お見事です！",
  moveLineComplete: ({ line }) => `${line}が完成しました。もう一方を続けてください。`,
  qrUnavailable: "QR コードを作成できません。リンクをコピーしてください。",
  manualLink: "自動でコピーできません。リンクを選択して手動でコピーしてください。",
  manualLinkAria: "自動でコピーできないため、Twain のリンクを選択しました。",
  linkCopied: "今日の Twain リンクをコピーしました。",
  resultCopied: "Twain の結果をコピーしました。",
  manualShare: "テキストを選択して手動でコピーしてください。",
  manualShareAria: "自動でコピーできないため、共有テキストを選択しました。",
  shareHintNone: "ヒントなし",
  shareHintCount: ({ count }) => `ヒント${count}回`,
  shareResultNumbered: ({ number, time, hints }) =>
    `今日の Twain #${number} を ${time}でクリアしました（${hints}）。私のタイムを超えられますか？`,
  shareResultUnnumbered: ({ time, hints }) =>
    `今日の Twain を ${time}でクリアしました（${hints}）。私のタイムを超えられますか？`,
};

const KOREAN = {
  ...ENGLISH,
  metaTitle: "Twain — 두 선은 만나지 않습니다",
  metaDescription: "오늘의 Twain 데일리 퍼즐에 도전하세요. 두 선은 서로 만나지 않습니다.",
  homeLabel: "Twain 홈",
  helpButtonLabel: "플레이 방법",
  shareButtonLabel: "오늘의 Twain 공유",
  languageButtonLabel: "언어 선택",
  gameLabel: "Twain 퍼즐",
  progressLabel: "오늘의 진행 상황",
  clear: "지우기",
  boardLabel: "데일리 Twain 퍼즐 보드",
  cellAria: ({ row, col }) => `${row}행 ${col}열`,
  cellClueAria: ({ row, col, line, clue }) =>
    `${row}행 ${col}열, ${line} 단서 ${clue}`,
  shareAction: "공유",
  undo: "되돌리기",
  hint: "힌트",
  boardInstructions:
    "숫자 선은 1부터 숫자 단서를 순서대로, 문자 선은 A부터 문자 단서를 순서대로 연결하세요. 두 선은 같은 칸을 사용할 수 없으며 함께 모든 칸을 채워야 합니다.",
  howToTitle: "플레이 방법",
  closeHowTo: "플레이 방법 닫기",
  guideTitle: "두 선 연결하기",
  guideCopy: "1 또는 A에서 시작해 각 순서를 따라가세요.",
  fillTitle: "함께 모두 채우기",
  fillCopy: "두 선으로 모든 칸을 채우세요. 같은 칸을 쓰거나 벽을 넘을 수 없습니다.",
  keyboardHtml:
    '키보드: <kbd>N</kbd>/<kbd>L</kbd> 선 선택, 방향키 이동, Enter 시작, Backspace 되돌리기, <kbd>H</kbd> 힌트, <kbd>R</kbd> 지우기.',
  shareTitle: "Twain 공유",
  shareTitleNumbered: ({ number }) => `Twain #${number} 공유`,
  closeShare: "공유 창 닫기",
  shareInstructions: "다른 기기에서 QR 코드를 스캔하거나 링크를 복사하세요.",
  qrLabel: "오늘의 Twain 링크 QR 코드",
  linkLabel: "링크",
  copyLink: "링크 복사",
  copied: "복사됨",
  shareFallbackTitle: "Twain 공유",
  closeShareFallback: "공유 대체 창 닫기",
  shareFallbackInstructions: "이 환경에서는 공유할 수 없습니다. 대신 복사하세요.",
  copy: "복사",
  languageTitle: "언어",
  languageAutomatic: ({ language }) => `자동 · ${language}`,
  languageChanged: ({ language }) => `언어 설정을 변경했습니다: ${language}.`,
  privacyPreferences: "개인정보 설정",
  privacyBannerTitle: "개인정보 및 분석",
  privacyBannerCopy:
    "Twain은 게임 진행 상황을 이 기기에 저장합니다. 선택적 Google Analytics는 완료 현황, 플레이 시간, 연속 기록, 힌트 사용을 이해하는 데 도움이 되며 허용하기 전에는 꺼져 있습니다.",
  privacyDetails: "자세히 보기",
  privacyDialogTitle: "개인정보 및 분석",
  closePrivacy: "개인정보 설정 닫기",
  privacyDialogIntro:
    "거부는 현재 브라우징 세션에만 적용됩니다. 분석 허용은 이 브라우저에 저장되며 언제든지 선택을 변경할 수 있습니다.",
  privacyCollectTitle: "분석을 허용하는 경우",
  privacyCollectCopy:
    "Google Analytics를 사용하면 Twain은 게임 진행 단계, 완료 및 스테이지 시간, 힌트, 실수, 연속 기록, 화면 설정을 전송합니다. Enhanced Measurement는 페이지 조회와 해당하는 경우 스크롤 깊이, 외부 링크 클릭, 사이트 검색, 동영상 참여, 파일 다운로드, 양식 상호작용도 기록합니다. Google Analytics에는 페이지·링크 메타데이터, 쿠키 기반 가명 식별자, 기본 기기·브라우저·대략적 위치 정보도 전송됩니다.",
  privacyAvoidTitle: "맞춤 게임 이벤트 범위",
  privacyAvoidCopy:
    "Twain의 맞춤 게임 이벤트에는 퍼즐 경로, 개별 이동, 퍼즐 seed, 단서 값, 이름, 이메일 주소, 계정 ID, 자유 입력 텍스트가 포함되지 않습니다. 해당하는 경우 Enhanced Measurement는 위에 설명된 페이지 및 상호작용 메타데이터를 전송할 수 있습니다.",
  privacyStatusGranted: "현재 선택: 분석 허용.",
  privacyStatusDenied: "현재 선택: 분석 거부.",
  privacyStatusUnset: "현재 선택: 선택하지 않음.",
  privacyDecline: "거부",
  privacyAccept: "분석 허용",
  privacySavedGranted: "선택적 분석을 허용했습니다.",
  privacySavedDenied: "선택적 분석을 사용 중지했습니다.",
  privacySaveFailed:
    "개인정보 설정을 저장할 수 없습니다. 분석 기능은 비활성 상태로 유지됩니다.",
  lineNumber: "숫자 선",
  lineLetter: "문자 선",
  difficultyEasy: "쉬움",
  difficultyMedium: "보통",
  difficultyHard: "어려움",
  difficultyExtra: "고급",
  difficultyUltra: "최고 난도",
  dateAria: ({ date }) => `오늘의 퍼즐 날짜는 ${date}입니다`,
  dateNumberedAria: ({ date, number }) => `오늘은 Twain #${number}, ${date}입니다`,
  timerRunning: "진행 중",
  timerPaused: "일시 정지",
  timerAria: ({ state, time }) => `데일리 경과 시간, ${state}, ${time}`,
  countdown: ({ time }) => `다음 퍼즐까지 ${time}`,
  boardStageAria: ({ difficulty, stage, total, rows, cols }) =>
    `${difficulty} 데일리 Twain 퍼즐, ${total}단계 중 ${stage}단계, ${rows}×${cols}`,
  cellsLeft: ({ count }) => `${count}칸 남았습니다.`,
  statusDailyComplete: ({ total, time }) =>
    `오늘의 ${total}개 보드를 ${time}에 완료했습니다.`,
  statusStageComplete: ({ difficulty }) =>
    `${difficulty} 완료. 다음 단계까지 데일리 타이머가 일시 정지됩니다.`,
  statusFirstStart: "1 또는 A에서 시작하세요. 첫 유효 이동부터 데일리 타이머가 시작됩니다.",
  statusReady: ({ difficulty }) =>
    `${difficulty} 준비 완료. 첫 유효 이동부터 데일리 타이머가 다시 시작됩니다.`,
  statusLineComplete: ({ line, continuation, cells }) =>
    `${line} 완료. ${continuation}${cells}`,
  statusContinueLine: ({ line }) => `${line}을 계속하세요. `,
  statusNextClue: ({ line, clue }) => `${line}: 다음은 ${clue}.`,
  statusFinalClue: ({ line }) => `${line}이 마지막 단서에 도착했습니다.`,
  progressAllComplete: ({ total }) => `오늘의 ${total}단계 모두 완료`,
  progressNextReady: ({ completed, total }) =>
    `${total}단계 중 ${completed}단계 완료; 다음 레벨 준비 완료`,
  progressCurrent: ({ completed, difficulty, stage, total }) =>
    `${completed}단계 완료; ${difficulty}, ${total}단계 중 ${stage}단계`,
  completionWell: "멋진 플레이예요!",
  completionNice: "잘했어요!",
  nextLevel: "다음 레벨",
  completionStats: ({ time, hints }) => `완료 시간 ${time} · ${hints}`,
  hintCount: ({ count }) => `힌트 ${count}회`,
  newDay: "대만 시간으로 새로운 날이 시작되었습니다. 오늘의 첫 보드가 준비되었습니다.",
  boardClearedPaused: "보드를 지웠습니다. 다음 이동부터 타이머가 다시 시작됩니다. 1 또는 A에서 시작하세요.",
  boardClearedRunning: "보드를 지웠습니다. 데일리 타이머는 계속됩니다. 1 또는 A에서 시작하세요.",
  undone: "한 단계 되돌렸습니다.",
  hintCorrected: "충돌하는 우회 경로를 지우고 올바른 한 단계를 추가했습니다.",
  hintAdded: ({ line }) => `${line}에 올바른 한 단계를 추가했습니다.`,
  lineSelected: ({ line }) => `${line}을 선택했습니다.`,
  moveAdjacent: "인접한 칸으로 이동하세요.",
  moveWall: "벽 때문에 이동할 수 없습니다.",
  moveOrder: "이 선의 단서를 순서대로 따라가세요.",
  moveOccupied: "두 선은 같은 칸을 사용할 수 없습니다.",
  moveVisited: "이미 이 선에 포함된 칸입니다. 경로를 따라 한 칸씩 되돌아가세요.",
  moveReserved: ({ line }) => `다른 선의 단서입니다. ${line}을 사용하세요.`,
  moveWrongStart: ({ line, clue }) => `${line}은 ${clue}에서 시작해야 합니다.`,
  moveFinished: "이 선은 이미 마지막 단서에서 끝났습니다.",
  moveSolved: "두 경로를 모두 완성했습니다. 멋져요!",
  moveLineComplete: ({ line }) => `${line} 완료. 다른 선을 계속하세요.`,
  qrUnavailable: "QR 코드를 만들 수 없습니다. 링크를 복사하세요.",
  manualLink: "자동 복사를 사용할 수 없습니다. 링크를 선택해 직접 복사하세요.",
  manualLinkAria: "자동 복사를 사용할 수 없어 Twain 링크를 선택했습니다.",
  linkCopied: "오늘의 Twain 링크를 복사했습니다.",
  resultCopied: "Twain 결과를 복사했습니다.",
  manualShare: "텍스트를 선택해 직접 복사하세요.",
  manualShareAria: "자동 복사를 사용할 수 없어 공유 텍스트를 선택했습니다.",
  shareHintNone: "힌트 없음",
  shareHintCount: ({ count }) => `힌트 ${count}회 사용`,
  shareResultNumbered: ({ number, time, hints }) =>
    `오늘의 Twain #${number} 퍼즐을 ${time}에 완료했습니다(${hints}). 제 기록을 이길 수 있나요?`,
  shareResultUnnumbered: ({ time, hints }) =>
    `오늘의 Twain 퍼즐을 ${time}에 완료했습니다(${hints}). 제 기록을 이길 수 있나요?`,
};

const SPANISH = {
  ...ENGLISH,
  metaTitle: "Twain — Dos líneas que nunca se encuentran",
  metaDescription: "Juega el Twain de hoy. Dos líneas que nunca se encuentran.",
  homeLabel: "Inicio de Twain",
  helpButtonLabel: "Cómo jugar",
  shareButtonLabel: "Compartir el Twain de hoy",
  languageButtonLabel: "Elegir idioma",
  gameLabel: "Puzle Twain",
  progressLabel: "Progreso de hoy",
  clear: "Borrar",
  boardLabel: "Tablero del Twain diario",
  cellAria: ({ row, col }) => `Fila ${row}, columna ${col}`,
  cellClueAria: ({ row, col, line, clue }) =>
    `Fila ${row}, columna ${col}, pista ${clue} de ${line}`,
  shareAction: "Compartir",
  undo: "Deshacer",
  hint: "Pista",
  boardInstructions:
    "Traza la línea numérica desde 1 siguiendo sus pistas y la línea de letras desde A siguiendo las suyas. No pueden compartir casillas y juntas deben llenar todo el tablero.",
  howToTitle: "Cómo jugar",
  closeHowTo: "Cerrar las instrucciones",
  guideTitle: "Guía ambas líneas",
  guideCopy: "Empieza en 1 o A y sigue cada secuencia en orden.",
  fillTitle: "Llena el tablero",
  fillCopy: "Cubre todas las casillas entre ambas líneas. No pueden compartir casillas ni cruzar muros.",
  keyboardHtml:
    'Teclado: <kbd>N</kbd>/<kbd>L</kbd> elige una línea, las flechas mueven, Enter inicia, Backspace deshace, <kbd>H</kbd> da una pista y <kbd>R</kbd> borra.',
  shareTitle: "Compartir Twain",
  shareTitleNumbered: ({ number }) => `Compartir Twain #${number}`,
  closeShare: "Cerrar la ventana de compartir",
  shareInstructions: "Escanea para jugar en otro dispositivo o copia el enlace.",
  qrLabel: "Código QR del enlace al Twain de hoy",
  linkLabel: "Enlace",
  copyLink: "Copiar enlace",
  copied: "Copiado",
  shareFallbackTitle: "Compartir Twain",
  closeShareFallback: "Cerrar alternativa para compartir",
  shareFallbackInstructions: "No se puede compartir aquí. Copia este texto en su lugar.",
  copy: "Copiar",
  languageTitle: "Idioma",
  languageAutomatic: ({ language }) => `Automático · ${language}`,
  languageChanged: ({ language }) => `Idioma cambiado a ${language}.`,
  privacyPreferences: "Opciones de privacidad",
  privacyBannerTitle: "Privacidad y analítica",
  privacyBannerCopy:
    "Twain guarda el progreso del juego en este dispositivo. Google Analytics opcional nos ayuda a entender las partidas completadas, el tiempo de juego, las rachas y el uso de pistas, y permanece desactivado hasta que lo permitas.",
  privacyDetails: "Ver detalles",
  privacyDialogTitle: "Privacidad y analítica",
  closePrivacy: "Cerrar opciones de privacidad",
  privacyDialogIntro:
    "Rechazar se aplica solo a esta sesión de navegación; permitir la analítica se guarda en este navegador. Puedes cambiar tu elección en cualquier momento.",
  privacyCollectTitle: "Si permites la analítica",
  privacyCollectCopy:
    "Al activar Google Analytics, Twain envía hitos de juego, tiempos total y por nivel, pistas, errores, rachas y ajustes de interfaz. Enhanced Measurement también registra páginas vistas y, cuando corresponde, profundidad de desplazamiento, clics en enlaces externos, búsquedas internas, interacción con vídeos, descargas de archivos y formularios. Google Analytics también recibe metadatos de páginas y enlaces, identificadores seudónimos basados en cookies y datos básicos del dispositivo, navegador y ubicación aproximada.",
  privacyAvoidTitle: "Límites de los eventos de juego",
  privacyAvoidCopy:
    "Los eventos de juego personalizados de Twain excluyen recorridos del puzle, movimientos individuales, seeds, valores de pistas, nombres, correos electrónicos, identificadores de cuenta y texto libre. Cuando corresponde, Enhanced Measurement puede enviar los metadatos de páginas e interacciones descritos arriba.",
  privacyStatusGranted: "Elección actual: analítica permitida.",
  privacyStatusDenied: "Elección actual: analítica rechazada.",
  privacyStatusUnset: "Elección actual: sin seleccionar.",
  privacyDecline: "Rechazar",
  privacyAccept: "Permitir analítica",
  privacySavedGranted: "Analítica opcional permitida.",
  privacySavedDenied: "Analítica opcional desactivada.",
  privacySaveFailed:
    "No se pudo guardar tu elección de privacidad. La analítica seguirá desactivada.",
  lineNumber: "Línea numérica",
  lineLetter: "Línea de letras",
  difficultyEasy: "Fácil",
  difficultyMedium: "Medio",
  difficultyHard: "Difícil",
  difficultyExtra: "Extra",
  difficultyUltra: "Ultra",
  dateAria: ({ date }) => `La fecha del puzle de hoy es ${date}`,
  dateNumberedAria: ({ date, number }) => `Hoy es el Twain número ${number}, ${date}`,
  timerRunning: "en marcha",
  timerPaused: "en pausa",
  timerAria: ({ state, time }) => `Tiempo diario, ${state}, ${time}`,
  countdown: ({ time }) => `Vuelve en ${time}`,
  boardStageAria: ({ difficulty, stage, total, rows, cols }) =>
    `Twain diario ${difficulty}, etapa ${stage} de ${total}, ${rows} por ${cols}`,
  cellsLeft: ({ count }) => `Quedan ${count} ${count === 1 ? "casilla" : "casillas"}.`,
  statusDailyComplete: ({ total, time }) =>
    `Completaste los ${total} tableros de hoy en ${time}.`,
  statusStageComplete: ({ difficulty }) =>
    `${difficulty} completado. El cronómetro queda en pausa hasta la siguiente etapa.`,
  statusFirstStart: "Empieza en 1 o A. El cronómetro comienza con el primer movimiento válido.",
  statusReady: ({ difficulty }) =>
    `${difficulty} está listo. El cronómetro continúa con el primer movimiento válido.`,
  statusLineComplete: ({ line, continuation, cells }) =>
    `${line} completa.${continuation} ${cells}`,
  statusContinueLine: ({ line }) => ` Continúa con ${line}.`,
  statusNextClue: ({ line, clue }) => `${line}: sigue ${clue}.`,
  statusFinalClue: ({ line }) => `${line} llegó a su última pista.`,
  progressAllComplete: ({ total }) => `Las ${total} etapas diarias están completas`,
  progressNextReady: ({ completed, total }) =>
    `${completed} de ${total} etapas completas; siguiente nivel listo`,
  progressCurrent: ({ completed, difficulty, stage, total }) =>
    `${completed} completas; ${difficulty}, etapa ${stage} de ${total}`,
  completionWell: "¡Muy bien jugado!",
  completionNice: "¡Bien hecho!",
  nextLevel: "Siguiente nivel",
  completionStats: ({ time, hints }) => `Completado en ${time} · ${hints}`,
  hintCount: ({ count }) => `${count} ${count === 1 ? "pista" : "pistas"}`,
  newDay: "Comenzó un nuevo día en Taiwán. El primer tablero de hoy está listo.",
  boardClearedPaused: "Tablero borrado. El cronómetro continuará con el próximo movimiento; empieza otra vez en 1 o A.",
  boardClearedRunning: "Tablero borrado. El cronómetro sigue en marcha; empieza otra vez en 1 o A.",
  undone: "Se deshizo un paso.",
  hintCorrected: "Se borraron los desvíos incompatibles y se añadió un paso correcto.",
  hintAdded: ({ line }) => `Se añadió un paso correcto a ${line}.`,
  lineSelected: ({ line }) => `${line} seleccionada.`,
  moveAdjacent: "Muévete a una casilla vecina.",
  moveWall: "Un muro bloquea ese movimiento.",
  moveOrder: "Sigue las pistas de esta línea en orden.",
  moveOccupied: "Las dos líneas no pueden compartir una casilla.",
  moveVisited: "Esa casilla ya forma parte de esta línea. Retrocede una casilla cada vez.",
  moveReserved: ({ line }) => `Esa pista pertenece a la otra línea. Usa ${line}.`,
  moveWrongStart: ({ line, clue }) => `Empieza ${line} en ${clue}.`,
  moveFinished: "Esa línea ya termina en su última pista.",
  moveSolved: "Ambos caminos están completos. ¡Excelente!",
  moveLineComplete: ({ line }) => `${line} completa. Continúa con la otra línea.`,
  qrUnavailable: "El código QR no está disponible. Copia el enlace.",
  manualLink: "No se puede copiar automáticamente. Selecciona y copia el enlace manualmente.",
  manualLinkAria: "No se puede copiar automáticamente. El enlace de Twain está seleccionado.",
  linkCopied: "Se copió el enlace al Twain de hoy.",
  resultCopied: "Se copió tu resultado de Twain.",
  manualShare: "Selecciona el texto y cópialo manualmente.",
  manualShareAria: "No se puede copiar automáticamente. El texto para compartir está seleccionado.",
  shareHintNone: "ninguna pista",
  shareHintCount: ({ count }) => `${count} ${count === 1 ? "pista" : "pistas"}`,
  shareResultNumbered: ({ number, time, hints }) =>
    `Completé el Twain #${number} de hoy en ${time} con ${hints}. ¿Puedes superar mi tiempo?`,
  shareResultUnnumbered: ({ time, hints }) =>
    `Completé el Twain de hoy en ${time} con ${hints}. ¿Puedes superar mi tiempo?`,
};

const BRAZILIAN_PORTUGUESE = {
  ...ENGLISH,
  metaTitle: "Twain — Duas linhas que nunca se encontram",
  metaDescription: "Jogue o Twain de hoje. Duas linhas que nunca se encontram.",
  homeLabel: "Início do Twain",
  helpButtonLabel: "Como jogar",
  shareButtonLabel: "Compartilhar o Twain de hoje",
  languageButtonLabel: "Escolher idioma",
  gameLabel: "Quebra-cabeça Twain",
  progressLabel: "Progresso de hoje",
  clear: "Limpar",
  boardLabel: "Tabuleiro diário do Twain",
  cellAria: ({ row, col }) => `Linha ${row}, coluna ${col}`,
  cellClueAria: ({ row, col, line, clue }) =>
    `Linha ${row}, coluna ${col}, pista ${clue} da ${line}`,
  shareAction: "Compartilhar",
  undo: "Desfazer",
  hint: "Dica",
  boardInstructions:
    "Trace a linha numérica desde 1 seguindo suas pistas e a linha de letras desde A seguindo as dela. Elas não podem compartilhar células e juntas devem preencher todo o tabuleiro.",
  howToTitle: "Como jogar",
  closeHowTo: "Fechar instruções",
  guideTitle: "Guie as duas linhas",
  guideCopy: "Comece em 1 ou A e siga cada sequência na ordem.",
  fillTitle: "Preencha em conjunto",
  fillCopy: "Cubra todas as células com as duas linhas. Elas não podem compartilhar células nem atravessar paredes.",
  keyboardHtml:
    'Teclado: <kbd>N</kbd>/<kbd>L</kbd> escolhe a linha, setas movem, Enter inicia, Backspace desfaz, <kbd>H</kbd> dá uma dica e <kbd>R</kbd> limpa.',
  shareTitle: "Compartilhar Twain",
  shareTitleNumbered: ({ number }) => `Compartilhar Twain #${number}`,
  closeShare: "Fechar janela de compartilhamento",
  shareInstructions: "Escaneie para jogar em outro dispositivo ou copie o link.",
  qrLabel: "QR code do link do Twain de hoje",
  linkLabel: "Link",
  copyLink: "Copiar link",
  copied: "Copiado",
  shareFallbackTitle: "Compartilhar Twain",
  closeShareFallback: "Fechar alternativa de compartilhamento",
  shareFallbackInstructions: "Não é possível compartilhar aqui. Copie este texto.",
  copy: "Copiar",
  languageTitle: "Idioma",
  languageAutomatic: ({ language }) => `Automático · ${language}`,
  languageChanged: ({ language }) => `Idioma alterado para ${language}.`,
  privacyPreferences: "Opções de privacidade",
  privacyBannerTitle: "Privacidade e análise",
  privacyBannerCopy:
    "O Twain salva o progresso do jogo neste dispositivo. O Google Analytics opcional nos ajuda a entender conclusões, tempo de jogo, sequências e uso de dicas, e permanece desativado até você permitir.",
  privacyDetails: "Ver detalhes",
  privacyDialogTitle: "Privacidade e análise",
  closePrivacy: "Fechar opções de privacidade",
  privacyDialogIntro:
    "A recusa vale apenas para esta sessão de navegação; a permissão de análise fica salva neste navegador. Você pode alterar sua escolha a qualquer momento.",
  privacyCollectTitle: "Se você permitir a análise",
  privacyCollectCopy:
    "Ao ativar o Google Analytics, o Twain envia marcos do jogo, tempos total e por fase, dicas, erros, sequências e configurações da interface. O Enhanced Measurement também registra visualizações de página e, quando aplicável, profundidade de rolagem, cliques em links externos, pesquisas internas, interação com vídeos, downloads de arquivos e formulários. O Google Analytics também recebe metadados de páginas e links, identificadores pseudônimos baseados em cookies e dados básicos do dispositivo, navegador e localização aproximada.",
  privacyAvoidTitle: "Limites dos eventos de jogo",
  privacyAvoidCopy:
    "Os eventos de jogo personalizados do Twain excluem caminhos do quebra-cabeça, movimentos individuais, seeds, valores das pistas, nomes, e-mails, IDs de conta e texto livre. Quando aplicável, o Enhanced Measurement pode enviar os metadados de páginas e interações descritos acima.",
  privacyStatusGranted: "Escolha atual: análise permitida.",
  privacyStatusDenied: "Escolha atual: análise recusada.",
  privacyStatusUnset: "Escolha atual: não selecionada.",
  privacyDecline: "Recusar",
  privacyAccept: "Permitir análise",
  privacySavedGranted: "Análise opcional permitida.",
  privacySavedDenied: "Análise opcional desativada.",
  privacySaveFailed:
    "Não foi possível salvar sua escolha de privacidade. A análise continuará desativada.",
  lineNumber: "Linha numérica",
  lineLetter: "Linha de letras",
  difficultyEasy: "Fácil",
  difficultyMedium: "Médio",
  difficultyHard: "Difícil",
  difficultyExtra: "Extra",
  difficultyUltra: "Ultra",
  dateAria: ({ date }) => `A data do quebra-cabeça de hoje é ${date}`,
  dateNumberedAria: ({ date, number }) => `Hoje é o Twain número ${number}, ${date}`,
  timerRunning: "em andamento",
  timerPaused: "pausado",
  timerAria: ({ state, time }) => `Tempo diário, ${state}, ${time}`,
  countdown: ({ time }) => `Volte em ${time}`,
  boardStageAria: ({ difficulty, stage, total, rows, cols }) =>
    `Twain diário ${difficulty}, etapa ${stage} de ${total}, ${rows} por ${cols}`,
  cellsLeft: ({ count }) => `Faltam ${count} ${count === 1 ? "célula" : "células"}.`,
  statusDailyComplete: ({ total, time }) =>
    `Você concluiu os ${total} tabuleiros de hoje em ${time}.`,
  statusStageComplete: ({ difficulty }) =>
    `${difficulty} concluído. O cronômetro fica pausado até a próxima etapa.`,
  statusFirstStart: "Comece em 1 ou A. O cronômetro começa no primeiro movimento válido.",
  statusReady: ({ difficulty }) =>
    `${difficulty} está pronto. O cronômetro continua no primeiro movimento válido.`,
  statusLineComplete: ({ line, continuation, cells }) =>
    `${line} concluída.${continuation} ${cells}`,
  statusContinueLine: ({ line }) => ` Continue com ${line}.`,
  statusNextClue: ({ line, clue }) => `${line}: próxima ${clue}.`,
  statusFinalClue: ({ line }) => `${line} chegou à última pista.`,
  progressAllComplete: ({ total }) => `Todas as ${total} etapas diárias concluídas`,
  progressNextReady: ({ completed, total }) =>
    `${completed} de ${total} etapas concluídas; próximo nível pronto`,
  progressCurrent: ({ completed, difficulty, stage, total }) =>
    `${completed} concluídas; ${difficulty}, etapa ${stage} de ${total}`,
  completionWell: "Mandou bem!",
  completionNice: "Muito bem!",
  nextLevel: "Próximo nível",
  completionStats: ({ time, hints }) => `Concluído em ${time} · ${hints}`,
  hintCount: ({ count }) => `${count} ${count === 1 ? "dica" : "dicas"}`,
  newDay: "Começou um novo dia em Taiwan. O primeiro tabuleiro de hoje está pronto.",
  boardClearedPaused: "Tabuleiro limpo. O cronômetro continua no próximo movimento; recomece em 1 ou A.",
  boardClearedRunning: "Tabuleiro limpo. O cronômetro continua rodando; recomece em 1 ou A.",
  undone: "Um passo foi desfeito.",
  hintCorrected: "Os desvios conflitantes foram removidos e um passo correto foi adicionado.",
  hintAdded: ({ line }) => `Um passo correto foi adicionado à ${line}.`,
  lineSelected: ({ line }) => `${line} selecionada.`,
  moveAdjacent: "Vá para uma célula vizinha.",
  moveWall: "Uma parede bloqueia esse movimento.",
  moveOrder: "Siga as pistas desta linha na ordem.",
  moveOccupied: "As duas linhas não podem compartilhar uma célula.",
  moveVisited: "Essa célula já faz parte da linha. Volte uma célula por vez pelo caminho.",
  moveReserved: ({ line }) => `Essa pista pertence à outra linha. Use ${line}.`,
  moveWrongStart: ({ line, clue }) => `Comece ${line} em ${clue}.`,
  moveFinished: "Essa linha já termina na última pista.",
  moveSolved: "Os dois caminhos estão completos. Excelente!",
  moveLineComplete: ({ line }) => `${line} concluída. Continue com a outra linha.`,
  qrUnavailable: "O QR code não está disponível. Copie o link.",
  manualLink: "Não foi possível copiar automaticamente. Selecione e copie o link manualmente.",
  manualLinkAria: "Não foi possível copiar automaticamente. O link do Twain está selecionado.",
  linkCopied: "O link do Twain de hoje foi copiado.",
  resultCopied: "Seu resultado do Twain foi copiado.",
  manualShare: "Selecione o texto e copie manualmente.",
  manualShareAria: "Não foi possível copiar automaticamente. O texto de compartilhamento está selecionado.",
  shareHintNone: "nenhuma dica",
  shareHintCount: ({ count }) => `${count} ${count === 1 ? "dica" : "dicas"}`,
  shareResultNumbered: ({ number, time, hints }) =>
    `Completei o Twain #${number} de hoje em ${time} com ${hints}. Consegue superar meu tempo?`,
  shareResultUnnumbered: ({ time, hints }) =>
    `Completei o Twain de hoje em ${time} com ${hints}. Consegue superar meu tempo?`,
};

export const MESSAGES = Object.freeze({
  en: Object.freeze(ENGLISH),
  "zh-TW": Object.freeze(TRADITIONAL_CHINESE),
  "zh-CN": Object.freeze(SIMPLIFIED_CHINESE),
  ja: Object.freeze(JAPANESE),
  ko: Object.freeze(KOREAN),
  es: Object.freeze(SPANISH),
  "pt-BR": Object.freeze(BRAZILIAN_PORTUGUESE),
});

export function isSupportedLocale(locale) {
  return SUPPORTED_LOCALE_CODES.has(locale);
}

export function localeLabel(locale) {
  return (
    SUPPORTED_LOCALES.find(({ code }) => code === locale)?.label ??
    DEFAULT_LOCALE_LABEL
  );
}

export function matchBrowserLocale(requestedLocales = []) {
  for (const requested of requestedLocales) {
    if (typeof requested !== "string" || requested.length === 0) {
      continue;
    }

    let locale;
    try {
      locale = new Intl.Locale(requested);
    } catch {
      continue;
    }

    if (locale.language === "zh") {
      const maximized = locale.maximize();
      const script = locale.script ?? maximized.script;
      const region = locale.region ?? maximized.region;
      if (script === "Hant" || ["TW", "HK", "MO"].includes(region)) {
        return "zh-TW";
      }
      return "zh-CN";
    }

    if (locale.language === "pt") {
      return "pt-BR";
    }

    const languageMatch = SUPPORTED_LOCALES.find(
      ({ code }) => code === locale.language,
    );
    if (languageMatch) {
      return languageMatch.code;
    }
  }

  return DEFAULT_LOCALE;
}

export function resolveLocale({ override = null, browserLocales = [] } = {}) {
  if (isSupportedLocale(override)) {
    return Object.freeze({ locale: override, source: "override" });
  }

  return Object.freeze({
    locale: matchBrowserLocale(browserLocales),
    source: "auto",
  });
}

export function translate(locale, key, params = {}) {
  const messages = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
  const message = messages[key] ?? MESSAGES[DEFAULT_LOCALE][key];

  if (typeof message === "function") {
    return message(params);
  }

  if (typeof message !== "string") {
    throw new RangeError(`Unknown translation key: ${key}`);
  }

  return message;
}

export function formatLocalizedDate(dateKey, locale) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    throw new RangeError(`Invalid date key: ${dateKey}`);
  }

  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dateKey
  ) {
    throw new RangeError(`Invalid date key: ${dateKey}`);
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatLocalizedHintCount(locale, hints) {
  if (!Number.isInteger(hints) || hints < 0) {
    throw new RangeError(`Invalid hint count: ${hints}`);
  }

  return translate(locale, "hintCount", { count: hints });
}

export function formatShareHintSummary(locale, hints) {
  if (!Number.isInteger(hints) || hints < 0) {
    throw new RangeError(`Invalid hint count: ${hints}`);
  }

  return hints === 0
    ? translate(locale, "shareHintNone")
    : translate(locale, "shareHintCount", { count: hints });
}
