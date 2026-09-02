import { FrappeApp } from 'frappe-js-sdk';

export const DEFAULT_FRAPPE_URL = 'https://hrms.gopocket.in';

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
  throw new Error(
    'FRAPPE_TOKEN is not set. Add it to .env for local runs and builds, and to ' +
      'the Cloudflare Worker environment for deploys. It is deliberately not ' +
      'hardcoded here so the credential never lands in version control.'
  );
}

export function getFrappeInstance(): FrappeApp {
  return new FrappeApp(getFrappeUrl(), {
    useToken: true,
    token: () => getFrappeToken(),
    type: 'token'
  });
}

/** One row of the `registration_details` child table on the Seminar doctype. */
export interface SeminarRegistrationRow {
  mobile_number?: string;
  full_name?: string;
  city?: string;
  client_code?: string;
  client_name?: string;
  class_code?: string;
  refer?: string;
  mode?: string;
  branch?: string;
  parent1?: string;
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
  registration_details?: SeminarRegistrationRow[];
}

export interface FormattedSeminar {
  id: string;
  /** Date-based URL segment, e.g. "20260831-1600". */
  slug: string;
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
    slug: seminarSlug(doc),
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
 * How long a seminar stays listed after its start time. A session beginning at
 * 14:00 therefore remains visible until 16:00, then drops off.
 */
export const SEMINAR_GRACE_HOURS = 2;

/**
 * Timezone the Frappe site stores its naive "YYYY-MM-DD HH:MM:SS" timestamps
 * in. Every comparison against those values has to be built in this zone, not
 * the host's, or the filter drifts by the offset between them.
 */
export const FRAPPE_TIMEZONE = 'Asia/Kolkata';

/**
 * Formats "now" as a Frappe-style "YYYY-MM-DD HH:MM:SS" timestamp in
 * FRAPPE_TIMEZONE. `offsetHours` shifts the instant first: negative values look
 * backwards, which is how the seminar grace window is expressed.
 *
 * The zone is pinned explicitly rather than read from the host clock because
 * Cloudflare Workers run in UTC while the Frappe site stores IST - relying on
 * the host would silently widen the window by 5.5 hours in production.
 */
export function getCurrentFrappeDateTime(offsetHours = 0): string {
  const instant = new Date(Date.now() + offsetHours * 60 * 60 * 1000);

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: FRAPPE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    // h23 keeps midnight as "00"; hour12:false reports it as "24" in some engines.
    hourCycle: 'h23'
  }).formatToParts(instant);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value ?? '00';

  return `${part('year')}-${part('month')}-${part('day')} ${part('hour')}:${part('minute')}:${part('second')}`;
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
  // Keep a seminar listed until SEMINAR_GRACE_HOURS after it starts.
  const targetDate = cutoffDate || getCurrentFrappeDateTime(-SEMINAR_GRACE_HOURS);
  const filters: any[] = [['Seminar', 'date_and_time', '>=', targetDate]];

  // The two attempts below are TRANSPORT fallbacks only - the SDK is not always
  // usable on the Edge runtime, so a native fetch stands in for it. Whichever
  // one succeeds returns its result verbatim, empty list included: "nothing is
  // running right now" is a correct answer and must never be back-filled with
  // past seminars, which would defeat the date filter entirely.
  try {
    const frappe = getFrappeInstance();
    const db = frappe.db();
    const docs = await db.getDocList<SeminarDoc>('Seminar', {
      fields: ['*'],
      filters,
      orderBy: { field: 'date_and_time', order: 'asc' }
    });
    return (docs || []).map(formatSeminar);
  } catch (error) {
    console.warn('Frappe SDK seminar query failed, trying native fetch...', error);
  }

  try {
    const docs = await fetchSeminarsViaNativeFetch(filters);
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

/** Matches a seminar slug: YYYYMMDD-HHMM, e.g. "20260831-1600". */
const SEMINAR_SLUG_PATTERN = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})$/;

