import 'dotenv/config'


export const env = {
    MONGODB_URI: process.env.MONGODB_URI,
    DATABASE_NAME: process.env.DATABASE_NAME,

    APP_HOST: process.env.APP_HOST,
    APP_PORT: process.env.APP_PORT,
    FRONTEND_URL: process.env.FRONTEND_URL,
    JWT_ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET,
    //JWT_REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET,

    BUILD_MODE: process.env.BUILD_MODE,
    
    AUTHOR: process.env.AUTHOR
}