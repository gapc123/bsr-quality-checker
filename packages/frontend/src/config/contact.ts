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
export const DEMO_BOOKING_EMAIL = 'george@attlee.ai';

// Aliases for semantic clarity (all point to the same email)
export const CONTACT_EMAIL = DEMO_BOOKING_EMAIL;
export const SUPPORT_EMAIL = DEMO_BOOKING_EMAIL;
export const SECURITY_EMAIL = DEMO_BOOKING_EMAIL;

// Demo user access (users with this email get free access)
export const DEMO_USER_EMAIL = DEMO_BOOKING_EMAIL;

// Calendly booking URL
export const CALENDAR_BOOKING_URL = 'https://calendly.com/georgeapclarke/30min';

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
export const MAILTO_DEMO = getMailtoLink(
  'Attlee Demo Request',
  `Hi George,

I'd like to book a demo of Attlee.

Here are some dates and times that work for me:
-
-
-

Looking forward to hearing from you.

Best regards`
);

// Use this for all "Book a Demo" buttons
export const BOOK_DEMO_URL = MAILTO_DEMO;
export const MAILTO_SUPPORT = getMailtoLink('Attlee Support Request');
export const MAILTO_SECURITY = getMailtoLink('Attlee Security Enquiry');
export const MAILTO_GENERAL = getMailtoLink('Attlee Enquiry');
