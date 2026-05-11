import { StageRuntime } from '@/app/runtime/StageRuntime'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function PreviewPage({ params }: Props) {
  const { slug } = await params
  return (
    <main className="relative w-full h-screen bg-black overflow-hidden">
      <StageRuntime canvasSlug={slug} />
    </main>
  )
}
