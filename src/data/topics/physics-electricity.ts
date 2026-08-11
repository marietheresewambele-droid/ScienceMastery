import questionBank from "@/data/physics/electricity-questions.json";
import type { PhysicsTopicConfig, RawPhysicsQuestionBank } from "@/data/topics/physics-topic-utils";
import { createPhysicsQuestions, createPhysicsSubtopics } from "@/data/topics/physics-topic-utils";
const data=questionBank as RawPhysicsQuestionBank;
export const physicsElectricityQuestions=createPhysicsQuestions(data,"electricity","Electricity");
export const physicsElectricityConfig: PhysicsTopicConfig={ id:"electricity", title:"Electricity", description:"Practise current, potential difference, resistance, circuits, domestic electricity and electrical energy.", route:"/physics/electricity", storageNamespace:"sciencemastery_physics_electricity", questions:physicsElectricityQuestions, subtopics:createPhysicsSubtopics(data), subject:"physics", examBoard:"AQA", topicNumber:"Topic 2" };
