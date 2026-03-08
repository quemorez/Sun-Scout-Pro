const statusDot = () => document.getElementById("status-dot");
const statusText = () => document.getElementById("status-text");
const batteryText = () => document.getElementById("battery-text");
const logEl = () => document.getElementById("log");
const helpTitle = () => document.getElementById("help-title");
const helpBody = () => document.getElementById("help-body");
const locationResult = () => document.getElementById("location-result");
const compassResult = () => document.getElementById("compass-result");

export function setStatus(state: "connected" | "connecting" | "disconnected", label?: string) {
  const dot = statusDot(); const text = statusText();
  if (dot) dot.className = `dot ${state}`;
  if (text) text.textContent = label ?? state.charAt(0).toUpperCase() + state.slice(1);
}

export function setBattery(level?: number) {
  const el = batteryText();
  if (el && level !== undefined) el.textContent = `🔋 ${level}%`;
}

export function log(message: string, type?: "success" | "error") {
  console.log(`[SunScout] ${message}`);
  const el = logEl();
  if (el) {
    const entry = document.createElement("div");
    entry.className = `entry${type ? ` ${type}` : ""}`;
    entry.textContent = `${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} ${message}`;
    el.prepend(entry);
    while (el.children.length > 120) el.removeChild(el.lastChild!);
  }
}

export function setHelp(title: string, body: string) {
  const t = helpTitle(); const b = helpBody();
  if (t) t.textContent = title;
  if (b) b.textContent = body;
}

export function setLocationResult(text: string) {
  const el = locationResult();
  if (el) el.textContent = text;
}

export function setCompassResult(text: string) {
  const el = compassResult();
  if (el) el.textContent = text;
}
