import { IconLayoutList } from "@tabler/icons-react";
import ComingSoon from "@/components/ComingSoon";

export const metadata = { title: "Workbench · Normen AI" };

export default function Page() {
  return (
    <ComingSoon
      title="Workbench"
      icon={IconLayoutList}
      description="Every phase, its activities, guardrails and checkpoint, in list or board view."
      milestone="milestones 2 and 3"
    />
  );
}
