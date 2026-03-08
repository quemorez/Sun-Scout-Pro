import { waitForEvenAppBridge, DeviceConnectType } from '@evenrealities/even_hub_sdk';
import SunCalc from 'suncalc';
import { LOCATIONS, PAGE_ORDER, PAGE_HELP, Page } from './constants';
import { buildStartupPage, buildHudPage } from './pages';
import { registerEventHandlers } from './events';
import { setStatus, setBattery, log, setHelp, setLocationResult, setCompassResult } from './ui';

declare global {
  interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; }
  interface DeviceOrientationEvent { webkitCompassHeading?: number; }
}

let currentPage: Page = "overview";
let currentLocationIndex = 0;
let headHeadingDeg = 180;
let cameraHeadingDeg = 180;
let selectedDate = new Date();
let bridgeRef: any = null;
let activeLocation = { ...LOCATIONS[0] };

function radToDeg(rad: number): number { return (rad * 180) / Math.PI; }
function toCompassAzimuthDeg(rad: number): number { return (radToDeg(rad) + 180) % 360; }
function normalizeAngle(deg: number): number { let a = deg % 360; if (a > 180) a -= 360; if (a < -180) a += 360; return a; }
function formatDate(date?: Date) { return date ? date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "-"; }
function formatTime(date?: Date) { return date ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "-"; }
function compassDirection(deg: number) {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}
function degLabel(deg: number) { return `${Math.round(((deg % 360) + 360) % 360)}° ${compassDirection(deg)}`; }
function getLightRelation(cameraHeading: number, sunAzimuth: number) {
  const delta = Math.abs(normalizeAngle(sunAzimuth - cameraHeading));
  if (delta < 30) return "Front";
  if (delta < 75) return "3/4 Fr";
  if (delta < 105) return "Side";
  if (delta < 150) return "3/4 Bk";
  return "Back";
}
function getTurnInstruction(userHeading: number, sunAzimuth: number) {
  const delta = normalizeAngle(sunAzimuth - userHeading);
  if (Math.abs(delta) < 8) return { delta, instruction: "Aligned" };
  return { delta, instruction: delta > 0 ? "Turn Right" : "Turn Left" };
}
function getPitchInstruction(elevationDeg: number) {
  if (elevationDeg < 8) return "Look Level";
  if (elevationDeg < 18) return "Look Up Slightly";
  if (elevationDeg < 35) return "Look Up";
  return "Look Up More";
}
function bestBacklightWindows(date: Date, lat: number, lon: number, cameraHeading: number) {
  const day = new Date(date); day.setHours(0, 0, 0, 0);
  const windows: Array<{start: Date, end: Date}> = [];
  let currentStart: Date | null = null; let lastGood: Date | null = null;
  for (let minutes = 0; minutes < 24 * 60; minutes += 5) {
    const t = new Date(day.getTime() + minutes * 60000);
    const pos = SunCalc.getPosition(t, lat, lon);
    const az = toCompassAzimuthDeg(pos.azimuth);
    const el = radToDeg(pos.altitude);
    const good = getLightRelation(cameraHeading, az) === "Back" && el >= 5 && el <= 25;
    if (good && !currentStart) currentStart = new Date(t);
    if (good) lastGood = new Date(t);
    if (!good && currentStart && lastGood) {
      windows.push({ start: currentStart, end: lastGood });
      currentStart = null; lastGood = null;
    }
  }
  if (currentStart && lastGood) windows.push({ start: currentStart, end: lastGood });
  return windows;
}
function buildPathSummary(date: Date, lat: number, lon: number) {
  const pos = SunCalc.getPosition(date, lat, lon);
  const az = toCompassAzimuthDeg(pos.azimuth);
  const el = Math.max(0, radToDeg(pos.altitude));
  return `${compassDirection(az)} ${az.toFixed(0)}° / Alt ${el.toFixed(0)}°`;
}
function buildPathMapGraphic(headHeading: number, sunAzimuth: number, elevationDeg: number, sunriseAzimuth: number, sunsetAzimuth: number) {
  const projectCol = (az: number) => {
    const rel = normalizeAngle(az - headHeading);
    return Math.max(0, Math.min(12, Math.round(((rel + 90) / 180) * 12)));
  };
  const projectRow = (elev: number) => elev > 45 ? 0 : elev > 20 ? 1 : 2;

  const rows = [
    "      N      ".split(""),
    "   .-^^^-.   ".split(""),
    "  R       S  ".split(""),
    "      +      ".split("")
  ];

  rows[2][projectCol(sunriseAzimuth)] = "R";
  rows[2][projectCol(sunsetAzimuth)] = "S";
  rows[projectRow(Math.max(0, elevationDeg))][projectCol(sunAzimuth)] = "☉";
  rows[3][6] = "+";
  return rows.map(r => r.join("")).join("\n");
}
function buildShadowDirection(sunAzimuth: number) { return compassDirection(sunAzimuth + 180); }

