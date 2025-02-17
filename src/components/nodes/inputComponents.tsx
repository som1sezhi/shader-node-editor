import {
  ControlType,
  DynamicInputPortType,
  InputPortOrControlComponent,
  InputPortType,
  OutputControlType,
  Vec2,
  Vec3,
} from "@/lib/types";
import { InputRow, NodeRow } from "./nodeParts";
import { ChangeEvent, ChangeEventHandler, useCallback } from "react";
import { hex2rgb, rgb2hex } from "@/lib/utils";
import { useHandleConnections } from "@xyflow/react";
import { strict as assert } from "assert";

function FloatInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (newVal: number) => void;
}) {
  const callback: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      onChange(parseFloat(e.target.value));
    },
    [onChange]
  );
  return (
    <input
      className="px-1 py-0.5 rounded-sm w-28 nodrag"
      type="number"
      step={0.01}
      value={value}
      onChange={callback}
    />
  );
}

function Vec2Input({
  value,
  onChange,
}: {
  value: Vec2;
  onChange: (newVal: Vec2) => void;
}) {
  const callback = useCallback(
    (newComponentVal: number, idx: 0 | 1) => {
      const newVal = [...value] as Vec2;
      newVal[idx] = newComponentVal;
      onChange(newVal);
    },
    [value, onChange]
  );
  return (
    <div className="flex flex-col">
      <FloatInput value={value[0]} onChange={(val) => callback(val, 0)} />
      <FloatInput value={value[1]} onChange={(val) => callback(val, 1)} />
    </div>
  );
}

function Vec3Input({
  value,
  onChange,
}: {
  value: Vec3;
  onChange: (newVal: Vec3) => void;
}) {
  const callback = useCallback(
    (newComponentVal: number, idx: 0 | 1 | 2) => {
      const newVal = [...value] as Vec3;
      newVal[idx] = newComponentVal;
      onChange(newVal);
    },
    [value, onChange]
  );
  return (
    <div className="flex flex-col">
      <FloatInput value={value[0]} onChange={(val) => callback(val, 0)} />
      <FloatInput value={value[1]} onChange={(val) => callback(val, 1)} />
      <FloatInput value={value[2]} onChange={(val) => callback(val, 2)} />
    </div>
  );
}

const FloatInputPort: InputPortOrControlComponent<number> = ({
  id,
  label,
  handleType,
  value,
  onChange,
}) => {
  const connections = useHandleConnections({ type: "target", id });
  return <InputRow id={id} label={label} handleType={handleType}>
  {connections.length == 0 ? (
    <FloatInput value={value} onChange={onChange} />
  ) : null}
</InputRow>
}

function Vec3InputPort() {
  return <div>vec3 component</div>;
}

const ColorInputPort: InputPortOrControlComponent<Vec3> = ({
  id,
  label,
  handleType,
  value,
  onChange,
}) => {
  const connections = useHandleConnections({ type: "target", id });

  const colorHex = rgb2hex(value);
  const onInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const c = hex2rgb(e.target.value);
      onChange(c);
    },
    [onChange]
  );
  return (
    <InputRow id={id} label={label} handleType={handleType}>
      {connections.length == 0 ? (
        <input
          type="color"
          className="nodrag"
          onInput={onInput}
          value={colorHex}
        />
      ) : null}
    </InputRow>
  );
};

const DynamicInputPort: InputPortOrControlComponent<number | Vec2 | Vec3> = ({
  id,
  label,
  handleType,
  value,
  onChange,
}) => {
  const connections = useHandleConnections({ type: "target", id });
  let component;
  if (typeof value === "number")
    component = <FloatInput value={value} onChange={onChange} />;
  else if (Array.isArray(value)) {
    if (value.length === 2)
      component = <Vec2Input value={value} onChange={onChange} />;
    else component = <Vec3Input value={value} onChange={onChange} />;
  }

  return (
    <InputRow id={id} label={label} handleType={handleType}>
      {connections.length == 0 ? component : null}
    </InputRow>
  );
};

const ColorOutputControl: InputPortOrControlComponent<Vec3> = ({
  value,
  onChange,
}) => {
  const colorHex = rgb2hex(value);
  const onInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const c = hex2rgb(e.target.value);
      onChange(c);
    },
    [onChange]
  );
  return (
    <NodeRow>
      <input
        type="color"
        className="nodrag"
        onInput={onInput}
        value={colorHex}
      />
    </NodeRow>
  );
};

const mathOps = [
  ["add", "Add"],
  ["sub", "Subtract"],
  ["mul", "Multiply"],
  ["div", "Divide"],
  ["pow", "Power"],
  ["log", "Log"],
  ["lt", "Less Than"],
  ["leq", "Less or Equal"],
  ["gt", "Greater Than"],
  ["geq", "Greater or Equal"],
] as const;

type MathOp = (typeof mathOps)[number][0];
const MathOpControl: InputPortOrControlComponent<MathOp> = ({
  id,
  label,
  handleType,
  value,
  onChange,
}) => {
  const callback = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value as MathOp);
    },
    [onChange]
  );
  return (
    <InputRow id={id} label={label} handleType={handleType}>
      <select
        className="w-full px-1 py-0.5 rounded-sm"
        value={value}
        onChange={callback}
      >
        {mathOps.map(([value, label]) => (
          <option value={value} key={value}>
            {label}
          </option>
        ))}
      </select>
    </InputRow>
  );
};

export const inputTypes: {
  FLOAT: InputPortType<number>;
  VEC3: InputPortType<Vec3>;
  COLOR: InputPortType<Vec3>;
  DYNAMIC: DynamicInputPortType<number | Vec2 | Vec3>;
  COLOR_OUTPUT_CONTROL: OutputControlType<Vec3>;
  MATH_OP: ControlType<MathOp>;
} = {
  FLOAT: {
    kind: "port",
    glslDataType: "float",
    component: FloatInputPort,
    defaultValue: 0,
  },
  VEC3: {
    kind: "port",
    glslDataType: "vec3",
    component: Vec3InputPort,
    defaultValue: [0, 0, 0],
  },
  COLOR: {
    kind: "port",
    glslDataType: "vec3",
    component: ColorInputPort,
    defaultValue: [0.5, 0.5, 0.5],
  },
  DYNAMIC: {
    kind: "dynamicPort",
    component: DynamicInputPort,
    decideConcreteType: (inputTypes) => {
      const typeToSize = {
        float: 1,
        vec2: 2,
        vec3: 3,
      };
      const inputSizes = inputTypes.map((type) => typeToSize[type]);
      assert(inputSizes.every((size) => typeof size === "number"));
      const biggest = Math.max(...inputSizes, 1);
      return (["float", "vec2", "vec3"] as const)[biggest - 1];
    },
    key: "dynamic",
    defaultValue: 0,
    defaultConcreteType: "float",
  },
  COLOR_OUTPUT_CONTROL: {
    kind: "outputControl",
    glslDataType: "vec3",
    component: ColorOutputControl,
    defaultValue: [0.5, 0.5, 0.5],
  },
  MATH_OP: {
    kind: "control",
    component: MathOpControl,
    defaultValue: "add",
  },
} as const;
