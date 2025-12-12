import type { SubHeaderProps } from '@/types/components';

export function SubHeader({
  headerName,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  showFilterIconButton: _showFilterIconButton = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setOffset: _setOffset,
}: SubHeaderProps) {
  return (
    <div className="mt-2.5 h-[85px] rounded-md flex flex-row justify-center items-center">
      <div className="w-full sm:w-1/4 md:w-1/4">
        <h2 className="text-[#424556] font-bold h-7 text-2xl text-center sm:text-left sm:text-lg sm:pl-1.5">
          {headerName}
        </h2>
      </div>
      <div className="hidden sm:block sm:w-5/12 md:w-1/2" />
      <div className="hidden sm:block sm:w-1/4 md:w-1/4" />
    </div>
  );
}

