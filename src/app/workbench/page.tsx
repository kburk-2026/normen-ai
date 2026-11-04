import WorkbenchList from "@/components/workbench/WorkbenchList";

export const metadata = { title: "Workbench · Normen AI" };

export default function Page() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-12">
      <WorkbenchList />
    </section>
  );
}
