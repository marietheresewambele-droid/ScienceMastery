import { recordReview } from "@/lib/activity";
import { markDirty } from "@/lib/sync";
import type { ReviewMap, ReviewRating, ReviewRecord, TopicDefinition } from "@/types/questions";

type ProgressTopic = Pick<TopicDefinition, "storageNamespace">;

export type TopicProgress = { bookmarks: Set<string>; needs: Set<string>; completed: Set<string>; reviews: ReviewMap };
const array = (key: string) => { try { const value=JSON.parse(localStorage.getItem(key) ?? "[]"); return new Set<string>(Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : []); } catch { return new Set<string>(); } };
const reviews = (key: string): ReviewMap => { try { const value=JSON.parse(localStorage.getItem(key) ?? "{}"); const result: ReviewMap={}; const entries=Array.isArray(value) ? value.map(x=>[x?.id ?? x?.questionId,x]) : Object.entries(value); for (const [id,raw] of entries) { if (!id || !raw) continue; if (typeof raw === "string") { const now=new Date().toISOString(); result[id]={rating:raw as ReviewRating,reviewedAt:now,dueAt:now,intervalDays:0,repetitions:0}; } else if (["again","hard","good","easy"].includes(raw.rating)) result[id]=raw as ReviewRecord; } return result; } catch { return {}; } };
export function readProgress(topic: ProgressTopic): TopicProgress { const n=topic.storageNamespace; return {bookmarks:array(`${n}_bookmarks`),needs:array(`${n}_needspractice`),completed:array(`${n}_completed`),reviews:reviews(`${n}_reviews`)}; }
const LADDER = [1, 3, 7, 14, 30, 60];
const DAY = 86400000;

/**
 * Spaced-repetition schedule. "Again" returns in 10 minutes; Hard repeats soon; Good and Easy climb a
 * 1 -> 3 -> 7 -> 14 -> 30 -> 60 day ladder (Easy skips a rung). Using hints caps how far the card is pushed.
 * Viewing the answer is part of every flashcard, so it does not shorten the interval.
 */
export function schedule(previous: ReviewRecord|undefined,rating: ReviewRating,hintsUsed=0): ReviewRecord {
  const now=new Date();
  const rung=LADDER.findIndex(days=>days>=(previous?.intervalDays??0));
  const current=previous?.intervalDays?(rung===-1?LADDER.length-1:rung):-1;
  let days=0;
  if(rating==="hard") days=Math.max(1,Math.round((previous?.intervalDays??0)*1.2)||1);
  else if(rating==="good") days=LADDER[Math.min(LADDER.length-1,current+1)];
  else if(rating==="easy") days=LADDER[Math.min(LADDER.length-1,current+2)];
  if(rating!=="again"&&hintsUsed>0) days=Math.min(days,hintsUsed>=2?2:3);
  const delay=rating==="again"?10*60*1000:days*DAY;
  return {rating,reviewedAt:now.toISOString(),dueAt:new Date(now.getTime()+delay).toISOString(),intervalDays:days,repetitions:rating==="again"?0:(previous?.repetitions??0)+1};
}
export function saveRating(topic: ProgressTopic,id:string,rating:ReviewRating,hintsUsed=0){
  const p=readProgress(topic); p.completed.add(id); if(rating==="again"||rating==="hard")p.needs.add(id); else p.needs.delete(id);
  p.reviews[id]=schedule(p.reviews[id],rating,hintsUsed);
  const n=topic.storageNamespace;
  const writes:[string,unknown][]=[[`${n}_completed`,[...p.completed]],[`${n}_needspractice`,[...p.needs]],[`${n}_reviews`,Object.entries(p.reviews).map(([qid,r])=>({id:qid,...r}))]];
  for(const [key,value] of writes){ localStorage.setItem(key,JSON.stringify(value)); markDirty(key); }
  recordReview();
  window.dispatchEvent(new Event("brainsoma:learning-updated"));
}
export function toggleBookmark(topic: ProgressTopic,id:string){const p=readProgress(topic); if(p.bookmarks.has(id)){p.bookmarks.delete(id);}else{p.bookmarks.add(id);} localStorage.setItem(`${topic.storageNamespace}_bookmarks`,JSON.stringify([...p.bookmarks])); markDirty(`${topic.storageNamespace}_bookmarks`); return p.bookmarks.has(id);}
