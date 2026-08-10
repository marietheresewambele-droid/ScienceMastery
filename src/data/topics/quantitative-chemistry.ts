import questionBank from "@/data/chemistry/quantitative-chemistry-questions.json";
import type { ChemistryTopicConfig, RawChemistryQuestionBank } from "@/data/topics/chemistry-topic-utils";
import { createChemistryQuestions, createChemistrySubtopics } from "@/data/topics/chemistry-topic-utils";

const data=questionBank as RawChemistryQuestionBank;
export const quantitativeChemistryQuestions=createChemistryQuestions(data,"quantitative-chemistry","Quantitative Chemistry");
export const quantitativeChemistryConfig: ChemistryTopicConfig={
  id:"quantitative-chemistry", title:"Quantitative Chemistry", description:"Practise chemical calculations, moles, reacting masses, yields, concentrations and uncertainty.",
  route:"/chemistry/quantitative-chemistry", storageNamespace:"sciencemastery_chemistry_quantitative_chemistry",
  questions:quantitativeChemistryQuestions, subtopics:createChemistrySubtopics(data), subject:"chemistry", examBoard:"AQA", topicNumber:"Topic 3"
};
