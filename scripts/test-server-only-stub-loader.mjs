// Lets plain Node execute the server-only parser during isolated tests.
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return { url: "data:text/javascript,export default {};", shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
