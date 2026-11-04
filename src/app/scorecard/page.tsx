import { IconGauge } from "@tabler/icons-react";
import ComingSoon from "@/components/ComingSoon";

export const metadata = { title: "Scorecard · Normen AI" };

export default function Page() {
  return (
    <ComingSoon
      title="Scorecard"
      icon={IconGauge}
      description="The evaluation metrics an AI project sets, baselines and must hit before launch."
      milestone="milestone 2"
    />
  );
}
