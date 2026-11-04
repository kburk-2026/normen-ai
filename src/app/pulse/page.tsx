import { IconHeartbeat } from "@tabler/icons-react";
import ComingSoon from "@/components/ComingSoon";

export const metadata = { title: "Pulse · Normen AI" };

export default function Page() {
  return (
    <ComingSoon
      title="Pulse"
      icon={IconHeartbeat}
      description="Post-launch monitoring: model drift, user feedback, usage and incidents."
      milestone="phase 2"
    />
  );
}
