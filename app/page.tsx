'use client';

import { useEffect, useState } from 'react';
import CSVViewer from './components/CSVViewer';

export default function Home() {
  const [csvData, setCsvData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCSV() {
      try {
        const response = await fetch('/api/getLatestCSV');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch CSV file');
        }
        const data = await response.text();
        setCsvData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load CSV file');
      } finally {
        setIsLoading(false);
      }
    }

    loadCSV();

    // 1분마다 데이터 새로고침
    const interval = setInterval(loadCSV, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-5 sm:p-6">
            {error && (
              <div className="p-4 mb-4 text-red-700 bg-red-100 rounded">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="p-4 text-gray-700">
                Loading CSV data...
              </div>
            )}

            {csvData && !isLoading && (
              <CSVViewer data={csvData} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
} 