// A small JSON Schema subset, enough to check tool arguments against the same schemas tools/list publishes, so the
// published contract and the check cannot drift apart. Supported keywords: type, enum, minimum, maximum, minLength,
// maxLength, pattern, properties, required, additionalProperties (false or a schema), propertyNames, minProperties,
// maxProperties. Anything else in a schema is documentation only.
"use strict";

const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

function matchesType(v, t) {
  if (t === "integer") return Number.isInteger(v);
  if (t === "number") return typeof v === "number" && Number.isFinite(v);
  if (t === "object") return isObj(v);
  if (t === "array") return Array.isArray(v);
  if (t === "null") return v === null;
  return typeof v === t;
}

function describe(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "an array";
  if (typeof v === "string") return "the string " + JSON.stringify(v.length > 40 ? v.slice(0, 40) + "..." : v);
  if (typeof v === "number") return "the number " + v;
  return "a " + typeof v;
}

function listOf(values) {
  const shown = values.slice(0, 40).map((x) => JSON.stringify(x)).join(", ");
  return values.length > 40 ? shown + ", ..." : shown;
}

// validate(schema, value) -> array of messages, empty when the value is valid.
function validate(schema, value, at = "arguments", errs = []) {
  if (errs.length >= 20 || !isObj(schema)) return errs;
  if (schema.type) {
    const types = [].concat(schema.type);
    if (!types.some((t) => matchesType(value, t))) {
      errs.push(at + ": expected " + types.join(" or ") + ", got " + describe(value));
      return errs;
    }
  }
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    errs.push(at + ": " + JSON.stringify(value) + " is not one of " + listOf(schema.enum));
    return errs;
  }
  if (typeof value === "number") {
    if (schema.minimum != null && value < schema.minimum) errs.push(at + ": " + value + " is below the minimum " + schema.minimum);
    if (schema.maximum != null && value > schema.maximum) errs.push(at + ": " + value + " is above the maximum " + schema.maximum);
  }
  if (typeof value === "string") {
    const n = [...value].length;
    if (schema.minLength != null && n < schema.minLength) errs.push(at + ": shorter than " + schema.minLength + " characters");
    if (schema.maxLength != null && n > schema.maxLength) errs.push(at + ": longer than " + schema.maxLength + " characters");
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errs.push(at + ": " + describe(value) + " does not match " + schema.pattern);
  }
  if (isObj(value)) {
    const keys = Object.keys(value);
    if (schema.minProperties != null && keys.length < schema.minProperties) errs.push(at + ": needs at least " + schema.minProperties + " entr" + (schema.minProperties === 1 ? "y" : "ies"));
    if (schema.maxProperties != null && keys.length > schema.maxProperties) errs.push(at + ": at most " + schema.maxProperties + " entries");
    for (const r of schema.required || []) if (!hasOwn(value, r)) errs.push(at + "." + r + ": required");
    const props = isObj(schema.properties) ? schema.properties : null;
    for (const k of keys) {
      if (errs.length >= 20) break;
      const where = at + "[" + JSON.stringify(k) + "]";
      if (schema.propertyNames) validate(schema.propertyNames, k, at + " key " + JSON.stringify(k), errs);
      if (props && hasOwn(props, k)) validate(props[k], value[k], at + "." + k, errs);
      else if (schema.additionalProperties === false) errs.push(at + ": unknown property " + JSON.stringify(k) + (props ? " (allowed: " + (Object.keys(props).join(", ") || "none") + ")" : ""));
      else if (isObj(schema.additionalProperties)) validate(schema.additionalProperties, value[k], where, errs);
    }
  }
  return errs;
}

module.exports = { validate, isObj, hasOwn };
