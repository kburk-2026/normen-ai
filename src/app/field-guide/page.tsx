import { IconBook } from "@tabler/icons-react";
import ComingSoon from "@/components/ComingSoon";

export const metadata = { title: "Field Guide · Normen AI" };

export default function Page() {
  return (
    <ComingSoon
      title="Field Guide"
      icon={IconBook}
      description="The methodology behind Normen: the seven phases, the four AI stages, and how they connect."
      milestone="milestone 5"
    />
  );
}
