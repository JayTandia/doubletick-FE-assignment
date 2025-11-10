import React, { useState, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { fetchCustomers, db } from "../lib/db";

// Debounce hook to delay value updates and reduce excessive function calls
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Extract initials from full name (e.g., "John Doe" -> "JD")
function getInitials(name) {
  if (!name) return "??";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Format ISO date to readable format (e.g., "21 October 2025 at 2:31 pm")
function formatTimestamp(isoDate) {
  if (!isoDate) return "—";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(new Date(isoDate));
  } catch (e) {
    return "Invalid Date";
  }
}

export function CustomerList({
  searchTerm,
  style,
  totalCount: initialTotalCount,
  onCountChange,
}) {
  // State management
  const [customers, setCustomers] = useState([]);
  const [listTotalCount, setListTotalCount] = useState(initialTotalCount);
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const debouncedSearchTerm = useDebounce(searchTerm, 250);
  const [fetchRange, setFetchRange] = useState({ offset: 0, limit: 30 });

  // Reset total count when search is cleared
  useEffect(() => {
    if (!debouncedSearchTerm) {
      setListTotalCount(initialTotalCount);
    }
  }, [initialTotalCount, debouncedSearchTerm]);

  // Main data fetching effect - fetches customers based on search, sort, and pagination
  useEffect(() => {
    let isMounted = true;
    let pollInterval = null;

    async function getData() {
      const { data, totalCount: newDbCount } = await fetchCustomers({
        ...fetchRange,
        sortConfig,
        searchTerm: debouncedSearchTerm,
      });

      if (isMounted) {
        setCustomers(data);
        if (newDbCount !== -1) {
          // Search results return specific count
          setListTotalCount(newDbCount);
          onCountChange(newDbCount);
        } else {
          // Get actual count from database for non-search queries
          const actualCount = await db.customers.count();
          setListTotalCount(actualCount);
          onCountChange(actualCount);
        }
      }
    }

    getData();

    // Poll for data when generation is starting (no data exists yet)
    if (!debouncedSearchTerm && initialTotalCount === 0) {
      pollInterval = setInterval(async () => {
        const count = await db.customers.count();
        if (count > 0) {
          getData();
          clearInterval(pollInterval);
        }
      }, 100);
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [
    fetchRange,
    sortConfig,
    debouncedSearchTerm,
    initialTotalCount,
    onCountChange,
  ]);

  // Handle column sorting - toggles between asc/desc
  const handleSort = (key) => {
    setSortConfig((prev) => {
      const direction =
        prev.key === key && prev.direction === "asc" ? "desc" : "asc";
      return { key, direction };
    });
    setFetchRange({ offset: 0, limit: 30 });
  };

  // Refs for virtual scrolling container and header height measurement
  const parentRef = useRef(null);
  const headerHeightRef = useRef(48);

  // Virtualizer config for efficient rendering of large lists
  const rowVirtualizer = useVirtualizer({
    count: listTotalCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 75,
    overscan: 10,
  });

  // Measure actual header height to prevent row overlap
  useEffect(() => {
    const thead = parentRef.current?.querySelector("thead");
    if (thead) {
      headerHeightRef.current = thead.offsetHeight;
    }
  }, []);

  // Get currently visible virtual items and their indices
  const virtualItems = rowVirtualizer.getVirtualItems();
  const firstVirtualIndex = virtualItems[0]?.index;
  const lastVirtualIndex = virtualItems[virtualItems.length - 1]?.index;

  // Update fetch range based on visible items (dynamic pagination)
  useEffect(() => {
    if (virtualItems.length === 0) {
      if (listTotalCount > 0) {
        setFetchRange({ offset: 0, limit: 30 });
      }
      return;
    }
    const first = virtualItems[0].index;
    const last = virtualItems[virtualItems.length - 1].index;

    if (first !== fetchRange.offset || last - first + 1 !== fetchRange.limit) {
      setFetchRange({
        offset: first,
        limit: last - first + 1,
      });
    }
  }, [firstVirtualIndex, lastVirtualIndex, fetchRange, listTotalCount]);

  return (
    <div ref={parentRef} className="table-wrapper" style={style}>
      {/* Virtual scrolling container with calculated total height */}
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        <table style={{ width: "100%" }}>
          {/* Table header with sortable columns */}
          <thead>
            <tr>
              <th onClick={() => handleSort("id")}>
                <input type="checkbox" className="checkbox" />
              </th>
              <th onClick={() => handleSort("name")}>
                Customer{" "}
                {sortConfig.key === "name" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => handleSort("score")}>
                Age{" "}
                {sortConfig.key === "score" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => handleSort("email")}>
                Email{" "}
                {sortConfig.key === "email" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => handleSort("lastMessageAt")}>
                Last message sent at{" "}
                {sortConfig.key === "lastMessageAt" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
              <th onClick={() => handleSort("addedBy")}>
                Added by{" "}
                {sortConfig.key === "addedBy" &&
                  (sortConfig.direction === "asc" ? "▲" : "▼")}
              </th>
            </tr>
          </thead>

          {/* Virtualized table body - only renders visible rows */}
          <tbody style={{ paddingTop: `${headerHeightRef.current}px` }}>
            {rowVirtualizer.getVirtualItems().map((virtualItem) => {
              // Calculate index in fetched customers array
              const customerIndex = virtualItem.index - fetchRange.offset;
              const customerData = customers[customerIndex];

              return (
                <tr
                  key={virtualItem.key}
                  className="table-row"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    // Offset by header height to prevent overlap
                    transform: `translateY(${
                      virtualItem.start + headerHeightRef.current
                    }px)`,
                  }}
                >
                  {!customerData ? (
                    <td colSpan={6}>Loading...</td>
                  ) : (
                    <>
                      <td>
                        <input type="checkbox" className="checkbox" />
                      </td>
                      <td>
                        <div className="customer-cell">
                          <div className="avatar">
                            {getInitials(customerData.name)}
                          </div>
                          <div className="customer-info">
                            <div className="customer-name">
                              {customerData.name}
                            </div>
                            <div className="customer-phone">
                              {customerData.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="count-cell">{customerData.score}</td>
                      <td className="email-cell">{customerData.email}</td>
                      <td className="timestamp">
                        {formatTimestamp(customerData.lastMessageAt)}
                      </td>
                      <td className="added-by">
                        <span className="user-icon">👤</span>
                        {customerData.addedBy}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
