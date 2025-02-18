import { useRef, useEffect, useState, ReactNode } from "react";
import { createPortal } from "react-dom";

// A portal that works client-side in Next.js
// https://github.com/vercel/next.js/blob/canary/examples/with-portals/components/ClientOnlyPortal.js
export default function Portal({
  children,
  selector,
}: {
  children: ReactNode;
  selector: string;
}) {
  const ref = useRef<Element | null>();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    ref.current = document.querySelector(selector);
    setMounted(true);
  }, [selector]);

  return mounted ? createPortal(children, ref.current!) : null;
}
