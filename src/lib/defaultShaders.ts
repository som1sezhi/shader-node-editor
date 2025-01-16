export const DEFAULT_VERTEX_SHADER = /* glsl */ `
varying vec3 v_normal;
void main() {
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  v_normal = normal;
}`;

export const DEFAULT_FRAGMENT_SHADER = /* glsl */ `
void main() {
  gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);
}`;