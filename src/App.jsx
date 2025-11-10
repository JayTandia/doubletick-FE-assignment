import React, { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./lib/db";
import { Header } from "./components/Header";
import { CustomerList } from "./components/CustomerList";
import "./App.css";

import WorkerUrl from "./generate-worker.js?worker";

function App() {
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [tableHeight, setTableHeight] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Refs for worker and header elements
  const workerRef = useRef(null);
  const headerRef = useRef(null);

  // Initialize database and start data generation if needed
  useEffect(() => {
    async function initData() {
      try {
        await db.open();
        const count = await db.customers.count();
        setTotalCount(count);

        // Start worker to generate 1M records if count is less than target
        if (count < 1000000) {
          setIsGenerating(true);

          const worker = new WorkerUrl();
          workerRef.current = worker;

          // Handle worker messages (progress, complete, error)
          worker.onmessage = (event) => {
            const { status, newCount } = event.data;

            if (status === "progress" || status === "complete") {
              setTotalCount(newCount);
            }

            if (status === "complete") {
              setIsGenerating(false);
              worker.terminate();
            } else if (status === "error") {
              setIsGenerating(false);
            }
          };

          worker.onerror = (err) => {
            setIsGenerating(false);
          };

          worker.postMessage({ command: "generate" });
        }
      } catch (error) {
        console.error("App: Database initialization failed:", error);
      }
    }
    initData();
    // Cleanup: terminate worker on unmount
    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  // Update total count only when not generating (prevents conflicts)
  const handleCountChange = useCallback(
    (newCount) => {
      if (!isGenerating) {
        setTotalCount(newCount);
      }
    },
    [isGenerating]
  );

  // Calculate table height based on window and header dimensions
  useEffect(() => {
    if (headerRef.current) {
      const headerHeight = headerRef.current.offsetHeight;
      const newHeight = window.innerHeight - headerHeight - 60;
      setTableHeight(newHeight);
    }
  }, []);

  return (
    <div
      className="app-layout"
      style={{ display: "flex", flexDirection: "column", height: "100vh" }}
    >
      {/* Header section with search and filters */}
      <div ref={headerRef}>
        <Header
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          totalCount={totalCount}
        />
      </div>

      {/* Customer list table with virtual scrolling */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <CustomerList
          searchTerm={searchTerm}
          style={{ height: `${tableHeight}px` }}
          totalCount={totalCount}
          onCountChange={handleCountChange}
        />
      </div>
    </div>
  );
}

export default App;
