import type { BiologyTopicConfig, BiologySubtopicConfig, MasteryQuestion } from "@/types/questions";

interface RawChemistryQuestion {
  id: string; question?: string; questionFamily?: string; subtopic?: string; sourceSubtopic?: string;
  tier?: "Foundation" | "Higher" | "Both" | string; marks?: number; modelAnswer?: string;
  markingPoints?: string[]; commandWord?: string; assessmentObjective?: string;
  specificationReference?: string; gradeDemand?: string; knowledgeType?: string;
}
export interface RawChemistryQuestionBank {
  metadata?: { subtopics?: Array<{ title?: string; questionCount?: number }> };
  questions: RawChemistryQuestion[];
}
function normaliseAO(value: unknown): MasteryQuestion["assessmentObjective"] | null {
  if (typeof value !== "string") return null;
  const tokens=Array.from(new Set(value.toUpperCase().match(/AO[123]/g) ?? []));
  const ordered=["AO1","AO2","AO3"].filter(value=>tokens.includes(value));
  return ordered.length ? ordered.join("/") as MasteryQuestion["assessmentObjective"] : null;
}
export function createChemistryQuestions(bank: RawChemistryQuestionBank, topicSlug: string, topicTitle: string): MasteryQuestion[] {
  return bank.questions.map((question,index)=>{
    if (!question.id || !question.question?.trim() || typeof question.marks !== "number") throw new Error(`Rejected ${topicTitle} record ${index+1}: missing required data`);
    const ao=normaliseAO(question.assessmentObjective); if (!ao) throw new Error(`Rejected ${topicTitle} record ${question.id}: invalid assessment objective`);
    const markingPoints=(question.markingPoints ?? []).filter((point): point is string=>typeof point === "string" && point.trim().length>0);
    if (!question.modelAnswer?.trim() && !markingPoints.length) throw new Error(`Rejected ${topicTitle} record ${question.id}: missing answer`);
    const subtopic=question.subtopic ?? question.sourceSubtopic; if (!subtopic) throw new Error(`Rejected ${topicTitle} record ${question.id}: missing subtopic`);
    const tier=question.tier === "Foundation" || question.tier === "Higher" || question.tier === "Both" ? question.tier : undefined;
    return { id:question.id, subject:"chemistry", topicSlug, topic:topicTitle, subtopic, question:question.question, marks:question.marks,
      assessmentObjective:ao, difficulty:tier, tier, commandWord:question.commandWord, specificationReference:question.specificationReference,
      markingPoints, modelAnswer:question.modelAnswer, gradeDemand:question.gradeDemand, questionFamily:question.questionFamily, originalSubtopic:question.sourceSubtopic };
  });
}
export function createChemistrySubtopics(bank: RawChemistryQuestionBank): BiologySubtopicConfig[] {
  return (bank.metadata?.subtopics ?? []).map((subtopic,index)=>({
    id:(subtopic.title ?? `subtopic-${index+1}`).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""),
    title:subtopic.title ?? "Unknown subtopic", description:"Practice questions for this subtopic."
  }));
}
export type ChemistryTopicConfig = BiologyTopicConfig;
