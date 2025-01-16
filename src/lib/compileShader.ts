import { Edge } from "@xyflow/react";
import { ShaderNode } from "@/lib/types";
import {
  DEFAULT_FRAGMENT_SHADER,
  DEFAULT_VERTEX_SHADER,
} from "./defaultShaders";
import { OUTPUT_NODE_TYPE, shaderNodeTypes } from "./shaderNodeTypes";

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
  return `o_${nodeId}_${outputPortId}`;
}

function extractFuncName(fnSource: string): string {
  const re = /^\s*void (\w+)\(/;
  return fnSource.match(re)![1];
}

export function compileShader(
  nodes: ShaderNode[],
  edges: Edge[]
): {
  vertShader: string;
  fragShader: string;
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

  const uniformsToWatch: Record<string, { value: unknown }> = {};
  let uniformDeclarations = "";
  const funcDefinitions: Record<string, string> = {};
  let mainBody = "";

  for (let i = visitOrder.length - 1; i >= 0; i--) {
    const nodeId = visitOrder[i];
    const { data: nodeData } = nodeLookup.get(nodeId)!;
    const nodeType = shaderNodeTypes[nodeData.nodeType];
    const edges = incomingEdges.get(nodeId)!;

    const vars: Record<string, string> = {};
    for (const input of nodeType.inputs) {
      if (input.type.kind != "port" && input.type.kind != "outputControl")
        continue;
      const edge = edges[input.id];
      if (edge === undefined) {
        // No edge is plugged into this input port, or this is an
        // output control w/ no input port. Either way,
        // take value from input control (uniform variable).
        const uniformVarType = input.type.glslDataType;
        const uniformVarName = createUniformVariableName(nodeId, input.id);
        vars[input.id] = uniformVarName;
        uniformDeclarations += `uniform ${uniformVarType} ${uniformVarName};\n`;
        uniformsToWatch[uniformVarName] = {
          value: nodeData.inputValues[input.id],
        };
      } else {
        // An edge is connected, take value from output variable
        vars[input.id] = createOutputVariableName(
          edge.source,
          edge.sourceHandle!
        );
      }
    }
    for (const output of nodeType.outputs) {
      const outputVarType = nodeData.outputTypes[output.id];
      const outputVarName = createOutputVariableName(nodeId, output.id);
      vars[output.id] = outputVarName;
      mainBody += outputVarType + " " + outputVarName + ";\n";
    }
    const { fnSource, fnCall } = nodeType.emitCode({ nodeData, vars });
    if (fnSource) {
      const fnName = extractFuncName(fnSource);
      funcDefinitions[fnName] = fnSource + "\n";
    }
    mainBody += fnCall + "\n";
  }

  let allFuncDefinitions = "";
  for (const func of Object.values(funcDefinitions)) allFuncDefinitions += func;
  return {
    vertShader: DEFAULT_VERTEX_SHADER,
    fragShader: `${uniformDeclarations}
    ${allFuncDefinitions}

    void main() {
      ${mainBody}
    }`,
    uniformsToWatch,
  };
}
