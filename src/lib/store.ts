import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Edge,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  OnReconnect,
  reconnectEdge,
} from "@xyflow/react";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import { customAlphabet } from "nanoid";
import { OUTPUT_NODE_TYPE, shaderNodeTypes } from "./shaderNodeTypes";
import {
  DynamicInputPortType,
  GLSLDataType,
  ShaderNode,
  ShaderNodeData,
} from "./types";
import {
  DEFAULT_FRAGMENT_SHADER,
  DEFAULT_VERTEX_SHADER,
} from "./defaultShaders";
import { compileShader, createUniformVariableName } from "./compileShader";
import { strict as assert } from "assert";

const nanoid = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  10
);

interface AppState {
  nodes: ShaderNode[];
  edges: Edge[];
  vertShader: string;
  fragShader: string;
  uniformsToWatch: Record<string, { value: unknown }>;
  actions: {
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onReconnect: OnReconnect;
    addNode: (type: keyof typeof shaderNodeTypes) => void;
    deleteEdge: (id: string) => void;
    updateInputData: (nodeId: string, portId: string, newVal: unknown) => void;
    compile: () => void;
  };
}

function glslTypeToInitValue(glslDataType: GLSLDataType) {
  switch (glslDataType) {
    case "float":
      return 0;
    case "vec2":
      return [0, 0];
    case "vec3":
      return [0, 0, 0];
    default:
      assert(false);
  }
}

function updateDynamicTypes(
  nodes: ShaderNode[],
  edges: Edge[],
  targetIds: string[]
): ShaderNode[] {
  const newNodes = [...nodes];
  const nodeLookup = new Map<string, ShaderNode>();
  const nodeIdx = new Map<string, number>();
  const incomingEdges = new Map<string, Edge[]>();
  const outgoingNeighbors = new Map<string, Set<string>>();
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    nodeLookup.set(node.id, node);
    nodeIdx.set(node.id, i);
    incomingEdges.set(node.id, []);
    outgoingNeighbors.set(node.id, new Set());
  }
  for (const edge of edges) {
    incomingEdges.get(edge.target)!.push(edge);
    outgoingNeighbors.get(edge.source)!.add(edge.target);
  }

  const stack = targetIds;
  let node;

  function updateNode(nodeId: string, newNode: ShaderNode) {
    newNodes[nodeIdx.get(nodeId)!] = newNode;
    nodeLookup.set(nodeId, newNode)
    node = newNode;
  }

  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    node = nodeLookup.get(nodeId);
    if (node === undefined) continue;
    console.log("updating", nodeId);
    const shaderNodeType = shaderNodeTypes[node.data.nodeType];
    // check if there are even any dynamic ports on this node
    if (shaderNodeType.inputs.every((inp) => inp.type.kind !== "dynamicPort"))
      continue;

    const idToInputType = new Map<string, DynamicInputPortType<unknown>>();
    const inputTypeToConnectedTypes = new Map<
      DynamicInputPortType<unknown>,
      GLSLDataType[]
    >();
    // initialization
    for (const input of shaderNodeType.inputs) {
      if (input.type.kind === "dynamicPort") {
        idToInputType.set(input.id, input.type);
        inputTypeToConnectedTypes.set(input.type, []);
      }
    }
    // for each connection to dynamic input ports, get the source output type
    // and collect it under the corresponding entry in inputTypeToConnectedTypes
    const incomingConns = incomingEdges.get(nodeId)!;
    for (const conn of incomingConns) {
      const inputType = idToInputType.get(conn.targetHandle!);
      if (inputType !== undefined) {
        const source = nodeLookup.get(conn.source)!;
        const sourceOutputType = source.data.outputTypes[conn.sourceHandle!];
        inputTypeToConnectedTypes.get(inputType)!.push(sourceOutputType);
      }
    }
    console.log(incomingConns);
    // determine the concrete type for each dynamic input port type
    const newConcreteTypes: Record<string, GLSLDataType> = {};
    for (const [
      inputType,
      connectedTypes,
    ] of inputTypeToConnectedTypes.entries()) {
      newConcreteTypes[inputType.key] =
        inputType.decideConcreteType(connectedTypes);
    }
    // update input control values based on updated concrete types
    for (const inp of shaderNodeType.inputs) {
      if (inp.type.kind === "dynamicPort") {
        const concreteType = newConcreteTypes[inp.type.key];
        assert(concreteType !== undefined);
        assert(node.data.concreteTypes?.[inp.type.key] !== undefined);
        if (node.data.concreteTypes[inp.type.key] !== concreteType) {
          const newNode: ShaderNode = {
            ...node,
            data: {
              ...node.data,
              inputValues: {
                ...node.data.inputValues,
                [inp.id]: glslTypeToInitValue(concreteType),
              },
            },
          };
          updateNode(node.id, newNode);
        }
      }
    }
    // update concrete types
    // note: concreteTypes cannot be undefined here since this node must contain
    // dynamic input ports
    const newNode: ShaderNode = {
      ...node,
      data: {
        ...node.data,
        concreteTypes: newConcreteTypes,
      },
    };
    updateNode(node.id, newNode);
    // update output types
    let needsChange = false;
    const newOutputTypes = { ...node.data.outputTypes };
    for (const output of shaderNodeType.outputs) {
      if (
        output.type === "dynamic" &&
        newConcreteTypes.dynamic !== node.data.outputTypes[output.id]
      ) {
        needsChange = true;
        newOutputTypes[output.id] = newConcreteTypes.dynamic;
      }
    }
    if (needsChange) {
      const newNode: ShaderNode = {
        ...node,
        data: {
          ...node.data,
          outputTypes: newOutputTypes,
        },
      };
      updateNode(node.id, newNode);
      // we changed our output type; let other dynamic ports down
      // the node graph know about this
      const outgoingNeighs = outgoingNeighbors.get(nodeId)!;
      for (const neigh of outgoingNeighs) stack.push(neigh);
      // TODO: remove edges that become incompatible with the new
      // output type (will that ever be possible?)
    }
    console.log("update end", newConcreteTypes);
  }

  return newNodes;
}

