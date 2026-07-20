import { Suspense } from "react";
import { MaterialDashboard } from "@/components/material-dashboard";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <MaterialDashboard />
    </Suspense>
  );
}
