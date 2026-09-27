// varmap.js：引用提取与替换
const REF_PATTERN = /\$([A-Za-z_][A-Za-z0-9_]*)/g;

export function refsOf(text) {
  const refs = [];
  const seen = new Set();
  for (const match of String(text).matchAll(REF_PATTERN)) {
    if (!seen.has(match[1])) {
      seen.add(match[1]);
      refs.push(match[1]);
    }
  }
  return refs;
}

export function replaceRefs(text, table) {
  return String(text).replace(REF_PATTERN, function (whole, name) {
    return Object.prototype.hasOwnProperty.call(table, name) ? String(table[name]) : whole;
  });
}
