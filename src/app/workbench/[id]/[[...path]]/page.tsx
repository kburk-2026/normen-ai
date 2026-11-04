import { Suspense } from "react";
import ProjectShell from "@/components/projects/ProjectShell";

export const metadata = { title: "Project · Normen AI" };

/** /workbench/<id> (all phases), /workbench/<id>/board, /workbench/<id>/<phase>/<section>. */
export default async function Page({ params }: { params: Promise<{ id: string; path?: string[] }> }) {
  const { id, path = [] } = await params;
  return (
    <Suspense>
      <ProjectShell id={decodeURIComponent(id)} path={path.map(decodeURIComponent)} />
    </Suspense>
  );
}
