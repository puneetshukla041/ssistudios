import { useState, useEffect, useCallback, useRef } from 'react';
import { IVisitingCardClient, SortConfig, PAGE_LIMIT } from '../utils/constants';

export const useVisitingCardData = (initialData?: { data: IVisitingCardClient[]; total: number; filters: { designations: string[] }; page?: number }) => {
  const [cards, setCards] = useState<IVisitingCardClient[]>(initialData?.data || []);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [uniqueDesignations, setUniqueDesignations] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [designationFilter, setDesignationFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({ key: '_id' as keyof IVisitingCardClient, direction: 'desc' });
  const initialDataHydrated = useRef(false);

  const fetchCards = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: PAGE_LIMIT.toString(),
        q: searchQuery,
        designation: designationFilter
      });

      const res = await fetch(`/api/visitingcards?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setCards(data.data);
        setTotalItems(data.total);
        setUniqueDesignations(data.filters.designations);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, designationFilter]);

  useEffect(() => {
    // If initial data provided from server, hydrate on first render only
    if (initialData && initialData.data && !initialDataHydrated.current) {
      setCards(initialData.data);
      setTotalItems(initialData.total);
      setUniqueDesignations(initialData.filters?.designations || []);
      setCurrentPage(initialData.page || 1);
      setIsLoading(false);
      initialDataHydrated.current = true;
      return;
    }
    fetchCards();
  }, [fetchCards, initialData]);

  return {
    cards,
    isLoading,
    totalItems,
    uniqueDesignations,
    currentPage,
    setCurrentPage,
    searchQuery,
    setSearchQuery,
    designationFilter,
    setDesignationFilter,
    sortConfig,
    setSortConfig,
    fetchCards,
    setCards // Exported for optimistic updates
  };
};