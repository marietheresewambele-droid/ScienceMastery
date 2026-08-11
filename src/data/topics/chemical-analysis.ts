import questionBank from "@/data/chemistry/chemical-analysis-questions.json";
import type { ChemistryTopicConfig, RawChemistryQuestionBank } from "@/data/topics/chemistry-topic-utils";
import { createChemistryQuestions, createChemistrySubtopics } from "@/data/topics/chemistry-topic-utils";

const data=questionBank as RawChemistryQuestionBank;
export const chemicalAnalysisQuestions=createChemistryQuestions(data,"chemical-analysis","Chemical Analysis");
export const chemicalAnalysisConfig: ChemistryTopicConfig={
  id:"chemical-analysis", title:"Chemical Analysis", description:"Review purity, formulations, chromatography, gas tests, ion tests and instrumental methods.",
  route:"/chemistry/chemical-analysis", storageNamespace:"sciencemastery_chemistry_chemical_analysis",
  questions:chemicalAnalysisQuestions, subtopics:createChemistrySubtopics(data), subject:"chemistry", examBoard:"AQA", topicNumber:"Topic 8"
};
