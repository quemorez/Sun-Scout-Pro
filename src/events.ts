import { EvenAppBridge, EvenHubEvent, OsEventTypeList } from '@evenrealities/even_hub_sdk';
import { log } from './ui';

export interface EventCallbacks { nextPage: () => Promise<void>; nextLocation: () => Promise<void>; }

let lastActionTs = 0;
const COOLDOWN_MS = 300;
function cooledDown() {
  const now = Date.now();
  if (now - lastActionTs < COOLDOWN_MS) return false;
  lastActionTs = now;
  return true;
}
function isClick(eventType: number | undefined) {
  return eventType === undefined || eventType === OsEventTypeList.CLICK_EVENT || eventType === 0;
}
function isDoubleClick(eventType: number | undefined) {
  return eventType === OsEventTypeList.DOUBLE_CLICK_EVENT || eventType === 3;
}

export function registerEventHandlers(bridge: EvenAppBridge, callbacks: EventCallbacks): () => void {
  return bridge.onEvenHubEvent(async (event: EvenHubEvent) => {
    try {
      const listEvent = event.listEvent;
      const textEvent = event.textEvent;
      const sysEvent = event.sysEvent;
      if (listEvent) {
        if (isClick(listEvent.eventType)) { if (!cooledDown()) return; await callbacks.nextPage(); return; }
        if (isDoubleClick(listEvent.eventType)) { if (!cooledDown()) return; await callbacks.nextLocation(); return; }
      }
      if (textEvent) {
        if (isClick(textEvent.eventType)) { if (!cooledDown()) return; await callbacks.nextPage(); return; }
        if (isDoubleClick(textEvent.eventType)) { if (!cooledDown()) return; await callbacks.nextLocation(); return; }
      }
      if (sysEvent) {
        if (isClick(sysEvent.eventType)) { if (!cooledDown()) return; await callbacks.nextPage(); return; }
        if (isDoubleClick(sysEvent.eventType)) { if (!cooledDown()) return; await callbacks.nextLocation(); return; }
      }
    } catch (err) {
      log("Event error: " + err, "error");
    }
  });
}
