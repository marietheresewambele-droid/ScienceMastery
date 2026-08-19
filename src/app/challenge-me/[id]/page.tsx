import ChallengeRunner from "@/components/challenge/ChallengeRunner";

export default async function ChallengeMeSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChallengeRunner challengeId={id} />;
}
