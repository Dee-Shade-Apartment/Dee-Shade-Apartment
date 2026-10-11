export const AMENITIES = [
  { name: '24/7 Electricity', icon: 'Zap' },
  { name: 'Standby Generator', icon: 'Plug' },
  { name: 'Snooker Board', icon: 'Circle' },
  { name: 'Table Tennis', icon: 'Table' },
  { name: 'Fully Equipped Kitchen', icon: 'Utensils' },
  { name: 'Heat Extractor', icon: 'Wind' },
  { name: 'Refrigerator', icon: 'Refrigerator' },
  { name: 'Smart TV', icon: 'Tv' },
  { name: 'Netflix', icon: 'Play' },
  { name: 'Amazon Prime Video', icon: 'MonitorPlay' },
  { name: 'Starlink Wi-Fi', icon: 'Wifi' },
  { name: 'Security & CCTV', icon: 'ShieldCheck' },
  { name: 'Serene & Secure Environment', icon: 'Trees' },
  { name: 'Ample Parking Space', icon: 'Car' },
];

export const HOUSE_RULES = [
  'No smoking inside the apartment.',
  'Maximum of four overnight guests per apartment.',
  'Respect the property and neighbours at all times.',
  'Check-in and check-out times are set by management.',
  'The refundable caution fee is returned after checkout subject to inspection.',
];

export const FAQS = [
  {
    question: 'How do I book an apartment?',
    answer: 'Select your check-in and check-out dates on the booking page, enter your guest details, review the price breakdown, then follow the bank transfer instructions. Your booking is confirmed once management verifies your transfer.',
  },
  {
    question: 'Is my booking confirmed immediately after I pay?',
    answer: 'No. Your booking enters a pending state after you upload your receipt and notify us. It becomes confirmed only after management verifies the bank transfer against the actual bank statement.',
  },
  {
    question: 'What is the caution fee?',
    answer: 'A refundable caution fee of ₦50,000 is collected per booking, separate from the accommodation charge. It is returned after checkout once the apartment passes inspection, subject to the property policy.',
  },
  {
    question: 'How many guests can stay overnight?',
    answer: 'Each apartment accommodates a maximum of four overnight guests.',
  },
  {
    question: 'What is the cancellation policy?',
    answer: 'Reservations are non-refundable once confirmed and payment has been verified, subject to applicable law and mandatory consumer protections.',
  },
  {
    question: 'Do you have parking and security?',
    answer: 'Yes. The property has ample parking space, CCTV coverage, and a serene, secure environment.',
  },
];

export const LOST_REASONS = [
  'No availability',
  'Price too high',
  'Slow response',
  'Guest stopped responding',
  'Payment not completed',
  'Booking cancelled',
  'Other',
];

export const REJECTION_REASONS = [
  'Transfer not found',
  'Incorrect amount',
  'Receipt unreadable',
  'Incorrect transfer narration',
  'Duplicate transaction evidence',
  'Other',
];

export const BOOKING_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending Verification',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked In',
  CHECKED_OUT: 'Checked Out',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  CANCELLED: 'Cancelled',
  CONFLICT_REVIEW: 'Conflict Review',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  NOT_SUBMITTED: 'Not Submitted',
  AWAITING_VERIFICATION: 'Awaiting Verification',
  VERIFIED: 'Verified',
  REJECTED: 'Rejected',
  PARTIALLY_VERIFIED: 'Partially Verified',
  REFUND_PENDING: 'Refund Pending',
  REFUNDED: 'Refunded',
};

export const CAUTION_FEE_STATUS_LABELS: Record<string, string> = {
  expected: 'Expected',
  received: 'Received',
  awaiting_inspection: 'Awaiting Inspection',
  eligible_for_refund: 'Eligible for Refund',
  refund_pending: 'Refund Pending',
  refunded: 'Refunded',
  deduction_under_review: 'Deduction Under Review',
  partially_refunded: 'Partially Refunded',
};

export const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin / Owner',
  manager: 'Manager',
  receptionist: 'Receptionist',
  accountant: 'Accountant',
};

export const BUSINESS = {
  name: 'DEESHADES APARTMENT',
  address: 'Gbenga Fapohunda Street, Alagbaka Extension, Akure, Ondo State, Nigeria.',
  standardRate: 100000,
  partyRate: 200000,
  cautionFee: 50000,
  maxOccupancy: 4,
  unitCount: 5,
};
