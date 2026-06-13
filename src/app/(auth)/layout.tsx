import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#EDE8DF] flex flex-col">
      {/* Minimal header */}
      <header className="border-b border-[#CFC8BC] py-5">
        <div className="max-w-md mx-auto px-6">
          <Link href="/" className="flex items-center gap-2 justify-center">
            <span className="font-mono text-stone-500 text-sm select-none">##</span>
            <span className="font-mono font-bold text-xs tracking-widest uppercase text-stone-900">
              nuclearhustle
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-[#CFC8BC]">
        <Link href="/" className="font-mono text-xs tracking-widest uppercase text-stone-400 hover:text-stone-900 transition-colors">
          ← Back to home
        </Link>
      </footer>
    </div>
  );
}
