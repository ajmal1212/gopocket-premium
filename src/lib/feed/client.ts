import { FEED_WS_URL } from "./config";
import type { Tick, TickListener } from "./types";

/**
 * The page's single connection to the feed hub.
 *
 * This is the same register/unregister/union bookkeeping the trading app does
 * inside a React context, with the context taken out: an ES module is
 * instantiated once per page, so the module *is* the shared state. That matters
 * in Astro, where every `client:*` island mounts its own React root and cannot
 * share a provider - a watchlist island, a position book island and a plain
 * `.astro` ticker strip all import this file and get one socket between them.
 *
 * The hub holds the real market session and fans it out (see the feed-hub
 * repo); this file only speaks its small JSON protocol, so nothing here needs a
 * vendor SDK.
 */

const RECONNECT_MS = [1000, 2000, 5000, 10000, 30000];

let socket: WebSocket | null = null;
let attempt = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

/** clientId -> the tokens that client asked for. */
const registrations = new Map<string, string[]>();
/** token -> everyone waiting on it. */
const listeners = new Map<string, Set<TickListener>>();
/** token -> last known quote, so a late subscriber renders immediately. */
const cache = new Map<string, Tick>();
const statusListeners = new Set<(up: boolean) => void>();

let upstreamUp = false;

/**
 * Ticks arrive far faster than a screen refreshes - several a second per
 * instrument during a busy open. Coalescing them into one animation frame means
 * a row repaints once per frame at worst, however many prints it received.
 */
const pending = new Map<string, Tick>();
let frame: number | null = null;

function scheduleFlush() {
  if (frame !== null) return;
  frame = requestAnimationFrame(() => {
    frame = null;
    for (const [token, tick] of pending) {
      const set = listeners.get(token);
      if (!set) continue;
      for (const listener of set) listener(tick);
    }
    pending.clear();
  });
}

function union(): string[] {
  return [...new Set([...registrations.values()].flat())];
}

function send(message: Record<string, unknown>) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function connect() {
  if (socket || typeof window === "undefined") return;

  socket = new WebSocket(FEED_WS_URL);

  socket.addEventListener("open", () => {
    attempt = 0;
    // The hub keeps no memory of a connection that dropped, so the full set is
    // re-sent rather than assumed.
    const tokens = union();
    if (tokens.length > 0) send({ sub: tokens });
  });

  socket.addEventListener("message", (event) => {
    let message;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }

    if (message.type === "snap") {
      for (const tick of Object.values(message.ticks) as Tick[]) {
        cache.set(tick.k, tick);
        pending.set(tick.k, tick);
      }
      scheduleFlush();
      return;
    }

    if (message.type === "tick") {
      const tick = message.tick as Tick;
      cache.set(tick.k, tick);
      pending.set(tick.k, tick);
      scheduleFlush();
      return;
    }

    if (message.type === "status") {
      upstreamUp = Boolean(message.up);
      for (const listener of statusListeners) listener(upstreamUp);
    }
  });

  socket.addEventListener("close", () => {
    socket = null;
    upstreamUp = false;
    for (const listener of statusListeners) listener(false);
    scheduleReconnect();
  });

  socket.addEventListener("error", () => socket?.close());
}

function scheduleReconnect() {
  if (reconnectTimer || registrations.size === 0) return;
  const delay = RECONNECT_MS[Math.min(attempt, RECONNECT_MS.length - 1)];
  attempt += 1;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, delay);
}

/**
 * Declare the tokens one component cares about. Calling it again with the same
 * id replaces that component's previous set, exactly like `registerTokens`.
 */
export function register(clientId: string, tokens: string[]) {
  const before = new Set(union());
  registrations.set(clientId, tokens.filter(isValidToken));
  const after = union();

  connect();

  const added = after.filter((t) => !before.has(t));
  if (added.length > 0) send({ sub: added });
}

export function unregister(clientId: string) {
  const before = new Set(union());
  registrations.delete(clientId);
  const after = new Set(union());

  const removed = [...before].filter((t) => !after.has(t));
  if (removed.length > 0) send({ unsub: removed });
}

/**
 * Listen to one instrument. Returns the unsubscribe function, and replays the
 * last known quote immediately so a component never renders an empty price it
 * already had the answer for.
 */
export function subscribe(token: string, listener: TickListener): () => void {
  let set = listeners.get(token);
  if (!set) {
    set = new Set();
    listeners.set(token, set);
  }
  set.add(listener);

  const known = cache.get(token);
  if (known) listener(known);

  return () => {
    set?.delete(listener);
    if (set?.size === 0) listeners.delete(token);
  };
}

export function onStatus(listener: (up: boolean) => void): () => void {
  statusListeners.add(listener);
  listener(upstreamUp);
  return () => statusListeners.delete(listener);
}

export function getTick(token: string): Tick | undefined {
  return cache.get(token);
}

/** "NSE|3045" - an exchange and a token, both non-empty. */
function isValidToken(token: unknown): token is string {
  if (typeof token !== "string") return false;
  const parts = token.split("|");
  return parts.length === 2 && parts[0].trim() !== "" && parts[1].trim() !== "";
}
