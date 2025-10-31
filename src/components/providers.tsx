
"use client";

import { CartProvider } from "@/context/cart-context";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
