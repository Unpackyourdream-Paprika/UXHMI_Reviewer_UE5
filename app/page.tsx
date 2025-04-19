'use client';

import { useState, useEffect } from 'react';
import CSVViewer from './components/CSVViewer';
import fs from 'fs/promises';
import path from 'path';

export default function Home() {
  const [csvData, setCsvData] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function loadLatestCSV() {
      try {
        const response = await fetch('/api/getLatestCSV');
        if (!response.ok) {
          throw new Error('Failed to fetch CSV data');
        }
        const data = await response.text();
        setCsvData(data);
      } catch (err) {
        setError('Failed to load CSV file. Please check the network connection.');
        console.error('Error loading CSV:', err);
      }
    }

    loadLatestCSV();
    // 1분마다 데이터 새로고침
    const interval = setInterval(loadLatestCSV, 60000);
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        color: '#ff6b6b',
        textAlign: 'center' 
      }}>
        {error}
      </div>
    );
  }

  return (
    <main className="csv-viewer">
      {csvData ? <CSVViewer data={csvData} /> : (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center' 
        }}>
          Loading data...
        </div>
      )}
    </main>
  );
} 