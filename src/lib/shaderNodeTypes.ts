import { ShaderNodeTypeInstance, typeCheckShaderNode } from "@/lib/types";
import { inputTypes } from "@/components/nodes/inputComponents";

const varyings = {
  NORMAL: "varying vec3 v_normal;",
  UV: "varying vec2 v_uv;",
};

export const OUTPUT_NODE_TYPE = "fragmentOutput";

export const shaderNodeTypes: Record<string, ShaderNodeTypeInstance> = {
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

  mix: typeCheckShaderNode({
    name: "Mix",
    inputs: [
      { id: "in1", type: inputTypes.COLOR, label: "Color 1" },
      { id: "in2", type: inputTypes.COLOR, label: "Color 2" },
    ] as const,
    outputs: [{ id: "out", type: "vec3", label: "Output" }] as const,

    emitCode() {
      return {
        fnSource: /* glsl */ `
void node_mix(vec3 a, vec3 b, out vec3 o) {
  o = (a + b) * 0.5;
}`,
      };
    },
  }),

  math: typeCheckShaderNode({
    name: "Math",
    inputs: [
      { id: "op", type: inputTypes.MATH_OP, label: "" },
      { id: "a", type: inputTypes.DYNAMIC, label: "A" },
      { id: "b", type: inputTypes.DYNAMIC, label: "B" },
    ] as const,
    outputs: [{ id: "out", type: "dynamic", label: "Out" }] as const,

    emitCode({ nodeData, vars }) {
      const ops = {
        add: "+",
        sub: "-",
        mul: "*",
        div: "/",
      };
      return {
        assignment: /* glsl */ `${vars.out} = ${vars.a} ${
          ops[nodeData.inputValues.op]
        } ${vars.b};`,
      };
    },
  }),

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
