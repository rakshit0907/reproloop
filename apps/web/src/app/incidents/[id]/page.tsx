import { Suspense } from "react";
import { IncidentDetail } from "@/components/incident-detail";

async function Content({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <IncidentDetail id={id} />;
}

export default function IncidentPage(props: PageProps<"/incidents/[id]">) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Suspense fallback={<p className="text-sm text-neutral-600">Loading…</p>}>
        <Content params={props.params} />
      </Suspense>
    </main>
  );
}