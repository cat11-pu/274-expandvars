// expandrun.js：按解析预算逐层展开，预算用尽把名字压在账上，收尾不限预算补齐。
import { refsOf, replaceRefs } from "./varmap.js";

function errorWith(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function has(list, name) {
  return list.indexOf(name) !== -1;
}

// 把一个名字的定义沿引用一层层替到底；
// chain 是当前展开链，引用未定义报 E_MISSING，绕回链上名字报 E_CYCLE。
function expand(name, defs, chain) {
  if (!hasOwn(defs, name)) {
    throw errorWith("E_MISSING", "名字 " + name + " 没有定义");
  }
  if (has(chain, name)) {
    throw errorWith("E_CYCLE", "名字 " + name + " 构成循环引用：" + chain.concat(name).join(" -> "));
  }
  const text = String(defs[name]);
  const nextChain = chain.concat(name);
  const table = {};
  refsOf(text).forEach(function (refName) {
    if (!hasOwn(table, refName)) {
      table[refName] = expand(refName, defs, nextChain);
    }
  });
  return replaceRefs(text, table);
}

function cloneState(state) {
  const source = state || {};
  return {
    resolved: Object.assign({}, source.resolved || {}),
    ledger: (source.ledger || []).slice(),
    applied: (source.applied || []).slice()
  };
}

// 非法事件一律报 E_BAD_EVENT：必须是 resolve 且带非空名字。
function validateEvents(events) {
  (events || []).forEach(function (event) {
    if (!event || typeof event !== "object" || event.kind !== "resolve"
        || typeof event.name !== "string" || event.name === "") {
      throw errorWith("E_BAD_EVENT", "事件不合法：" + JSON.stringify(event));
    }
  });
}

// 一轮展开：账上结转的名字优先，随后处理本轮事件；受整批共用预算限制。
// 已处理过的名字不再解析；预算用尽后没解析的名字压在 ledger 上带出下一轮。
export function step(spec) {
  validateEvents(spec.events);
  const defs = spec.defs || {};
  const state = cloneState(spec.state);
  let budget = Number(spec.budget);
  if (!Number.isFinite(budget)) {
    budget = 0;
  }

  const waiting = [];
  state.ledger.forEach(function (name) {
    if (!has(state.applied, name) && !has(waiting, name)) {
      waiting.push(name);
    }
  });
  (spec.events || []).forEach(function (event) {
    const name = event.name;
    if (!has(state.applied, name) && !has(waiting, name)) {
      waiting.push(name);
    }
  });

  const carry = [];
  let judged = 0;
  waiting.forEach(function (name) {
    judged += 1;
    if (budget <= 0) {
      carry.push(name);
      return;
    }
    state.resolved[name] = expand(name, defs, []);
    state.applied.push(name);
    budget -= 1;
  });
  state.ledger = carry;

  return {
    state: state,
    resolved: judged - carry.length,
    ledger_before: carry.length,
    ledger: carry.slice(),
    judged: judged,
    judged_bound: (spec.events || []).length
  };
}

// 收尾：不限预算，把账上剩余名字全部解析完，返回补齐个数。
export function close(spec) {
  const defs = spec.defs || {};
  const state = cloneState(spec.state);
  let catchup = 0;

  state.ledger.slice().forEach(function (name) {
    if (has(state.applied, name)) {
      return;
    }
    state.resolved[name] = expand(name, defs, []);
    state.applied.push(name);
    catchup += 1;
  });
  state.ledger = [];

  return { state: state, catchup: catchup };
}
