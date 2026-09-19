// The single source of truth for every editable string and image on the site.
//
// These values are exactly what the site rendered before the admin panel
// existed. Anything the owners save in /admin is stored in D1 and layered on
// top of this map at render time, so an empty (or unprovisioned) database
// still produces the finished site.

export type FieldType = 'text' | 'textarea' | 'lines' | 'image' | 'toggle';

export type FieldDef = {
  key: string;
  label: string;
  type: FieldType;
  help?: string;
};

export type GroupDef = {
  id: string;
  label: string;
  blurb: string;
  fields: FieldDef[];
};
/**
 * The sections the restaurant actually edits. Everything else on the page keeps
 * the wording in DEFAULT_CONTENT below, which is what the site launched with.
 */
export const CONTENT_GROUPS: GroupDef[] = [
  {
    id: 'announcement',
    label: 'Announcement bar',
    blurb:
      'A single line across the very top of every page. Use it for a holiday closing, a private event, or a special. Turn it off when there is nothing to say.',
    fields: [
      { key: 'announcement.enabled', label: 'Show the bar', type: 'toggle' },
      { key: 'announcement.text', label: 'Message', type: 'text', help: 'Keep it to one short sentence.' },
      {
        key: 'announcement.link_label',
        label: 'Link label (optional)',
        type: 'text',
        help: 'Leave both link fields empty for a message with no link.',
      },
      { key: 'announcement.link_url', label: 'Link address (optional)', type: 'text' },
    ],
  },
  {
    id: 'visit',
    label: 'Hours & visiting',
    blurb: 'Reservations, opening hours, and the address. Change hours here and they update everywhere.',
    fields: [
      { key: 'visit.hours_open_days', label: 'Open days', type: 'text' },
      { key: 'visit.hours_open_times', label: 'Open times', type: 'text' },
      {
        key: 'visit.hours_extra',
        label: 'Extra hours notes',
        type: 'lines',
        help: 'One note per line — for example "Lounge 4:00 PM—close".',
      },
      { key: 'visit.hours_closed_days', label: 'Closed days', type: 'text' },
      { key: 'visit.hours_closed_note', label: 'Closed note', type: 'text' },
      { key: 'visit.address', label: 'Address', type: 'lines', help: 'One line per line break.' },
      { key: 'visit.reservations_note', label: 'Reservations paragraph', type: 'textarea' },
    ],
  },
];

