/**
 * CENTRAL CONTACT CONFIGURATION
 *
 * All demo booking, contact, and support email references MUST use these constants.
 * Do NOT hardcode email addresses elsewhere in the codebase.
 *
 * To change the demo booking email, update DEMO_BOOKING_EMAIL below.
 * All components importing from this file will automatically update.
 */

// Primary contact email for all demo bookings, enquiries, and support
export const DEMO_BOOKING_EMAIL = 'georgeapclarke@gmail.com';

// Aliases for semantic clarity (all point to the same email)
export const CONTACT_EMAIL = DEMO_BOOKING_EMAIL;
export const SUPPORT_EMAIL = DEMO_BOOKING_EMAIL;
export const SECURITY_EMAIL = DEMO_BOOKING_EMAIL;

// Demo user access (users with this email get free access)
export const DEMO_USER_EMAIL = DEMO_BOOKING_EMAIL;

// Cal.com booking URL
export const CALENDAR_BOOKING_URL = 'https://cal.com/george-clarke-sxbbdr/30min';

// Form submission endpoint (FormSubmit.co routes to DEMO_BOOKING_EMAIL)
export const FORM_SUBMIT_URL = `https://formsubmit.co/${DEMO_BOOKING_EMAIL}`;

// Mailto links with pre-filled subjects
export const getMailtoLink = (subject?: string, body?: string) => {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const queryString = params.toString();
  return `mailto:${DEMO_BOOKING_EMAIL}${queryString ? '?' + queryString : ''}`;
};

// Pre-configured mailto links
export const MAILTO_DEMO = getMailtoLink('Meridian Demo Request', 'Hi, I would like to book a demo of Meridian.\n\nCompany:\nRole:\nPhone:\n');
export const MAILTO_SUPPORT = getMailtoLink('Meridian Support Request');
export const MAILTO_SECURITY = getMailtoLink('Meridian Security Enquiry');
export const MAILTO_GENERAL = getMailtoLink('Meridian Enquiry');
