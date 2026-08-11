import questionBank from "@/data/physics/waves-questions.json";
import type { PhysicsTopicConfig, RawPhysicsQuestionBank } from "@/data/topics/physics-topic-utils";
import { createPhysicsQuestions, createPhysicsSubtopics } from "@/data/topics/physics-topic-utils";
const data=questionBank as RawPhysicsQuestionBank;
export const physicsWavesQuestions=createPhysicsQuestions(data,"waves","Waves");
export const physicsWavesConfig: PhysicsTopicConfig={ id:"waves", title:"Waves", description:"Master wave properties, required practicals, electromagnetic waves and black-body radiation.", route:"/physics/waves", storageNamespace:"sciencemastery_physics_waves", questions:physicsWavesQuestions, subtopics:createPhysicsSubtopics(data), subject:"physics", examBoard:"AQA", topicNumber:"Topic 6" };
