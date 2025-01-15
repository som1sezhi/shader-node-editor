import { ShaderNodeData, Vec3 } from "@/lib/types";
import { hex2rgb, rgb2hex } from "@/lib/utils";
import {
  NodeProps,
  Node,
  useReactFlow,
  useHandleConnections,
  useNodesData,
} from "@xyflow/react";
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { InputRow, NodeBody, NodeRow, OutputRow } from "./nodeParts";
import { shaderNodeTypes } from "@/lib/shaderNodeTypes";

function useInput(id: string) {
  const connections = useHandleConnections({
    type: "target",
    id,
  });
  const nodeData = useNodesData<ColorNode>(connections[0]?.source);

  return nodeData;
}

type ShaderNode = Node<ShaderNodeData>;

export function ShaderNode({ id, data, selected }: NodeProps<ShaderNode>) {
  const { updateNodeData } = useReactFlow<ShaderNode>();

  const { name, inputs, outputs } = shaderNodeTypes[data.nodeType];

  const inputComponents = inputs.map((inputControl) => {
    const { id: handleId, label, type } = inputControl;
    const onChange = (newVal: unknown) => {
      updateNodeData(id, {
        inputValues: { ...data.inputValues, [handleId]: newVal },
      });
    };
    const InputComponent = type.component;
    return (
      <InputComponent
        key={handleId}
        id={handleId}
        label={label}
        value={data.inputValues[handleId]}
        onChange={onChange}
      />
    );
  });

  const outputComponents = outputs.map((outputPort) => {
    const { id: handleId, label } = outputPort;
    return <OutputRow key={handleId} id={handleId} label={label} />;
  });

  return (
    <NodeBody name={name} selected={selected}>
      {outputComponents}
      {inputComponents}
    </NodeBody>
  );
}

type ColorNode = Node<{ color: Vec3 }>;

export function ColorNode({ id, data, selected }: NodeProps<ColorNode>) {
  const { updateNodeData } = useReactFlow();
  const [color, setColor] = useState<Vec3>(data.color);

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const c = hex2rgb(e.target.value);
      setColor(c);
      updateNodeData(id, { color: c });
    },
    [id, updateNodeData]
  );

  const colorHex = useMemo(() => rgb2hex(color), [color]);

  return (
    <NodeBody name="Color" selected={selected}>
      <OutputRow id="color" label="Color" />
      <NodeRow>
        <input
          type="color"
          className="nodrag"
          onInput={onChange}
          value={colorHex}
        />
      </NodeRow>
    </NodeBody>
  );
}

type MixNode = Node<{ color: Vec3 }>;

export function MixNode({ id, selected }: NodeProps<MixNode>) {
  const { updateNodeData } = useReactFlow();

  const in1NodeData = useInput("in1");
  const in2NodeData = useInput("in2");

  useEffect(() => {
    const color1 = in1NodeData?.data ? in1NodeData.data.color : [0, 0, 0];
    const color2 = in2NodeData?.data ? in2NodeData.data.color : [0, 0, 0];
    const c = [
      (color1[0] + color2[0]) / 2,
      (color1[1] + color2[1]) / 2,
      (color1[2] + color2[2]) / 2,
    ];
    updateNodeData(id, { color: c });
  }, [in1NodeData, in2NodeData, id, updateNodeData]);

  return (
    <NodeBody name="Mix" selected={selected}>
      <OutputRow id="out" label="Output" />
      <InputRow id="in1" label="Input 1" />
      <InputRow id="in2" label="Input 2" />
    </NodeBody>
  );
}

export function OutputNode({ selected }: NodeProps) {
  const connections = useHandleConnections({
    type: "target",
    id: "color1",
  });
  const nodeData = useNodesData<ColorNode>(connections?.[0]?.source);

  const color = {
    r: nodeData?.data ? nodeData.data.color[0] * 255 : 0,
    g: nodeData?.data ? nodeData.data.color[1] * 255 : 0,
    b: nodeData?.data ? nodeData.data.color[2] * 255 : 0,
  };

  return (
    <NodeBody name="Output Color" selected={selected}>
      <InputRow id="color1" label="Color" />
      <InputRow id="color2" label="Color" />
      <div
        style={{
          background: `rgb(${color.r}, ${color.g}, ${color.b})`,
        }}
      >
        &nbsp;&nbsp;&nbsp;
      </div>
    </NodeBody>
  );
}
