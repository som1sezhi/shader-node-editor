import { jsValueToGLSL } from "@/lib/compileShader";
import { useShader } from "@/lib/store";
import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { Button } from "./reusable/Button";
import Modal from "./reusable/Modal";
import { Toast } from "radix-ui";
import Portal from "./reusable/Portal";

function CopyButton({ exportedShader }: { exportedShader: string }) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(0);

  const onClick = useCallback(() => {
    setOpen(false);
    navigator.clipboard.writeText(exportedShader);
    timerRef.current = window.setTimeout(() => {
      setOpen(true);
    }, 100);
  }, [exportedShader]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <>
      <Button
        onClick={onClick}
        className="bg-blue-600 hover:bg-blue-500 text-white self-end py-2 px-4"
      >
        Copy
      </Button>
      <Toast.Provider swipeDirection="up" duration={3000}>
        <Toast.Root
          className="bg-white rounded-md shadow-md px-4 p-2 data-[state=open]:animate-[slide-in-from-top_100ms] data-[state=closed]:animate-[fade-out_100ms] data-[swipe=move]:translate-y-[var(--radix-toast-swipe-move-y)] data-[swipe=move]:transition-none data-[swipe=cancel]:translate-y-0 data-[swipe=cancel]:transition-transform data-[swipe=end]:animate-[swipe-out-to-top_100ms]"
          open={open}
          onOpenChange={setOpen}
        >
          <Toast.Description asChild>
            <div>Copied to clipboard!</div>
          </Toast.Description>
        </Toast.Root>
        <Portal selector="body">
          <Toast.Viewport className="fixed top-3 p-2 z-50 w-screen flex justify-center" />
        </Portal>
      </Toast.Provider>
    </>
  );
}

export default function ExportModal() {
  const { fragShader, uniformsToWatch } = useShader();

  const exportedShader = useMemo(() => {
    const allKeys = Object.keys(uniformsToWatch).join("|");
    const regex = new RegExp(`uniform (\\w+) (${allKeys})`, "g");
    return fragShader
      .replaceAll(
        regex,
        (_, uniformType, uniformName) =>
          `const ${uniformType} ${uniformName} = ${jsValueToGLSL(
            uniformsToWatch[uniformName].value
          )}`
      )
      .trim();
  }, [fragShader, uniformsToWatch]);

  return (
    <Modal>
      <Modal.Trigger asChild>
        <button className="bg-gray-100 hover:bg-gray-200 rounded-md py-1 px-2 shadow-md flex flex-row items-center">
          Export
        </button>
      </Modal.Trigger>
      <Modal.Content title="Export to GLSL">
        <div className="flex flex-col gap-6">
          <SyntaxHighlighter
            language="glsl"
            style={docco}
            className="text-sm overflow-y-auto max-h-[calc(100vh-150px)]"
          >
            {exportedShader}
          </SyntaxHighlighter>
          <CopyButton exportedShader={exportedShader} />
        </div>
      </Modal.Content>
    </Modal>
  );
}
