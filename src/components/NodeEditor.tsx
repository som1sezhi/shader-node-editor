"use client";

import {
  Background,
  Edge,
  getOutgoers,
  IsValidConnection,
  Node,
  NodeTypes,
  OnConnect,
  OnReconnect,
  Panel,
  ReactFlow,
  useReactFlow,
  useUpdateNodeInternals,
} from "@xyflow/react";

import { ShaderNode as ShaderNodeComponent } from "./nodes/ShaderNode";
import { useStoreActions, useEdgeStore, useNodeStore } from "@/lib/store";
import {
  MouseEvent as ReactMouseEvent,
  useCallback,
  useRef,
  useState,
} from "react";
import { ShaderNode } from "@/lib/types";
import { canConvert } from "@/lib/shaderTypeConversions";
import { getSourceAndTargetDataTypes } from "@/lib/utils";
import ContextMenu, { ContextMenuProps } from "./ContextMenu";
import { useClick } from "@szhsin/react-menu";
import Modal from "./Modal";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";

function Plus() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-5"
    >
      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
    </svg>
  );
}

function HelpModal() {
  return (
    <Modal>
      <Modal.Trigger asChild>
        <button
          aria-label="Help"
          className="p-1.5 -mt-0.5 -mr-0.5 bg-gray-100 shadow-md rounded-full flex align-middle justify-center"
        >
          <QuestionMarkCircledIcon width="1.5rem" height="1.5rem" />
        </button>
      </Modal.Trigger>
      <Modal.Content title="Help">
        <div className="mt-6 mb-4 flex flex-col gap-6">
          <p>
            Add new nodes using the <b>Add Node</b> button in the top-left, or
            by right-clicking the canvas. A <b>Fragment Output</b> node must be
            present in order to see any output in the preview pane. Otherwise,
            the preview mesh will show up as solid magenta.
          </p>
          <p>
            You can select nodes by clicking on them. Addtionally, you can
            select multiple nodes by holding <b>Ctrl</b> while clicking, or by
            holding <b>Shift</b> while dragging (box select). Press
            <b>Backspace</b> to delete selected nodes.
          </p>
        </div>
      </Modal.Content>
    </Modal>
  );
}

const nodeTypes: NodeTypes = {
  ShaderNode: ShaderNodeComponent,
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
  } = useStoreActions();
  const { getNodes, getEdges, getNode } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  const onConnectCallback: OnConnect = useCallback(
    (connection) => {
      onConnect(connection);
      updateNodeInternals(connection.target);
    },
    [onConnect, updateNodeInternals]
  );

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

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      const nodes = getNodes();
      const edges = getEdges();
      const source = getNode(connection.source)! as ShaderNode;
      const target = getNode(connection.target)! as ShaderNode;
      // const source = nodes.find((node) => node.id === connection.target)!;
      // const target = nodes.find((node) => node.id === connection.target)!;

      // ensure data types are compatible
      const [sourceDataType, targetDataType] = getSourceAndTargetDataTypes(
        source,
        target,
        connection
      );
      if (
        targetDataType === null ||
        !canConvert(sourceDataType, targetDataType)
      )
        return false;

      // prevent cycles
      // https://reactflow.dev/examples/interaction/prevent-cycles
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
    [getNodes, getEdges, getNode]
  );

  const [menu, setMenu] = useState<ContextMenuProps>({
    isOpen: false,
    anchorPoint: { x: 0, y: 0 },
    onClose: () => {
      setMenu((menu) => ({ ...menu, isOpen: false }));
    },
    onItemClick: (value: string) => addNode(value),
  });
  const onPaneContextMenu = useCallback((e: MouseEvent | ReactMouseEvent) => {
    e.preventDefault();
    setMenu((menu) => ({
      ...menu,
      isOpen: true,
      anchorRef: undefined,
      anchorPoint: { x: e.clientX, y: e.clientY },
    }));
  }, []);
  const menuAnchorProps = useClick(menu.isOpen, (isOpen, e) => {
    // for some reason e.currentTarget can be null by the time the updater
    // function runs, so we store the target in this closure instead
    const target = e.currentTarget;
    setMenu((menu) => ({
      ...menu,
      isOpen,
      anchorRef: { current: target },
      anchorPoint: undefined,
    }));
  });

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnectCallback}
      onReconnect={onReconnectSuccess}
      onReconnectStart={onReconnectStart}
      onReconnectEnd={onReconnectEnd}
      isValidConnection={isValidConnection}
      onPaneContextMenu={onPaneContextMenu}
      nodeTypes={nodeTypes}
      fitView
    >
      <Panel position="top-left">
        <button
          className="bg-blue-600 text-white rounded-md py-1 px-2 shadow-md flex flex-row items-center"
          {...menuAnchorProps}
        >
          <span className="mr-1"><Plus /></span> Add Node
        </button>
      </Panel>
      <Panel position="top-right">
        <HelpModal />
      </Panel>
      <ContextMenu {...menu} />
      <Background />
    </ReactFlow>
  );
}
