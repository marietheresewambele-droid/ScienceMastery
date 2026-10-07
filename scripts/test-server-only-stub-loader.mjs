// Lets plain Node run the TypeScript tests: stubs "server-only" and resolves the "@/" alias to src/.
const SRC = new URL("../src/", import.meta.url);

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return { url: "data:text/javascript,export default {};", shortCircuit: true };
  }
  if (specifier.startsWith("@/")) {
    const path = specifier.slice(2);
    return nextResolve(new URL(/\.[cm]?[jt]sx?$/.test(path) ? path : `${path}.ts`, SRC).href, context);
  }
  return nextResolve(specifier, context);
}
