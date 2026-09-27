import assert from "node:assert";
import { refsOf, replaceRefs } from "../varmap.js";
import { step, close } from "../expandrun.js";
import { render } from "../app.js";

const base = {
  budget: 1, defs: { A: "$B", B: "v" },
  state: { resolved: {}, ledger: [], applied: [] },
  events: [],
  missing_error_code: "E_MISSING", cycle_error_code: "E_CYCLE",
  event_error_code: "E_BAD_EVENT"
};

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

check("refsOf returns a list", () => {
  assert.ok(Array.isArray(refsOf("$A")));
});

check("replaceRefs returns text", () => {
  assert.strictEqual(typeof replaceRefs("$A", { A: "v" }), "string");
});

check("step returns a state", () => {
  assert.strictEqual(typeof step(base).state, "object");
});

check("close returns a state", () => {
  assert.strictEqual(typeof close(base).state, "object");
});

check("render counts events", () => {
  assert.strictEqual(typeof render(base).count, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