/**
 * Builds the public URL segment for a seminar from its start time, so
 * "2026-08-31 16:00:00" becomes "20260831-1600".
 *
 * `date_and_time` is a naive IST string, and the slug is derived from it by
 * pure string surgery - no Date parsing - so the URL always matches the stored
 * value regardless of the host's timezone. Falls back to the Frappe record id
 * when the timestamp is missing or malformed, so a link is never broken.
 */
export function seminarSlug(doc: Pick<SeminarDoc, 'name' | 'date_and_time'>): string {
  const raw = (doc.date_and_time || '').trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!match) return String(doc.name || '');
  const [, year, month, day, hour, minute] = match;
  return `${year}${month}${day}-${hour}${minute}`;
}

/** Inverse of seminarSlug: "20260831-1600" -> "2026-08-31 16:00:00". */
export function seminarSlugToDateTime(slug: string): string | null {
  const match = slug.match(SEMINAR_SLUG_PATTERN);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  return `${year}-${month}-${day} ${hour}:${minute}:00`;
}

/** Looks up a single seminar by its exact start time. */
async function findSeminarByDateTime(dateTime: string): Promise<SeminarDoc | null> {
  const filters: any[] = [['Seminar', 'date_and_time', '=', dateTime]];

  try {
    const frappe = getFrappeInstance();
    const db = frappe.db();
    const docs = await db.getDocList<SeminarDoc>('Seminar', { fields: ['*'], filters, limit: 1 });
    return docs && docs.length > 0 ? docs[0] : null;
  } catch (error) {
    console.warn('SDK seminar slug lookup failed, trying native fetch...', error);
  }

  try {
    const docs = await fetchSeminarsViaNativeFetch(filters);
    return docs[0] || null;
  } catch (error) {
    console.error('Native fetch seminar slug lookup failed:', error);
    return null;
  }
}

/**
 * Resolves /research-learn/<identifier>, where the identifier is either a
 * date-based slug ("20260831-1600") or - for links created before slugs
 * existed - a raw Frappe record id.
 */
export async function getSeminarBySlugOrId(identifier: string): Promise<FormattedSeminar | null> {
  const value = (identifier || '').trim();
  if (!value) return null;

  const dateTime = seminarSlugToDateTime(value);
  if (dateTime) {
    const doc = await findSeminarByDateTime(dateTime);
    return doc ? formatSeminar(doc) : null;
  }

  return getSeminarById(value);
}

/** Fetches the raw Seminar document, including its registration_details rows. */
export async function getSeminarDocByName(name: string): Promise<SeminarDoc | null> {
  const url = `${getFrappeUrl()}/api/resource/Seminar/${encodeURIComponent(name)}`;
  return frappeResourceGet<SeminarDoc>(url, 'getSeminarDocByName');
}

export type SeminarRegistrationResult =
  | { status: 'ok'; registrations: number }
  | { status: 'not_found' }
  | { status: 'duplicate' }
  | { status: 'error'; message: string };

/**
 * Appends one attendee to a seminar's `registration_details` child table.
 *
 * IMPORTANT: updateDoc replaces a Table field wholesale rather than appending to
 * it, so the existing rows are read first and sent back alongside the new one.
 * Posting just the new row would silently delete every prior registration.
 *
 * This is a read-modify-write, so two people registering in the same instant can
 * race and one row can be lost. Frappe has no append-to-child-table REST call;
 * closing that gap properly needs a server-side whitelisted method.
 */
