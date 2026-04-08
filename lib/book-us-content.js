function readText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeBookUsContent(content = {}) {
  const officeLines = Array.isArray(content?.officeLines)
    ? content.officeLines.map((line) => readText(line)).filter(Boolean)
    : [];

  return {
    heading: readText(content?.heading) || 'Book Us',
    subheading:
      readText(content?.subheading) ||
      'Reach out through your preferred contact option and we will help you with booking details.',
    officeTitle: readText(content?.officeTitle) || 'Our Office',
    officeLines:
      officeLines.length > 0
        ? officeLines
        : ['3B#2nd Floor, House#612, Road#8,', 'Avenue#6, Mirpur DOHS, Dhaka-1216, Bangladesh'],
    phoneTitle: readText(content?.phoneTitle) || 'Phone',
    phoneNumber: readText(content?.phoneNumber) || '+8801312-030609',
    emailTitle: readText(content?.emailTitle) || 'E-Mail',
    emailAddress: readText(content?.emailAddress) || 'hello@chitrostyle.com',
    whatsappTitle: readText(content?.whatsappTitle) || 'WhatsApp',
    whatsappNumber: readText(content?.whatsappNumber) || '+8801312-030609',
    whatsappLabel: readText(content?.whatsappLabel) || 'Chat on WhatsApp',
    whatsappMessage: readText(content?.whatsappMessage) || 'Hello, I want to know about booking.',
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
