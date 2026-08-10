import questionBank from "@/data/chemistry/atomic-structure-and-the-periodic-table-questions.json";
import type { ChemistryTopicConfig, RawChemistryQuestionBank } from "@/data/topics/chemistry-topic-utils";
import { createChemistryQuestions, createChemistrySubtopics } from "@/data/topics/chemistry-topic-utils";

const data=questionBank as RawChemistryQuestionBank;
export const atomicStructureAndThePeriodicTableQuestions=createChemistryQuestions(data,"atomic-structure-and-the-periodic-table","Atomic Structure and the Periodic Table");
export const atomicStructureAndThePeriodicTableConfig: ChemistryTopicConfig={
  id:"atomic-structure-and-the-periodic-table", title:"Atomic Structure and the Periodic Table", description:"Review atoms, elements, mixtures, atomic models and periodic trends through structured mastery practice.",
  route:"/chemistry/atomic-structure-and-the-periodic-table", storageNamespace:"sciencemastery_chemistry_atomic_structure_and_the_periodic_table",
  questions:atomicStructureAndThePeriodicTableQuestions, subtopics:createChemistrySubtopics(data), subject:"chemistry", examBoard:"AQA", topicNumber:"Topic 1"
};
