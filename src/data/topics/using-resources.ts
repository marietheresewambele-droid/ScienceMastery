import questionBank from "@/data/chemistry/using-resources-questions.json";
import type { ChemistryTopicConfig, RawChemistryQuestionBank } from "@/data/topics/chemistry-topic-utils";
import { createChemistryQuestions, createChemistrySubtopics } from "@/data/topics/chemistry-topic-utils";

const data=questionBank as RawChemistryQuestionBank;
export const usingResourcesQuestions=createChemistryQuestions(data,"using-resources","Using Resources");
export const usingResourcesConfig: ChemistryTopicConfig={
  id:"using-resources", title:"Using Resources", description:"Review sustainable resources, water treatment, life-cycle assessment, materials and fertilisers.",
  route:"/chemistry/using-resources", storageNamespace:"sciencemastery_chemistry_using_resources",
  questions:usingResourcesQuestions, subtopics:createChemistrySubtopics(data), subject:"chemistry", examBoard:"AQA", topicNumber:"Topic 10"
};
