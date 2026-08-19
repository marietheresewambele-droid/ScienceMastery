import PracticalRunner from "@/components/practical/PracticalRunner";

export default async function PracticalModeSessionPage({
  params,
}: {
  params: Promise<{ practicalId: string }>;
}) {
  const { practicalId } = await params;
  return <PracticalRunner practicalId={practicalId} />;
}
