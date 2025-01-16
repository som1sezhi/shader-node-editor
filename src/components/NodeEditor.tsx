import {
  Background,
  Edge,
  getOutgoers,
  IsValidConnection,
  Node,
  NodeTypes,
  OnReconnect,
  Panel,
  ReactFlow,
  useReactFlow,
  useUpdateNodeInternals,
} from "@xyflow/react";

import { ShaderNode } from "./nodes/nodes";
import { useStoreActions, useEdgeStore, useNodeStore } from "@/lib/store";
import { useCallback, useRef } from "react";
import { shaderNodeTypes } from "@/lib/shaderNodeTypes";

const nodeTypes: NodeTypes = {
  ShaderNode,
};

export default function NodeEditor() {
  const nodes = useNodeStore();
  const edges = useEdgeStore();
  const {
    onNodesChange,
    onEdgesChange,
    onConnect,
    onReconnect,
    addNode,
    deleteEdge,
    compile,
  } = useStoreActions();
  const { getNodes, getEdges } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  // allow for reconnecting edges and deleting edges on drop
  // https://reactflow.dev/examples/edges/delete-edge-on-drop
  const edgeReconnectSuccessful = useRef(true);

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnectSuccess: OnReconnect = useCallback(
    (oldEdge, newConnection) => {
      edgeReconnectSuccessful.current = true;
      onReconnect(oldEdge, newConnection);
      // reconnecting an edge to another input may cause visual glitches
      // unless we update node internals (for some reason this doesn't
      // seem to be a problem with connecting edges the 1st time?)
      updateNodeInternals(newConnection.target);
    },
    [onReconnect, updateNodeInternals]
  );

  const onReconnectEnd = useCallback(
    (_: unknown, edge: Edge) => {
      if (!edgeReconnectSuccessful.current) {
        deleteEdge(edge.id);
      }
      edgeReconnectSuccessful.current = true;
    },
    [deleteEdge]
  );

  // prevent cycles
  // https://reactflow.dev/examples/interaction/prevent-cycles
  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      const nodes = getNodes();
      const edges = getEdges();
      const target = nodes.find((node) => node.id === connection.target)!;
      const hasCycle = (node: Node, visited = new Set()) => {
        if (visited.has(node.id)) return false;

        visited.add(node.id);

        for (const outgoer of getOutgoers(node, nodes, edges)) {
          if (outgoer.id === connection.source) return true;
          if (hasCycle(outgoer, visited)) return true;
        }
      };

      if (target.id === connection.source) return false;
      return !hasCycle(target);
    },
    [getNodes, getEdges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onReconnect={onReconnectSuccess}
      onReconnectStart={onReconnectStart}
      onReconnectEnd={onReconnectEnd}
      isValidConnection={isValidConnection}
      nodeTypes={nodeTypes}
      fitView
    >
      <Panel position="top-right">
        {Object.entries(shaderNodeTypes).map(([key, type]) => (
          <button
            className="bg-slate-300 rounded-md px-1 mr-1"
            key={key}
            onClick={() => addNode(key as keyof typeof shaderNodeTypes)}
          >
            {type.name}
          </button>
        ))}
        <button
          className="bg-green-300 rounded-md px-1"
          onClick={() => compile()}
        >
          Compile
        </button>
      </Panel>
      <Background />
    </ReactFlow>
  );
}
