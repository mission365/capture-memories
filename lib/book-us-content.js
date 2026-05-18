function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export const HARDCODED_CONTACT_NUMBER = '+8801757120383';

export function normalizeBookUsContent(content = {}) {
  const officeLines = Array.isArray(content?.officeLines)
    ? content.officeLines.map((line) => readText(line)).filter(Boolean)
    : [];

  return {
    heading: readText(content?.heading) || 'Book Us',
    subheading:
      readText(content?.subheading) ||
      'Reach out through your preferred contact option and the Capture Memories team will help you with booking details.',
    officeTitle: readText(content?.officeTitle) || 'Our Office',
    officeLines:
      officeLines.length > 0
        ? officeLines
        : ['3B#2nd Floor, House#612, Road#8,', 'Avenue#6, Mirpur DOHS, Dhaka-1216, Bangladesh'],
    phoneTitle: readText(content?.phoneTitle) || 'Phone',
    phoneNumber: HARDCODED_CONTACT_NUMBER,
    emailTitle: readText(content?.emailTitle) || 'E-Mail',
    emailAddress: readText(content?.emailAddress) || 'hello@capturememories.com',
    whatsappTitle: readText(content?.whatsappTitle) || 'WhatsApp',
    whatsappNumber: HARDCODED_CONTACT_NUMBER,
    whatsappLabel: readText(content?.whatsappLabel) || 'Chat on WhatsApp',
    whatsappMessage: readText(content?.whatsappMessage) || 'Hello, I want to know about booking with Capture Memories.',
  };
}

export const DEFAULT_BOOK_US_CONTENT = normalizeBookUsContent({});

export function createWhatsAppLink(content = {}) {
  const normalizedContent = normalizeBookUsContent(content);
  const whatsappNumber = normalizedContent.whatsappNumber.replace(/\D+/g, '');

  if (!whatsappNumber) {
    return '';
  }

  const messageQuery = normalizedContent.whatsappMessage
    ? `?text=${encodeURIComponent(normalizedContent.whatsappMessage)}`
    : '';

  return `https://wa.me/${whatsappNumber}${messageQuery}`;
}
