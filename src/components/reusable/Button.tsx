import { ComponentPropsWithoutRef, forwardRef } from "react";
import { twMerge } from "tailwind-merge";

type ButtonProps = ComponentPropsWithoutRef<"button">;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    return (
      <button
        {...props}
        className={twMerge(
          "py-1 px-2 shadow-md flex flex-row items-center rounded-md",
          props.className
        )}
        ref={ref}
      >
        {props.children}
      </button>
    );
  }
);
