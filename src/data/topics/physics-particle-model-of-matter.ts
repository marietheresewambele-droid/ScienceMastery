import questionBank from "@/data/physics/particle-model-of-matter-questions.json";
import type { PhysicsTopicConfig, RawPhysicsQuestionBank } from "@/data/topics/physics-topic-utils";
import { createPhysicsQuestions, createPhysicsSubtopics } from "@/data/topics/physics-topic-utils";
const data=questionBank as RawPhysicsQuestionBank;
export const physicsParticleModelOfMatterQuestions=createPhysicsQuestions(data,"particle-model-of-matter","Particle Model of Matter");
export const physicsParticleModelOfMatterConfig: PhysicsTopicConfig={ id:"particle-model-of-matter", title:"Particle Model of Matter", description:"Master density, particle behaviour, internal energy, changes of state and gas pressure.", route:"/physics/particle-model-of-matter", storageNamespace:"sciencemastery_physics_particle_model_of_matter", questions:physicsParticleModelOfMatterQuestions, subtopics:createPhysicsSubtopics(data), subject:"physics", examBoard:"AQA", topicNumber:"Topic 3" };
