import { ShaderNodeTypeInstance, typeCheckShaderNode } from "@/lib/types";
import { inputTypes } from "@/components/nodes/inputComponents";

const varyings = {
  NORMAL: "varying vec3 v_normal;"
};

export const OUTPUT_NODE_TYPE = "fragmentOutput";

export const shaderNodeTypes: Record<string, ShaderNodeTypeInstance> = {
  normal: typeCheckShaderNode({
    name: "Normal",
    inputs: [] as const,
    outputs: [{ id: "out", type: "vec3", label: "Normal"}] as const,

    emitCode({ vars }) {
      return {
        requiredVaryings: [varyings.NORMAL],
        assignment: /* glsl */`${vars.out} = normalize(v_normal);`
      }
    }
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
