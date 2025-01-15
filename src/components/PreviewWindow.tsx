import { useShaderSources } from "@/lib/store";
import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";

function Mesh() {
  const [vertShader, fragShader] = useShaderSources();
  return (
    <mesh scale={1}>
      <boxGeometry args={[1, 1, 1]} />
      <shaderMaterial
        fragmentShader={fragShader}
        vertexShader={vertShader}
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
      <Mesh />
      <OrbitControls />
    </Canvas>
  );
}
