import questionBank from "@/data/chemistry/bonding-structure-and-properties-of-matter-questions.json";
import type { ChemistryTopicConfig, RawChemistryQuestionBank } from "@/data/topics/chemistry-topic-utils";
import { createChemistryQuestions, createChemistrySubtopics } from "@/data/topics/chemistry-topic-utils";

const data=questionBank as RawChemistryQuestionBank;
export const bondingStructureAndPropertiesOfMatterQuestions=createChemistryQuestions(data,"bonding-structure-and-properties-of-matter","Bonding, Structure and Properties of Matter");
export const bondingStructureAndPropertiesOfMatterConfig: ChemistryTopicConfig={
  id:"bonding-structure-and-properties-of-matter", title:"Bonding, Structure and Properties of Matter", description:"Master ionic, covalent and metallic bonding, material properties and nanoscience.",
  route:"/chemistry/bonding-structure-and-properties-of-matter", storageNamespace:"sciencemastery_chemistry_bonding_structure_and_properties_of_matter",
  questions:bondingStructureAndPropertiesOfMatterQuestions, subtopics:createChemistrySubtopics(data), subject:"chemistry", examBoard:"AQA", topicNumber:"Topic 2"
};
