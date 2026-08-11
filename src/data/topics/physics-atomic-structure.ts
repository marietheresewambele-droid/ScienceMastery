import questionBank from "@/data/physics/atomic-structure-questions.json";
import type { PhysicsTopicConfig, RawPhysicsQuestionBank } from "@/data/topics/physics-topic-utils";
import { createPhysicsQuestions, createPhysicsSubtopics } from "@/data/topics/physics-topic-utils";
const data=questionBank as RawPhysicsQuestionBank;
export const physicsAtomicStructureQuestions=createPhysicsQuestions(data,"atomic-structure","Atomic Structure");
export const physicsAtomicStructureConfig: PhysicsTopicConfig={ id:"atomic-structure", title:"Atomic Structure", description:"Review atoms, isotopes, nuclear radiation, half-life, hazards, fission and fusion.", route:"/physics/atomic-structure", storageNamespace:"sciencemastery_physics_atomic_structure", questions:physicsAtomicStructureQuestions, subtopics:createPhysicsSubtopics(data), subject:"physics", examBoard:"AQA", topicNumber:"Topic 4" };
