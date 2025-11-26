export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
    return (
        <div className="max-w-7xl mx-auto py-8 flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
            </div>
        </div>
    );
}