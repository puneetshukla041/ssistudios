export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[#f8f9fa]">
      <div className="flex items-center font-sans">
        <h1 className="mr-5 border-r border-gray-300 pr-5 text-2xl font-medium text-gray-900">
          404
        </h1>
        <div className="inline-block">
          <h2 className="m-0 text-sm font-normal leading-[28px] text-gray-700">
            This page could not be found.
          </h2>
        </div>
      </div>
    </div>
  );
}