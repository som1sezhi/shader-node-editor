import { useShader } from "@/lib/store";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Mesh, ShaderMaterial } from "three";

function PreviewMesh() {
  const { vertShader, fragShader, uniformsToWatch } = useShader();
  const mesh = useRef<Mesh>(null!);
  const uniforms: Record<string, { value: unknown }> = useMemo(() => ({}), []);

  // console.log(fragShader, uniformsToWatch);

  useEffect(() => {
    const material = mesh.current.material as ShaderMaterial;
    material.fragmentShader = fragShader;
    material.needsUpdate = true;
    for (const k in uniforms) {
      if (uniforms.hasOwnProperty(k)) delete uniforms[k];
    }
  }, [fragShader, uniforms]);

  useEffect(() => {
    for (const [k, v] of Object.entries(uniformsToWatch)) {
      const value = v.value;
      if (uniforms[k] === undefined)
        uniforms[k] = { value };
      else
        uniforms[k].value = value;
    }
  }, [uniforms, uniformsToWatch]);

  // useFrame(({ clock }) => {
  //   const material = mesh.current.material as ShaderMaterial;
  //   material.uniforms.u_time.value = clock.getElapsedTime();
  // });

  return (
    <mesh ref={mesh} scale={1}>
      <boxGeometry args={[1, 1, 1]} />
      <torusGeometry />
      <shaderMaterial
        fragmentShader={fragShader}
        vertexShader={vertShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function PreviewWindow() {
  return (
    <Canvas>
      <ambientLight intensity={0.01} />
      <spotLight
        position={[10, 15, 10]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <pointLight
        position={[-10, -15, -10]}
        decay={0}
        intensity={Math.PI / 2}
      />
      <PreviewMesh />
      <OrbitControls />
    </Canvas>
  );
}
