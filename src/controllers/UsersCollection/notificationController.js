import { StatusCodes } from 'http-status-codes';
import { NotificationModel } from '~/models/NotificationModel.js';
import { AuthModel } from '~/models/AuthModel.js';

const createNotification = async (req, res) => {
    try {
        const { userId, postId, message, type } = req.body;
        
        if (!userId || !postId || !message || !type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newNotification = await NotificationModel.createNotification({ 
            userId, 
            postId, 
            message, 
            type 
        });

        const io = req.app.get('socketio');
        const user = await AuthModel.findOneById(userId);
        
        if (user?.notificationId) {
            io.to(user.notificationId).emit('newNotification', newNotification);
        }

        res.status(StatusCodes.CREATED).json({ message: 'Notification created' });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
};

const getNotifications = async (req, res) => {
    try {
        const userId = req.params.userId;
        const notifications = await NotificationModel.getNotifications(userId);
        const unreadCount = notifications.filter(notification => !notification.isRead).length;
        res.status(StatusCodes.OK).json({ notifications, unreadCount });
    } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

const markAsRead = async (req, res) => {
    try {
    const userId = req.params.userId;
    await NotificationModel.markAsRead(userId);
    // Emit sự kiện `notificationCountUpdated` cho user
    req.app.get('socketio').to(userId).emit('notificationCountUpdated');

    res.status(StatusCodes.OK).json({ message: 'Notification marked as read' });
    } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to update notification' });
    }
};

export const notificationController = {
    getNotifications,
    markAsRead,
    createNotification,
};