import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Edge,
  Node,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
  OnReconnect,
  reconnectEdge,
} from "@xyflow/react";
import { create } from "zustand";
import { useShallow } from "zustand/shallow";

const DEFAULT_VERTEX_SHADER = /* glsl */ `
void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
}`;

const DEFAULT_FRAGMENT_SHADER = /* glsl */ `
void main() {
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}`;

interface AppState {
  nodes: Node[];
  edges: Edge[];
  vertShader: string;
  fragShader: string;
  actions: {
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onReconnect: OnReconnect;
    deleteEdge: (id: string) => void;
  };
}

// NOTE: this zustand store should only be used from within
// client components.
const useStore = create<AppState>((set, get) => ({
  nodes: [
    {
      id: "node-1",
      type: "ColorNode",
      position: { x: -100, y: 0 },
      data: { color: [1, 0, 1] },
    },
    {
      id: "node-1b",
      type: "ColorNode",
      position: { x: -100, y: 100 },
      data: { color: [1, 0, 1] },
    },
    {
      id: "node-2",
      type: "OutputNode",
      position: { x: 100, y: 0 },
      data: {},
    },
    {
      id: "node-3",
      type: "MixNode",
      position: { x: 0, y: 0 },
      data: { color: [0, 0, 0] },
    },
  ],
  edges: [],
  vertShader: DEFAULT_VERTEX_SHADER,
  fragShader: DEFAULT_FRAGMENT_SHADER,
  actions: {
    onNodesChange: (changes) => {
      set({ nodes: applyNodeChanges(changes, get().nodes) });
    },

    onEdgesChange: (changes) => {
      set({ edges: applyEdgeChanges(changes, get().edges) });
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
    },

    deleteEdge: (id) => {
      set((state) => ({
        edges: state.edges.filter((e) => e.id !== id),
      }));
    },
  },
}));

export const useNodeStore = () => useStore((state) => state.nodes);
export const useEdgeStore = () => useStore((state) => state.edges);
export const useShaderSources = () =>
  useStore(useShallow((state) => [state.vertShader, state.fragShader]));
export const useStoreActions = () => useStore((state) => state.actions);
