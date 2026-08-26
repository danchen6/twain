export function formatHintCount(hints) {
  if (!Number.isInteger(hints) || hints < 0) {
    throw new RangeError(`Invalid hint count: ${hints}`);
  }

  return `${hints} ${hints === 1 ? "hint" : "hints"}`;
}

export function formatDailyResultShareText({
  elapsed,
  hints,
  twainNumber = null,
}) {
  const twainIdentity =
    twainNumber === null ? "today's Twain" : `today's Twain #${twainNumber}`;
  const hintSummary = hints === 0 ? "no hints" : formatHintCount(hints);

  return `I completed ${twainIdentity} in ${elapsed} with ${hintSummary}. Can you beat my time?`;
}
