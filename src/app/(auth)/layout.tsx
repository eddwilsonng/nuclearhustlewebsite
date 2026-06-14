export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex items-start justify-center px-4 py-8 md:py-12 w-full min-w-0">
      {children}
    </div>
  );
}
