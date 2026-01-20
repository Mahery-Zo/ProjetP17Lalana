import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mg.lalana.app',
  appName: 'Lalana',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
