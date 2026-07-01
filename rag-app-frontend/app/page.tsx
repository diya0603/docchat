import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center text-center px-4">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Your documents,{" "}
          <span className="text-gray-400">answered.</span>
        </h1>

        <p className="text-lg text-gray-400 sm:text-xl">
          Upload any PDF and get instant, accurate answers powered by AI.
          No more searching — just ask.
        </p>

        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="w-full rounded-lg bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-gray-200 sm:w-auto"
          >
            Get started for free
          </Link>
          <Link
            href="/login"
            className="w-full rounded-lg border border-gray-600 px-6 py-3 text-sm font-semibold text-gray-300 hover:border-gray-400 hover:text-white sm:w-auto"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}