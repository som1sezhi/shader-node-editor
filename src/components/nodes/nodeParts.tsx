import { Handle, HandleProps, Position } from "@xyflow/react";
import { Fragment, ReactElement, ReactNode } from "react";

const typeToColor = {
  float: "bg-gray-400",
  vec2: "bg-lime-400",
  vec3: "bg-yellow-400",
  dynamicVec: "bg-blue-400",
};

export type HandleDataType = keyof typeof typeToColor;

interface ColoredHandleProps extends HandleProps {
  handleType: HandleDataType;
}

function BaseHandle({ handleType, ...rest }: ColoredHandleProps) {
  const color = typeToColor[handleType];
  return <Handle className={`w-2.5 h-2.5 ${color}`} {...rest} />;
}

interface ShaderNodeHandleProps {
  id: string;
  handleType: HandleDataType;
}

function InputHandle({ id, handleType }: ShaderNodeHandleProps) {
  return (
    <BaseHandle
      type="target"
      position={Position.Left}
      id={id}
      handleType={handleType}
    />
  );
}

function OutputHandle({ id, handleType }: ShaderNodeHandleProps) {
  return (
    <BaseHandle
      type="source"
      position={Position.Right}
      id={id}
      handleType={handleType}
    />
  );
}

export function NodeBody({
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
      className={`${
        selected ? "outline outline-2 outline-blue-500 outline-offset-1" : ""
      } rounded-md bg-neutral-50 shadow-xl text-xs min-w-24`}
    >
      <p className={`rounded-t-md px-2 pt-1 pb-0.5 bg-red-300 shadow-sm`}>
        {name}
      </p>
      <div className="flex flex-col gap-1 pt-1 pb-2">{children}</div>
    </div>
  );
}

export function NodeRow({
  rtl,
  children,
}: {
  rtl?: boolean;
  children: ReactNode;
}) {
  const flexDir = rtl ? "flex-row-reverse" : "flex-row";
  return (
    <div className={`relative flex ${flexDir} items-center px-2`}>
      {children}
    </div>
  );
}

interface InputRowProps {
  id: string;
  label: string;
  handleType: HandleDataType | null;
  children?: ReactElement | null;
}

interface OutputRowProps {
  id: string;
  label: string;
  handleType: HandleDataType;
}

export function InputRow({ id, label, handleType, children }: InputRowProps) {
  return (
    <Fragment>
      <NodeRow>
        {handleType ? <InputHandle id={id} handleType={handleType} /> : null}
        <label htmlFor={id}>{label}</label>
      </NodeRow>
      {children ? <NodeRow>{children}</NodeRow> : null}
    </Fragment>
  );
}

export function OutputRow({ id, label, handleType }: OutputRowProps) {
  return (
    <NodeRow rtl>
      <OutputHandle id={id} handleType={handleType} />
      <label htmlFor={id}>{label}</label>
    </NodeRow>
  );
}