export const DEFAULT_CONTENT: Record<string, string> = {
  'announcement.enabled': 'false',
  'announcement.text': '',
  'announcement.link_label': '',
  'announcement.link_url': '',

  'hero.image': '/media/dining-room.jpg',
  'hero.eyebrow': 'From the coast to Taylor Park',
  'hero.title': 'Ocean fresh.\nVermont rooted.',
  'hero.intro':
    'Fresh seafood, steaks, pasta, and local ingredients—served in the heart of historic downtown Saint Albans.',
  'hero.cta_label': 'Explore the menus',
  'hero.location': '65 North Main · Saint Albans, Vermont',
  'hero.hours_days': 'Tuesday—Saturday',
  'hero.hours_times': '11:00 AM—8:30 PM',

  'welcome.eyebrow': 'A Saint Albans institution',
  'welcome.heading': 'A welcoming table,\nset for every palate.',
  'welcome.body':
    'What began as a roadside seafood truck grew into a downtown gathering place known for fresh catch, warm service, and an easygoing dining room beside Taylor Park.',
  'welcome.link_label': 'Meet Jeff’s',
  'welcome.proof': '1979 | The story begins\nLocal | Farms & vendors\nLunch | Through dinner',

  'menus.eyebrow': 'Lunch, dinner & the lounge',
  'menus.heading': 'Come hungry.\nChoose slowly.',
  'menus.body':
    'Seafood may lead the menu, but it is only the beginning. Jeff’s serves steaks, chicken, pasta, salads, and nightly specials, with local ingredients whenever possible.',
  'menus.note':
    'View the current lunch and dinner menus online. Selections and prices may change; call for nightly specials.',
  'menus.image': '/media/shrimp-scampi.jpg',
  'menus.image_alt': 'Shrimp scampi served over pasta at Jeff’s Seafood.',
  'menus.caption_label': 'From the kitchen',
  'menus.caption_text': 'Fresh seafood and familiar favorites, prepared to order.',

  'story.image': '/media/restaurant-exterior.jpg',
  'story.image_alt': 'Jeff’s restaurant storefront on North Main Street in downtown Saint Albans.',
  'story.stamp': 'Downtown\nSaint Albans',
  'story.eyebrow': 'Since the first fresh catch',
  'story.heading': 'From a roadside truck to a downtown landmark.',
  'story.lede':
    'Jeff’s began in 1979 as a seafood truck selling fresh catch three times a week. Demand led to a market and deli, then to the restaurant at 65 North Main Street in 1989.',
  'story.body':
    'James and Kelli Jehle, who joined the Jeff’s team in 2018, purchased the restaurant in 2025. They carry its next chapter forward after Katie Walsh’s decade of ownership, keeping the focus on thoughtful food and warm local service.',
  'story.timeline':
    '1979 | Roadside seafood truck\n1989 | Restaurant opens here\n2015 | Katie takes the helm\n2025 | James & Kelli take the helm',

  'gather.image': '/media/lounge.jpg',
  'gather.image_alt': 'The brick-walled Lounge at Jeff’s with its bar and gathering tables.',
  'gather.eyebrow': 'Gather at Jeff’s',
  'gather.heading': 'Dinner for two.\nA room for fourteen.\nOr the whole affair.',
  'gather.body':
    'The Lounge, group dining, and full-service catering give every kind of gathering a place at the table—from a simple luncheon to a special celebration.',
  'gather.cta_label': 'Plan it with us',

  'spaces.eyebrow': 'Inside Jeff’s',
  'spaces.heading': 'A room for the\nway you’re dining.',
  'spaces.body':
    'Lunch near the windows. Dinner beneath warm lights. A cocktail against old brick. Jeff’s can feel easygoing or occasion-worthy—often at the same table.',
  'spaces.one_image': '/media/dining-room.jpg',
  'spaces.one_caption': 'Main dining room',
  'spaces.one_alt': 'The warm main dining room with wooden booths and tables.',
  'spaces.two_image': '/media/shrimp-scampi.jpg',
  'spaces.two_caption': 'From the kitchen',
  'spaces.two_alt': 'Shrimp scampi served over pasta.',
  'spaces.three_image': '/media/lounge.jpg',
  'spaces.three_caption': 'The Lounge',
  'spaces.three_alt': 'The Lounge at Jeff’s, framed by historic brick walls.',

  'visit.eyebrow': 'Come to the green',
  'visit.heading': 'Your table\nis waiting.',
  'visit.reservations_note':
    'Please call the restaurant to reserve. For other inquiries, requests, or special events, use the restaurant’s contact form.',
  'visit.hours_open_days': 'Tuesday—Saturday',
  'visit.hours_open_times': '11:00 AM—8:30 PM',
  'visit.hours_extra': 'Limited menu 3:00—4:00 PM\nLounge 4:00 PM—close',
  'visit.hours_closed_days': 'Sunday & Monday',
  'visit.hours_closed_note': 'Closed',
  'visit.address': '65 North Main Street\nSaint Albans, Vermont 05478\nBeside Taylor Park',

  'site.name': 'Jeff’s Seafood',
  'site.wordmark_lead': 'Jeff’s',
  'site.wordmark_small': 'Seafood',
  'site.phone_display': '(802) 524-6135',
  'site.phone_dial': '+18025246135',
  'site.menus_url': 'https://jeffsseafoodvt.com/menus',
  'site.contact_url': 'https://jeffsseafoodvt.com/#9348b19c-e100-4b57-87f3-917139bec823',
  'site.maps_url':
    'https://www.google.com/maps/search/?api=1&query=Jeff%27s+Maine+Seafood+65+North+Main+Street+Saint+Albans+VT+05478',
  'site.facebook_url': 'https://www.facebook.com/jeffsmaineseafood',
  'site.instagram_url': 'https://www.instagram.com/jeffsseafoodvt',
  'site.footer_tagline':
    'Fresh catch, local care, and a place at the table in historic downtown Saint Albans.',
  'site.footer_note': 'Gift cards available by phone or in person',
  'site.seo_description':
    'Fresh seafood, steak, pasta, and local ingredients in historic downtown Saint Albans, Vermont.',
};

