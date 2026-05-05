export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: PaginationState;
}

export const createPagination = <T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number
): PaginatedData<T> => {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    pagination: {
      currentPage,
      itemsPerPage,
      totalItems: items.length,
    },
  };
};

export const getTotalPages = (totalItems: number, itemsPerPage: number): number => {
  return Math.ceil(totalItems / itemsPerPage);
};

export const getPageNumbers = (currentPage: number, totalPages: number): number[] => {
  const delta = 2; // Number of pages to show before and after current page
  const range: number[] = [];
  
  for (
    let i = Math.max(1, currentPage - delta);
    i <= Math.min(totalPages, currentPage + delta);
    i++
  ) {
    range.push(i);
  }
  
  return range;
}; 