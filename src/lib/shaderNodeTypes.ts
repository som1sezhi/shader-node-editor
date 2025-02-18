import { ShaderNodeTypeInstance, typeCheckShaderNode } from "@/lib/types";
import { inputTypes } from "@/components/nodes/inputComponents";

const varyings = {
  NORMAL: "varying vec3 v_normal;",
  UV: "varying vec2 v_uv;",
};

export const OUTPUT_NODE_TYPE = "fragmentOutput";

export type ShaderNodeTypes = Record<string, ShaderNodeTypeInstance>;

export const inputNodeTypes: ShaderNodeTypes = {
  value: typeCheckShaderNode({
    name: "Value",
    inputs: [
      { id: "value", type: inputTypes.FLOAT_OUTPUT_CONTROL, label: "Value" },
    ] as const,
    outputs: [{ id: "out", type: "float", label: "Value" }] as const,

    emitCode({ vars }) {
      return {
        assignment: /* glsl */ `${vars.out} = ${vars.value};`,
      };
    },
  }),

  vec2: typeCheckShaderNode({
    name: "Vec2",
    inputs: [
      { id: "value", type: inputTypes.VEC2_OUTPUT_CONTROL, label: "Value" },
    ] as const,
    outputs: [{ id: "out", type: "vec2", label: "Value" }] as const,

    emitCode({ vars }) {
      return {
        assignment: /* glsl */ `${vars.out} = ${vars.value};`,
      };
    },
  }),

  vec3: typeCheckShaderNode({
    name: "Vec3",
    inputs: [
      { id: "value", type: inputTypes.VEC3_OUTPUT_CONTROL, label: "Value" },
    ] as const,
    outputs: [{ id: "out", type: "vec3", label: "Value" }] as const,

    emitCode({ vars }) {
      return {
        assignment: /* glsl */ `${vars.out} = ${vars.value};`,
      };
    },
  }),

  normal: typeCheckShaderNode({
    name: "Normal",
    inputs: [] as const,
    outputs: [{ id: "out", type: "vec3", label: "Normal" }] as const,

    emitCode({ vars }) {
      return {
        requiredVaryings: [varyings.NORMAL],
        assignment: /* glsl */ `${vars.out} = normalize(v_normal);`,
      };
    },
  }),

  uv: typeCheckShaderNode({
    name: "UV",
    inputs: [] as const,
    outputs: [{ id: "out", type: "vec2", label: "UV" }] as const,

    emitCode({ vars }) {
      return {
        requiredVaryings: [varyings.UV],
        assignment: /* glsl */ `${vars.out} = v_uv;`,
      };
    },
  }),

  color: typeCheckShaderNode({
    name: "Color",
    inputs: [
      { id: "color", type: inputTypes.COLOR_OUTPUT_CONTROL, label: "Color" },
    ] as const,
    outputs: [{ id: "out", type: "vec3", label: "Color" }] as const,

    emitCode({ vars }) {
      return {
        assignment: /* glsl */ `${vars.out} = ${vars.color};`,
      };
    },
  }),
};

export const outputNodeTypes: ShaderNodeTypes = {
  fragmentOutput: typeCheckShaderNode({
    name: "Fragment Output",
    inputs: [{ id: "color", type: inputTypes.COLOR, label: "Color" }] as const,
    outputs: [] as const,

    emitCode({ vars }) {
      return {
        assignment: /* glsl */ `gl_FragColor = vec4(${vars.color}, 1.0);`,
      };
    },
  }),
};

