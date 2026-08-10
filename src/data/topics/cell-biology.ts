import type { MasteryQuestion, TopicMetadata } from "@/types/questions";

/**
 * Cell Biology topic metadata for AQA GCSE Biology
 * 
 * This file contains demonstration data only.
 * When the verified Excel workbook is imported:
 * - Replace the questions array with parsed workbook data
 * - Ensure all marking points and model answers match the verified source
 * - Update subtopics if the workbook structure differs
 */

export const cellBiologyMetadata: TopicMetadata = {
  subject: "biology",
  title: "Cell Biology",
  slug: "cell-biology",
  examBoard: "AQA",
  topicNumber: "Topic 1",
  description:
    "Review cell structure, microscopy, cell division, stem cells and transport in cells through structured mastery practice.",
  subtopics: [
    "Cell structure",
    "Cell specialisation and differentiation",
    "Microscopy",
    "Chromosomes and the cell cycle",
    "Mitosis",
    "Stem cells",
    "Diffusion",
    "Osmosis",
    "Active transport",
    "Required practical: microscopy",
    "Required practical: osmosis",
  ],
};

// DEMONSTRATION QUESTIONS ONLY - Replace with verified workbook data
// These are sample questions to demonstrate the system functionality
export const cellBiologyQuestions: MasteryQuestion[] = [
  {
    id: "cb-001",
    subject: "biology",
    topicSlug: "cell-biology",
    subtopic: "Cell structure",
    question:
      "Name two structures that are found in plant cells but not in animal cells.",
    marks: 2,
    assessmentObjective: "AO1",
    difficulty: "Foundation",
    commandWord: "Name",
    specificationReference: "4.1.1.1",
    markingPoints: [
      "Cell wall",
      "Permanent vacuole",
      "Chloroplasts (accept chlorophyll)",
    ],
    modelAnswer:
      "Plant cells have a cell wall, permanent vacuole and chloroplasts which animal cells do not have.",
  },
  {
    id: "cb-002",
    subject: "biology",
    topicSlug: "cell-biology",
    subtopic: "Cell specialisation and differentiation",
    question:
      "Explain how a sperm cell is adapted for its function in fertilisation.",
    marks: 3,
    assessmentObjective: "AO2",
    difficulty: "Higher",
    commandWord: "Explain",
    specificationReference: "4.1.1.3",
    markingPoints: [
      "Tail/flagellum for swimming/movement",
      "Many mitochondria to release energy for movement",
      "Haploid nucleus containing genetic material",
      "Acrosome containing enzymes to digest egg cell membrane",
    ],
    modelAnswer:
      "The sperm cell has a tail for swimming to the egg cell. It contains many mitochondria to provide energy for this movement. The haploid nucleus carries genetic information, and the acrosome contains enzymes to break down the egg cell membrane during fertilisation.",
  },
  {
    id: "cb-003",
    subject: "biology",
    topicSlug: "cell-biology",
    subtopic: "Microscopy",
    question:
      "Calculate the magnification of a microscope if the eyepiece lens has a magnification of ×10 and the objective lens has a magnification of ×40.",
    marks: 2,
    assessmentObjective: "AO2",
    difficulty: "Both",
    commandWord: "Calculate",
    specificationReference: "4.1.1.2",
    markingPoints: [
      "Magnification = eyepiece magnification × objective magnification",
      "Correct substitution: 10 × 40 = 400",
    ],
    modelAnswer: "Magnification = 10 × 40 = ×400",
  },
  {
    id: "cb-004",
    subject: "biology",
    topicSlug: "cell-biology",
    subtopic: "Diffusion",
    question:
      "Define the term diffusion and give one example of a substance that diffuses into or out of a cell.",
    marks: 3,
    assessmentObjective: "AO1",
    difficulty: "Foundation",
    commandWord: "Define",
    specificationReference: "4.1.3.1",
    markingPoints: [
      "Net movement of particles from an area of higher concentration to an area of lower concentration",
      "Down a concentration gradient",
      "Example: oxygen, carbon dioxide, glucose, amino acids, ions (any valid substance)",
    ],
  },
  {
    id: "cb-005",
    subject: "biology",
    topicSlug: "cell-biology",
    subtopic: "Osmosis",
    question:
      "A student places a piece of potato in a concentrated sugar solution. After 30 minutes, the potato has decreased in mass. Explain why.",
    marks: 4,
    assessmentObjective: "AO3",
    difficulty: "Higher",
    commandWord: "Explain",
    specificationReference: "4.1.3.2",
    markingPoints: [
      "Water moves by osmosis",
      "From inside the potato cells to the sugar solution",
      "Through partially permeable membranes",
      "Because the sugar solution has a lower water potential / potato cells have a higher water potential",
    ],
    modelAnswer:
      "Water moves out of the potato cells by osmosis. This occurs because the concentrated sugar solution has a lower water potential than the potato cells. Water moves through the partially permeable cell membranes from the region of higher water potential (potato) to the region of lower water potential (sugar solution), causing the potato to lose mass.",
  },
];
