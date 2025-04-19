import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const networkPath = '\\\\192.168.0.39\\csv\\2025-04-19';
    console.log('Accessing network path:', networkPath);

    // 1. 디렉토리 내 파일 목록 읽기
    const files = fs.readdirSync(networkPath);
    console.log('Files in directory:', files);

    // 2. 타임머신 CSV 파일 필터링
    const csvFiles = files.filter(file => 
      file.startsWith('0_timemachine_') && 
      file.endsWith('.csv')
    );
    console.log('CSV files found:', csvFiles);

    if (csvFiles.length === 0) {
      return NextResponse.json({
        error: 'No timemachine CSV files found'
      }, { status: 404 });
    }

    // 3. 최신 파일 찾기
    const latestFile = csvFiles.sort((a, b) => {
      const timeA = a.match(/\d{2}-\d{2}-\d{2}/)?.[0] || '';
      const timeB = b.match(/\d{2}-\d{2}-\d{2}/)?.[0] || '';
      return timeB.localeCompare(timeA);
    })[0];
    console.log('Latest file selected:', latestFile);

    // 4. 파일 읽기
    const filePath = path.join(networkPath, latestFile);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    console.log('File content length:', fileContent.length);

    // 5. 응답 반환
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${latestFile}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

  } catch (error) {
    console.error('Error accessing file:', error);
    return NextResponse.json({
      error: 'Failed to access CSV file',
      details: error.message
    }, { status: 500 });
  }
} 