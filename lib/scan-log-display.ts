export const MANUAL_SCAN_TERMINAL_CODE = "MANUAL_ADMIN";

type ScanLogLike = {
  status?: string | null;
  terminalCode?: string | null;
  errorMessage?: string | null;
  terminal?: {
    name?: string | null;
    code?: string | null;
  } | null;
};

export function isManualScanLog(log: ScanLogLike) {
  return (
    log.terminalCode === MANUAL_SCAN_TERMINAL_CODE ||
    log.errorMessage?.toLocaleLowerCase("fr-FR").includes("manuel") === true
  );
}

export function getManualScanLabel(log: ScanLogLike) {
  if (!isManualScanLog(log)) return null;

  const message = log.errorMessage?.toLocaleLowerCase("fr-FR") ?? "";

  if (log.status === "REVERSED" || message.includes("annul")) {
    return "Annulation manuelle";
  }

  return "Validation manuelle";
}

export function getScanLogTerminalName(log: ScanLogLike) {
  return getManualScanLabel(log) || log.terminal?.name || log.terminalCode || "";
}

export function getScanLogTerminalCode(log: ScanLogLike) {
  return isManualScanLog(log)
    ? "MANUEL"
    : log.terminal?.code || log.terminalCode || "";
}
