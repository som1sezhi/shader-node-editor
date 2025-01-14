"use client";

import NodeEditor from "@/components/NodeEditor";

export default function Home() {
  return (
    // div needs a known width/height for react-flow to work properly
    <div style={{ width: "100vw", height: "100vh" }}>
      <NodeEditor />
    </div>
  );
}
