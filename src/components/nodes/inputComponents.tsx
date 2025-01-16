import {
  InputPortOrControlComponent,
  InputPortType,
  OutputControlType,
  Vec3,
} from "@/lib/types";
import { InputRow, NodeRow } from "./nodeParts";
import { ChangeEvent, useCallback } from "react";
import { hex2rgb, rgb2hex } from "@/lib/utils";
import { useHandleConnections } from "@xyflow/react";

function FloatInputPort() {
  return <div>float component</div>;
}

function Vec3InputPort() {
  return <div>vec3 component</div>;
}

const ColorInputPort: InputPortOrControlComponent<Vec3> = ({
  id,
  label,
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
    <InputRow id={id} label={label}>
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

export const inputTypes: {
  FLOAT: InputPortType<number>;
  VEC3: InputPortType<Vec3>;
  COLOR: InputPortType<Vec3>;
  COLOR_OUTPUT_CONTROL: OutputControlType<Vec3>;
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
    defaultValue: [0, 0, 0],
  },
  COLOR_OUTPUT_CONTROL: {
    kind: "outputControl",
    glslDataType: "vec3",
    component: ColorOutputControl,
    defaultValue: [0, 0, 0],
  },
} as const;
