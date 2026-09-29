export function brokenFactory(checkpoint) {
 let value = 0;
 return {
  async increment() { const before = value; await checkpoint(); value = before + 1; },
  value() { return value; },
 };
}
export function fixedFactory(checkpoint) {
 let value = 0;
 return {
  async increment() { value += 1; await checkpoint(); },
  value() { return value; },
 };
}
