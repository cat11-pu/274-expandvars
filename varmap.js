// varmap.js：引用提取与替换（引用形如 $名字）
const REF_RE = /\$([A-Za-z_][A-Za-z0-9_]*)/g;

function toText(text) {
  return text == null ? "" : String(text);
}

// 返回文本里出现的引用名，按首次出现顺序去重。
export function refsOf(text) {
  const names = [];
  const seen = new Set();
  toText(text).replace(REF_RE, function (whole, name) {
    if (!seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
    return whole;
  });
  return names;
}

// 把文本里的引用按 table 做一层替换；表里没有的引用原样保留。
export function replaceRefs(text, table) {
  const values = table || {};
  return toText(text).replace(REF_RE, function (whole, name) {
    return Object.prototype.hasOwnProperty.call(values, name) ? values[name] : whole;
  });
}
