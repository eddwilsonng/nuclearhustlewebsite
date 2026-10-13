export function StickyHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-canvas/95 backdrop-blur-sm">
      {children}
    </header>
  );
}
