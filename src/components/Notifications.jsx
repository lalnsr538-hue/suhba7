import React, { useState, useEffect } from 'react';
import { Bell, UserPlus, Heart, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';
import { notificationService } from '../services/supabaseService';

const Notifications = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.mode !== 'guest') {
            loadNotifications();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await notificationService.getAll(user.id);
            setNotifications(data);

            // Mark all as read after loading
            setTimeout(() => {
                notificationService.markAllRead(user.id);
            }, 3000);
        } catch (err) {
            console.error('Error loading notifications:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!user || user.mode === 'guest') {
        return (
            <div className="notifications-page page-center page-message">
                <div className="empty-icon-bg float">
                    <AlertCircle size={32} color="var(--gold-500)" />
                </div>
                <h2 className="page-message-title">تسجيل الدخول مطلوب</h2>
                <p className="page-message-text">يجب أن تكون مسجلاً لترى إشعاراتك وتفاعلات أصدقائك.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="notifications-page page-center">
                <Loader2 size={40} className="animate-spin" color="var(--emerald-400)" />
            </div>
        );
    }

    const getIcon = (type) => {
        switch (type) {
            case 'like': return <Heart size={20} color="#f43f5e" />;
            case 'comment': return <MessageCircle size={20} color="var(--emerald-400)" />;
            case 'follow': return <UserPlus size={20} color="var(--emerald-400)" />;
            default: return <Bell size={20} color="var(--gold-500)" />;
        }
    };

    return (
        <div className="notifications-page page-container page-narrow animate-fade-in">
            <h2 className="page-title">
                <Bell size={24} color="var(--emerald-400)" /> الإشعارات
            </h2>

            {notifications.length === 0 ? (
                <div className="empty-state page-empty-block">
                    <div className="float notifications-empty-icon">
                        <Bell size={32} color="var(--emerald-400)" />
                    </div>
                    <h3 className="empty-title">لا توجد إشعارات جديدة</h3>
                    <p className="empty-subtitle">عندما يتفاعل شخص ما مع محتواك، سيظهر إشعاره هنا.</p>
                </div>
            ) : (
                <div className="notifications-list">
                    {notifications.map((notif, i) => (
                        <div
                            key={notif.id}
                            className={`notification-card glass-card animate-fade-up stagger-${(i % 5) + 1} ${notif.read ? '' : 'unread'}`}
                        >
                            <div className="notif-icon">
                                {getIcon(notif.type)}
                            </div>
                            <div className="notif-content">
                                <p className="notif-message">
                                    {notif.from_user && <strong className="notif-user">{notif.from_user}</strong>}
                                    {' '}{notif.message}
                                </p>
                                <span className="notif-date">
                                    {new Date(notif.created_at).toLocaleDateString('ar-EG', { hour: 'numeric', minute: 'numeric' })}
                                </span>
                            </div>
                            {!notif.read && <div className="notif-unread-dot" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Notifications;
