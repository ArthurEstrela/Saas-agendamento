export const AppointmentCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-5 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
    <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="flex items-center mb-4">
      <div className="w-10 h-10 rounded-full bg-gray-200 mr-3"></div>
      <div className="flex-1">
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6 mt-2"></div>
      </div>
    </div>
    <div className="h-8 bg-gray-200 rounded w-full mt-4"></div>
  </div>
);