import express from 'express';
import { notificationController } from '~/controllers/UsersCollection/NotificationController.js';

const Router6 = express.Router();

Router6.post('/', notificationController.createNotification);
Router6.get('/:userId', notificationController.getNotifications);
Router6.put('/:userId/mark-as-read', notificationController.markAsRead);

export const notificationRoute = Router6;