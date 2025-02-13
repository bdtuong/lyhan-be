import {env} from '../config/environment.js'
export const WHITELIST_DOMAINS = [
    env.FRONTEND_URL,
    // những domain có thể nhận database
]