export const mathNodeTypes: ShaderNodeTypes = {
  split: typeCheckShaderNode({
    name: "Split Components",
    inputs: [
      { id: "input", type: inputTypes.DYNAMIC, label: "Vector" },
    ] as const,
    outputs: [
      { id: "x", type: "float", label: "X" },
      { id: "y", type: "float", label: "Y" },
      { id: "z", type: "float", label: "Z" },
      { id: "w", type: "float", label: "W" },
    ] as const,
    emitCode({ nodeData, vars }) {
      switch (nodeData.concreteTypes!.dynamic) {
        case "float":
          return {
            assignment: /* glsl */ `${vars.x} = ${vars.input};
  ${vars.y} = 0.0;
  ${vars.z} = 0.0;
  ${vars.w} = 0.0;`,
          };
        case "vec2":
          return {
            assignment: /* glsl */ `${vars.x} = ${vars.input}.x;
  ${vars.y} = ${vars.input}.y;
  ${vars.z} = 0.0;
  ${vars.w} = 0.0;`,
          };
        case "vec3":
          return {
            assignment: /* glsl */ `${vars.x} = ${vars.input}.x;
  ${vars.y} = ${vars.input}.y;
  ${vars.z} = ${vars.input}.z;
  ${vars.w} = 0.0;`,
          };
        default:
          const exhaustiveCheck: never = nodeData.concreteTypes!.dynamic;
          throw new Error(`Unhandled type ${exhaustiveCheck}`);
      }
    },
  }),

  combine: typeCheckShaderNode({
    name: "Combine Components",
    inputs: [
      { id: "x", type: inputTypes.FLOAT, label: "X" },
      { id: "y", type: inputTypes.FLOAT, label: "Y" },
      { id: "z", type: inputTypes.FLOAT, label: "Z" },
      { id: "w", type: inputTypes.FLOAT, label: "W" },
    ] as const,
    outputs: [
      { id: "xy", type: "vec2", label: "XY" },
      { id: "xyz", type: "vec3", label: "XYZ" },
    ] as const,
    emitCode({ vars }) {
      return {
        assignment: /* glsl */ `${vars.xy} = vec2(${vars.x}, ${vars.y});
  ${vars.xyz} = vec3(${vars.x}, ${vars.y}, ${vars.z});`,
      };
    },
  }),

  mix: typeCheckShaderNode({
    name: "Mix",
    inputs: [
      { id: "fac", type: inputTypes.FLOAT, label: "Factor" },
      { id: "in1", type: inputTypes.COLOR, label: "Color 1" },
      { id: "in2", type: inputTypes.COLOR, label: "Color 2" },
    ] as const,
    outputs: [{ id: "out", type: "vec3", label: "Output" }] as const,

    emitCode() {
      return {
        fnSource: /* glsl */ `
void node_mix(float fac, vec3 a, vec3 b, out vec3 o) {
  o = a + (b - a) * fac;
}`,
      };
    },
  }),

  binaryFunc: typeCheckShaderNode({
    name: "Math",
    inputs: [
      { id: "op", type: inputTypes.MATH_OP, label: "" },
      { id: "a", type: inputTypes.DYNAMIC, label: "A" },
      { id: "b", type: inputTypes.DYNAMIC, label: "B" },
    ] as const,
    outputs: [{ id: "out", type: "dynamic", label: "Out" }] as const,

    emitCode({ nodeData, vars }) {
      const opExp = (op: string) => ({
        assignment: /* glsl */ `${vars.out} = ${vars.a} ${op} ${vars.b};`,
      });
      const compareExp = (func: string) => ({
        assignment: /* glsl */ `${vars.out} = ${
          nodeData.concreteTypes!.dynamic
        }(${func}(${vars.a}, ${vars.b}));`,
      });
      const assignExp = (expr: string) => ({
        assignment: /* glsl */ `${vars.out} = ${expr};`,
      });
      switch (nodeData.inputValues.op) {
        case "add":
          return opExp("+");
        case "sub":
          return opExp("-");
        case "mul":
          return opExp("*");
        case "div":
          return opExp("/");
        case "pow":
          return assignExp(`pow(${vars.a}, ${vars.b})`);
        case "log":
          return assignExp(`log(${vars.a}) / log(${vars.b})`);
        case "lt":
          return compareExp("lessThan");
        case "leq":
          return compareExp("lessThanEqual");
        case "gt":
          return compareExp("greaterThan");
        case "geq":
          return compareExp("greaterThanEqual");
        default:
          const exhaustiveCheck: never = nodeData.inputValues.op;
          throw new Error(`Unhandled operation ${exhaustiveCheck}`);
      }
    },
  }),
};

export const shaderNodeTypes: ShaderNodeTypes = {
  ...inputNodeTypes,
  ...outputNodeTypes,
  ...mathNodeTypes,
};
