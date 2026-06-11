import { TripPlannerClient } from "@/components/trip/TripPlannerClient";

type TripPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;

  return <TripPlannerClient tripId={id} />;
}
