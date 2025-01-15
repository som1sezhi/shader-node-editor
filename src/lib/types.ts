import { ReactElement } from "react";
import { shaderNodeTypes } from "./shaderNodeTypes";

export type Vec3 = [number, number, number];


type CompatibleGLSLDataType<JSType> = JSType extends number
  ? "float"
  : JSType extends Vec3
  ? "vec3"
  : never;

export type InputPortOrControlComponent<JSType> = (props: {
  id: string;
  label: string;
  value: JSType;
  onChange: (newVal: JSType) => void;
}) => ReactElement;

interface InputPortType<JSType> {
  kind: "port";
  glslDataType: CompatibleGLSLDataType<JSType>;
	component: InputPortOrControlComponent<JSType>;
	defaultValue: JSType;
}

interface DynamicInputPortType<JSType> {
  kind: "dynamicPort";
	component: InputPortOrControlComponent<JSType>;
	defaultValue: JSType;
}

interface ControlType<JSType> {
  kind: "control";
	component: InputPortOrControlComponent<JSType>;
	defaultValue: JSType;
}

export type InputPortOrControlType<JSType> =
  | InputPortType<JSType>
  | DynamicInputPortType<JSType>
  | ControlType<JSType>;

type GetJSType<T> = T extends InputPortOrControlType<infer X> ? X : never;

type CoordSpace = "world" | "view";
type InputNodeDataType = number | Vec3 | CoordSpace;
type GLSLDataType = CompatibleGLSLDataType<InputNodeDataType>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface InputPortOrControl<JSType = any> {
  id: string;
  type: InputPortOrControlType<JSType>;
  label: string;
}

type OutputPortType = GLSLDataType | "dynamicVec";

interface OutputPort {
  id: string;
  type: OutputPortType;
  label: string;
}

type OutputPortTypeToGLSLTypes<T extends OutputPortType> =
  T extends "dynamicVec" ? "float" | "vec3" : T;

export type ShaderNodeData<
  Inputs extends InputPortOrControl[] = InputPortOrControl[],
  Outputs extends OutputPort[] = OutputPort[]
> = {
  nodeType: keyof typeof shaderNodeTypes;
  inputValues: {
    [Input in Inputs[number] as Input["id"]]: GetJSType<Input["type"]>;
  };
  outputTypes: {
    [Output in Outputs[number] as Output["id"]]: OutputPortTypeToGLSLTypes<
      Output["type"]
    >;
  };
};

interface EmitCodeArgs<
  Inputs extends InputPortOrControl[],
  Outputs extends OutputPort[]
> {
  nodeData: ShaderNodeData<Inputs, Outputs>;
  vars: Record<Inputs[number]["id"] | Outputs[number]["id"], string>;
}

interface EmittedCode {
  fnSource?: string;
  fnCall: string;
}

interface ShaderNodeType<
  Inputs extends InputPortOrControl[],
  Outputs extends OutputPort[]
> {
  name: string;
  inputs: Inputs;
  outputs: Outputs;
  emitCode: (args: EmitCodeArgs<Inputs, Outputs>) => EmittedCode;
}

export function typeCheckShaderNode<
  Inputs extends InputPortOrControl[],
  Outputs extends OutputPort[]
>(
  node: { inputs: Inputs; outputs: Outputs } & Omit<
    ShaderNodeType<Inputs, Outputs>,
    "inputs" | "outputs"
  >
): ShaderNodeType<Inputs, Outputs> {
  return node;
}
