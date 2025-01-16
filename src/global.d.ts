interface Window {
  optimize_glsl: (
    code: string,
    target: 1 | 2 | 3,
    isVertShader: boolean
  ) => string?;
}
