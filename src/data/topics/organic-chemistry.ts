import questionBank from "@/data/chemistry/organic-chemistry-questions.json";
import type { ChemistryTopicConfig, RawChemistryQuestionBank } from "@/data/topics/chemistry-topic-utils";
import { createChemistryQuestions, createChemistrySubtopics } from "@/data/topics/chemistry-topic-utils";

const data=questionBank as RawChemistryQuestionBank;
export const organicChemistryQuestions=createChemistryQuestions(data,"organic-chemistry","Organic Chemistry");
export const organicChemistryConfig: ChemistryTopicConfig={
  id:"organic-chemistry", title:"Organic Chemistry", description:"Practise hydrocarbons, cracking, organic reactions and polymers.",
  route:"/chemistry/organic-chemistry", storageNamespace:"brainsoma_chemistry_organic_chemistry",
  questions:organicChemistryQuestions, subtopics:createChemistrySubtopics(data), subject:"chemistry", examBoard:"AQA", topicNumber:"Topic 7"
};
