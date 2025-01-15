import { Vec3 } from "@/lib/types";
import { hex2rgb, rgb2hex } from "@/lib/utils";
import {
  Handle,
  HandleProps,
  NodeProps,
  Node,
  Position,
  useReactFlow,
  useHandleConnections,
  useNodesData,
} from "@xyflow/react";
import {
  ChangeEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

function BaseHandle(props: HandleProps) {
  return <Handle className="w-2.5 h-2.5 bg-yellow-400" {...props} />;
}

function InputHandle({ id }: { id: string }) {
  return <BaseHandle type="target" position={Position.Left} id={id} />;
}

function OutputHandle({ id }: { id: string }) {
  return <BaseHandle type="source" position={Position.Right} id={id} />;
}

function NodeBody({
  name,
  selected,
  children,
}: {
  name: string;
  selected?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`${selected ? "outline outline-2 outline-blue-500 outline-offset-1" : ""} rounded-md bg-neutral-50 shadow-xl text-xs min-w-24`}
    >
      <p className={`rounded-t-md px-2 pt-1 pb-0.5 bg-red-300 shadow-sm`}>
        {name}
      </p>
      <div className="flex flex-col gap-1 pt-1 pb-2">{children}</div>
    </div>
  );
}

function NodeRow({ rtl, children }: { rtl?: boolean; children: ReactNode }) {
  const flexDir = rtl ? "flex-row-reverse" : "flex-row";
  return (
    <div className={`relative flex ${flexDir} items-center px-3`}>
      {children}
    </div>
  );
}

interface InputRowProps {
  id: string;
  label: string;
}

function InputRow({ id, label }: InputRowProps) {
  return (
    <NodeRow>
      <InputHandle id={id} />
      <label htmlFor={id}>{label}</label>
    </NodeRow>
  );
}

function OutputRow({ id, label }: { id: string; label: string }) {
  return (
    <NodeRow rtl>
      <OutputHandle id={id} />
      <label htmlFor={id}>{label}</label>
    </NodeRow>
  );
}

function useInput(id: string) {
  const connections = useHandleConnections({
    type: "target",
    id,
  });
  const nodeData = useNodesData<ColorNode>(connections[0]?.source);

  return nodeData;
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
