import qrcode from "../vendor/qrcode-generator.mjs";

export const QR_QUIET_ZONE = 4;

export function createQrCode(value) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError("QR code value must be a non-empty string.");
  }

  const encoder = qrcode(0, "M");
  encoder.addData(value);
  encoder.make();

  const moduleCount = encoder.getModuleCount();
  const modules = Object.freeze(
    Array.from({ length: moduleCount }, (_, row) =>
      Object.freeze(
        Array.from({ length: moduleCount }, (_, column) =>
          encoder.isDark(row, column),
        ),
      ),
    ),
  );
  const pathSegments = [];

  modules.forEach((row, rowIndex) => {
    let runStart = null;

    for (let column = 0; column <= moduleCount; column += 1) {
      const isDark = column < moduleCount && row[column];

      if (isDark && runStart === null) {
        runStart = column;
      } else if (!isDark && runStart !== null) {
        const x = runStart + QR_QUIET_ZONE;
        const y = rowIndex + QR_QUIET_ZONE;
        pathSegments.push(
          `M${x} ${y}h${column - runStart}v1H${x}z`,
        );
        runStart = null;
      }
    }
  });

  return Object.freeze({
    moduleCount,
    modules,
    pathData: pathSegments.join(""),
    quietZone: QR_QUIET_ZONE,
    viewBoxSize: moduleCount + QR_QUIET_ZONE * 2,
  });
}
