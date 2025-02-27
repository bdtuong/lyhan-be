import { env } from '~/config/environment.js';
export const WHITELIST_DOMAINS = [
  env.FRONTEND_URL,
  env.CLOUDINARY_URL,
  `https://res.cloudinary.com/dzzpvjxsh/image/upload`,
  // những domain có thể nhận database
];
