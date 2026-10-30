// External destinations used by the reference design's contact actions.
export const INSTAGRAM_HANDLE = 'dr_mythrisharan';
export const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

// Clinic phone numbers, confirmed by the clinic.
export const CLINIC_PHONES = [
  { display: '+91 97341 11222', tel: 'tel:+919734111222' },
  { display: '+91 80901 00569', tel: 'tel:+918090100569' },
];

// Directions are hidden until the clinic confirms the destination. The
// reference site uses this Maps search, which could not be verified to resolve
// to the clinic:
//   https://www.google.com/maps/search/?api=1&query=Birth+Nest+Khajaguda+Hyderabad
// Set this to the confirmed URL to show "Get Directions" / "Directions" again.
export const DIRECTIONS_URL: string | null = null;
