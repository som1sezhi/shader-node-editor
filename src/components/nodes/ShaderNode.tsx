import type { ShaderNode } from "@/lib/types";
import { NodeProps } from "@xyflow/react";
import { NodeBody, OutputRow } from "./nodeParts";
import { shaderNodeTypes } from "@/lib/shaderNodeTypes";
import { useStoreActions } from "@/lib/store";

export function ShaderNode({ id, data, selected }: NodeProps<ShaderNode>) {
  const { updateInputData } = useStoreActions();

  const { name, inputs, outputs } = shaderNodeTypes[data.nodeType];

  const inputComponents = inputs.map((inputControl) => {
    const { id: handleId, label, type } = inputControl;
    const onChange = (newVal: unknown) => {
      updateInputData(id, handleId, newVal);
    };
    const InputComponent = type.component;
    const handleType = "glslDataType" in type ? type.glslDataType : null;
    return (
      <InputComponent
        key={handleId}
        id={handleId}
        label={label}
        handleType={handleType}
        value={data.inputValues[handleId]}
        onChange={onChange}
      />
    );
  });

  const outputComponents = outputs.map((outputPort) => {
    const { id: handleId, type: handleType, label } = outputPort;
    return (
      <OutputRow
        key={handleId}
        id={handleId}
        label={label}
        handleType={handleType}
      />
    );
  });

  return (
    <NodeBody name={name} selected={selected}>
      {outputComponents}
      {inputComponents}
    </NodeBody>
  );
}
