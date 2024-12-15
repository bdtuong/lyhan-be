// minhnguyencong333
// u4aFxfr2IJAgzStQ
 

// Replace the placeholders in the connection string uri with your credentials
const MONGODB_URI = 'mongodb+srv://minhnguyencong333:u4aFxfr2IJAgzStQ@scout-codesharing.qr0ar.mongodb.net/?retryWrites=true&w=majority&appName=scout-codesharing';
const DATABASE_NAME ='scout-codesharing'
// Create a client with options to specify Stable API Version 1

import { MongoClient, ServerApiVersion } from 'mongodb'
let scoutdatabaseInstance = null

//khởi tạo đối tượng mongoClientInstance để connect tới MongoDB
const mongoClientInstance= new MongoClient(MONGODB_URI,
{
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }

})

export const CONNECT_DB = async () => {
    //gọi kết nối đến MongoDB atlas với URI đã khai báo
    await mongoClientInstance.connect()

    //kết nối thành công thì lấy Database theo tên và gán ngược lại cho biến scoutdatabaseInstance
    scoutdatabaseInstance = mongoClientInstance.db(DATABASE_NAME)
}


//function GET_DB (khoong async) có nhiệm vụ export scoutdatabaseinstant sau khi connect thành công tới MongoDB để sử dụng nhiều nơi
//phải gọi GET_DB sau khi kết nối thành công mongodb
export const GET_DB = ()=> {
    if(!scoutdatabaseInstance) throw new Error('Must connect to Database first!')
    return scoutdatabaseInstance
}