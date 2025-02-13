import {env} from '../config/environment.js'
export const WHITELIST_DOMAINS = [
    env.FRONTEND_URL,
    'http://localhost:5173',

    // những domain có thể nhận database
]
