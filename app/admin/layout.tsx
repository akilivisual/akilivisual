import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AkiliVisual — Admin',
}

const NAV = [
  { label: 'States', href: '/admin' },
  { label: 'Personas', href: '/admin/personas' },
  { label: 'Media', href: '/admin/media' },
  { label: 'Motion', href: '/admin/motion' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-white/10 flex flex-col">
        {/* Wordmark */}
        <div className="px-6 py-7 border-b border-white/10">
          <Link href="/admin">
            <span className="text-xs tracking-[0.3em] uppercase text-white/90 font-light">
              AkiliVisual
            </span>
          </Link>
          <p className="text-[10px] tracking-[0.2em] uppercase text-white/25 mt-1">
            Admin
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2 rounded text-[11px] tracking-[0.15em] uppercase text-white/40 hover:text-white hover:bg-white/5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Preview link */}
        <div className="px-6 py-5 border-t border-white/10">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-white/25 hover:text-white/60 transition-colors"
          >
            <span className="w-1 h-1 rounded-full bg-white/30" />
            Preview Stage
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
