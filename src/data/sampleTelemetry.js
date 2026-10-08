export const sampleTelemetry = [
  {
    id: 'sample-telemetry-1',
    userId: 'sample-user-id',
    deviceId: 'sample-device-id',
    deviceName: 'My Android Phone',
    timestamp: new Date('2026-10-08T20:15:00Z'),
    location: {
      latitude: 17.385,
      longitude: 78.4867,
      accuracy: 12.4,
      altitude: 530.2,
      speed: 0.5,
    },
    gyroscope: { x: 0.012, y: -0.034, z: 0.006 },
    accelerometer: { x: 0.12, y: 9.71, z: 0.21 },
    batteryLevel: 76,
    isCharging: false,
    networkType: 'WiFi',
    androidVersion: '15',
    deviceModel: 'Samsung Galaxy',
    appVersion: '1.0.0',
  },
]
