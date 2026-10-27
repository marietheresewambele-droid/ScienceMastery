"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { canonical, classifyKey, mergeValues, sameValue } from "@/lib/syncMerge";

/**
 * Mirrors the progress kept in localStorage into public.student_sync for signed-in students.
 * localStorage stays the source of truth for the UI; signed-out students are unaffected.
 */

const META_KEY = "sciencemastery_sync_meta_v1";
const OWNER_KEY = "sciencemastery_sync_owner_v1";
const PUSH_DELAY_MS = 1500;
const CHUNK = 100;

type Meta = { ts: Record<string, number>; dirty: string[] };

function readMeta(): Meta {
  try {
    const parsed = JSON.parse(localStorage.getItem(META_KEY) ?? "{}");
    return { ts: parsed.ts && typeof parsed.ts === "object" ? parsed.ts : {}, dirty: Array.isArray(parsed.dirty) ? parsed.dirty : [] };
  } catch {
    return { ts: {}, dirty: [] };
  }
}
const writeMeta = (meta: Meta) => { try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch { /* storage unavailable */ } };

const parse = (raw: string | null): unknown => {
  if (raw === null) return undefined;
  try { return JSON.parse(raw); } catch { return undefined; }
};

function syncedLocalKeys(): string[] {
  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key && classifyKey(key)) keys.push(key);
  }
  return keys;
}

/** Tells the app that synced data changed underneath it (another device, or a sign-out). */
function announce() {
  window.dispatchEvent(new Event("brainsoma:learning-updated"));
  window.dispatchEvent(new Event("sciencemastery:courses-updated"));
}

let pushHandler: (() => Promise<void>) | null = null;
let pushTimer: ReturnType<typeof setTimeout> | undefined;

/** Call after writing a synced key to localStorage so it is uploaded for signed-in students. */
export function markDirty(key: string) {
  if (typeof window === "undefined" || !classifyKey(key)) return;
  const meta = readMeta();
  meta.ts[key] = Date.now();
  if (!meta.dirty.includes(key)) meta.dirty.push(key);
  writeMeta(meta);
  if (pushHandler) {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => { void pushHandler?.(); }, PUSH_DELAY_MS);
  }
}

/** Uploads pending changes straight away (used before signing out). */
export async function flushSync() {
  clearTimeout(pushTimer);
  await pushHandler?.();
}

export function setPushHandler(handler: (() => Promise<void>) | null) {
  pushHandler = handler;
  if (!handler) clearTimeout(pushTimer);
}

export async function pushDirty(client: SupabaseClient, userId: string) {
  const meta = readMeta();
  if (!meta.dirty.length) return;
  const rows = meta.dirty
    .map((key) => ({ key, value: parse(localStorage.getItem(key)) }))
    .filter((row) => row.value !== undefined)
    .map((row) => ({ user_id: userId, key: row.key, value: row.value, updated_at: new Date(meta.ts[row.key] ?? Date.now()).toISOString() }));
  for (let start = 0; start < rows.length; start += CHUNK) {
    const { error } = await client.from("student_sync").upsert(rows.slice(start, start + CHUNK), { onConflict: "user_id,key" });
    if (error) throw error;
  }
  // Keep anything that changed while the upload was running.
  const latest = readMeta();
  latest.dirty = latest.dirty.filter((key) => !meta.dirty.includes(key) || latest.ts[key] !== meta.ts[key]);
  writeMeta(latest);
}

/** Removes the previous student's data from this browser so it never reaches the next account. */
export function clearSyncedLocalData() {
  for (const key of syncedLocalKeys()) localStorage.removeItem(key);
  localStorage.removeItem(META_KEY);
  localStorage.removeItem(OWNER_KEY);
  announce();
}

export const syncOwner = () => localStorage.getItem(OWNER_KEY);

/** Pulls the account's data, merges it with this device's, and uploads whatever the account is missing. */
export async function syncNow(client: SupabaseClient, userId: string) {
  const owner = localStorage.getItem(OWNER_KEY);
  if (owner && owner !== userId) clearSyncedLocalData();
  localStorage.setItem(OWNER_KEY, userId);

  const { data, error } = await client.from("student_sync").select("key,value,updated_at").eq("user_id", userId);
  if (error) throw error;
  const remote = new Map((data ?? []).map((row) => [row.key as string, row]));
  const meta = readMeta();

  let changedLocally = false;
  const uploads: { user_id: string; key: string; value: unknown; updated_at: string }[] = [];
  for (const key of new Set([...remote.keys(), ...syncedLocalKeys()])) {
    const kind = classifyKey(key);
    if (!kind) continue;
    const local = parse(localStorage.getItem(key));
    const row = remote.get(key);
    const merged = mergeValues(kind, local, meta.ts[key] ?? 0, row?.value, row ? Date.parse(row.updated_at as string) || 0 : 0);
    if (merged === undefined) continue;
    if (local === undefined || !sameValue(kind, local, merged)) {
      localStorage.setItem(key, JSON.stringify(canonical(kind, merged)));
      changedLocally = true;
    }
    if (!row || !sameValue(kind, row.value, merged)) {
      uploads.push({ user_id: userId, key, value: canonical(kind, merged), updated_at: new Date().toISOString() });
    }
  }
  for (let start = 0; start < uploads.length; start += CHUNK) {
    const { error: uploadError } = await client.from("student_sync").upsert(uploads.slice(start, start + CHUNK), { onConflict: "user_id,key" });
    if (uploadError) throw uploadError;
  }
  const after = readMeta();
  after.dirty = after.dirty.filter((key) => !uploads.some((upload) => upload.key === key));
  writeMeta(after);
  if (changedLocally) announce();
}
