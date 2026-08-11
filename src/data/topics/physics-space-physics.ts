import questionBank from "@/data/physics/space-physics-questions.json";
import type { PhysicsTopicConfig, RawPhysicsQuestionBank } from "@/data/topics/physics-topic-utils";
import { createPhysicsQuestions, createPhysicsSubtopics } from "@/data/topics/physics-topic-utils";
const data=questionBank as RawPhysicsQuestionBank;
export const physicsSpacePhysicsQuestions=createPhysicsQuestions(data,"space-physics","Space Physics");
export const physicsSpacePhysicsConfig: PhysicsTopicConfig={ id:"space-physics", title:"Space Physics", description:"Practise the solar system, stellar evolution, orbital motion, red-shift and the expanding universe.", route:"/physics/space-physics", storageNamespace:"sciencemastery_physics_space_physics", questions:physicsSpacePhysicsQuestions, subtopics:createPhysicsSubtopics(data), subject:"physics", examBoard:"AQA", topicNumber:"Topic 8" };
