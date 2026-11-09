import { HomeContent } from "@/components/home-content";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">ReproLoop</h1>
      <p className="mt-2 mb-8 text-neutral-600">
        From user-reported software problems to developer-verified fixes.
      </p>
      <HomeContent />
    </main>
  );
}