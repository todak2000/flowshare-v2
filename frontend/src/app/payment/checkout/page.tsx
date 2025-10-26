"use client";

import { CheckoutContent } from "@/components/payment/checkout";
import { Suspense } from "react";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
