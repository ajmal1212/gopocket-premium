import { FrappeApp } from 'frappe-js-sdk';

export const DEFAULT_FRAPPE_URL = 'https://hrms.gopocket.in';
export const DEFAULT_FRAPPE_TOKEN = 'ca55fb5157bea03:39f7391028b27b9';

export function getFrappeUrl(): string {
  const proc = (globalThis as any).process;
  if (proc?.env?.FRAPPE_URL) {
    return proc.env.FRAPPE_URL;
  }
  if (import.meta.env?.FRAPPE_URL) {
    return import.meta.env.FRAPPE_URL;
  }
  return DEFAULT_FRAPPE_URL;
}

export function getFrappeToken(): string {
  const proc = (globalThis as any).process;
  if (proc?.env?.FRAPPE_TOKEN) {
    return proc.env.FRAPPE_TOKEN;
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
  return `${baseUrl}${encodeFilePath(cleanPath)}`;
}

/**
 * Frappe file names often contain spaces and other unsafe characters
 * (e.g. "/files/WhatsApp Image 2026-08-27 at 14.54.36.jpeg"). Encode each
 * segment, leaving already-encoded segments (e.g. "GOPocket%20baner.jpg")
 * untouched so they are not double-escaped.
 */
function encodeFilePath(path: string): string {
  const [pathname, query = ''] = path.split(/\?(.*)/s);

  const encoded = pathname
    .split('/')
    .map((segment) => (/%[0-9A-Fa-f]{2}/.test(segment) ? segment : encodeURIComponent(segment)))
    .join('/');

  return query ? `${encoded}?${query}` : encoded;
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

/* ============================================================================
   BLOG DOCTYPE FUNCTIONS
   ============================================================================ */

/** One row of the `faq` child table on the Blog doctype. */
export interface BlogFaqRow {
  name?: string;
  idx?: number;
  question?: string;
  answer?: string;
}

export interface BlogDoc {
  name: string | number;
  meta_tittle?: string;
  meta_title?: string;
  meta_description?: string;
  slug?: string;
  post_body?: string;
  post_summary?: string | null;
  main_image?: string | null;
  thumbnail_image?: string | null;
  category1?: string | null;
  category2?: string | null;
  category3?: string | null;
  faq?: BlogFaqRow[];
  owner?: string;
  creation?: string;
  modified?: string;
  docstatus?: number;
}

export interface BlogFaq {
  id: string;
  question: string;
  answer: string;
}

export interface FormattedBlog {
  id: string;
  title: string;
  description: string;
  slug: string;
  summary: string;
  mainImage: string;
  thumbnailImage: string;
  /** First entry of `categories`; kept so existing listing code keeps working. */
  category: string;
  categories: string[];
  faqs: BlogFaq[];
  formattedDate: string;
  creation: string;
  modified: string;
  /** ISO-8601 timestamps for schema.org / OpenGraph article metadata. */
  publishedISO: string;
  modifiedISO: string;
  postBody?: string;
}

export function formatPostBody(rawBody?: string): string {
  if (!rawBody) return '';

  let html = rawBody.trim();

  // 0. Frappe stores the body already wrapped in <div class="ql-editor read-mode">.
  //    The article template adds that wrapper itself, so unwrap to avoid nesting.
  const wrapper = html.match(/^<div[^>]*class=["'][^"']*\bql-editor\b[^"']*["'][^>]*>([\s\S]*)<\/div>$/i);
  if (wrapper) {
    html = wrapper[1];
  }

  // 1. Mask existing relative <img> src attributes so they don't contain '/files/' or '/private/files/'
  html = html.replace(/src=["'](\/(?:private\/)?files\/[^"']+)["']/gi, (_match, imgPath) => {
    const fullUrl = getFullImageUrl(imgPath).replace('/files/', '/__MASKED_FILES__/').replace('/private/files/', '/__MASKED_PRIVATE_FILES__/');
    return `src="${fullUrl}"`;
  });

  // 2. Convert any remaining unmasked raw /files/ or /private/files/ text paths into responsive <img> elements
  html = html.replace(
    /(\/(?:private\/)?files\/[^\s<>"']+\.(?:jpg|jpeg|png|webp|gif|svg)(?:\?[^\s<>"']*)?)/gi,
    (match) => {
      const fullUrl = getFullImageUrl(match);
      return `<img src="${fullUrl}" alt="Blog Image" class="w-full h-auto object-cover rounded-3xl my-6 border border-border-light shadow-lg" loading="lazy" />`;
    }
  );

  // 3. Unmask existing <img> src attributes back to normal /files/ and /private/files/
  html = html.replace(/__MASKED_FILES__/g, 'files').replace(/__MASKED_PRIVATE_FILES__/g, 'private/files');

  return html;
}

/**
 * Frappe stores timestamps as "YYYY-MM-DD HH:MM:SS.ffffff" with no timezone, so
 * they are parsed in the server's local zone before being emitted as ISO-8601
 * for schema.org and OpenGraph `article:*` tags.
 */
export function toIsoDate(value?: string | null): string {
  if (!value) return '';
  const dt = new Date(value.replace(' ', 'T'));
  return isNaN(dt.getTime()) ? '' : dt.toISOString();
}

export function formatBlog(doc: BlogDoc): FormattedBlog {
  // Editor-entered fields regularly carry stray whitespace; trim so titles read
  // cleanly and slugs never produce a "%20" tail in the URL.
  const title = (doc.meta_tittle || doc.meta_title || 'Untitled Article').trim();
  const description = (doc.meta_description || doc.post_summary || '').trim();
  const slug = (doc.slug || '').trim() || String(doc.name);
  const creation = doc.creation || '';
  
  let formattedDate = 'Recent';
  if (creation) {
    try {
      const dt = new Date(creation.replace(' ', 'T'));
      if (!isNaN(dt.getTime())) {
        formattedDate = dt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      formattedDate = creation.split(' ')[0] || creation;
    }
  }

  // The Blog doctype replaced the single `blog_category` with up to three
  // category fields; collapse them into one ordered, de-duplicated list.
  const categories = [doc.category1, doc.category2, doc.category3]
    .map((value) => (value || '').trim())
    .filter((value, index, all) => value.length > 0 && all.indexOf(value) === index);

  // `faq` is a child table, so it only arrives from the single-document
  // endpoint; list responses omit it entirely, hence the array guard.
  const faqs = (Array.isArray(doc.faq) ? doc.faq : [])
    .filter((row) => (row?.question || '').trim() && (row?.answer || '').trim())
    .slice()
    .sort((a, b) => (a.idx ?? 0) - (b.idx ?? 0))
    .map((row, index) => ({
      id: `blog-faq-${row.name || index + 1}`,
      question: (row.question || '').trim(),
      answer: (row.answer || '').trim()
    }));

  return {
    id: String(doc.name),
    title,
    description,
    slug,
    summary: doc.post_summary || description,
    mainImage: getFullImageUrl(doc.main_image || doc.thumbnail_image),
    thumbnailImage: getFullImageUrl(doc.thumbnail_image || doc.main_image),
    category: categories[0] || 'Finance',
    categories,
    faqs,
    formattedDate,
    creation,
    modified: doc.modified || '',
    publishedISO: toIsoDate(doc.creation),
    modifiedISO: toIsoDate(doc.modified || doc.creation),
    postBody: formatPostBody(doc.post_body)
  };
}

/**
 * Fetches blog collection list with limit_page_length = 20 (without post_body)
 */
export async function getBlogPosts(limit = 20): Promise<FormattedBlog[]> {
  const fields = [
    'name',
    'meta_tittle',
    'meta_description',
    'slug',
    'main_image',
    'thumbnail_image',
    'category1',
    'category2',
    'category3',
    'creation',
    'modified'
  ];

  // 1. Try SDK
  try {
    const frappe = getFrappeInstance();
    const db = frappe.db();
    const docs = await db.getDocList<BlogDoc>('Blog', {
      fields: fields as any,
      limit,
      orderBy: { field: 'creation', order: 'desc' }
    });

    if (docs && docs.length > 0) {
      return docs.map(formatBlog);
    }
  } catch (error) {
    console.warn('Frappe SDK getBlogPosts failed, trying native fetch...', error);
  }

  // 2. Native fetch
  try {
    const baseUrl = getFrappeUrl();
    const token = getFrappeToken();
    const url = `${baseUrl}/api/resource/Blog?fields=${encodeURIComponent(JSON.stringify(fields))}&limit_page_length=${limit}&order_by=creation desc`;

    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        return json.data.map(formatBlog);
      }
    }
  } catch (error) {
    console.error('Native fetch getBlogPosts failed:', error);
  }

  return [];
}

/**
 * Shared authenticated GET against the Frappe REST API.
 * Returns the parsed `data` payload, or null on any non-OK / network failure.
 */
async function frappeResourceGet<T>(url: string, context: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'Authorization': `token ${getFrappeToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      if (res.status !== 404) {
        console.warn(`Frappe ${context} responded ${res.status} for ${url}`);
      }
      return null;
    }

    const json = await res.json();
    return (json?.data ?? null) as T | null;
  } catch (error) {
    console.error(`Frappe ${context} request failed:`, error);
    return null;
  }
}

/**
 * Fetches one Blog document straight from the single-resource endpoint:
 *   GET /api/resource/Blog/<name>
 * This is the only call that reliably returns the full `post_body`.
 */
export async function getBlogDocByName(name: string | number): Promise<BlogDoc | null> {
  const url = `${getFrappeUrl()}/api/resource/Blog/${encodeURIComponent(String(name))}`;
  return frappeResourceGet<BlogDoc>(url, 'getBlogDocByName');
}

/**
 * Resolves a pretty slug (used in /blog/<slug> URLs) to the Blog record id.
 *   GET /api/resource/Blog?filters=[["slug","=","<slug>"]]&fields=["name"]
 */
export async function getBlogNameBySlug(slug: string): Promise<string | null> {
  const params = new URLSearchParams({
    filters: JSON.stringify([['slug', '=', slug]]),
    fields: JSON.stringify(['name']),
    limit_page_length: '1'
  });

  const url = `${getFrappeUrl()}/api/resource/Blog?${params.toString()}`;
  const rows = await frappeResourceGet<Array<{ name: string | number }>>(url, 'getBlogNameBySlug');

  if (Array.isArray(rows) && rows.length > 0 && rows[0]?.name != null) {
    return String(rows[0].name);
  }
  return null;
}

/**
 * Fetches a single blog post for /blog/<identifier>, where the identifier is
 * either the record id (e.g. "1") or the slug.
 *
 * Both paths converge on GET /api/resource/Blog/<name> so the detail page
 * always renders the same complete document.
 */
export async function getBlogPostBySlugOrId(identifier: string): Promise<FormattedBlog | null> {
  const id = (identifier || '').trim();
  if (!id) return null;

  // 1. Numeric identifiers are record ids - fetch the document directly.
  if (/^\d+$/.test(id)) {
    const doc = await getBlogDocByName(id);
    if (doc) return formatBlog(doc);
  }

  // 2. Otherwise resolve the slug to a record id, then fetch that document.
  const nameFromSlug = await getBlogNameBySlug(id);
  if (nameFromSlug) {
    const doc = await getBlogDocByName(nameFromSlug);
    if (doc) return formatBlog(doc);
  }

  // 3. Last resort: the identifier may itself be a non-numeric record name.
  if (!/^\d+$/.test(id)) {
    const doc = await getBlogDocByName(id);
    if (doc) return formatBlog(doc);
  }

  return null;
}
