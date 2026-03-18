import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

const useFilters = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const getFilter = (key) => searchParams.get(key);

  const getFilters = () => {
    const filters = {};
    for (const [key, value] of searchParams.entries()) {
      filters[key] = value;
    }
    return filters;
  };

  const setFilter = useCallback(
    (key, value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (value === null || value === undefined || value === '') {
          next.delete(key);
        } else {
          next.set(key, value);
          if (key !== 'page') {
            next.set('page', '1'); // reset to page 1 on filter change
          }
        }
        return next;
      });
    },
    [setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  const getPage = () => parseInt(searchParams.get('page') || '1', 10);

  return { getFilter, getFilters, setFilter, resetFilters, getPage, searchParams };
};

export default useFilters;
