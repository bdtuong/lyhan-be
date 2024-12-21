//import thư viện express
import express from 'express'; 
import exitHook from "async-exit-hook"
import { CONNECT_DB, GET_DB, CLOSE_DB } from './src/config/mongodb.js';
import { env } from './src/config/environment.js'
import {APIs_V1} from './src/routes/v1/index.js'

const START_SERVER = ()=>{
  //tạo 1 app express mới
  const app = express();

  //enable red.body json data
  app.use(express.json());
  //use API_V1
  app.use ('/v1', APIs_V1)

  app.listen(env.APP_PORT, env.APP_HOST, () => {
    console.log(`Hello ${env.AUTHOR}, We are running at http://${env.APP_HOST}:${env.APP_PORT}/`);
  });
  //Thực hiện cleanup trước khi dừng server
  exitHook((signal)=>{
    console.log('3.Server is shutting down...')
    CLOSE_DB()
    console.log('4.Disconnected from MongoDB Cloud Atlas')
  })
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

