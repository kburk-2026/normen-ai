import { IconTarget } from "@tabler/icons-react";
import ComingSoon from "@/components/ComingSoon";

export const metadata = { title: "Fit Check · Normen AI" };

export default function Page() {
  return (
    <ComingSoon
      title="Fit Check"
      icon={IconTarget}
      description="Ten questions that tell you whether a problem actually needs AI."
      milestone="milestone 4"
    />
  );
}
