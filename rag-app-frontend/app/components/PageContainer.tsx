export default function PageContainer({
  children,
  centered = false,
}: {
  children: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <div
      className={`mx-auto max-w-2xl px-4 py-8 ${
        centered ? 'flex min-h-[calc(100vh-57px)] items-center justify-center' : ''
      }`}
    >
      {children}
    </div>
  );
}