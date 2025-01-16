import { ShaderNodeTypeInstance, typeCheckShaderNode } from "@/lib/types";
import { inputTypes } from "@/components/nodes/inputComponents";

export const OUTPUT_NODE_TYPE = "fragmentOutput";

export const shaderNodeTypes: Record<string, ShaderNodeTypeInstance> = {
  color: typeCheckShaderNode({
    name: "Color",
    inputs: [
      { id: "color", type: inputTypes.COLOR_OUTPUT_CONTROL, label: "Color" },
    ] as const,
    outputs: [{ id: "output", type: "vec3", label: "Color" }] as const,

    emitCode({ vars }) {
      return {
        fnCall: /* glsl */ `${vars.output} = ${vars.color};`,
      };
    },
  }),

  mix: typeCheckShaderNode({
    name: "Mix",
    inputs: [
      { id: "color1", type: inputTypes.COLOR, label: "Color 1" },
      { id: "color2", type: inputTypes.COLOR, label: "Color 2" },
    ] as const,
    outputs: [{ id: "output", type: "vec3", label: "Output" }] as const,

    emitCode({ vars }) {
      return {
        fnSource: /* glsl */ `
          void node_mix(vec3 a, vec3 b, out vec3 o) {
				    o = (a + b) * 0.5;
			    }`,
        fnCall: /* glsl */ `node_mix(${vars.color1}, ${vars.color2}, ${vars.output});`,
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