export async function addSeminarRegistration(
  seminarName: string,
  row: SeminarRegistrationRow
): Promise<SeminarRegistrationResult> {
  const doc = await getSeminarDocByName(seminarName);
  if (!doc) return { status: 'not_found' };

  const existing = Array.isArray(doc.registration_details) ? doc.registration_details : [];
  const mobile = (row.mobile_number || '').trim();

  if (existing.some((entry) => (entry?.mobile_number || '').trim() === mobile)) {
    return { status: 'duplicate' };
  }

  const registration_details = [...existing, row];

  try {
    const frappe = getFrappeInstance();
    await frappe.db().updateDoc('Seminar', seminarName, { registration_details });
    return { status: 'ok', registrations: registration_details.length };
  } catch (error) {
    console.warn('SDK updateDoc failed for seminar registration, trying native fetch...', error);
  }

  try {
    const res = await fetch(`${getFrappeUrl()}/api/resource/Seminar/${encodeURIComponent(seminarName)}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${getFrappeToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ registration_details })
    });

    if (res.ok) return { status: 'ok', registrations: registration_details.length };

    // mobile_number is `unique` on the child doctype, so Frappe rejects a number
    // that is already registered for ANY seminar, not just this one.
    const detail = await res.text();
    if (/DuplicateEntry|already exists|Duplicate entry/i.test(detail)) {
      return { status: 'duplicate' };
    }
    console.error('Seminar registration rejected by Frappe:', res.status, detail.slice(0, 300));
    return { status: 'error', message: `Registration service returned ${res.status}.` };
  } catch (error) {
    console.error('Native fetch seminar registration failed:', error);
    return { status: 'error', message: 'Could not reach the registration service.' };
  }
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

/* ============================================================================
   LEAD CREATION (open-account call-back form)
   ============================================================================ */

export const CREATE_LEAD_METHOD = 'gopocket.website.create_lead';

/** Payload accepted by the `create_lead` whitelisted method. */
export interface CreateLeadParams {
  mobile: string;
  refer: string;
  src: string;
  tag: string;
}

/**
 * Frappe answers with one of three statuses. `client` means the number already
 * belongs to a back-office user, `kyc` means signup is mid-KYC, and
 * `lead_created` is a fresh CRM Lead. The caller routes on the status.
 */
export interface CreateLeadResponse {
  status?: string;
  message?: string;
  lead?: string;
}

export type CreateLeadResult =
  | { ok: true; data: CreateLeadResponse }
  | { ok: false; message: string };

/** Frappe wraps whitelisted-method return values in a top-level `message` key. */
function unwrapMessage(payload: any): CreateLeadResponse | null {
  const body = payload && typeof payload === 'object' ? payload.message : null;
  return body && typeof body === 'object' ? (body as CreateLeadResponse) : null;
}

/**
 * Creates (or matches) a CRM Lead for a mobile number.
 *
 * Every key is always sent, empty string included, because the method expects
 * the full shape rather than a partial payload.
 *
 * Mirrors the fallback used elsewhere in this file: the SDK rides on axios,
 * which is not always happy inside the Cloudflare Worker runtime, so a native
 * fetch stands behind it.
 */
export async function createLead(params: CreateLeadParams): Promise<CreateLeadResult> {
  const payload: CreateLeadParams = {
    mobile: params.mobile || '',
    refer: params.refer || '',
    src: params.src || '',
    tag: params.tag || ''
  };

  try {
    const frappe = getFrappeInstance();
    const response = await frappe.call().post<any>(CREATE_LEAD_METHOD, payload);
    const data = unwrapMessage(response);
    if (data) return { ok: true, data };
    console.error('create_lead returned an unexpected body:', JSON.stringify(response).slice(0, 300));
  } catch (error) {
    console.warn('SDK call().post failed for create_lead, trying native fetch...', error);
  }

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    // The method is whitelisted for guests, so a missing token is not fatal
    // here - send the credential when we have one and carry on when we do not.
    try {
      headers.Authorization = `token ${getFrappeToken()}`;
    } catch {
      /* no token configured */
    }

    const res = await fetch(`${getFrappeUrl()}/api/method/${CREATE_LEAD_METHOD}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const text = await res.text();

    if (!res.ok) {
      console.error('create_lead rejected by Frappe:', res.status, text.slice(0, 300));
      return { ok: false, message: `Lead service returned ${res.status}.` };
    }

    const data = unwrapMessage(JSON.parse(text));
    if (!data) return { ok: false, message: 'Lead service returned an unexpected response.' };
    return { ok: true, data };
  } catch (error) {
    console.error('Native fetch create_lead failed:', error);
    return { ok: false, message: 'Could not reach the lead service.' };
  }
}