export type MenuItem = {
  id: string;
  title: string;
  blurb: string;
  fileUrl: string | null;
  fileType: string | null;
  linkUrl: string | null;
  sortOrder: number;
  status: 'published' | 'draft';
};

/** Shown until the owners add their own menus in /admin. */
export const DEFAULT_MENUS: MenuItem[] = [
  { id: 'lunch', title: 'Lunch', blurb: 'Seafood favorites, salads, sandwiches, pasta, and midday specials.', fileUrl: null, fileType: null, linkUrl: null, sortOrder: 1, status: 'published' },
  { id: 'dinner', title: 'Dinner', blurb: 'Fresh catch, steaks, chicken, pasta, and thoughtfully prepared entrées.', fileUrl: null, fileType: null, linkUrl: null, sortOrder: 2, status: 'published' },
  { id: 'dessert', title: 'Dessert', blurb: 'A sweet finish, from familiar classics to house selections.', fileUrl: null, fileType: null, linkUrl: null, sortOrder: 3, status: 'published' },
  { id: 'drinks', title: 'Drinks', blurb: 'Cocktails, local brews, and relaxed pours in the Lounge at Jeff’s.', fileUrl: null, fileType: null, linkUrl: null, sortOrder: 4, status: 'published' },
  { id: 'wine', title: 'Wine', blurb: 'Bottles and glasses selected to meet seafood, steak, and the moment.', fileUrl: null, fileType: null, linkUrl: null, sortOrder: 5, status: 'published' },
  { id: 'kids', title: 'Kids & platters', blurb: 'Choices for younger guests and seafood platters made for sharing.', fileUrl: null, fileType: null, linkUrl: null, sortOrder: 6, status: 'published' },
];

export type JobItem = {
  id: string;
  title: string;
  schedule: string;
  experience: string;
  duties: string[];
  applyUrl: string;
  sortOrder: number;
  status: 'published' | 'draft';
};

const HIRING_URL = 'https://jeffsseafoodvt.com/jobs';

/** Applications from the jobs page are addressed here. */
export const APPLICATION_EMAIL = 'jamestjehle@gmail.com';

export const DEFAULT_JOBS: JobItem[] = [
  {
    id: 'line-cook',
    title: 'Line Cook',
    schedule: 'AM & PM shifts · Full-time or part-time',
    experience: 'Kitchen experience preferred.',
    duties: [
      'Prepare ingredients and follow kitchen standards for quality and timely service.',
      'Set up, clean, and close stations; keep the kitchen organized.',
      'Learn multiple stations and help teammates with a positive, respectful attitude.',
    ],
    applyUrl: '',
    sortOrder: 1,
    status: 'published',
  },
  {
    id: 'dishwasher',
    title: 'Dishwasher',
    schedule: 'PM shifts',
    experience: 'No experience required. Training available for the right person.',
    duties: [
      'Wash and put away dishes, keeping your station clean and organized.',
      'Help close the kitchen: sweep, mop, and clean equipment.',
      'Support teammates and bring a positive, respectful attitude.',
    ],
    applyUrl: '',
    sortOrder: 2,
    status: 'published',
  },
];

export const HIRING_PAGE_URL = HIRING_URL;
