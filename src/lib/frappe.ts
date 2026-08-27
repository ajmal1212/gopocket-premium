import { FrappeApp } from 'frappe-js-sdk';

const FRAPPE_URL = import.meta.env.FRAPPE_URL || 'https://hrms.gopocket.in';
const FRAPPE_TOKEN = import.meta.env.FRAPPE_TOKEN || 'ca55fb5157bea03:39f7391028b27b9';

export const frappe = new FrappeApp(FRAPPE_URL, {
  useToken: true,
  token: () => FRAPPE_TOKEN,
  type: 'token'
});

export interface SeminarDoc {
  name: string;
  tittle?: string;
  title?: string;
  description?: string;
  date_and_time?: string;
  type?: string;
  cost?: string;
  language?: string;
  image?: string | null;
  owner?: string;
  creation?: string;
  modified?: string;
  docstatus?: number;
}

export interface FormattedSeminar {
  id: string;
  title: string;
  description: string;
  date_and_time: string;
  formattedDate: string;
  formattedTime: string;
  type: string;
  cost: string;
  language: string;
  image: string;
  rawImage?: string | null;
}

/**
 * Normalizes image URL from Frappe
 */
export function getFullImageUrl(imagePath?: string | null): string {
  if (!imagePath) {
    return '/assets/images/learn1.jpeg';
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    if (imagePath.includes('192.168.')) {
      return imagePath.replace(/^http:\/\/[^/]+/, FRAPPE_URL);
    }
    return imagePath;
  }
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${FRAPPE_URL}${cleanPath}`;
}

/**
 * Formats raw Seminar doc from Frappe to clean frontend structure
 */
export function formatSeminar(doc: SeminarDoc): FormattedSeminar {
  const title = doc.tittle || doc.title || 'Untitled Masterclass';
  const description = (doc.description || '').trim();
  const rawDateTime = doc.date_and_time || '';
  
  let formattedDate = 'Upcoming';
  let formattedTime = '';

  if (rawDateTime) {
    try {
      const dt = new Date(rawDateTime.replace(' ', 'T'));
      if (!isNaN(dt.getTime())) {
        formattedDate = dt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        formattedTime = dt.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      } else {
        const parts = rawDateTime.split(' ');
        formattedDate = parts[0] || rawDateTime;
        formattedTime = parts[1] || '';
      }
    } catch {
      formattedDate = rawDateTime;
    }
  }

  return {
    id: doc.name,
    title,
    description,
    date_and_time: rawDateTime,
    formattedDate,
    formattedTime,
    type: doc.type || 'Online',
    cost: doc.cost || 'Free',
    language: doc.language || 'Tamil',
    image: getFullImageUrl(doc.image),
    rawImage: doc.image
  };
}

/**
 * Formats current Date to Frappe datetime string (YYYY-MM-DD HH:mm:ss)
 */
export function getCurrentFrappeDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Fetches seminars filtered by date_and_time >= cutoffDate (defaults to current time)
 */
export async function getSeminars(cutoffDate?: string): Promise<FormattedSeminar[]> {
  try {
    const db = frappe.db();
    const targetDate = cutoffDate || getCurrentFrappeDateTime();
    
    const filters: any[] = [
      ['Seminar', 'date_and_time', '>=', targetDate]
    ];

    const docs = await db.getDocList<SeminarDoc>('Seminar', {
      fields: ['*'],
      filters,
      orderBy: { field: 'date_and_time', order: 'asc' }
    });

    return (docs || []).map(formatSeminar);
  } catch (error) {
    console.error('Error fetching seminars via Frappe SDK:', error);
    return [];
  }
}

/**
 * Fetches a single seminar by name (ID)
 */
export async function getSeminarById(id: string): Promise<FormattedSeminar | null> {
  try {
    const db = frappe.db();
    const doc = await db.getDoc<SeminarDoc>('Seminar', id);
    if (doc) {
      return formatSeminar(doc);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching seminar ${id} via Frappe SDK:`, error);
    return null;
  }
}
