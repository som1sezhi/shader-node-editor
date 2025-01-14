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

type AppState = {
  nodes: Node[];
  edges: Edge[];
  actions: {
    onNodesChange: OnNodesChange;
    onEdgesChange: OnEdgesChange;
    onConnect: OnConnect;
    onReconnect: OnReconnect;
    deleteEdge: (id: string) => void;
  };
};

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
  actions: {
    onNodesChange: (changes) => {
      set({ nodes: applyNodeChanges(changes, get().nodes) });
    },
    onEdgesChange: (changes) => {
      set({ edges: applyEdgeChanges(changes, get().edges) });
    },
    onConnect: (connection) => {
      set({ edges: addEdge(connection, get().edges) });
    },
    onReconnect: (oldEdge, newConnection) => {
      set({ edges: reconnectEdge(oldEdge, newConnection, get().edges) });
    },
    deleteEdge: (id) => {
      set((state) => ({
        edges: state.edges.filter((e) => e.id !== id)
      }));
    },
  },
}));

export const useNodeStore = () => useStore((state) => state.nodes);
export const useEdgeStore = () => useStore((state) => state.edges);
export const useStoreActions = () => useStore((state) => state.actions);
