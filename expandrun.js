// expandrun.js：按解析预算展开并留账
import { refsOf, replaceRefs } from "./varmap.js";

function codes(spec) {
  return {
    missing: spec.missing_error_code || "E_MISSING",
    cycle: spec.cycle_error_code || "E_CYCLE",
    event: spec.event_error_code || "E_BAD_EVENT"
  };
}

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

// 把一个名字一层层替到底；memo 只在本轮展开内复用，不写回状态。
function expand(name, defs, stack, err, memo) {
  if (Object.prototype.hasOwnProperty.call(memo, name)) return memo[name];
  if (stack.indexOf(name) !== -1) fail(err.cycle, "展开绕回自己：" + name);
  if (!Object.prototype.hasOwnProperty.call(defs, name)) fail(err.missing, "名字未定义：" + name);
  const nextStack = stack.concat([name]);
  const text = String(defs[name]);
  const table = {};
  for (const ref of refsOf(text)) {
    table[ref] = expand(ref, defs, nextStack, err, memo);
  }
  const value = replaceRefs(text, table);
  memo[name] = value;
  return value;
}

function cloneState(state) {
  const prev = state || {};
  return {
    resolved: Object.assign({}, prev.resolved || {}),
    ledger: (prev.ledger || []).slice(),
    applied: (prev.applied || []).slice()
  };
}

export function step(spec) {
  const err = codes(spec);
  const defs = spec.defs || {};
  const events = spec.events == null ? [] : spec.events;
  if (!Array.isArray(events)) fail(err.event, "事件表必须是数组");
  const state = cloneState(spec.state);
  const resolved = state.resolved;
  const appliedSet = new Set(state.applied);
  let budget = Number.isFinite(spec.budget) ? Math.max(0, spec.budget) : Infinity;
  let resolvedCount = 0;
  let judged = 0;

  // 先还上一轮压在账上的旧账，预算不够就继续压着。
  const ledger = [];
  for (const name of state.ledger) {
    if (Object.prototype.hasOwnProperty.call(resolved, name)) continue;
    if (budget > 0) {
      resolved[name] = expand(name, defs, [], err, {});
      resolvedCount += 1;
      budget -= 1;
    } else if (ledger.indexOf(name) === -1) {
      ledger.push(name);
    }
  }

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (!event || typeof event !== "object" || event.kind !== "resolve" || typeof event.name !== "string") {
      fail(err.event, "事件不合法：" + JSON.stringify(event));
    }
    const id = event.id !== undefined ? event.id : index;
    if (appliedSet.has(id)) continue;
    appliedSet.add(id);
    state.applied.push(id);
    judged += 1;
    if (Object.prototype.hasOwnProperty.call(resolved, event.name)) continue;
    if (budget > 0) {
      resolved[event.name] = expand(event.name, defs, [], err, {});
      resolvedCount += 1;
      budget -= 1;
    } else if (ledger.indexOf(event.name) === -1) {
      ledger.push(event.name);
    }
  }

  state.ledger = ledger;
  return { state, resolved: resolvedCount, ledger_before: ledger.length, ledger: ledger.slice(),
           judged, judged_bound: events.length };
}

export function close(spec) {
  const err = codes(spec);
  const defs = spec.defs || {};
  const state = cloneState(spec.state);
  let catchup = 0;
  for (const name of state.ledger) {
    if (Object.prototype.hasOwnProperty.call(state.resolved, name)) continue;
    state.resolved[name] = expand(name, defs, [], err, {});
    catchup += 1;
  }
  state.ledger = [];
  return { state, catchup };
}
