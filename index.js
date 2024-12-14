//import thư viện express
import express from 'express'; 
import { CONNECT_DB, GET_DB } from '~/config/mongodb';


const START_SERVER = ()=>{
  //tạo 1 app express mới
  const app = express(); 

  //các biến lấy ra từ các biến môi trường tương ứng. Giá trị được định nghĩa trong .env
  // eslint-disable-next-line no-undef
  const databaseUrl = process.env.DATABASE_URL;
  // eslint-disable-next-line no-undef
  const apiKey = process.env.API_KEY;
  // eslint-disable-next-line no-undef
  const secretKey = process.env.SECRET_KEY;

  //in giá trị từ biến để kiểm tra
  console.log('Database URL:', databaseUrl);
  console.log('API Key:', apiKey);
  console.log('Secret Key:', secretKey);

  const hostname = 'localhost'
  const port = 8017

  app.get('/', async (req, res) => {
    console.log(await GET_DB().listCollections().toArray())
    res.send('Hello, scout-codesharing!');
  });   

  app.listen(port, hostname, () => {
    console.log(`Hello, We are running at http://${hostname}: ${port}/`);
  });

}


//chỉ khi kết nối tới database thành công mới Start Server backend lên
// Immediately-invoked / Anonymous Async Function (IIFE)
(async ()=> {
  try {
    console.log('1.Connecting to MongoDB Cloud Atlas...')
    await CONNECT_DB()
    console.log('2.Connected to MongoDB Cloud Atlas!')
    START_SERVER()
  } catch (error) {
    console.error(error)
    // eslint-disable-next-line no-undef
    process.exit(0)
    
  }
})()


//chỉ khi kết nối tới database thành công mới Start Server backend lên
/*console.log('1.Connecting to MongoDB Cloud Atlas...')
CONNECT_DB ()
  .then( ()=> console.log('2.Connected to MongoDB Cloud Atlas!'))     //chạy thành công CONNECT_DB
  .then(()=> START_SERVER())  //gọi thẳng đến server
  //error thì exit
  .catch(error => {
    console.error(error)
    process.exit(0)
  })*/