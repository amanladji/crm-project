import api from './api';

const notification = {
    /**
     * Get all notifications for the logged-in user
     */
    getNotifications: () => {
        return api.get('/notifications');
    },

    /**
     * Get count of unread notifications for the logged-in user
     */
    getUnreadCount: () => {
        return api.get('/notifications/unread-count');
    },

    /**
     * Mark a notification as read
     */
    markAsRead: (notificationId) => {
        return api.put(`/notifications/${notificationId}/read`);
    }
};

export default notification;
