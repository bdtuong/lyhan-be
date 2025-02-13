import {env} from '../config/environment.js'
export const WHITELIST_DOMAINS = [
    env.FRONTEND_URL,
    'https://scout-backend-tvhe.onrender.com',
    // những domain có thể nhận database
]
