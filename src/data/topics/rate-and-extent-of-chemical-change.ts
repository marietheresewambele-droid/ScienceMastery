import questionBank from "@/data/chemistry/rate-and-extent-of-chemical-change-questions.json";
import type { ChemistryTopicConfig, RawChemistryQuestionBank } from "@/data/topics/chemistry-topic-utils";
import { createChemistryQuestions, createChemistrySubtopics } from "@/data/topics/chemistry-topic-utils";

const data=questionBank as RawChemistryQuestionBank;
export const rateAndExtentOfChemicalChangeQuestions=createChemistryQuestions(data,"rate-and-extent-of-chemical-change","Rate and Extent of Chemical Change");
export const rateAndExtentOfChemicalChangeConfig: ChemistryTopicConfig={
  id:"rate-and-extent-of-chemical-change", title:"Rate and Extent of Chemical Change", description:"Review reaction rates, collision theory, reversible reactions and equilibrium.",
  route:"/chemistry/rate-and-extent-of-chemical-change", storageNamespace:"sciencemastery_chemistry_rate_and_extent_of_chemical_change",
  questions:rateAndExtentOfChemicalChangeQuestions, subtopics:createChemistrySubtopics(data), subject:"chemistry", examBoard:"AQA", topicNumber:"Topic 6"
};
