import { Background, Edge, NodeTypes, OnReconnect, ReactFlow } from "@xyflow/react";

import { ColorNode, MixNode, OutputNode } from "./nodes/nodes";
import { useStoreActions, useEdgeStore, useNodeStore } from "@/lib/store";
import { useCallback, useRef } from "react";

const nodeTypes: NodeTypes = {
  ColorNode,
  OutputNode,
  MixNode,
};

export default function NodeEditor() {
  const nodes = useNodeStore();
  const edges = useEdgeStore();
  const { onNodesChange, onEdgesChange, onConnect, onReconnect, deleteEdge } =
    useStoreActions();

  // https://reactflow.dev/examples/edges/delete-edge-on-drop
  const edgeReconnectSuccessful = useRef(true);

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnectSuccess: OnReconnect = useCallback(
    (oldEdge, newConnection) => {
      edgeReconnectSuccessful.current = true;
      onReconnect(oldEdge, newConnection);
    },
    [onReconnect]
  );

  const onReconnectEnd = useCallback((_: unknown, edge: Edge) => {
    if (!edgeReconnectSuccessful.current) {
      deleteEdge(edge.id);
    }
    edgeReconnectSuccessful.current = true;
  }, [deleteEdge]);

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
      nodeTypes={nodeTypes}
      fitView
    >
      <Background />
    </ReactFlow>
  );
}
