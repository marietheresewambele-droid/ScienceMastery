import questionBank from "@/data/chemistry/atomic-structure-and-the-periodic-table-questions.json";
import type { ChemistryTopicConfig, RawChemistryQuestionBank } from "@/data/topics/chemistry-topic-utils";
import { createChemistryQuestions, createChemistrySubtopics } from "@/data/topics/chemistry-topic-utils";

const data=questionBank as RawChemistryQuestionBank;

const atomicStructureSubtopicLabelMap: Record<string, string> = {
  "T1 Atomic Structure · 4.1.1.1": "Model of the atom",
  "T1 Atomic Structure · 4.1.1.1–4.1.1.2": "Model of the atom",
  "T1 Atomic Structure · 4.1.1.2": "Model of the atom",
  "T1 Atomic Structure · 4.1.1.2, 4.1.2.2": "Model of the atom",
  "T1 Atomic Structure · 4.1.1.3": "Model of the atom",
  "T1 Atomic Structure · 4.1.1.4–4.1.1.5": "Model of the atom",
  "T1 Atomic Structure · 4.1.1.4": "Model of the atom",
  "T1 Atomic Structure · 4.1.1.4; 4.1.2.2": "Model of the atom",
  "T1 Atomic Structure · 4.1.1.6": "Model of the atom",
  "T1 Atomic Structure · 4.1.1.7": "Model of the atom",
  "T1 Atomic Structure · 4.1.2.1": "Periodic table",
  "T1 Atomic Structure · 4.1.2.2": "Periodic table",
  "T1 Atomic Structure · 4.1.2.3": "Periodic table",
  "T1 Atomic Structure · 4.1.2.4": "Periodic table",
  "T1 Atomic Structure · 4.1.2.5": "Periodic table",
  "T1 Atomic Structure · 4.1.2.6": "Periodic table",
  "T1 Atomic Structure · 4.1.3": "Transition metals",
  "T1 Atomic Structure · 4.1.3.1": "Transition metals",
  "T1 Atomic Structure · 4.8.1.3": "Periodic table",
  "T1 Atomic Structure · WS 3.4": "Model of the atom",
};

export const atomicStructureAndThePeriodicTableQuestions=createChemistryQuestions(
  data,
  "atomic-structure-and-the-periodic-table",
  "Atomic Structure and the Periodic Table",
  atomicStructureSubtopicLabelMap,
);
export const atomicStructureAndThePeriodicTableConfig: ChemistryTopicConfig={
  id:"atomic-structure-and-the-periodic-table", title:"Atomic Structure and the Periodic Table", description:"Review atoms, elements, mixtures, atomic models and periodic trends through structured mastery practice.",
  route:"/chemistry/atomic-structure-and-the-periodic-table", storageNamespace:"sciencemastery_chemistry_atomic_structure_and_the_periodic_table",
  questions:atomicStructureAndThePeriodicTableQuestions, subtopics:createChemistrySubtopics(data, atomicStructureSubtopicLabelMap), subject:"chemistry", examBoard:"AQA", topicNumber:"Topic 1"
};
