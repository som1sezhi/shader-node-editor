import { Dialog } from "radix-ui";
import { Cross2Icon } from "@radix-ui/react-icons";

export default function HelpModal() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="py-1 px-2 bg-gray-600 text-white shadow-md rounded-md">
          Help
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="z-[49] bg-black opacity-50 fixed inset-0" />
        <Dialog.Content className="z-50 bg-white shadow-md fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10/12 max-w-[36rem] p-5 rounded-lg" aria-describedby={undefined}>
          <Dialog.Title className="text-xl font-bold">Help</Dialog.Title>
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
              holding <b>Shift</b> while dragging (box select). Press{" "}
              <b>Backspace</b> to delete selected nodes.
            </p>
          </div>
          <Dialog.Close asChild>
            <button className="absolute top-5 right-5" aria-label="Close">
              <Cross2Icon />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
