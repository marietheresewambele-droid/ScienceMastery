import questionBank from "@/data/physics/energy-questions.json";
import type { PhysicsTopicConfig, RawPhysicsQuestionBank } from "@/data/topics/physics-topic-utils";
import { createPhysicsQuestions, createPhysicsSubtopics } from "@/data/topics/physics-topic-utils";
const data=questionBank as RawPhysicsQuestionBank;
export const physicsEnergyQuestions=createPhysicsQuestions(data,"energy","Energy");
export const physicsEnergyConfig: PhysicsTopicConfig={ id:"energy", title:"Energy", description:"Review energy stores, transfers, conservation, power, efficiency and energy resources.", route:"/physics/energy", storageNamespace:"sciencemastery_physics_energy", questions:physicsEnergyQuestions, subtopics:createPhysicsSubtopics(data), subject:"physics", examBoard:"AQA", topicNumber:"Topic 1" };
