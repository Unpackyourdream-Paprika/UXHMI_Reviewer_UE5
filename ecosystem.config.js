module.exports = {
  apps: [
    {
      name: 'hyundai-csv-reviewer',
      // script: 'dist/src/main.js',
      script: 'node_modules/next/dist/bin/next',
      instances: '1', // CPU 코어 수만큼 인스턴스 생성
      exec_mode: 'fork', // cluster 모드로 변경
      watch: false, // 파일 변경 감지 비활성화
      max_memory_restart: '300M', // 메모리 제한 설정
      env_production: {
        NODE_ENV: 'production',
      },
      // 로그 설정
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      merge_logs: true,
    },
  ],
};
// #pm2 start ecosystem.config.js --env production
