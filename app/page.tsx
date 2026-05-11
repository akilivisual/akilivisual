import { StageCarousel } from '@/app/runtime/StageCarousel'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="relative w-full h-screen bg-black overflow-hidden">
      <StageCarousel />
    </main>
  )
}
