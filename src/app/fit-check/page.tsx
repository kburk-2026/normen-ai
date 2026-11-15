import { Suspense } from "react";
import FitCheck from "@/components/fitcheck/FitCheck";

export const metadata = { title: "Fit Check · Normen AI" };

export default function Page() {
  return (
    <section className="px-5 py-12">
      {/* FitCheck reads ?project= from the address, which needs a Suspense boundary. */}
      <Suspense>
        <FitCheck />
      </Suspense>
    </section>
  );
}
