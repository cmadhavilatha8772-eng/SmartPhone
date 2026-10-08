// Development-only script. This file is not run automatically.
// Use it manually when you want to seed a local Firebase emulator or a dev project.
// Example: node scripts/seedDevelopmentData.js

import { sampleTelemetry } from '../src/data/sampleTelemetry.js'

console.log('Development sample data is available for local testing only.')
console.log(JSON.stringify(sampleTelemetry, null, 2))
