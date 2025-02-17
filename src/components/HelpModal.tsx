import { Dialog } from "radix-ui";
import { Cross1Icon, QuestionMarkCircledIcon } from "@radix-ui/react-icons";

export default function HelpModal() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          aria-label="Help"
          className="p-1.5 -mt-0.5 -mr-0.5 bg-gray-100 shadow-md rounded-full flex align-middle justify-center"
        >
          <QuestionMarkCircledIcon width="1.5rem" height="1.5rem" />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="z-50 bg-black/50 fixed inset-0 data-[state=open]:animate-[fade-in_100ms] data-[state=closed]:animate-[fade-out_100ms]" />
        <Dialog.Content
          className="z-50 bg-white shadow-md fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10/12 max-w-[36rem] p-5 rounded-lg data-[state=open]:animate-[fade-in_100ms] data-[state=closed]:animate-[fade-out_100ms]"
          aria-describedby={undefined}
        >
          <div className="flex flex-row items-center justify-between">
            <Dialog.Title className="text-xl font-bold">Help</Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="text-gray-500 hover:text-gray-800"
                aria-label="Close"
              >
                <Cross1Icon width={18} height={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="mt-6 mb-4 flex flex-col gap-6">
            <p>
              Add new nodes using the <b>Add Node</b> button in the top-left, or
              by right-clicking the canvas. A <b>Fragment Output</b> node must
              be present in order to see any output in the preview pane.
              Otherwise, the preview mesh will show up as solid magenta.
            </p>
            <p>
              You can select nodes by clicking on them. Addtionally, you can
              select multiple nodes by holding <b>Ctrl</b> while clicking, or by
              holding <b>Shift</b> while dragging (box select). Press
              <b>Backspace</b> to delete selected nodes.
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
