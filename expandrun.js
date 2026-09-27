// expandrun.js：按解析预算展开并留账（基线：一律给空表）
import { refsOf, replaceRefs } from "./varmap.js";

export function step(spec) {
  return { state: spec.state, resolved: 0, ledger_before: 0, ledger: [], judged: 0, judged_bound: 0 };
}

export function close(spec) {
  return { state: spec.state, catchup: 0 };
}
