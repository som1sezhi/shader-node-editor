import { ReactElement } from "react";
import { shaderNodeTypes } from "./shaderNodeTypes";
import { Node } from "@xyflow/react";
import { HandleDataType } from "@/components/nodes/nodeParts";

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

type CompatibleGLSLDataType<JSType> = JSType extends number
  ? "float"
  : JSType extends Vec2
  ? "vec2"
  : JSType extends Vec3
  ? "vec3"
  : JSType extends unknown
  ? "float" | "vec2" | "vec3"
  : never;

type CoordSpace = "world" | "view";
type InputNodeDataType = number | Vec2 | Vec3 | CoordSpace;
export type GLSLDataType = CompatibleGLSLDataType<InputNodeDataType>;
export type DynamicDataType = "dynamic";

export type InputPortOrControlComponent<JSType> = (props: {
  id: string;
  label: string;
  handleType: HandleDataType | null;
  value: JSType;
  onChange: (newVal: JSType) => void;
}) => ReactElement;

export interface InputPortType<JSType> {
  kind: "port";
  glslDataType: CompatibleGLSLDataType<JSType>;
  component: InputPortOrControlComponent<JSType>;
  defaultValue: JSType;
}

export interface DynamicInputPortType<JSType> {
  kind: "dynamicPort";
  component: InputPortOrControlComponent<JSType>;
  decideConcreteType: (
    connectedInputTypes: GLSLDataType[]
  ) => CompatibleGLSLDataType<JSType>;
  key: DynamicDataType;
  defaultValue: JSType;
  defaultConcreteType: GLSLDataType;
}

export interface ControlType<JSType> {
  kind: "control";
  component: InputPortOrControlComponent<JSType>;
  defaultValue: JSType;
}

export interface OutputControlType<JSType> {
  kind: "outputControl";
  glslDataType: CompatibleGLSLDataType<JSType>;
  component: InputPortOrControlComponent<JSType>;
  defaultValue: JSType;
}

export type InputPortOrControlType<JSType> =
  | InputPortType<JSType>
  | DynamicInputPortType<JSType>
  | ControlType<JSType>
  | OutputControlType<JSType>;

type GetJSType<T> = T extends InputPortOrControlType<infer X> ? X : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface InputPortOrControl<JSType = any> {
  id: string;
  type: InputPortOrControlType<JSType>;
  label: string;
}

type OutputPortType = GLSLDataType | "dynamic";

interface OutputPort {
  id: string;
  type: OutputPortType;
  label: string;
}

type OutputPortTypeToGLSLTypes<T extends OutputPortType> = T extends "dynamic"
  ? "float" | "vec3"
  : T;

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
  concreteTypes?: {
    [key: string]: GLSLDataType;
  };
};

interface EmitCodeArgs<
  Inputs extends InputPortOrControl[],
  Outputs extends OutputPort[]
> {
  nodeData: ShaderNodeData<Inputs, Outputs>;
  vars: Record<Inputs[number]["id"] | Outputs[number]["id"], string>;
}

type EmittedCode =
  | {
      fnSource: string;
      fnCall?: string;
      requiredVaryings?: string[];
    }
  | {
      assignment: string;
      requiredVaryings?: string[];
    };

interface ShaderNodeType<
  Inputs extends InputPortOrControl[],
  Outputs extends OutputPort[]
> {
  name: string;
  inputs: Inputs;
  outputs: Outputs;
  emitCode: (args: EmitCodeArgs<Inputs, Outputs>) => EmittedCode;
}

export type ShaderNodeTypeInstance = ShaderNodeType<
  InputPortOrControl[],
  OutputPort[]
>;

export type ShaderNode = Node<ShaderNodeData>;

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
