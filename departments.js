// departments.js
// Demo departments, demo users, demo drugs used by the app.

const DEPARTMENTS = ['Cardiology', 'Pharmacy', 'General Medicine'];

const DEMO_USERS = [
  { email: 'admin@hospital.local', password: 'admin123', role: 'Admin', department: 'All', name: 'Administrator' },
  { email: 'pharma@hospital.local', password: 'pharma123', role: 'Pharmacist', department: 'Pharmacy', name: 'Pharmacist' },
  { email: 'cardio@hospital.local', password: 'cardio123', role: 'Department', department: 'Cardiology', name: 'Cardio Nurse' }
];

const DEMO_DRUGS = [
  {
    id: 'D-001',
    name: 'Aspirin 75mg',
    department: 'Cardiology',
    stock: 120,
    expiry: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
    temp: 22.0,
    restockAt: 50,
    safeRange: { min: 2, max: 30 },
    barcode: 'ASP075'
  },
  {
    id: 'D-002',
    name: 'Atorvastatin 10mg',
    department: 'Pharmacy',
    stock: 40,
    expiry: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString(),
    temp: 24.0,
    restockAt: 60,
    safeRange: { min: 2, max: 30 },
    barcode: 'ATV10'
  },
  {
    id: 'D-003',
    name: 'Paracetamol 500mg',
    department: 'General Medicine',
    stock: 300,
    expiry: new Date(Date.now() + 400 * 24 * 3600 * 1000).toISOString(),
    temp: 25.0,
    restockAt: 100,
    safeRange: { min: 2, max: 35 },
    barcode: 'PCM500'
  },
  {
    id: 'D-004',
    name: 'Insulin (Vial)',
    department: 'Pharmacy',
    stock: 20,
    expiry: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
    temp: 6.0,
    restockAt: 30,
    safeRange: { min: 2, max: 8 },
    barcode: 'INSVIAL'
  }
];

// Expose to window (safe for browsers)
window.DEPARTMENTS = DEPARTMENTS;
window.DEMO_USERS = DEMO_USERS;
window.DEMO_DRUGS = DEMO_DRUGS;
