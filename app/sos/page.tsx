
"use client";

import AppLayout from "@/components/layout/app-layout";
// import { SOSUI } from "./sos-ui";

export default function SOSBookingPage() {
  return (
    <AppLayout>
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">SOS Sessions - Coming Soon</h1>
        <p className="text-gray-600">
          SOS sessions are temporarily disabled while we improve the experience. 
          Please check back soon!
        </p>
      </div>
      {/* <SOSUI /> */}
    </AppLayout>
  );
}
