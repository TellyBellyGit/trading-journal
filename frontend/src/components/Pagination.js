import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const Pagination = ({ pagination, onPageChange, className = '' }) => {
    const { currentPage, totalPages, totalCount, hasNextPage, hasPreviousPage } = pagination;
    // Generate page numbers to show
    const getVisiblePages = () => {
        const delta = 2; // Number of pages to show on each side of current page
        const range = [];
        const rangeWithDots = [];
        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }
        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        }
        else {
            rangeWithDots.push(1);
        }
        rangeWithDots.push(...range);
        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        }
        else {
            if (totalPages > 1) {
                rangeWithDots.push(totalPages);
            }
        }
        return rangeWithDots;
    };
    if (totalPages <= 1) {
        return null; // Don't show pagination if only one page
    }
    return (_jsxs("div", { className: `flex items-center justify-between px-4 py-3 bg-gray-800 border-t border-gray-700 ${className}`, children: [_jsxs("div", { className: "flex-1 flex justify-between sm:hidden", children: [_jsx("button", { onClick: () => onPageChange(currentPage - 1), disabled: !hasPreviousPage, className: "relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed", children: "Previous" }), _jsx("button", { onClick: () => onPageChange(currentPage + 1), disabled: !hasNextPage, className: "ml-3 relative inline-flex items-center px-4 py-2 border border-gray-600 text-sm font-medium rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed", children: "Next" })] }), _jsxs("div", { className: "hidden sm:flex-1 sm:flex sm:items-center sm:justify-between", children: [_jsx("div", { children: _jsxs("p", { className: "text-sm text-gray-400", children: ["Showing", ' ', _jsx("span", { className: "font-medium text-white", children: ((currentPage - 1) * 20) + 1 }), ' ', "to", ' ', _jsx("span", { className: "font-medium text-white", children: Math.min(currentPage * 20, totalCount) }), ' ', "of", ' ', _jsx("span", { className: "font-medium text-white", children: totalCount }), ' ', "results"] }) }), _jsx("div", { children: _jsxs("nav", { className: "relative z-0 inline-flex rounded-md shadow-sm -space-x-px", "aria-label": "Pagination", children: [_jsxs("button", { onClick: () => onPageChange(currentPage - 1), disabled: !hasPreviousPage, className: "relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx("span", { className: "sr-only", children: "Previous" }), _jsx("svg", { className: "h-5 w-5", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 20 20", fill: "currentColor", "aria-hidden": "true", children: _jsx("path", { fillRule: "evenodd", d: "M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z", clipRule: "evenodd" }) })] }), getVisiblePages().map((page, index) => {
                                    if (page === '...') {
                                        return (_jsx("span", { className: "relative inline-flex items-center px-4 py-2 border border-gray-600 bg-gray-700 text-sm font-medium text-gray-400", children: "..." }, `dots-${index}`));
                                    }
                                    const pageNum = page;
                                    const isCurrent = pageNum === currentPage;
                                    return (_jsx("button", { onClick: () => onPageChange(pageNum), className: `relative inline-flex items-center px-4 py-2 border text-sm font-medium ${isCurrent
                                            ? 'z-10 bg-blue-600 border-blue-500 text-white'
                                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`, children: pageNum }, pageNum));
                                }), _jsxs("button", { onClick: () => onPageChange(currentPage + 1), disabled: !hasNextPage, className: "relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-700 text-sm font-medium text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed", children: [_jsx("span", { className: "sr-only", children: "Next" }), _jsx("svg", { className: "h-5 w-5", xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 20 20", fill: "currentColor", "aria-hidden": "true", children: _jsx("path", { fillRule: "evenodd", d: "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", clipRule: "evenodd" }) })] })] }) })] })] }));
};
export default Pagination;