function buildState() {
  const location = activeLocation;
  const pos = SunCalc.getPosition(selectedDate, location.lat, location.lon);
  const times = SunCalc.getTimes(selectedDate, location.lat, location.lon);
  const sunrisePos = SunCalc.getPosition(times.sunrise, location.lat, location.lon);
  const sunsetPos = SunCalc.getPosition(times.sunset, location.lat, location.lon);
  const sunriseAz = toCompassAzimuthDeg(sunrisePos.azimuth);
  const sunsetAz = toCompassAzimuthDeg(sunsetPos.azimuth);
  const sunAzimuth = toCompassAzimuthDeg(pos.azimuth);
  const sunElevation = radToDeg(pos.altitude);
  const turn = getTurnInstruction(headHeadingDeg, sunAzimuth);
  const windows = bestBacklightWindows(selectedDate, location.lat, location.lon, cameraHeadingDeg);
  const best = windows[0]; const next = windows[1];
  const shadowLengthRatio = sunElevation > 0.5 ? `${(1 / Math.tan((Math.max(sunElevation, 0.5) * Math.PI) / 180)).toFixed(1)}x` : "Very long";

  return {
    page: currentPage, locationName: location.name, headHeadingDeg, cameraHeadingDeg,
    dateLabel: formatDate(selectedDate), sunAzimuth, sunElevation,
    lightRelation: getLightRelation(cameraHeadingDeg, sunAzimuth),
    turnInstruction: turn.instruction, turnDelta: turn.delta,
    pitchInstruction: getPitchInstruction(Math.max(0, sunElevation)),
    bestWindow: best ? `${formatTime(best.start)}-${formatTime(best.end)}` : "No good",
    nextBestWindow: next ? `${formatTime(next.start)}-${formatTime(next.end)}` : "No second",
    shadowDirection: buildShadowDirection(sunAzimuth), shadowLengthRatio,
    pathSummary: buildPathSummary(selectedDate, location.lat, location.lon),
    hudGraphic: buildPathMapGraphic(headHeadingDeg, sunAzimuth, Math.max(0, sunElevation), sunriseAz, sunsetAz),
    sunrise: formatTime(times.sunrise), sunset: formatTime(times.sunset),
    morningGolden: `${formatTime(times.goldenHourEnd)}-${formatTime(times.sunriseEnd)}`,
    eveningGolden: `${formatTime(times.goldenHour)}-${formatTime(times.sunsetStart)}`,
    sunriseAzimuth: degLabel(sunriseAz), sunsetAzimuth: degLabel(sunsetAz),
  };
}

