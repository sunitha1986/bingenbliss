import { useEffect, useRef, useState } from "react";

export function useScrollLoadedCount(
  totalItems,
  { pageSize = 24, resetKey = "", rootRef = null } = {},
) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef(null);
  const hasMore = visibleCount < totalItems;

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [pageSize, resetKey]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((currentCount) =>
            Math.min(currentCount + pageSize, totalItems),
          );
        }
      },
      {
        root: rootRef?.current || null,
        rootMargin: "160px",
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, pageSize, rootRef, totalItems]);

  return {
    visibleCount: Math.min(visibleCount, totalItems),
    sentinelRef,
    hasMore,
  };
}
