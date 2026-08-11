import { cellBiologyConfig } from "./cell-biology";
import { organisationConfig } from "./organisation";
import { infectionAndResponseConfig } from "./infection-and-response";
import { bioenergeticsConfig } from "./bioenergetics";
import { homeostasisAndResponseConfig } from "./homeostasis-and-response";
import { inheritanceVariationAndEvolutionConfig } from "./inheritance-variation-and-evolution";
import { ecologyConfig } from "./ecology";
import { atomicStructureAndThePeriodicTableConfig } from "./atomic-structure-and-the-periodic-table";
import { bondingStructureAndPropertiesOfMatterConfig } from "./bonding-structure-and-properties-of-matter";
import { quantitativeChemistryConfig } from "./quantitative-chemistry";
import { chemicalChangesConfig } from "./chemical-changes";
import { energyChangesConfig } from "./energy-changes";
import { rateAndExtentOfChemicalChangeConfig } from "./rate-and-extent-of-chemical-change";
import { organicChemistryConfig } from "./organic-chemistry";
import { chemicalAnalysisConfig } from "./chemical-analysis";
import { chemistryOfTheAtmosphereConfig } from "./chemistry-of-the-atmosphere";
import { usingResourcesConfig } from "./using-resources";
import { physicsEnergyConfig } from "./physics-energy";
import { physicsElectricityConfig } from "./physics-electricity";
import { physicsParticleModelOfMatterConfig } from "./physics-particle-model-of-matter";
import { physicsAtomicStructureConfig } from "./physics-atomic-structure";
import { physicsForcesConfig } from "./physics-forces";
import { physicsWavesConfig } from "./physics-waves";
import { physicsMagnetismAndElectromagnetismConfig } from "./physics-magnetism-and-electromagnetism";
import { physicsSpacePhysicsConfig } from "./physics-space-physics";

export const topicRegistry = [
  cellBiologyConfig, organisationConfig, infectionAndResponseConfig, bioenergeticsConfig,
  homeostasisAndResponseConfig, inheritanceVariationAndEvolutionConfig, ecologyConfig,
  atomicStructureAndThePeriodicTableConfig, bondingStructureAndPropertiesOfMatterConfig,
  quantitativeChemistryConfig, chemicalChangesConfig, energyChangesConfig,
  rateAndExtentOfChemicalChangeConfig, organicChemistryConfig, chemicalAnalysisConfig,
  chemistryOfTheAtmosphereConfig, usingResourcesConfig, physicsEnergyConfig,
  physicsElectricityConfig, physicsParticleModelOfMatterConfig, physicsAtomicStructureConfig,
  physicsForcesConfig, physicsWavesConfig, physicsMagnetismAndElectromagnetismConfig,
  physicsSpacePhysicsConfig,
];

export type RegisteredTopic = (typeof topicRegistry)[number];
export const questionKey = (subject: string, topic: string, id: string) => `${subject}:${topic}:${id}`;
