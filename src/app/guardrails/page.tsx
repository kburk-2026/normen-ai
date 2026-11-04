import { IconShieldCheck } from "@tabler/icons-react";
import ComingSoon from "@/components/ComingSoon";

export const metadata = { title: "Guardrails · Normen AI" };

export default function Page() {
  return (
    <ComingSoon
      title="Guardrails"
      icon={IconShieldCheck}
      description="Risk tiering, data privacy, bias testing and human review, mapped to each phase."
      milestone="a later phase"
    />
  );
}
