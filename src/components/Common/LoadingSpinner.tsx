export const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

export const DashboardSkeleton = () => (
    <div className="animate-pulse flex h-screen">
        <div className="w-64 bg-gray-200"></div>
        <div className="flex-1 p-8">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="h-32 bg-gray-300 rounded"></div>
                <div className="h-32 bg-gray-300 rounded"></div>
                <div className="h-32 bg-gray-300 rounded"></div>
            </div>
        </div>
    </div>
)