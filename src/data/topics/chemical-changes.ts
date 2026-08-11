import questionBank from "@/data/chemistry/chemical-changes-questions.json";
import type { ChemistryTopicConfig, RawChemistryQuestionBank } from "@/data/topics/chemistry-topic-utils";
import { createChemistryQuestions, createChemistrySubtopics } from "@/data/topics/chemistry-topic-utils";

const data=questionBank as RawChemistryQuestionBank;
export const chemicalChangesQuestions=createChemistryQuestions(data,"chemical-changes","Chemical Changes");
export const chemicalChangesConfig: ChemistryTopicConfig={
  id:"chemical-changes", title:"Chemical Changes", description:"Review reactivity, extraction, acids, salts, electrolysis and redox reactions.",
  route:"/chemistry/chemical-changes", storageNamespace:"sciencemastery_chemistry_chemical_changes",
  questions:chemicalChangesQuestions, subtopics:createChemistrySubtopics(data), subject:"chemistry", examBoard:"AQA", topicNumber:"Topic 4"
};
