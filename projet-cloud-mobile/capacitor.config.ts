import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mg.lalana.mobile',
  appName: 'Lalana',
  webDir: 'dist',
  plugins: {
    Geolocation: {
      // Request high accuracy location
    }
  },
  android: {
    // Permissions will be added to AndroidManifest.xml
  }
};

export default config;
