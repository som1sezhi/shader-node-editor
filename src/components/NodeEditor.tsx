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
import { useCallback, useRef } from "react";
import { shaderNodeTypes } from "@/lib/shaderNodeTypes";
import {
  ShaderNode,
} from "@/lib/types";
import { canConvert } from "@/lib/shaderTypeConversions";
import { getSourceAndTargetDataTypes } from "@/lib/utils";

const nodeTypes: NodeTypes = {
  ShaderNode: ShaderNodeComponent,
};

// function glslTypeToInitValue(glslDataType: GLSLDataType) {
//   switch (glslDataType) {
//     case "float":
//       return 0;
//     case "vec2":
//       return [0, 0];
//     case "vec3":
//       return [0, 0, 0];
//     default:
//       assert(false);
//   }
// }

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
  const { getNodes, getEdges, getNode } =
    useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();

  /*
  const updateDynamicTypes = useCallback(
    (targetIds: string[]) => {
      const stack = targetIds;
      while (stack.length > 0) {
        const nodeId = stack.pop()!;
        const node = getNode(nodeId) as ShaderNode;
        assert(node !== undefined);
        console.log("updating", nodeId);
        const shaderNodeType = shaderNodeTypes[node.data.nodeType];
        // check if there are even any dynamic ports on this node
        if (
          shaderNodeType.inputs.every((inp) => inp.type.kind !== "dynamicPort")
        )
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
        const incomingConns = getHandleConnections({
          type: "target",
          nodeId,
        });
        for (const conn of incomingConns) {
          const inputType = idToInputType.get(conn.targetHandle!);
          if (inputType !== undefined) {
            const source = getNode(conn.source) as ShaderNode;
            const sourceOutputType =
              source.data.outputTypes[conn.sourceHandle!];
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
            if (node.data.concreteTypes[inp.type.key] !== concreteType)
              updateNodeData(nodeId, {
                inputValues: {
                  ...node.data.inputValues,
                  [inp.id]: glslTypeToInitValue(concreteType),
                },
              });
          }
        }
        // update concrete types
        updateNodeData(nodeId, { concreteTypes: newConcreteTypes });
        // update output types
        const newOutputTypes = { ...node.data.outputTypes };
        let needsChange = false;
        for (const output of shaderNodeType.outputs) {
          if (
            output.type === "dynamic" &&
            newConcreteTypes.dynamic !== newOutputTypes[output.id]
          ) {
            needsChange = true;
            newOutputTypes[output.id] = newConcreteTypes.dynamic;
          }
        }
        if (needsChange) {
          updateNodeData(nodeId, { outputTypes: newOutputTypes });
          // we changed our output type; let other dynamic ports down
          // the node graph know about this
          const outgoingConns = getHandleConnections({
            type: "source",
            nodeId,
          });
          const outgoingNeighs = new Set<string>();
          for (const conn of outgoingConns)
            outgoingNeighs.add(conn.target);
          for (const neigh of outgoingNeighs)
            stack.push(neigh);
          // TODO: remove edges that become incompatible with the new
          // output type (will that ever be possible?)
        }
        console.log("update end", newConcreteTypes, newOutputTypes);
      }
    },
    [getHandleConnections, getNode, updateNodeData]
  );*/

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
