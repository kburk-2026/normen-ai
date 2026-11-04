import { IconGitCommit } from "@tabler/icons-react";
import ComingSoon from "@/components/ComingSoon";

export const metadata = { title: "Shipped · Normen AI" };

export default function Page() {
  return (
    <ComingSoon
      title="Shipped"
      icon={IconGitCommit}
      description="A running log of what changed in Normen AI and when."
      milestone="milestone 5"
    />
  );
}
