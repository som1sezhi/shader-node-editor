import { Edge } from "@xyflow/react";
import { ShaderNode } from "@/lib/types";
import {
  DEFAULT_FRAGMENT_SHADER,
  DEFAULT_VERTEX_SHADER,
} from "./defaultShaders";
import { OUTPUT_NODE_TYPE, shaderNodeTypes } from "./shaderNodeTypes";
import { getSourceAndTargetDataTypes } from "./utils";
import { convertExprType } from "./shaderTypeConversions";
import { strict as assert } from "assert";

export function createUniformVariableName(
  nodeId: string,
  portId: string
): string {
  return `u_${nodeId}_${portId}`;
}

function createOutputVariableName(
  nodeId: string,
  outputPortId: string
): string {
  return `${nodeId}_${outputPortId}`;
}

function extractFuncName(fnSource: string): string {
  const re = /^\s*void (\w+)\(/;
  return fnSource.match(re)![1];
}

// function getGLSLTypeFromJSValue(value: number | Vec2 | Vec3) {
//   if (typeof value === "number")
//     return "float";
//   if (value.length === 2)
//     return "vec2";
//   return "vec3";
// }

export function compileShader(
  nodes: ShaderNode[],
  edges: Edge[]
): {
  vertShader: string;
  fragShader: string;
  origFragShader: string;
  uniformsToWatch: Record<string, { value: unknown }>;
} {
  const nodeLookup = new Map<string, ShaderNode>();
  const incomingEdges = new Map<string, Record<string, Edge>>();
  const outgoingNeighbors = new Map<string, Set<string>>();

  let outputNode: ShaderNode | null = null;
  for (const node of nodes) {
    nodeLookup.set(node.id, node);
    incomingEdges.set(node.id, {});
    outgoingNeighbors.set(node.id, new Set());
    if (node.data.nodeType === OUTPUT_NODE_TYPE) outputNode = node;
  }

  if (outputNode === null)
    return {
      vertShader: DEFAULT_VERTEX_SHADER,
      fragShader: DEFAULT_FRAGMENT_SHADER,
      origFragShader: DEFAULT_FRAGMENT_SHADER,
      uniformsToWatch: {},
    };

  for (const edge of edges) {
    incomingEdges.get(edge.target)![edge.targetHandle!] = edge;
    outgoingNeighbors.get(edge.source)!.add(edge.target);
  }

  // do a DFS floodfill from the end node to figure out which nodes
  // we actually have to process
  const stack = [outputNode.id];
  const willProcess = new Set<string>();
  willProcess.add(outputNode.id);
  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    for (const [, edge] of Object.entries(incomingEdges.get(nodeId)!)) {
      const predId = edge.source;
      if (!willProcess.has(predId)) {
        willProcess.add(predId);
        stack.push(predId);
      }
    }
  }

  // do a topological sort using DFS
  const unvisited = willProcess;
  const visitOrder: string[] = []; // will contain the sort in reverse order

  function visit(nodeId: string) {
    for (const neigh of outgoingNeighbors.get(nodeId)!.values()) {
      if (unvisited.has(neigh)) {
        visit(neigh);
      }
    }
    unvisited.delete(nodeId);
    visitOrder.push(nodeId);
  }

  while (unvisited.size > 0) {
    const start = unvisited.values().next().value!;
    visit(start);
  }

  const varyingDeclarations = new Set<string>();
  const uniformsToWatch: Record<string, { value: unknown }> = {};
  let uniformDeclarations = "";
  const funcDefinitions = new Map<string, string>();
  let mainBody = "";

  // Visit nodes in topological sort order
  for (let i = visitOrder.length - 1; i >= 0; i--) {
    const nodeId = visitOrder[i];
    const { data: nodeData } = nodeLookup.get(nodeId)!;
    const nodeType = shaderNodeTypes[nodeData.nodeType];
    const edges = incomingEdges.get(nodeId)!;

    const vars: Record<string, string> = {};
    const callArgs: string[] = [];

    for (const input of nodeType.inputs) {
      if (input.type.kind === "control")
        continue;

      const edge = edges[input.id];
      if (edge === undefined) {
        // No edge is plugged into this input port, or this is an
        // output control w/ no input port. Either way,
        // take value from input control (uniform variable).
        let uniformVarType;
        if (input.type.kind === "dynamicPort") {
          // uniformVarType = getGLSLTypeFromJSValue(nodeData.inputValues[input.id]);
          assert(nodeData.concreteTypes !== undefined)
          uniformVarType = nodeData.concreteTypes[input.type.key];
        } else
          uniformVarType = input.type.glslDataType;
        const uniformVarName = createUniformVariableName(nodeId, input.id);
        vars[input.id] = uniformVarName;
        callArgs.push(uniformVarName);
        uniformDeclarations += `uniform ${uniformVarType} ${uniformVarName};\n`;
        uniformsToWatch[uniformVarName] = {
          value: nodeData.inputValues[input.id],
        };
      } else {
        // An edge is connected, take value from output variable
        let outputVarName = createOutputVariableName(
          edge.source,
          edge.sourceHandle!
        );
        const [sourceType, targetType] = getSourceAndTargetDataTypes(
          nodeLookup.get(edge.source)!,
          nodeLookup.get(edge.target)!,
          edge
        );
        let targetGLSLType;
        if (targetType === "dynamic") {
          assert(nodeData.concreteTypes !== undefined);
          targetGLSLType = nodeData.concreteTypes[targetType];
        } else {
          targetGLSLType = targetType!;
        }
        outputVarName = convertExprType(outputVarName, sourceType, targetGLSLType);
        vars[input.id] = outputVarName;
        callArgs.push(outputVarName);
      }
    }
    for (const output of nodeType.outputs) {
      const outputVarType = nodeData.outputTypes[output.id];
      const outputVarName = createOutputVariableName(nodeId, output.id);
      vars[output.id] = outputVarName;
      callArgs.push(outputVarName);
      mainBody += `  ${outputVarType} ${outputVarName};\n`;
    }

    const emitted = nodeType.emitCode({ nodeData, vars });
    if ("fnSource" in emitted) {
      const fnName = extractFuncName(emitted.fnSource);
      funcDefinitions.set(fnName, emitted.fnSource);
      let fnCall = emitted.fnCall;
      if (fnCall === undefined) {
        fnCall = `${fnName}(${callArgs.join(", ")});`;
      }
      mainBody += "  " + fnCall + "\n";
    } else {
      mainBody += "  " + emitted.assignment + "\n";
    }
    if (emitted.requiredVaryings) {
      for (const varyingDecl of emitted.requiredVaryings)
        varyingDeclarations.add(varyingDecl);
    }
  }

  const fragShader = `${Array.from(varyingDeclarations).join("\n")}
${uniformDeclarations}
${Array.from(funcDefinitions.values()).join("\n")}
void main() {
${mainBody}}`;

  // Optimize code using globally-loaded function.
  // Will return null if function is not loaded yet
  const optFragShader = window.optimize_glsl(fragShader, 1, false);

  // console.log(optFragShader);
  // console.log(fragShader);

  // The optimizer seems to have a habit of breaking for no reason,
  // so we safeguard against this case.
  // Character set retrieved from:
  // https://www.opengl.org/sdk/docs/tutorials/TyphoonLabs/Chapter_2.pdf
  let fragShaderToUse;
  if (
    optFragShader === null ||
    !/^[-0-9A-Za-z_.+*/%<>\[\]{}()^|&~=!:;,?# \t\v\r\n\f]+$/.test(optFragShader)
  ) {
    console.warn(`Malformed optimized code found, falling back on unoptimized code.
========== Original code: ==========
${fragShader}

========== Optimized code: ==========
${optFragShader}`);
    fragShaderToUse = fragShader;
  } else {
    fragShaderToUse = optFragShader;
  }

  return {
    vertShader: DEFAULT_VERTEX_SHADER,
    fragShader: fragShaderToUse,
    origFragShader: fragShader,
    uniformsToWatch,
  };
}

function numberToGLSL(x: number) {
  if (!Number.isFinite(x))
    return "0.";
  const str = x.toString();
  return str.includes(".") ? str : str + ".";
}

export function jsValueToGLSL(jsValue: unknown) {
  if (typeof jsValue === "number") {
    return numberToGLSL(jsValue);
  } else if (Array.isArray(jsValue)) {
    assert(2 <= jsValue.length && jsValue.length <= 4);
    const list = jsValue.map(numberToGLSL).join(", ");
    return `vec${jsValue.length}(${list})`;
  }
  throw new Error(`${jsValue} cannot be converted to GLSL`);
}