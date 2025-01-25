import type { ShaderNode } from "@/lib/types";
import { NodeProps } from "@xyflow/react";
import { NodeBody, OutputRow } from "./nodeParts";
import { shaderNodeTypes } from "@/lib/shaderNodeTypes";
import { useStoreActions } from "@/lib/store";

export function ShaderNode({ id, data, selected }: NodeProps<ShaderNode>) {
  const { updateInputData, compile } = useStoreActions();

  const { name, inputs, outputs } = shaderNodeTypes[data.nodeType];

  const inputComponents = inputs.map((inputControl) => {
    const { id: handleId, label, type } = inputControl;
    const onChange = (newVal: unknown) => {
      updateInputData(id, handleId, newVal);
      // almost always, if a control-type input is changed, we need
      // to recompile
      if (type.kind === "control")
        compile();
    };
    const InputComponent = type.component;
    let handleType = null;
    if ("glslDataType" in type)
      handleType = type.glslDataType;
    else if (type.kind === "dynamicPort")
      handleType = type.key;
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
    const { id: handleId, label } = outputPort;
    return (
      <OutputRow
        key={handleId}
        id={handleId}
        label={label}
        handleType={data.outputTypes[handleId]}
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