function renderControls() {
  const locationSelect = document.getElementById("location-select") as HTMLSelectElement | null;
  const dateInput = document.getElementById("date-input") as HTMLInputElement | null;
  const headInput = document.getElementById("head-heading-input") as HTMLInputElement | null;
  const cameraInput = document.getElementById("camera-heading-input") as HTMLInputElement | null;
  const headText = document.getElementById("head-heading-text");
  const cameraText = document.getElementById("camera-heading-text");
  if (locationSelect && locationSelect.options.length === 0) {
    LOCATIONS.forEach((loc, i) => {
      const opt = document.createElement("option");
      opt.value = String(i); opt.textContent = loc.name; locationSelect.appendChild(opt);
    });
  }
  if (locationSelect) locationSelect.value = String(currentLocationIndex);
  if (dateInput) dateInput.value = new Date(selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  if (headInput) headInput.value = String(Math.round(headHeadingDeg));
  if (cameraInput) cameraInput.value = String(Math.round(cameraHeadingDeg));
  if (headText) headText.textContent = `${Math.round(headHeadingDeg)}°`;
  if (cameraText) cameraText.textContent = `${Math.round(cameraHeadingDeg)}°`;
  const help = PAGE_HELP[currentPage];
  setHelp(help.title, help.body);
}

function buildEmailBody(state: ReturnType<typeof buildState>) {
  return [
    `SunScout Export`, ``,
    `Page: ${state.page}`, `Location: ${state.locationName}`, `Date: ${state.dateLabel}`,
    `Head Heading: ${Math.round(state.headHeadingDeg)}°`, `Camera Heading: ${Math.round(state.cameraHeadingDeg)}°`, ``,
    `Sunrise: ${state.sunrise} (${state.sunriseAzimuth})`,
    `Sunset: ${state.sunset} (${state.sunsetAzimuth})`,
    `Morning Golden Hour: ${state.morningGolden}`,
    `Evening Golden Hour: ${state.eveningGolden}`, ``,
    `Sun Azimuth: ${state.sunAzimuth.toFixed(0)}°`,
    `Sun Elevation: ${Math.max(0, state.sunElevation).toFixed(0)}°`,
    `Light Relation: ${state.lightRelation}`,
    `Turn Instruction: ${state.turnInstruction}`,
    `Turn Delta: ${state.turnDelta.toFixed(0)}°`,
    `Pitch Instruction: ${state.pitchInstruction}`,
    `Best Window: ${state.bestWindow}`,
    `Next Window: ${state.nextBestWindow}`,
    `Path Summary: ${state.pathSummary}`,
    `Shadow Direction: ${state.shadowDirection}`,
    `Shadow Length: ${state.shadowLengthRatio}`,
  ].join("\n");
}
function shareViaEmail() {
  const state = buildState();
  window.location.href = `mailto:?subject=${encodeURIComponent(`SunScout Export - ${state.locationName}`)}&body=${encodeURIComponent(buildEmailBody(state))}`;
  log("Opened email export", "success");
}
async function geocodeLocation(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!response.ok) throw new Error(`Geocoding failed (${response.status})`);
  const results = await response.json();
  if (!results || !results.length) throw new Error("No matching location found");
  const r = results[0];
  activeLocation = { name: r.display_name.split(",").slice(0, 2).join(",").trim(), lat: Number(r.lat), lon: Number(r.lon) };
  setLocationResult(`Using ${activeLocation.name} (${activeLocation.lat.toFixed(4)}, ${activeLocation.lon.toFixed(4)})`);
  log(`Location search updated to ${activeLocation.name}`, "success");
}
async function useCurrentLocation() {
  if (!navigator.geolocation) throw new Error("Geolocation is not available on this device");
  const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 });
  });
  activeLocation = { name: "Current Location", lat: pos.coords.latitude, lon: pos.coords.longitude };
  setLocationResult(`Using current location (${activeLocation.lat.toFixed(4)}, ${activeLocation.lon.toFixed(4)})`);
  log("Updated to current location", "success");
}
function getSpeechRecognition() { return window.SpeechRecognition || window.webkitSpeechRecognition; }
async function voiceLocationCommand() {
  const SR = getSpeechRecognition();
  if (!SR) throw new Error("Speech recognition is not available in this browser");
  return new Promise((resolve, reject) => {
    const recognition = new SR();
    recognition.lang = "en-US"; recognition.interimResults = false; recognition.maxAlternatives = 1;
    recognition.onresult = async (event: any) => {
      const transcript = String(event.results?.[0]?.[0]?.transcript || "").trim();
      try {
        if (!transcript) throw new Error("No voice command detected");
        log(`Voice command: ${transcript}`, "success");
        setLocationResult(`Heard: ${transcript}`);
        const lower = transcript.toLowerCase();
        if (lower.includes("use current location")) { await useCurrentLocation(); resolve(transcript); return; }
        const match = lower.match(/search for\s+(.+)/i);
        if (match && match[1]) { await geocodeLocation(transcript.replace(/search for\s+/i, "").trim()); resolve(transcript); return; }
        await geocodeLocation(transcript); resolve(transcript);
      } catch (err) { reject(err); }
    };
    recognition.onerror = (event: any) => reject(new Error(`Voice input failed: ${event.error || "unknown error"}`));
    recognition.onnomatch = () => reject(new Error("Voice command not recognized"));
    recognition.start();
  });
}
function handleOrientationEvent(event: DeviceOrientationEvent) {
  const alpha = typeof event.webkitCompassHeading === "number"
    ? event.webkitCompassHeading
    : (typeof event.alpha === "number" ? (360 - event.alpha) % 360 : null);
  if (alpha === null) return;
  headHeadingDeg = alpha;
  setCompassResult(`Compass enabled. Heading ${Math.round(headHeadingDeg)}°.`);
  renderControls();
  if (bridgeRef && (currentPage === "align" || currentPage === "path")) pushCurrentPage();
}
async function enableCompass() {
  const OrientationEventAny = DeviceOrientationEvent as any;
  if (typeof OrientationEventAny !== "undefined" && typeof OrientationEventAny.requestPermission === "function") {
    const result = await OrientationEventAny.requestPermission();
    if (result !== "granted") throw new Error("Motion permission was denied");
  }
  window.addEventListener("deviceorientation", handleOrientationEvent, true);
  setCompassResult("Compass enabled. Turn your phone to rotate the G2 path map and drive Align.");
  log("Compass enabled", "success");
}
async function pushCurrentPage() {
  if (!bridgeRef) return;
  await bridgeRef.rebuildPageContainer(buildHudPage(buildState()));
  renderControls();
  log(`Pushed ${currentPage}`, "success");
}
async function nextPage() {
  const idx = PAGE_ORDER.indexOf(currentPage);
  currentPage = PAGE_ORDER[(idx + 1) % PAGE_ORDER.length];
  await pushCurrentPage();
}
async function nextLocation() {
  currentLocationIndex = (currentLocationIndex + 1) % LOCATIONS.length;
  activeLocation = { ...LOCATIONS[currentLocationIndex] };
  setLocationResult(`Using saved location ${activeLocation.name}`);
  await pushCurrentPage();
}
async function main() {
  log("Initializing...");
  setStatus("connecting", "Waiting for bridge...");
  activeLocation = { ...LOCATIONS[currentLocationIndex] };
  renderControls();

  const bridge = await waitForEvenAppBridge();
  bridgeRef = bridge;
  log("Bridge ready", "success");

  const device = await bridge.getDeviceInfo();
  if (device?.status?.isConnected()) { setStatus("connected"); setBattery(device.status.batteryLevel); }
  else { setStatus("disconnected", "No glasses"); }

  bridge.onDeviceStatusChanged((status: any) => {
    if (status.connectType === DeviceConnectType.Connected) { setStatus("connected"); setBattery(status.batteryLevel); }
    else if (status.connectType === DeviceConnectType.Disconnected) { setStatus("disconnected"); }
    else if (status.connectType === DeviceConnectType.Connecting) { setStatus("connecting"); }
  });

  const result = await bridge.createStartUpPageContainer(buildStartupPage());
  if (result !== 0) { log("Startup failed: " + result, "error"); return; }
  log("Startup page created", "success");

  setLocationResult(`Using saved location ${activeLocation.name}`);
  await pushCurrentPage();
  registerEventHandlers(bridge, { nextPage, nextLocation });
  log("Events active", "success");

  const locationSelect = document.getElementById("location-select") as HTMLSelectElement;
  const searchInput = document.getElementById("location-search-input") as HTMLInputElement;
  const searchBtn = document.getElementById("search-location-btn") as HTMLButtonElement;
  const voiceBtn = document.getElementById("voice-location-btn") as HTMLButtonElement;
  const currentLocationBtn = document.getElementById("current-location-btn") as HTMLButtonElement;
  const enableCompassBtn = document.getElementById("enable-compass-btn") as HTMLButtonElement;
  const dateInput = document.getElementById("date-input") as HTMLInputElement;
  const headInput = document.getElementById("head-heading-input") as HTMLInputElement;
  const cameraInput = document.getElementById("camera-heading-input") as HTMLInputElement;
  const pushBtn = document.getElementById("push-btn") as HTMLButtonElement;
  const shareBtn = document.getElementById("share-btn") as HTMLButtonElement;
  const overviewBtn = document.getElementById("overview-btn") as HTMLButtonElement;
  const nowBtn = document.getElementById("now-btn") as HTMLButtonElement;
  const alignBtn = document.getElementById("align-btn") as HTMLButtonElement;
  const windowBtn = document.getElementById("window-btn") as HTMLButtonElement;
  const pathBtn = document.getElementById("path-btn") as HTMLButtonElement;
  const shadowBtn = document.getElementById("shadow-btn") as HTMLButtonElement;

  locationSelect.onchange = async () => { currentLocationIndex = Number(locationSelect.value); activeLocation = { ...LOCATIONS[currentLocationIndex] }; setLocationResult(`Using saved location ${activeLocation.name}`); await pushCurrentPage(); };
  searchBtn.onclick = async () => { try { const query = searchInput.value.trim(); if (!query) return; setLocationResult("Searching..."); await geocodeLocation(query); await pushCurrentPage(); } catch (err) { setLocationResult(String(err)); log(String(err), "error"); } };
  voiceBtn.onclick = async () => { try { setLocationResult("Listening..."); await voiceLocationCommand(); await pushCurrentPage(); } catch (err) { setLocationResult(String(err)); log(String(err), "error"); } };
  currentLocationBtn.onclick = async () => { try { setLocationResult("Getting current location..."); await useCurrentLocation(); await pushCurrentPage(); } catch (err) { setLocationResult(String(err)); log(String(err), "error"); } };
  enableCompassBtn.onclick = async () => { try { await enableCompass(); } catch (err) { setCompassResult(String(err)); log(String(err), "error"); } };
  dateInput.onchange = async () => { selectedDate = new Date(dateInput.value); await pushCurrentPage(); };
  headInput.oninput = async () => { headHeadingDeg = Number(headInput.value); renderControls(); await pushCurrentPage(); };
  cameraInput.oninput = async () => { cameraHeadingDeg = Number(cameraInput.value); renderControls(); await pushCurrentPage(); };
  shareBtn.onclick = () => { shareViaEmail(); };
  pushBtn.onclick = async () => { await pushCurrentPage(); };
  overviewBtn.onclick = async () => { currentPage = "overview"; await pushCurrentPage(); };
  nowBtn.onclick = async () => { currentPage = "now"; await pushCurrentPage(); };
  alignBtn.onclick = async () => { currentPage = "align"; await pushCurrentPage(); };
  windowBtn.onclick = async () => { currentPage = "window"; await pushCurrentPage(); };
  pathBtn.onclick = async () => { currentPage = "path"; await pushCurrentPage(); };
  shadowBtn.onclick = async () => { currentPage = "shadow"; await pushCurrentPage(); };
}
main().catch((err) => { log("Fatal: " + err, "error"); console.error(err); });
