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
      columns: ['timestamp', 'velocity', 'torque', 'gear', 'steering', 'acceleator', 'brake', 'hor', 'eor', 'dca'],
      displayNames: {
        'timestamp': 'Time',
        'velocity': 'Velocity',
        'torque': 'Torque',
        'gear': 'Gear',
        'steering': 'Steering',
        'acceleator': 'Accelerator',
        'brake': 'Brake',
        'hor': 'HOR',
        'eor': 'EOR',
        'dca': 'DCA'
      },
      columnWidths: {
        'timestamp': '15%',
        'velocity': '15%',
        'torque': '15%',
        'gear': '12%',
        'steering': '15%',
        'acceleator': '15%',
        'brake': '12%',
        'hor': '12%',
        'eor': '12%',
        'dca': '12%'
      }
    },
    {
      watermark: 'Behavior Detection Data',
      columns: ['isSleep', 'isPhone', 'isDrinking', 'is_drowsy', 'dominant_emotion', 'dominant_action'],
      displayNames: {
        'isSleep': 'Sleep',
        'isPhone': 'Phone',
        'isDrinking': 'Drink',
        'is_drowsy': 'Drowsy',
        'dominant_emotion': 'Emotion',
        'dominant_action': 'Action'
      },
      columnWidths: {
        'isSleep': '12%',
        'isPhone': '12%',
        'isDrinking': '12%',
        'is_drowsy': '12%',
        'dominant_emotion': '12%',
        'dominant_action': '12%'
      }
    },
    {
      watermark: 'EYE TRACK DATA',
      columns: ['fps', 'Gaze', 'LeftClosestWorldIntersection', 'RightClosestWorldIntersection'],
      displayNames: {
        'fps': 'FPS',
        'Gaze': 'Gaze',
        'LeftClosestWorldIntersection': 'Left World',
        'RightClosestWorldIntersection': 'Right World'
      },
      columnWidths: {
        'fps': '1%',
        'Gaze': '1.5%',
        'LeftClosestWorldIntersection': '2%',
        'RightClosestWorldIntersection': '2%'
      }
    }
  ];

  useEffect(() => {
    if (!data) return;

    try {
      Papa.parse(data, {
        complete: (results: Papa.ParseResult<any>) => {
          if (results.data && Array.isArray(results.data)) {
            console.log('Raw data length:', results.data.length);
            
            // 완전히 빈 행만 제거
            const validData = results.data.filter(row => 
              Array.isArray(row) && row.length > 0 && row.some(cell => cell !== null)
            );

            console.log('Valid data length:', validData.length);
            console.log('First few rows:', validData.slice(0, 3));

            if (validData.length === 0) {
              console.error('No valid data found');
              return;
            }

            const headers = validData[0];
            // 중복된 행 제거
            const uniqueRows = validData.slice(1).filter((row, index, self) =>
              index === self.findIndex((r) => JSON.stringify(r) === JSON.stringify(row))
            );

            console.log('Unique rows length:', uniqueRows.length);

            setHeaders(headers.map((h: string) => String(h).trim()));
            setParsedData(uniqueRows.map(row => 
              row.map((cell: any) => {
                if (cell === null || cell === undefined || cell === '') return '-';
                // 숫자 처리
                const num = Number(cell);
                if (!isNaN(num)) return num;
                return String(cell).trim() || '-';
              })
            ));
          }
        },
        header: false,
        skipEmptyLines: false,
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
          // 정확한 컬럼 이름 매칭
          return headerStr === colNameStr;
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
    
    // Boolean 값 변환 (isSleep, isPhone, isDrinking, is_drowsy)
    if (columnName === 'isSleep' || columnName === 'isPhone' || columnName === 'isDrinking' || columnName === 'is_drowsy') {
      if (value === 0 || value === '0' || value.toString().toLowerCase() === 'no') return 'FALSE';
      if (value === 1 || value === '1' || value.toString().toLowerCase() === 'yes') return 'TRUE';
      return String(value);
    }
    
    if (columnName === 'timestamp') {
      const date = new Date(value);
      return date.toTimeString().split(' ')[0];
    }
    
    if (typeof value === 'number') {
      if (value === 0) return '0';
      return Number.isInteger(value) ? value.toString() : value.toFixed(2);
    }
    
    return String(value).trim() || '-';
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
                    <th key={colIndex}>
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