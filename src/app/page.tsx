"use client";

import NodeEditor from "@/components/NodeEditor";
import PreviewWindow from "@/components/PreviewWindow";
import { ReactFlowProvider } from "@xyflow/react";
import { Allotment } from "allotment";

import "allotment/dist/style.css";
import Script from "next/script";
import { Fragment } from "react";

export default function Home() {
  return (
    <Fragment>
      <div style={{ width: "100vw", height: "100vh" }}>
        <Allotment>
          <Allotment.Pane>
            <ReactFlowProvider>
              {/*div needs a known width/height for react-flow to work properly*/}
              <div style={{ width: "100%", height: "100%" }}>
                <NodeEditor />
              </div>
            </ReactFlowProvider>
          </Allotment.Pane>
          <Allotment.Pane>
            <PreviewWindow />
          </Allotment.Pane>
        </Allotment>
      </div>
      <Script
        src="shader-node-editor/glsl-optimizer/loader.js"
        strategy="beforeInteractive"
      />
      <Script src="shader-node-editor/glsl-optimizer/glsl-optimizer.js" />
    </Fragment>
  );
}
