import { useState } from "react";
import {
  AiOutlineFastBackward,
  AiFillFastForward,
  AiOutlineArrowRight,
  AiOutlineArrowLeft,
} from "react-icons/ai";

const range = (start, end) => {
  return [...Array(end - start).keys()].map((el) => el + start);
};

const getPagesCut = ({ pagesCount, pagesCutCount, currentPage }) => {
  const ceiling = Math.ceil(pagesCutCount / 2);
  const floor = Math.floor(pagesCutCount / 2);
  if (pagesCount <= pagesCutCount) {
    return { start: 1, end: pagesCount + 1 };
  } else if (currentPage <= ceiling) {
    return { start: 1, end: pagesCutCount + 1 };
  } else if (currentPage + floor >= pagesCount) {
    return { start: pagesCount - pagesCutCount + 1, end: pagesCount + 1 };
  } else {
    return {
      start: currentPage - ceiling + 1,
      end: currentPage + floor + 1,
    };
  }
};

const PaginationItem = ({ page, currentPage, onPageChange, isDisabled }) => {
  const isActive = page === Number(currentPage);
  const isIcon = typeof page !== 'number';
  
  return (
    <button
      className={`
        ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
        ${isActive 
          ? 'bg-red-600 text-white shadow-lg shadow-red-600/25' 
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
        }
        ${isIcon ? 'w-8 h-8 sm:w-10 sm:h-10' : 'min-w-[2rem] sm:min-w-[2.5rem] h-8 sm:h-10 px-2 sm:px-3'}
        border-none rounded-md sm:rounded-lg flex items-center justify-center
        transition-all duration-200 ease-out
        font-medium text-xs sm:text-sm
        backdrop-blur-sm
        flex-shrink-0
      `}
      onClick={() => !isDisabled && onPageChange(page)}
      disabled={isDisabled}
    >
      {isIcon ? (
        <span className="text-sm sm:text-lg">{page}</span>
      ) : (
        <span>{page}</span>
      )}
    </button>
  );
};

const Pagination = ({ currentPage, total, limit, onPageChange, pagesNum }) => {
  const [goToPage, setGoToPage] = useState('');
  const pagesCount = Math.ceil(total / limit);
  const pagesCut = getPagesCut({ pagesCount, pagesCutCount: 5, currentPage });
  const pages = range(pagesCut.start, pagesCut.end);
  const isFirstPage = Number(currentPage) === 1;
  const isLastPage = Number(currentPage) === pagesCount;

  const handleGoToPage = () => {
    const pageNum = parseInt(goToPage, 10);
    if (pageNum >= 1 && pageNum <= pagesCount) {
      onPageChange(pageNum);
      setGoToPage('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleGoToPage();
    }
  };

  if (pagesCount <= 1) return null;

  return (
    <div className="flex flex-col justify-center items-center mt-12 mb-8 px-2 sm:px-4 gap-4">
      {/* Pagination Bar */}
      <div className="flex items-center gap-1 sm:gap-2 p-1 sm:p-2 bg-gray-900/60 backdrop-blur-md rounded-xl sm:rounded-2xl border border-gray-800 shadow-2xl max-w-full overflow-hidden">
        <PaginationItem
          page={<AiOutlineFastBackward />}
          currentPage={Number(currentPage)}
          onPageChange={() => onPageChange(1)}
          isDisabled={isFirstPage}
        />
        <PaginationItem
          page={<AiOutlineArrowLeft />}
          currentPage={Number(currentPage)}
          onPageChange={() => onPageChange(Number(currentPage) - 1)}
          isDisabled={isFirstPage}
        />
        
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide max-w-[200px] sm:max-w-none">
          {pages.map((page) => (
            <PaginationItem
              page={page}
              key={page}
              currentPage={Number(currentPage)}
              onPageChange={onPageChange}
            />
          ))}
        </div>
        
        <PaginationItem
          page={<AiOutlineArrowRight />}
          currentPage={Number(currentPage)}
          onPageChange={() => onPageChange(Number(currentPage) + 1)}
          isDisabled={isLastPage}
        />
        <PaginationItem
          page={<AiFillFastForward />}
          currentPage={Number(currentPage)}
          onPageChange={() => onPageChange(pagesNum)}
          isDisabled={isLastPage}
        />
      </div>

      {/* Go to Page Input */}
      <div className="flex items-center gap-2 bg-gray-900/60 backdrop-blur-md rounded-xl sm:rounded-2xl border border-gray-800 shadow-2xl p-2">
        <input
          type="number"
          min="1"
          max={pagesCount}
          value={goToPage}
          onChange={(e) => {
            const value = e.target.value;
            if (value === '' || (parseInt(value, 10) >= 1 && parseInt(value, 10) <= pagesCount)) {
              setGoToPage(value);
            }
          }}
          onKeyPress={handleKeyPress}
          placeholder={`Go to page (1-${pagesCount})`}
          className="bg-gray-800/80 text-white placeholder-gray-400 border border-gray-700 rounded-lg px-3 py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent w-32 sm:w-40 md:w-48 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={handleGoToPage}
          disabled={!goToPage || parseInt(goToPage, 10) < 1 || parseInt(goToPage, 10) > pagesCount}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg px-4 py-2 flex items-center gap-1 sm:gap-2 transition-all duration-200 ease-out font-medium text-sm sm:text-base hover:scale-105 active:scale-95 shadow-lg shadow-red-600/25"
        >
          <span>Go</span>
          <AiOutlineArrowRight className="text-sm sm:text-base" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
