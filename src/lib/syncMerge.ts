/**
 * Pure merge rules for syncing a student's localStorage progress with their account. They are written
 * so that merging never loses progress: reviews keep the newer record per question, completed
 * questions are unioned, daily activity keeps the larger count per day, and everything else is
 * last-write-wins by timestamp.
 */

export type SyncKind = "reviews" | "ids" | "lww" | "courses" | "activity";

export const COURSES_KEY = "sciencemastery_courses_v1";
export const ACTIVITY_KEY = "sciencemastery_activity_v1";
export const EXAM_CALENDAR_KEY = "brainsoma_exam_calendar";

const TOPIC_KEY = /^brainsoma_v2_(biology|chemistry|physics)_.+_(reviews|completed|bookmarks|needspractice)$/;

/** Which merge rule applies to a localStorage key, or null when the key is not synced. */
export function classifyKey(key: string): SyncKind | null {
  const topic = TOPIC_KEY.exec(key);
  if (topic) return topic[2] === "reviews" ? "reviews" : topic[2] === "completed" ? "ids" : "lww";
  if (key === COURSES_KEY) return "courses";
  if (key === EXAM_CALENDAR_KEY) return "lww";
  if (key === ACTIVITY_KEY) return "activity";
  return null;
}

type Json = unknown;
type ReviewLike = { id?: string; questionId?: string; reviewedAt?: string };

const asArray = (value: Json): Json[] => (Array.isArray(value) ? value : []);
const isRecord = (value: Json): value is Record<string, Json> => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function reviewMap(value: Json): Map<string, ReviewLike & Record<string, Json>> {
  const map = new Map<string, ReviewLike & Record<string, Json>>();
  const entries: [string, Json][] = Array.isArray(value)
    ? value.map((item) => [String((item as ReviewLike)?.id ?? (item as ReviewLike)?.questionId ?? ""), item])
    : isRecord(value) ? Object.entries(value) : [];
  for (const [id, raw] of entries) {
    if (id && isRecord(raw)) map.set(id, { ...raw, id });
  }
  return map;
}

const time = (value: string | undefined) => (value ? Date.parse(value) || 0 : 0);

function mergeReviews(local: Json, remote: Json): Json {
  const merged = reviewMap(local);
  for (const [id, record] of reviewMap(remote)) {
    const existing = merged.get(id);
    if (!existing || time(record.reviewedAt) > time(existing.reviewedAt)) merged.set(id, record);
  }
  return [...merged.values()].sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

const mergeIds = (local: Json, remote: Json): Json =>
  [...new Set([...asArray(local), ...asArray(remote)].filter((id): id is string => typeof id === "string"))].sort();

function cleanDays(value: Json): Record<string, number> {
  const days: Record<string, number> = {};
  if (isRecord(value)) {
    for (const [day, count] of Object.entries(value)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(day) && typeof count === "number" && count > 0) days[day] = Math.floor(count);
    }
  }
  return days;
}

function mergeActivity(local: Json, remote: Json): Json {
  const a = isRecord(local) ? local : {};
  const b = isRecord(remote) ? remote : {};
  const days = cleanDays(a.days);
  for (const [day, count] of Object.entries(cleanDays(b.days))) days[day] = Math.max(days[day] ?? 0, count);
  const aStamp = typeof a.goalUpdatedAt === "number" ? a.goalUpdatedAt : 0;
  const bStamp = typeof b.goalUpdatedAt === "number" ? b.goalUpdatedAt : 0;
  const newest = bStamp > aStamp ? b : a;
  return {
    days: Object.fromEntries(Object.entries(days).sort(([x], [y]) => x.localeCompare(y))),
    goal: typeof newest.goal === "number" ? newest.goal : undefined,
    goalUpdatedAt: Math.max(aStamp, bStamp),
  };
}

function mergeCourses(local: Json, localTs: number, remote: Json, remoteTs: number): Json {
  // Courses added before the account existed (never stamped) are kept alongside the account's.
  if (localTs === 0) {
    const byId = new Map<string, Json>();
    for (const course of [...asArray(remote), ...asArray(local)]) {
      const id = isRecord(course) ? course.id : undefined;
      if (typeof id === "string") byId.set(id, course);
    }
    return [...byId.values()];
  }
  return remoteTs > localTs ? remote : local;
}

/**
 * Canonical form of a value, so two devices holding the same data in a different order compare equal.
 */
export function canonical(kind: SyncKind, value: Json): Json {
  if (value === undefined) return undefined;
  if (kind === "reviews") return mergeReviews(value, []);
  if (kind === "ids") return mergeIds(value, []);
  if (kind === "activity") return mergeActivity(value, {});
  return value;
}

/**
 * Merges the device's value with the account's. `undefined` means "not present". Timestamps (ms) only
 * matter for last-write-wins keys; a missing local timestamp counts as the oldest.
 */
export function mergeValues(kind: SyncKind, local: Json, localTs: number, remote: Json, remoteTs: number): Json {
  if (local === undefined) return canonical(kind, remote);
  if (remote === undefined) return canonical(kind, local);
  switch (kind) {
    case "reviews": return mergeReviews(local, remote);
    case "ids": return mergeIds(local, remote);
    case "activity": return mergeActivity(local, remote);
    case "courses": return mergeCourses(local, localTs, remote, remoteTs);
    case "lww": return remoteTs > localTs ? remote : local;
  }
}

export const sameValue = (kind: SyncKind, a: Json, b: Json) =>
  JSON.stringify(canonical(kind, a)) === JSON.stringify(canonical(kind, b));
