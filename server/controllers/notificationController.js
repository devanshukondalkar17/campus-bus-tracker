module.exports = (simulator) => {
  return {
    getNotifications: (req, res) => {
      const allNotifs = simulator.getNotifications();
      const userId = req.user ? req.user.id : null;
      const user = userId ? simulator.getUserById(userId) : null;

      // Filter notifications relevant to this user
      const filtered = allNotifs.filter(n => {
        if (n.targetType === 'ALL') return true;
        if (n.targetType === 'ROUTE' && user && user.assignedRouteId === n.targetId) return true;
        if (n.targetType === 'USER' && user && user.id === n.targetId) return true;
        if (user && user.role === 'admin') return true;
        return false;
      }).map(n => ({
        ...n,
        isRead: userId ? (n.readBy || []).includes(userId) : false
      }));

      const unreadCount = filtered.filter(n => !n.isRead).length;

      res.json({
        success: true,
        notifications: filtered,
        unreadCount
      });
    },

    markAsRead: (req, res) => {
      const { id } = req.params;
      const userId = req.user ? req.user.id : 'demo-user';
      const notif = simulator.getNotifications().find(n => n.id === id);

      if (notif) {
        if (!notif.readBy) notif.readBy = [];
        if (!notif.readBy.includes(userId)) notif.readBy.push(userId);
      }

      res.json({ success: true, message: 'Notification marked as read.' });
    },

    markAllAsRead: (req, res) => {
      const userId = req.user ? req.user.id : 'demo-user';
      simulator.getNotifications().forEach(n => {
        if (!n.readBy) n.readBy = [];
        if (!n.readBy.includes(userId)) n.readBy.push(userId);
      });

      res.json({ success: true, message: 'All notifications marked as read.' });
    }
  };
};
