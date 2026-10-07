import type { Subject, TopicDefinition } from "@/types/questions";

/**
 * Static site metadata for every AQA topic. Questions and subtopics are NOT defined here:
 * they come from the Supabase question bank (subjects -> topics -> subtopics -> questions).
 * `number` is the workbook "Unit" (T1 -> 1) and must match public.topics in
 * supabase/migrations/20261007120000_question_hierarchy.sql.
 */
export const SUBJECTS: { id: Subject; code: "BIO" | "CHEM" | "PHYS"; name: string }[] = [
  { id: "biology", code: "BIO", name: "Biology" },
  { id: "chemistry", code: "CHEM", name: "Chemistry" },
  { id: "physics", code: "PHYS", name: "Physics" },
];

type TopicSeed = [number: number, slug: string, title: string, description: string];

const TOPICS: Record<Subject, TopicSeed[]> = {
  biology: [
    [1, "cell-biology", "Cell Biology", "Review cell structure, microscopy, cell division, stem cells and transport in cells."],
    [2, "organisation", "Organisation", "Study tissues, organs and organ systems in animals and plants, from enzymes to the heart and leaves."],
    [3, "infection-and-response", "Infection and Response", "Practise communicable diseases, the immune system, vaccination, antibiotics and plant disease."],
    [4, "bioenergetics", "Bioenergetics", "Review photosynthesis, respiration and metabolism, including limiting factors and exercise."],
    [5, "homeostasis-and-response", "Homeostasis and Response", "Master the nervous system, hormones, blood glucose, reproduction and plant hormones."],
    [6, "inheritance-variation-and-evolution", "Inheritance, Variation and Evolution", "Practise reproduction, genetics, variation, evolution and classification."],
    [7, "ecology", "Ecology", "Review adaptation, ecosystems, biodiversity, trophic levels and food production."],
  ],
  chemistry: [
    [1, "atomic-structure-and-the-periodic-table", "Atomic Structure and the Periodic Table", "Review atoms, elements, mixtures, atomic models and periodic trends through structured mastery practice."],
    [2, "bonding-structure-and-properties-of-matter", "Bonding, Structure and Properties of Matter", "Master ionic, covalent and metallic bonding, material properties and nanoscience."],
    [3, "quantitative-chemistry", "Quantitative Chemistry", "Practise chemical calculations, moles, reacting masses, yields, concentrations and uncertainty."],
    [4, "chemical-changes", "Chemical Changes", "Review reactivity, extraction, acids, salts, electrolysis and redox reactions."],
    [5, "energy-changes", "Energy Changes", "Practise exothermic and endothermic reactions, reaction profiles, bond energies, cells and fuel cells."],
    [6, "rate-and-extent-of-chemical-change", "Rate and Extent of Chemical Change", "Review reaction rates, collision theory, reversible reactions and equilibrium."],
    [7, "organic-chemistry", "Organic Chemistry", "Practise hydrocarbons, cracking, organic reactions and polymers."],
    [8, "chemical-analysis", "Chemical Analysis", "Review purity, formulations, chromatography, gas tests, ion tests and instrumental methods."],
    [9, "chemistry-of-the-atmosphere", "Chemistry of the Atmosphere", "Study atmospheric evolution, greenhouse gases, climate change and pollutants."],
    [10, "using-resources", "Using Resources", "Review sustainable resources, water treatment, life-cycle assessment, materials and fertilisers."],
  ],
  physics: [
    [1, "energy", "Energy", "Review energy stores, transfers, conservation, power, efficiency and energy resources."],
    [2, "electricity", "Electricity", "Practise current, potential difference, resistance, circuits, domestic electricity and electrical energy."],
    [3, "particle-model-of-matter", "Particle Model of Matter", "Master density, particle behaviour, internal energy, changes of state and gas pressure."],
    [4, "atomic-structure", "Atomic Structure", "Review atoms, isotopes, nuclear radiation, half-life, hazards, fission and fusion."],
    [5, "forces", "Forces", "Practise interactions, elasticity, moments, pressure, motion, momentum and force calculations."],
    [6, "waves", "Waves", "Master wave properties, required practicals, electromagnetic waves and black-body radiation."],
    [7, "magnetism-and-electromagnetism", "Magnetism and Electromagnetism", "Review magnetic fields, the motor effect, induction, generators and transformers."],
    [8, "space-physics", "Space Physics", "Practise the solar system, stellar evolution, orbital motion, red-shift and the expanding universe."],
  ],
};

export const topicRegistry: TopicDefinition[] = SUBJECTS.flatMap(({ id: subject, code }) =>
  TOPICS[subject].map(([number, slug, title, description]) => ({
    id: slug,
    topicId: `${code}-T${String(number).padStart(2, "0")}`,
    subject,
    number,
    title,
    description,
    route: `/${subject}/${slug}`,
    // "v2" namespaces started with the subject/topic/subtopic question bank; earlier local
    // progress referenced the previous question IDs and was reset on purpose.
    storageNamespace: `brainsoma_v2_${subject}_${slug.replace(/-/g, "_")}`,
    examBoard: "AQA",
    topicNumber: `Topic ${number}`,
  })),
);

export type RegisteredTopic = TopicDefinition;

export function findTopic(subject: string, slug: string): TopicDefinition | undefined {
  return topicRegistry.find((topic) => topic.subject === subject && topic.id === slug);
}

export const questionKey = (subject: string, topic: string, id: string) => `${subject}:${topic}:${id}`;
