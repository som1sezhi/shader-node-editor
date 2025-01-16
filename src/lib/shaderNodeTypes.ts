import { ShaderNodeTypeInstance, typeCheckShaderNode } from "@/lib/types";
import { inputTypes } from "@/components/nodes/inputComponents";

export const OUTPUT_NODE_TYPE = "fragmentOutput";

export const shaderNodeTypes: Record<string, ShaderNodeTypeInstance> = {
  color: typeCheckShaderNode({
    name: "Color",
    inputs: [
      { id: "color", type: inputTypes.COLOR_OUTPUT_CONTROL, label: "Color" },
    ] as const,
    outputs: [{ id: "out", type: "vec3", label: "Color" }] as const,

    emitCode({ vars }) {
      return {
        fnCall: /* glsl */ `${vars.out} = ${vars.color};`,
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

    emitCode({ vars }) {
      return {
        fnSource: /* glsl */ `
void node_mix(vec3 a, vec3 b, out vec3 o) {
  o = (a + b) * 0.5;
}`,
        fnCall: /* glsl */ `node_mix(${vars.in1}, ${vars.in2}, ${vars.out});`,
      };
    },
  }),

  fragmentOutput: typeCheckShaderNode({
    name: "Fragment Output",
    inputs: [{ id: "color", type: inputTypes.COLOR, label: "Color" }] as const,
    outputs: [] as const,

    emitCode({ vars }) {
      return {
        fnCall: /* glsl */ `gl_FragColor = vec4(${vars.color}, 1.0);`,
      };
    },
  }),
};
