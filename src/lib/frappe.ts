import { FrappeApp } from 'frappe-js-sdk';

export const DEFAULT_FRAPPE_URL = 'https://hrms.gopocket.in';
export const DEFAULT_FRAPPE_TOKEN = 'ca55fb5157bea03:39f7391028b27b9';

export function getFrappeUrl(): string {
  if (typeof process !== 'undefined' && process.env?.FRAPPE_URL) {
    return process.env.FRAPPE_URL;
  }
  if (import.meta.env?.FRAPPE_URL) {
    return import.meta.env.FRAPPE_URL;
  }
  return DEFAULT_FRAPPE_URL;
}

export function getFrappeToken(): string {
  if (typeof process !== 'undefined' && process.env?.FRAPPE_TOKEN) {
    return process.env.FRAPPE_TOKEN;
  }
  if (import.meta.env?.FRAPPE_TOKEN) {
    return import.meta.env.FRAPPE_TOKEN;
  }
  return DEFAULT_FRAPPE_TOKEN;
}

export function getFrappeInstance(): FrappeApp {
  return new FrappeApp(getFrappeUrl(), {
    useToken: true,
    token: () => getFrappeToken(),
    type: 'token'
  });
}

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

export function getFullImageUrl(imagePath?: string | null): string {
  const baseUrl = getFrappeUrl();
  if (!imagePath) {
    return '/assets/images/learn1.jpeg';
  }
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    if (imagePath.includes('192.168.')) {
      return imagePath.replace(/^http:\/\/[^/]+/, baseUrl);
    }
    return imagePath;
  }
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${baseUrl}${cleanPath}`;
}

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
 * Direct fetch fallback for Edge runtime (Cloudflare Workers) compatibility
 */
async function fetchSeminarsViaNativeFetch(filters?: any[]): Promise<SeminarDoc[]> {
  const baseUrl = getFrappeUrl();
  const token = getFrappeToken();
  
  let url = `${baseUrl}/api/resource/Seminar?fields=["*"]&order_by=date_and_time asc`;
  if (filters && filters.length > 0) {
    url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
  }

  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
  }

  const json = await res.json();
  return json.data || [];
}

/**
 * Fetches seminars with automatic fallback
 */
export async function getSeminars(cutoffDate?: string): Promise<FormattedSeminar[]> {
  const targetDate = cutoffDate || getCurrentFrappeDateTime();
  const filters: any[] = [['Seminar', 'date_and_time', '>=', targetDate]];

  // 1. Try via Frappe SDK
  try {
    const frappe = getFrappeInstance();
    const db = frappe.db();
    const docs = await db.getDocList<SeminarDoc>('Seminar', {
      fields: ['*'],
      filters,
      orderBy: { field: 'date_and_time', order: 'asc' }
    });

    if (docs && docs.length > 0) {
      return docs.map(formatSeminar);
    }
  } catch (error) {
    console.warn('Frappe SDK query failed, trying native fetch fallback...', error);
  }

  // 2. Try via Native Fetch (Cloudflare Workers safe)
  try {
    const docs = await fetchSeminarsViaNativeFetch(filters);
    if (docs && docs.length > 0) {
      return docs.map(formatSeminar);
    }
  } catch (error) {
    console.error('Native fetch query failed:', error);
  }

  // 3. Fallback: If filtered date returned 0 upcoming seminars, fetch all seminars
  try {
    const frappe = getFrappeInstance();
    const db = frappe.db();
    const docs = await db.getDocList<SeminarDoc>('Seminar', {
      fields: ['*'],
      limit: 10,
      orderBy: { field: 'date_and_time', order: 'desc' }
    });
    if (docs && docs.length > 0) {
      return docs.map(formatSeminar);
    }
  } catch {
    // ignore
  }

  try {
    const docs = await fetchSeminarsViaNativeFetch();
    return docs.map(formatSeminar);
  } catch (error) {
    console.error('All seminar fetch strategies failed:', error);
    return [];
  }
}

/**
 * Fetches a single seminar by name (ID)
 */
export async function getSeminarById(id: string): Promise<FormattedSeminar | null> {
  // 1. Try via Frappe SDK
  try {
    const frappe = getFrappeInstance();
    const db = frappe.db();
    const doc = await db.getDoc<SeminarDoc>('Seminar', id);
    if (doc) {
      return formatSeminar(doc);
    }
  } catch (error) {
    console.warn(`SDK getSeminarById failed for ${id}, trying native fetch...`, error);
  }

  // 2. Try via Native Fetch
  try {
    const baseUrl = getFrappeUrl();
    const token = getFrappeToken();
    const res = await fetch(`${baseUrl}/api/resource/Seminar/${encodeURIComponent(id)}`, {
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data) {
        return formatSeminar(json.data);
      }
    }
  } catch (error) {
    console.error(`Native fetch getSeminarById failed for ${id}:`, error);
  }

  return null;
}
