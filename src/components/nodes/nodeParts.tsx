import { Handle, HandleProps, Position } from "@xyflow/react";
import { Fragment, ReactElement, ReactNode } from "react";

function BaseHandle(props: HandleProps) {
  return <Handle className="w-2.5 h-2.5 bg-yellow-400" {...props} />;
}

function InputHandle({ id }: { id: string }) {
  return <BaseHandle type="target" position={Position.Left} id={id} />;
}

function OutputHandle({ id }: { id: string }) {
  return <BaseHandle type="source" position={Position.Right} id={id} />;
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
    <div className={`relative flex ${flexDir} items-center px-3`}>
      {children}
    </div>
  );
}

interface InputRowProps {
  id: string;
  label: string;
  children?: ReactElement;
}

export function InputRow({ id, label, children }: InputRowProps) {
  return (
    <Fragment>
      <NodeRow>
        <InputHandle id={id} />
        <label htmlFor={id}>{label}</label>
      </NodeRow>
      {children ? <NodeRow>{children}</NodeRow> : null}
    </Fragment>
  );
}

export function OutputRow({ id, label }: { id: string; label: string }) {
  return (
    <NodeRow rtl>
      <OutputHandle id={id} />
      <label htmlFor={id}>{label}</label>
    </NodeRow>
  );
}
