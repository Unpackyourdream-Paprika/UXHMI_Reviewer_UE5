'use client';

import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import styles from './CSVViewer.module.css';

interface CSVViewerProps {
  data: string;
}

interface Section {
  watermark: string;
  columns: string[];
  displayNames: { [key: string]: string };
}

const CSVViewer: React.FC<CSVViewerProps> = ({ data }) => {
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  // 섹션별 컬럼 정의
  const sections: Section[] = [
    {
      watermark: 'T',
      columns: ['timestamp'],
      displayNames: {
        'timestamp': 'Time'
      }
    },
    {
      watermark: 'VCR',
      columns: ['scenario', 'carName', 'idleTime', 'rpm', 'velocity', 'torque', 'gear', 'steering', 'accelerator', 'brake'],
      displayNames: {
        'scenario': 'Scene',
        'carName': 'Car',
        'idleTime': 'Idle',
        'rpm': 'RPM',
        'velocity': 'Vel',
        'torque': 'Torq',
        'gear': 'Gear',
        'steering': 'Str',
        'accelerator': 'Acc',
        'brake': 'Brk'
      }
    },
    {
      watermark: 'BHV',
      columns: ['isSleep', 'isPhone', 'isDrinking', 'HOD_Dir', 'Sgaze', 'is_drowsy', 'dominant_emotion', 'dominant_action_confidence'],
      displayNames: {
        'isSleep': 'Sleep',
        'isPhone': 'Phone',
        'isDrinking': 'Drink',
        'HOD_Dir': 'HoD',
        'Sgaze': 'Gaze',
        'is_drowsy': 'Drowsy',
        'dominant_emotion': 'Emotion',
        'dominant_action_confidence': 'Action'
      }
    },
    {
      watermark: 'EYE',
      columns: ['fps', 'LeftClosestWindScreen', 'RightClosestWindScreen'],
      displayNames: {
        'fps': 'FPS',
        'LeftClosestWindScreen': 'Left World',
        'RightClosestWindScreen': 'Right World'
      }
    }
  ];

  useEffect(() => {
    if (!data) return;

    try {
      Papa.parse(data, {
        complete: (results: Papa.ParseResult<any>) => {
          if (results.data && Array.isArray(results.data)) {
            // 빈 행이나 불완전한 행 제거
            const validData = results.data.filter(row => 
              Array.isArray(row) && row.length > 1 && row.some(cell => cell !== '')
            );

            if (validData.length === 0) {
              console.error('No valid data found');
              return;
            }

            const headers = validData[0];
            const rows = validData.slice(1);

            console.log('Headers:', headers);
            console.log('First row:', rows[0]);
            console.log('Total rows:', rows.length);

            setHeaders(headers.map((h: string) => String(h).trim()));
            setParsedData(rows.map(row => 
              row.map((cell: any) => {
                if (cell === null || cell === undefined || cell === '') return '';
                // 숫자 처리
                const num = Number(cell);
                if (!isNaN(num)) return num;
                return String(cell).trim();
              })
            ));
          }
        },
        header: false,
        skipEmptyLines: true,
        delimiter: ',',
        dynamicTyping: true
      });
    } catch (error) {
      console.error('Error parsing CSV:', error);
    }
  }, [data]);

  const getColumnIndices = (section: Section): number[] => {
    if (!headers.length) return [];
    
    return section.columns
      .map(colName => {
        const index = headers.findIndex(header => {
          const headerStr = String(header).toLowerCase();
          const colNameStr = colName.toLowerCase();
          // 부분 매칭을 위한 로직 개선
          return headerStr.includes(colNameStr.replace('windscreen', '')) || 
                 colNameStr.includes(headerStr.replace('windscreen', ''));
        });
        if (index === -1) {
          console.warn(`Column not found: ${colName}`);
        }
        return index;
      })
      .filter(index => index !== -1);
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '-';
    
    // 타임스탬프 포맷팅
    if (typeof value === 'string' && value.includes('-') && value.includes(':')) {
      const time = value.split(' ')[1];  // "11:55:39" 부분만 추출
      return time;
    }
    
    if (typeof value === 'number') {
      return Math.abs(value) < 0.01 ? value.toExponential(2) : 
             Number.isInteger(value) ? value.toString() : 
             value.toFixed(4);
    }
    return String(value);
  };

  if (!parsedData.length) {
    return <div className={styles.noData}>데이터를 불러오는 중...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <div className={styles.watermark}>VCRM Data</div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {getColumnIndices(sections[1]).map((colIndex) => (
                  <th key={colIndex}>
                    {sections[1].displayNames[headers[colIndex]] || headers[colIndex]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {getColumnIndices(sections[1]).map((colIndex) => (
                    <td key={colIndex} className={typeof row[colIndex] === 'number' ? styles.numericCell : ''}>
                      {formatValue(row[colIndex])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.watermark}>Eye Tracking Data</div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {getColumnIndices(sections[3]).map((colIndex) => (
                  <th key={colIndex}>
                    {sections[3].displayNames[headers[colIndex]] || headers[colIndex]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {getColumnIndices(sections[3]).map((colIndex) => (
                    <td key={colIndex} className={typeof row[colIndex] === 'number' ? styles.numericCell : ''}>
                      {formatValue(row[colIndex])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.watermark}>Behavior Detection Data</div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                {getColumnIndices(sections[2]).map((colIndex) => (
                  <th key={colIndex}>
                    {sections[2].displayNames[headers[colIndex]] || headers[colIndex]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsedData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {getColumnIndices(sections[2]).map((colIndex) => (
                    <td key={colIndex} className={typeof row[colIndex] === 'number' ? styles.numericCell : ''}>
                      {formatValue(row[colIndex])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CSVViewer; 