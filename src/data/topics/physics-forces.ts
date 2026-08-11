import questionBank from "@/data/physics/forces-questions.json";
import type { PhysicsTopicConfig, RawPhysicsQuestionBank } from "@/data/topics/physics-topic-utils";
import { createPhysicsQuestions, createPhysicsSubtopics } from "@/data/topics/physics-topic-utils";
const data=questionBank as RawPhysicsQuestionBank;
export const physicsForcesQuestions=createPhysicsQuestions(data,"forces","Forces");
export const physicsForcesConfig: PhysicsTopicConfig={ id:"forces", title:"Forces", description:"Practise interactions, elasticity, moments, pressure, motion, momentum and force calculations.", route:"/physics/forces", storageNamespace:"sciencemastery_physics_forces", questions:physicsForcesQuestions, subtopics:createPhysicsSubtopics(data), subject:"physics", examBoard:"AQA", topicNumber:"Topic 5" };
