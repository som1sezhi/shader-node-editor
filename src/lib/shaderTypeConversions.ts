export const typeConversions: Record<string, (expr: string) => string> = {
  float_vec2: (expr) => `vec2(${expr})`,
  float_vec3: (expr) => `vec3(${expr})`,
  float_vec4: (expr) => `vec4(${expr})`,
  vec2_float: (expr) => `(${expr}).x`,
  vec2_vec3: (expr) => `vec3(${expr}, 0.0)`,
  vec2_vec4: (expr) => `vec4(${expr}, 0.0, 1.0)`,
  vec3_float: (expr) => `(${expr}).x`,
  vec3_vec2: (expr) => `(${expr}).xy`,
  vec3_vec4: (expr) => `vec4(${expr}, 1.0)`,
  vec4_float: (expr) => `(${expr}).x`,
  vec4_vec2: (expr) => `(${expr}).xy`,
  vec4_vec3: (expr) => `(${expr}).xyz`,
};

export function canConvert(type1: string, type2: string) {
  return type1 === type2 || type1 + "_" + type2 in typeConversions;
}

export function convertExprType(expr: string, type1: string, type2: string) {
  if (type1 === type2)
    return expr;
  return typeConversions[type1 + "_" + type2](expr);
}
