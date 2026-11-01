import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ma.successcompass.scapp',
  appName: 'SCAPP',
  webDir: 'dist',
  server: {
    url: 'https://scapp.ma/',
    cleartext: false,
  },
};

export default config;
