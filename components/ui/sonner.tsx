"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  console.log("🔵 Toaster component rendering");

  return (
    <Sonner
      className="toaster group"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "font-sans",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
