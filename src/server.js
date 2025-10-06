// Import thư viện
import express from 'express';
import cors from 'cors';
import { corsOptions } from './config/cors.js';
import exitHook from 'async-exit-hook';
import { CONNECT_DB, CLOSE_DB } from './config/mongodb.js';
import { env } from './config/environment.js';
import { APIs_V1 } from './routes/v1/index.js';
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware.js';
import cookieParser from 'cookie-parser';
import 'module-alias/register';
import { Server } from 'socket.io';
import http from 'http';
import { ObjectId } from 'mongodb';
import { WHITELIST_DOMAINS } from '~/utils/constant.js';
import { AuthModel } from './models/AuthModel.js';
import './passport/google.strategy.js';
const START_SERVER = () => {
  const app = express();
  const server = http.createServer(app);

  // Thiết lập Socket.IO
  const io = new Server(server, {
    cors: {
      origin: WHITELIST_DOMAINS,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  app.set('socketio', io);

  // Xử lý socket connection
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('registerUser', async (userId) => {
      try {
        await AuthModel.updateOne(
          { _id: new ObjectId(userId) },
          { $set: { notificationId: socket.id } }
        );
        socket.join(userId);
      } catch (error) {
        console.error('Error updating notificationId:', error);
      }
    });

    socket.on('disconnect', async () => {
      try {
        await AuthModel.updateOne(
          { notificationId: socket.id },
          { $set: { notificationId: null } }
        );
      } catch (error) {
        console.error('Error clearing notificationId:', error);
      }
    });
  });

  // Route nhẹ để UptimeRobot ping giữ server "tỉnh"
  app.get('/keepalive', (_req, res) => {
    console.log("🐣 PING /keepalive");
    res.status(200).send('Backend is alive!');
  });

  // Middlewares
  app.use(cookieParser());
  app.use(cors(corsOptions));
  app.use(express.json());
  app.use('/v1', APIs_V1);
  app.use(errorHandlingMiddleware);

  // ==== 🔧 Quan trọng cho Render: dùng process.env.PORT và 0.0.0.0 ====
  const PORT = process.env.PORT || env.APP_PORT || 3000;
  const HOST = '0.0.0.0';

  server.listen(PORT, HOST, () => {
    console.log(`✅ Hello ${env.AUTHOR}, server is running on http://${HOST}:${PORT}`);
  });

  // Cleanup khi tắt server
  exitHook(() => {
    console.log('🛑 Server is shutting down...');
    CLOSE_DB();
    console.log('✅ Disconnected from MongoDB Cloud Atlas');
  });
};

// Kết nối MongoDB rồi mới start server
(async () => {
  try {
    console.log('🔄 Connecting to MongoDB Cloud Atlas...');
    await CONNECT_DB();
    console.log('✅ Connected to MongoDB Cloud Atlas!');
    START_SERVER();
  } catch (error) {
    console.error('❌ Failed to connect to DB:', error);
    process.exit(1);
  }
})();
