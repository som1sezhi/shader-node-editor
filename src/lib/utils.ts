import { Connection, Edge } from "@xyflow/react";
import { ShaderNode, Vec3 } from "./types";
import { shaderNodeTypes } from "./shaderNodeTypes";

function clamp(x: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, x));
}

export function hex2rgb(color: string): Vec3 {
  return [
    parseInt(color.substring(1, 3), 16) / 255,
    parseInt(color.substring(3, 5), 16) / 255,
    parseInt(color.substring(5, 7), 16) / 255,
  ];
}

function component2hex(component: number) {
  const c = Math.round(clamp(component, 0, 1) * 255).toString(16);
  return c.length == 1 ? "0" + c : c;
}

export function rgb2hex(col: Vec3) {
  return (
    "#" + component2hex(col[0]) + component2hex(col[1]) + component2hex(col[2])
  );
}

export function getSourceAndTargetDataTypes(
  source: ShaderNode,
  target: ShaderNode,
  edge: Edge | Connection
): [string, string | null] {
  const sourceDataType = source.data.outputTypes[edge.sourceHandle!];
  const inpControlType = shaderNodeTypes[target.data.nodeType].inputs.find(
    (inp) => inp.id === edge.targetHandle
  )!.type;
  const targetDataType =
    "glslDataType" in inpControlType ? inpControlType.glslDataType : null;
  return [sourceDataType, targetDataType];
}
