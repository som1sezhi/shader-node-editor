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
import { ShaderNode, ShaderNodeData } from "./types";
import {
  DEFAULT_FRAGMENT_SHADER,
  DEFAULT_VERTEX_SHADER,
} from "./defaultShaders";
import { compileShader, createUniformVariableName } from "./compileShader";

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
      set({ edges: applyEdgeChanges(changes, get().edges) });
      if (
        changes.some(
          ({ type }) =>
            type === "add" || type === "remove" || type === "replace"
        )
      ) {
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
      });
      outputs.map((output) => {
        if (output.type !== "dynamicVec")
          data.outputTypes[output.id] = output.type;
      });
      set({
        nodes: [...get().nodes, { id, position, data, type: "ShaderNode" }],
      });
      if (nodeType == OUTPUT_NODE_TYPE) get().actions.compile();
    },

    deleteEdge: (id) => {
      set((state) => ({
        edges: state.edges.filter((e) => e.id !== id),
      }));
      get().actions.compile();
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
