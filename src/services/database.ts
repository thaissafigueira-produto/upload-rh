import { useSyncExternalStore } from "react";
import { DB_VERSION, generateDemoDatabase } from "@/data/seed";
import type { Database } from "@/types";

const DB_KEY = "guapeco-rh-db-v2";
const SESSION_KEY = "guapeco-rh-session-v2";

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // armazenamento indisponível (ex.: modo privado): segue apenas em memória
  }
}

function loadDatabase(): Database {
  const raw = readStorage(DB_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Database;
      if (parsed?.version === DB_VERSION) return parsed;
    } catch {
      // dado corrompido: recria a base de demonstração
    }
  }
  const seed = generateDemoDatabase();
  writeStorage(DB_KEY, JSON.stringify(seed));
  return seed;
}

interface State {
  db: Database;
  sessionUserId: string | null;
}

let state: State = { db: loadDatabase(), sessionUserId: readStorage(SESSION_KEY) };
const listeners = new Set<() => void>();

function setState(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}

export const getState = () => state;
export const getDb = () => state.db;

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function mutate(fn: (current: Database) => Database) {
  const db = fn(state.db);
  writeStorage(DB_KEY, JSON.stringify(db));
  setState({ ...state, db });
}

export function setSessionUserId(userId: string | null) {
  writeStorage(SESSION_KEY, userId);
  setState({ ...state, sessionUserId: userId });
}

let focusEmpresaId = "";

/** Empresa que a equipe Guapeco está consultando. Definida de forma silenciosa (sem re-render)
 * porque é escolhida pela rota, antes de as telas lerem os dados. */
export const getFocusEmpresaId = () => focusEmpresaId;
export function setFocusEmpresaId(id: string) {
  focusEmpresaId = id;
}

export function resetDatabase() {
  const db = generateDemoDatabase();
  writeStorage(DB_KEY, JSON.stringify(db));
  setState({ db, sessionUserId: state.sessionUserId });
}

/** Faz a tela reagir a qualquer mudança nos dados ou na sessão. */
export function useDatabase() {
  return useSyncExternalStore(subscribe, getState, getState);
}
