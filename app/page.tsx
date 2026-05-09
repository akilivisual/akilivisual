import { StageRuntime } from '@/app/runtime/StageRuntime'

export default function Home() {
  return (
    <main className="relative w-full h-screen bg-black overflow-hidden">
      <StageRuntime canvasSlug="canvas_0001" />
    </main>
  )
}
