import { Cross1Icon } from "@radix-ui/react-icons";
import { Dialog } from "radix-ui";
import { ReactNode } from "react";

export default function Modal({ children }: { children: ReactNode }) {
  return <Dialog.Root>{children}</Dialog.Root>;
}

function ModalContent({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="z-50 bg-black/50 fixed inset-0 data-[state=open]:animate-[fade-in_100ms] data-[state=closed]:animate-[fade-out_100ms]" />
      <Dialog.Content
        className="z-50 bg-white shadow-md fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10/12 max-w-[36rem] p-5 rounded-lg data-[state=open]:animate-[fade-in_100ms] data-[state=closed]:animate-[fade-out_100ms]"
        aria-describedby={undefined}
      >
        <div className="flex flex-row items-center justify-between">
          <Dialog.Title className="text-xl font-bold">{title}</Dialog.Title>
          <Dialog.Close asChild>
            <button
              className="text-gray-500 hover:text-gray-800"
              aria-label="Close"
            >
              <Cross1Icon width={18} height={18} />
            </button>
          </Dialog.Close>
        </div>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}

Modal.Trigger = Dialog.Trigger;
Modal.Content = ModalContent;
