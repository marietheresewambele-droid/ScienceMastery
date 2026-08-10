import questionBank from "@/data/chemistry/chemistry-of-the-atmosphere-questions.json";
import type { ChemistryTopicConfig, RawChemistryQuestionBank } from "@/data/topics/chemistry-topic-utils";
import { createChemistryQuestions, createChemistrySubtopics } from "@/data/topics/chemistry-topic-utils";

const data=questionBank as RawChemistryQuestionBank;
export const chemistryOfTheAtmosphereQuestions=createChemistryQuestions(data,"chemistry-of-the-atmosphere","Chemistry of the Atmosphere");
export const chemistryOfTheAtmosphereConfig: ChemistryTopicConfig={
  id:"chemistry-of-the-atmosphere", title:"Chemistry of the Atmosphere", description:"Study atmospheric evolution, greenhouse gases, climate change and pollutants.",
  route:"/chemistry/chemistry-of-the-atmosphere", storageNamespace:"sciencemastery_chemistry_chemistry_of_the_atmosphere",
  questions:chemistryOfTheAtmosphereQuestions, subtopics:createChemistrySubtopics(data), subject:"chemistry", examBoard:"AQA", topicNumber:"Topic 9"
};
