import {
  inputNodeTypes,
  mathNodeTypes,
  outputNodeTypes,
  ShaderNodeTypes,
} from "@/lib/shaderNodeTypes";
import { ShaderNodeTypeInstance } from "@/lib/types";
import {
  ClickEvent,
  ControlledMenu,
  EventHandler,
  MenuItem as MenuItemInner,
  SubMenu as SubMenuInner,
} from "@szhsin/react-menu";
import { PropsWithChildren, RefObject, useCallback } from "react";
// import "@szhsin/react-menu/dist/index.css";

function Chevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="size-5"
    >
      <path
        fillRule="evenodd"
        d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const menuClass =
  "flex flex-col z-50 bg-white border shadow-md select-none min-w-[8rem] rounded-md py-1";

const menuItemClass = ({
  hover,
  submenu,
}: {
  hover: boolean;
  submenu?: boolean;
}) =>
  `whitespace-nowrap inline-block px-2 py-0.5 ${
    hover && "bg-gray-200"
  } ${submenu && "flex items-center"}`;

function MenuItem({ value, label }: { value: string; label: string }) {
  return (
    <MenuItemInner value={value} className={menuItemClass}>
      {label}
    </MenuItemInner>
  );
}

function SubMenu({
  label,
  children,
}: PropsWithChildren<{
  label: string;
}>) {
  return (
    <SubMenuInner
      shift={-5}
      label={
        <>
          <span className="flex-grow">{label}</span>
          <span className="-mr-1.5 opacity-30">
            <Chevron />
          </span>
        </>
      }
      className="relative"
      menuClassName={menuClass}
      itemProps={{ className: menuItemClass }}
    >
      {children}
    </SubMenuInner>
  );
}

export interface ContextMenuProps {
  isOpen: boolean;
  anchorRef?: RefObject<Element>;
  anchorPoint?: {
    x: number;
    y: number;
  };
  onClose: () => void;
  onItemClick: (value: string) => void;
}

function sortShaderTypes(types: ShaderNodeTypes) {
  return Object.entries(types).sort((a, b) =>
    a[1].name > b[1].name ? 1 : b[1].name > a[1].name ? -1 : 0
  );
}
const menuItems: {
  label: string;
  items: [string, ShaderNodeTypeInstance][];
}[] = [
  {
    label: "Input",
    items: sortShaderTypes(inputNodeTypes),
  },
  {
    label: "Output",
    items: sortShaderTypes(outputNodeTypes),
  },
  {
    label: "Math",
    items: sortShaderTypes(mathNodeTypes),
  },
];

export default function ContextMenu({
  isOpen,
  anchorRef,
  anchorPoint,
  onClose,
  onItemClick,
}: ContextMenuProps) {
  const callback: EventHandler<ClickEvent> = useCallback(
    (e) => {
      onItemClick(e.value);
    },
    [onItemClick]
  );
  return (
    <ControlledMenu
      anchorRef={anchorRef}
      anchorPoint={anchorPoint}
      state={isOpen ? "open" : "closed"}
      direction="bottom"
      onClose={onClose}
      menuClassName={menuClass}
      onItemClick={callback}
    >
      {menuItems.map((submenu) => (
        <SubMenu key={submenu.label} label={submenu.label}>
          {submenu.items.map((item) => (
            <MenuItem key={item[0]} value={item[0]} label={item[1].name} />
          ))}
        </SubMenu>
      ))}
    </ControlledMenu>
  );
}
