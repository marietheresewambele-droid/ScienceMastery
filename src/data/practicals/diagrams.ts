import type { ApparatusIconKey } from "@/components/practical/diagrams/apparatusIcons";

export interface DiagramItem {
  icon: ApparatusIconKey;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: any;
}

/**
 * Apparatus-diagram specs for every AQA required practical, keyed by
 * practical id. Each entry lists the key pieces of apparatus (not every
 * consumable in the spec) so the diagram reads clearly at a glance, in the
 * style of exam-board apparatus diagrams.
 */
export const PRACTICAL_DIAGRAMS: Record<string, DiagramItem[]> = {
  // Biology
  "BIO-RP01": [
    { icon: "microscope", label: "Light microscope" },
    { icon: "glassBlock", label: "Prepared slide + coverslip" },
    { icon: "dropper", label: "Stain (e.g. iodine)" },
  ],
  "BIO-RP02": [
    { icon: "petriDish", label: "Agar plate + paper discs" },
    { icon: "bunsenBurner", label: "Sterile flame technique" },
    { icon: "ruler", label: "Measure inhibition zones" },
  ],
  "BIO-RP03": [
    { icon: "testTubeRack", label: "Potato cylinders in solution", props: { count: 4 } },
    { icon: "balance", label: "Mass before / after" },
    { icon: "ruler", label: "Length before / after" },
  ],
  "BIO-RP04": [
    { icon: "testTubeRack", label: "Food sample tubes", props: { count: 4 } },
    { icon: "dropper", label: "Benedict's / iodine / Biuret" },
    { icon: "beaker", label: "Water bath", props: { liquid: "var(--color-orange-soft)" } },
  ],
  "BIO-RP05": [
    { icon: "petriDish", label: "Spotting tile + iodine" },
    { icon: "dropper", label: "Amylase + buffer solution" },
    { icon: "stopwatch", label: "Time to colour change" },
  ],
  "BIO-RP06": [
    { icon: "plantSeedling", label: "Pondweed" },
    { icon: "gasSyringe", label: "Gas collection" },
    { icon: "ruler", label: "Distance from lamp" },
  ],
  "BIO-RP07": [
    { icon: "ruler", label: "Metre ruler — drop & catch test" },
  ],
  "BIO-RP08": [
    { icon: "plantSeedling", label: "Germinating seedlings" },
    { icon: "petriDish", label: "Petri dish + cotton wool" },
    { icon: "rayBox", label: "Directional light source" },
  ],
  "BIO-RP09": [
    { icon: "quadrat", label: "Quadrat sampling" },
    { icon: "ruler", label: "Transect tape" },
    { icon: "thermometer", label: "Abiotic sensor reading" },
  ],
  "BIO-RP10": [
    { icon: "cup", label: "Milk / organic material", props: { liquid: "var(--color-cream-soft)" } },
    { icon: "thermometer", label: "Water bath temperature" },
    { icon: "dropper", label: "pH indicator" },
  ],

  // Chemistry
  "CHE-RP01": [
    { icon: "beaker", label: "Acid + insoluble oxide/carbonate" },
    { icon: "funnelFilterPaper", label: "Filter off excess solid" },
    { icon: "petriDish", label: "Evaporate to crystallise" },
  ],
  "CHE-RP02": [
    { icon: "retortStand", label: "Clamp stand holding burette" },
    { icon: "burette", label: "Burette — alkali" },
    { icon: "conicalFlask", label: "Conical flask — acid + indicator" },
  ],
  "CHE-RP03": [
    { icon: "electrolysisCell", label: "Electrolyte + inert electrodes" },
    { icon: "powerSupplyBox", label: "DC power supply" },
    { icon: "testTube", label: "Collect gas + test with splint" },
  ],
  "CHE-RP04": [
    { icon: "cup", label: "Insulated cup + lid" },
    { icon: "thermometer", label: "Thermometer / probe" },
    { icon: "balance", label: "Balance for reactants" },
  ],
  "CHE-RP05": [
    { icon: "conicalFlask", label: "Acid + marble chips" },
    { icon: "gasSyringe", label: "Gas syringe" },
    { icon: "stopwatch", label: "Stopwatch" },
  ],
  "CHE-RP06": [
    { icon: "beaker", label: "Solvent chamber (lid on)" },
    { icon: "dropper", label: "Capillary tube spots dye" },
    { icon: "ruler", label: "Measure Rf value" },
  ],
  "CHE-RP07": [
    { icon: "bunsenBurner", label: "Flame test wire" },
    { icon: "testTubeRack", label: "NaOH / acid tests", props: { count: 4 } },
    { icon: "dropper", label: "Silver nitrate / barium chloride" },
  ],
  "CHE-RP08": [
    { icon: "beaker", label: "Water sample" },
    { icon: "funnelFilterPaper", label: "Filtration" },
    { icon: "condenserFlask", label: "Simple distillation" },
  ],

  // Physics
  "PHY-RP01": [
    { icon: "heaterBlock", label: "Heater in metal block" },
    { icon: "thermometer", label: "Temperature probe" },
    { icon: "stopwatch", label: "Timer" },
  ],
  "PHY-RP02": [
    { icon: "cup", label: "Hot water + insulation", props: { liquid: "var(--color-orange-soft)" } },
    { icon: "thermometer", label: "Temperature probe" },
    { icon: "stopwatch", label: "Timer" },
  ],
  "PHY-RP03": [
    { icon: "circuitBoard", label: "Ammeter–voltmeter circuit" },
    { icon: "powerSupplyBox", label: "Power supply" },
    { icon: "ruler", label: "Test wire length" },
  ],
  "PHY-RP04": [
    { icon: "circuitBoard", label: "Ammeter–voltmeter circuit" },
    { icon: "powerSupplyBox", label: "Variable DC supply" },
  ],
  "PHY-RP05": [
    { icon: "balance", label: "Mass" },
    { icon: "measuringCylinder", label: "Volume by displacement" },
    { icon: "cube", label: "Regular / irregular solid" },
  ],
  "PHY-RP06": [
    { icon: "retortStand", label: "Clamp stand" },
    { icon: "springMasses", label: "Spring + masses" },
    { icon: "ruler", label: "Extension" },
  ],
  "PHY-RP07": [
    { icon: "rampTrolley", label: "Trolley on ramp" },
    { icon: "lightGate", label: "Light gates" },
    { icon: "ruler", label: "Distance measurements" },
  ],
  "PHY-RP08": [
    { icon: "circuitBoard", label: "Signal generator" },
    { icon: "ruler", label: "Measure wavelength" },
  ],
  "PHY-RP09": [
    { icon: "rayBox", label: "Ray box / laser" },
    { icon: "glassBlock", label: "Glass block" },
    { icon: "protractor", label: "Angle measurements" },
  ],
  "PHY-RP10": [
    { icon: "lesliesCube", label: "Leslie's cube" },
    { icon: "thermometer", label: "Infrared detector / thermometer" },
    { icon: "stopwatch", label: "Timer" },
  ],
};

export function getPracticalDiagram(practicalId: string): DiagramItem[] {
  return PRACTICAL_DIAGRAMS[practicalId] ?? [];
}