// NOTE: this zustand store should only be used from within
// client components.
const useStore = create<AppState>()((set, get) => ({
  nodes: [],
  edges: [],
  vertShader: DEFAULT_VERTEX_SHADER,
  fragShader: DEFAULT_FRAGMENT_SHADER,
  uniformsToWatch: {},
  actions: {
    onNodesChange: (changes) => {
      set({ nodes: applyNodeChanges(changes, get().nodes) as ShaderNode[] });
      // auto compile
      if (
        changes.some(
          ({ type }) =>
            type === "add" || type === "remove" || type === "replace"
        )
      ) {
        get().actions.compile();
      }
    },

    onEdgesChange: (changes) => {
      const edgeChangesToCareAbout = changes.filter(({ type }) =>
        ["add", "remove", "replace"].includes(type)
      );
      const targets = edgeChangesToCareAbout.map((change) => {
        switch (change.type) {
          case "add":
            return change.item.target;
          case "remove":
            const edge = get().edges.find((ed) => ed.id === change.id);
            assert(edge !== undefined);
            return edge.target;
          case "replace":
            return change.item.target;
          default:
            assert(false);
        }
      });
      set({ edges: applyEdgeChanges(changes, get().edges) });
      set((state) => ({
        nodes: updateDynamicTypes(state.nodes, state.edges, [
          ...new Set(targets),
        ]),
      }));

      if (edgeChangesToCareAbout.length > 0) {
        get().actions.compile();
      }
    },

    onConnect: (connection) => {
      // delete edges currently connected to the target handle
      // (ensures that each input may only have 1 edge connected at a time)
      const edges = get().edges.filter(
        (e) =>
          e.target !== connection.target ||
          e.targetHandle !== connection.targetHandle
      );
      set({ edges: addEdge(connection, edges) });
      set((state) => ({
        nodes: updateDynamicTypes(state.nodes, state.edges, [
          connection.target,
        ]),
      }));
      get().actions.compile();
    },

    onReconnect: (oldEdge, newConnection) => {
      // delete edges currently connected to the target handle
      // (ensures that each input may only have 1 edge connected at a time)
      const edges = get().edges.filter(
        (e) =>
          e.target !== newConnection.target ||
          e.targetHandle !== newConnection.targetHandle
      );
      set({ edges: reconnectEdge(oldEdge, newConnection, edges) });
      set((state) => ({
        nodes: updateDynamicTypes(state.nodes, state.edges, [
          oldEdge.target,
          newConnection.target,
        ]),
      }));
      get().actions.compile();
    },

    addNode: (nodeType) => {
      const id = `${nodeType}_${nanoid()}`;
      const position = { x: 0, y: 0 };
      const { inputs, outputs } = shaderNodeTypes[nodeType];
      const data: ShaderNodeData = {
        nodeType,
        inputValues: {},
        outputTypes: {},
      };
      inputs.map((input) => {
        data.inputValues[input.id] = input.type.defaultValue;
        if (input.type.kind === "dynamicPort") {
          if (!data.concreteTypes) data.concreteTypes = {};
          data.concreteTypes[input.type.key] = input.type.defaultConcreteType;
        }
      });
      outputs.map((output) => {
        // at the start, dynamic outputs are of type float
        data.outputTypes[output.id] =
          output.type === "dynamic" ? "float" : output.type;
      });
      set({
        nodes: [...get().nodes, { id, position, data, type: "ShaderNode" }],
      });
      if (nodeType == OUTPUT_NODE_TYPE) get().actions.compile();
    },

    deleteEdge: (id) => {
      const edge = get().edges.find((e) => e.id == id);
      if (edge) {
        set((state) => ({
          edges: state.edges.filter((e) => e.id !== id),
        }));
        set((state) => ({
          nodes: updateDynamicTypes(state.nodes, state.edges, [edge.target]),
        }));
        get().actions.compile();
      }
    },

    updateInputData: (nodeId, portId, newVal) => {
      set({
        nodes: get().nodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                inputValues: {
                  ...node.data.inputValues,
                  [portId]: newVal,
                },
              },
            };
          }
          return node;
        }),
      });
      const uniformName = createUniformVariableName(nodeId, portId);
      const oldUniformsToWatch = get().uniformsToWatch;
      if (oldUniformsToWatch[uniformName] !== undefined) {
        set({
          uniformsToWatch: {
            ...oldUniformsToWatch,
            [uniformName]: { value: newVal },
          },
        });
      }
    },

    compile: () => {
      const { nodes, edges } = get();
      const { fragShader, uniformsToWatch } = compileShader(
        nodes as ShaderNode[],
        edges
      );
      console.log(uniformsToWatch);
      set({ fragShader, uniformsToWatch });
    },
  },
}));

export const useNodeStore = () => useStore((state) => state.nodes);
export const useEdgeStore = () => useStore((state) => state.edges);
export const useShader = () =>
  useStore(
    useShallow((state) => ({
      vertShader: state.vertShader,
      fragShader: state.fragShader,
      uniformsToWatch: state.uniformsToWatch,
    }))
  );
export const useStoreActions = () => useStore((state) => state.actions);
