import questionBank from "@/data/physics/magnetism-and-electromagnetism-questions.json";
import type { PhysicsTopicConfig, RawPhysicsQuestionBank } from "@/data/topics/physics-topic-utils";
import { createPhysicsQuestions, createPhysicsSubtopics } from "@/data/topics/physics-topic-utils";
const data=questionBank as RawPhysicsQuestionBank;
export const physicsMagnetismAndElectromagnetismQuestions=createPhysicsQuestions(data,"magnetism-and-electromagnetism","Magnetism and Electromagnetism");
export const physicsMagnetismAndElectromagnetismConfig: PhysicsTopicConfig={ id:"magnetism-and-electromagnetism", title:"Magnetism and Electromagnetism", description:"Review magnetic fields, the motor effect, induction, generators and transformers.", route:"/physics/magnetism-and-electromagnetism", storageNamespace:"sciencemastery_physics_magnetism_and_electromagnetism", questions:physicsMagnetismAndElectromagnetismQuestions, subtopics:createPhysicsSubtopics(data), subject:"physics", examBoard:"AQA", topicNumber:"Topic 7" };
