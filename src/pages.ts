import {
  CreateStartUpPageContainer, RebuildPageContainer, TextContainerProperty,
} from '@evenrealities/even_hub_sdk';
import type { Page } from './constants';

export interface HudState {
  page: Page;
  locationName: string;
  headHeadingDeg: number;
  cameraHeadingDeg: number;
  dateLabel: string;
  sunAzimuth: number;
  sunElevation: number;
  lightRelation: string;
  turnInstruction: string;
  turnDelta: number;
  pitchInstruction: string;
  bestWindow: string;
  nextBestWindow: string;
  shadowDirection: string;
  shadowLengthRatio: string;
  pathSummary: string;
  hudGraphic: string;
  sunrise: string;
  sunset: string;
  morningGolden: string;
  eveningGolden: string;
  sunriseAzimuth: string;
  sunsetAzimuth: string;
}

function bigText(content: string) {
  return new TextContainerProperty({
    xPosition: 12, yPosition: 12, width: 552, height: 264,
    containerID: 1, containerName: "hud-text",
    content, isEventCapture: 1,
    borderWidth: 1, borderColor: 13, borderRdaius: 6, paddingLength: 8,
  });
}

export function buildStartupPage(): CreateStartUpPageContainer {
  return new CreateStartUpPageContainer({
    containerTotalNum: 1,
    textObject: [new TextContainerProperty({
      xPosition: 20, yPosition: 20, width: 280, height: 40,
      containerID: 1, containerName: "startup-text",
      content: "SunScout", isEventCapture: 0,
    })]
  });
}

function buildPageContent(state: HudState): string {
  const header = state.page === "overview" ? "OVERVIEW" :
    state.page === "now" ? "SUN NOW" :
    state.page === "align" ? "ALIGN HUD" :
    state.page === "window" ? "WINDOW" :
    state.page === "path" ? "PATH MAP" : "SHADOW";

  if (state.page === "overview") return [
    header, "", state.locationName,
    `Rise ${state.sunrise} (${state.sunriseAzimuth})`,
    `Set  ${state.sunset} (${state.sunsetAzimuth})`,
    `AM   ${state.morningGolden}`,
    `PM   ${state.eveningGolden}`, "",
    "tap = next page", "double tap = next location",
  ].join("\n");

  if (state.page === "now") return [
    header, "", state.locationName, state.hudGraphic,
    `az  ${state.sunAzimuth.toFixed(0)}°`,
    `alt ${Math.max(0, state.sunElevation).toFixed(0)}°`,
    `light ${state.lightRelation}`, state.dateLabel, "",
    "tap = next page", "double tap = next location",
  ].join("\n");

  if (state.page === "align") return [
    header, "", state.locationName, state.hudGraphic,
    state.turnInstruction, state.pitchInstruction,
    `az Δ ${state.turnDelta.toFixed(0)}°`,
    `cam ${Math.round(state.cameraHeadingDeg)}°`, "",
    "tap = next page", "double tap = next location",
  ].join("\n");

  if (state.page === "window") return [
    header, "", state.locationName, state.hudGraphic,
    `best ${state.bestWindow}`, `next ${state.nextBestWindow}`,
    `light ${state.lightRelation}`, "",
    "tap = next page", "double tap = next location",
  ].join("\n");

  if (state.page === "path") return [
    header, "", state.locationName, state.hudGraphic,
    `Sun ${state.sunAzimuth.toFixed(0)}° / ${Math.max(0, state.sunElevation).toFixed(0)}°`,
    `Rise ${state.sunriseAzimuth}`,
    `Set  ${state.sunsetAzimuth}`, "",
    "tap = next page", "double tap = next location",
  ].join("\n");

  return [
    header, "", state.locationName, state.hudGraphic,
    `dir ${state.shadowDirection}`, `len ${state.shadowLengthRatio}`,
    `light ${state.lightRelation}`, "",
    "tap = next page", "double tap = next location",
  ].join("\n");
}

export function buildHudPage(state: HudState): RebuildPageContainer {
  return new RebuildPageContainer({
    containerTotalNum: 1,
    textObject: [bigText(buildPageContent(state))],
  });
}
