// Server component that passes the id to the client component
import { HorseDetailClient } from "./horse-detail-client"

interface HorseDetailPageProps {
  params: {
    id: string
  }
}

export default function HorseDetailPage({ params }: HorseDetailPageProps) {
  // Access id directly here - this is fine in a Server Component
  return <HorseDetailClient id={params.id} />
}
