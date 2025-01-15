import {
  InputPortOrControlComponent,
  InputPortOrControlType,
  Vec3,
} from "@/lib/types";
import { InputRow } from "./nodeParts";
import { ChangeEvent, useCallback } from "react";
import { hex2rgb, rgb2hex } from "@/lib/utils";

export function FloatInputPort() {
  return <div>float component</div>;
}

export function Vec3InputPort() {
  return <div>vec3 component</div>;
}

export const ColorInputPort: InputPortOrControlComponent<Vec3> = ({
  id,
  label,
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
    <InputRow id={id} label={label}>
      <input
        type="color"
        className="nodrag"
        onInput={onInput}
        value={colorHex}
      />
    </InputRow>
  );
};

export const inputTypes: {
  FLOAT: InputPortOrControlType<number>;
  VEC3: InputPortOrControlType<Vec3>;
  COLOR: InputPortOrControlType<Vec3>;
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
    defaultValue: [0, 0, 0]
  },
  COLOR: {
    kind: "port",
    glslDataType: "vec3",
    component: ColorInputPort,
    defaultValue: [0, 0, 0]
  },
} as const;
