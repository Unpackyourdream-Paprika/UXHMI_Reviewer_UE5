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
  columnWidths?: { [key: string]: string };
}

const CSVViewer: React.FC<CSVViewerProps> = ({ data }) => {
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  // 섹션별 컬럼 정의
  const sections: Section[] = [
    {
      watermark: 'VCRM Data',
      columns: ['timestamp', 'velocity', 'torque', 'gear', 'steering', 'accelerator', 'brake'],
      displayNames: {
        'timestamp': 'Time',
        'velocity': 'Velocity',
        'torque': 'Torq',
        'gear': 'Gear',
        'steering': 'Str',
        'accelerator': 'Acc',
        'brake': 'Brk'
      },
      columnWidths: {
        'timestamp': '80px'
      }
    },
    {
      watermark: 'Behavior Detection Data',
      columns: ['isSleep', 'isPhone', 'isDrinking', 'is_drowsy', 'dominant_emotion', 'dominant_action', 'Sgaze', 'fps', 'LeftClosestWorldIntersection', 'RightClosestWorldIntersection'],
      displayNames: {
        'isSleep': 'Sleep',
        'isPhone': 'Phone',
        'isDrinking': 'Drink',
        'is_drowsy': 'Drowsy',
        'dominant_emotion': 'Emotion',
        'dominant_action': 'Action',
        'Sgaze': 'Gaze',
        'fps': 'FPS',
        'LeftClosestWorldIntersection': 'Left World',
        'RightClosestWorldIntersection': 'Right World'
      },
      columnWidths: {
        'fps': '60px',
        'LeftClosestWorldIntersection': '100px',
        'RightClosestWorldIntersection': '100px'
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

  const formatValue = (value: any, columnName: string): string => {
    if (value === null || value === undefined || value === '') return '-';
    if (columnName === 'timestamp') {
      // 타임스탬프를 시간 형식(HH:MM:SS)으로 변환
      const date = new Date(value);
      return date.toTimeString().split(' ')[0];
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
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className={styles.section}>
          <div className={styles.watermark}>{section.watermark}</div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  {getColumnIndices(section).map((colIndex) => (
                    <th 
                      key={colIndex}
                      style={section.columnWidths?.[headers[colIndex]] ? 
                        { width: section.columnWidths[headers[colIndex]], maxWidth: section.columnWidths[headers[colIndex]] } : 
                        undefined}
                    >
                      {section.displayNames[headers[colIndex]] || headers[colIndex]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsedData.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {getColumnIndices(section).map((colIndex) => (
                      <td 
                        key={colIndex} 
                        className={typeof row[colIndex] === 'number' ? styles.numericCell : ''}
                        style={section.columnWidths?.[headers[colIndex]] ? 
                          { width: section.columnWidths[headers[colIndex]], maxWidth: section.columnWidths[headers[colIndex]] } : 
                          undefined}
                      >
                        {formatValue(row[colIndex], headers[colIndex])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CSVViewer; 