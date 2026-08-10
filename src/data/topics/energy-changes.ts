import questionBank from "@/data/chemistry/energy-changes-questions.json";
import type { ChemistryTopicConfig, RawChemistryQuestionBank } from "@/data/topics/chemistry-topic-utils";
import { createChemistryQuestions, createChemistrySubtopics } from "@/data/topics/chemistry-topic-utils";

const data=questionBank as RawChemistryQuestionBank;
export const energyChangesQuestions=createChemistryQuestions(data,"energy-changes","Energy Changes");
export const energyChangesConfig: ChemistryTopicConfig={
  id:"energy-changes", title:"Energy Changes", description:"Practise exothermic and endothermic reactions, reaction profiles, bond energies, cells and fuel cells.",
  route:"/chemistry/energy-changes", storageNamespace:"sciencemastery_chemistry_energy_changes",
  questions:energyChangesQuestions, subtopics:createChemistrySubtopics(data), subject:"chemistry", examBoard:"AQA", topicNumber:"Topic 5"
};
