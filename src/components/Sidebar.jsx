import React from 'react';
import { Home, Compass, PlaySquare, Bell, User, Settings, Search, MessageCircle, PlusSquare, Tv, LogOut } from 'lucide-react';
import { notificationService } from '../services/supabaseService';

const Sidebar = ({ setView, currentView, user, hasChannel, onLogout }) => {
    const [unreadCount, setUnreadCount] = React.useState(0);

    const loadUnreadCount = React.useCallback(async () => {
        if (!user || user.mode === 'guest') return;
        try {
            const count = await notificationService.getUnreadCount(user.id);
            setUnreadCount(count);
        } catch (err) {
            console.error('Sidebar notification fetch error:', err);
        }
    }, [user]);

    React.useEffect(() => {
        if (user && user.mode !== 'guest') {
            loadUnreadCount();
            const interval = setInterval(loadUnreadCount, 30000); // Check every 30s
            return () => clearInterval(interval);
        }
    }, [user, currentView, loadUnreadCount]); // Refetch on view change too

    const navItems = [
        { name: 'الرئيسية', icon: Home, view: 'home' },
        { name: 'استكشف', icon: Compass, view: 'explore' },
        { name: 'مقاطع', icon: PlaySquare, view: 'shorts' },
        { name: 'الرسائل', icon: MessageCircle, view: 'messages' },
        { name: 'الإشعارات', icon: Bell, view: 'notifications', badge: unreadCount },
        { name: 'إنشاء', icon: PlusSquare, view: 'create' },
    ];

    return (
        <aside className="sidebar">
            {/* Header with Logo + Search */}
            <div className="sidebar-header">
                <div className="logo-wrapper">
                    <div className="logo-icon animate-pulse-glow">ص</div>
                    <span className="logo-text">صُحبة</span>
                </div>
                <div className="search-box">
                    <Search size={18} color="var(--text-muted)" />
                    <input type="text" placeholder="ابحث في صحبة..." />
                </div>
            </div>

            {/* Navigation */}
            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const isActive = currentView === item.view;
                    return (
                        <button
                            key={item.view}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            onClick={() => setView(item.view)}
                        >
                            <span className="nav-icon">
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                                {item.badge > 0 && (
                                    <span className="notification-badge animate-pulse">{item.badge}</span>
                                )}
                            </span>
                            <span>{item.name}</span>
                        </button>
                    );
                })}

                {/* Channel Button — only for logged-in users */}
                {user && user.mode === 'user' && (
                    <button
                        className={`nav-item ${['my-channel', 'create-channel'].includes(currentView) ? 'active' : ''}`}
                        onClick={() => setView(hasChannel ? 'my-channel' : 'create-channel')}
                    >
                        <span className="nav-icon">
                            <Tv size={22} strokeWidth={['my-channel', 'create-channel'].includes(currentView) ? 2.5 : 1.8} />
                        </span>
                        <span>{hasChannel ? 'قناتي' : 'إنشاء قناة'}</span>
                        {!hasChannel && (
                            <span className="channel-new-badge">جديد</span>
                        )}
                    </button>
                )}
            </nav>

            {/* Footer */}
            <div className="sidebar-footer">
                <button
                    className={`nav-item ${currentView === 'profile' ? 'active' : ''}`}
                    onClick={() => setView('profile')}
                >
                    <span className="nav-icon">
                        <User size={22} strokeWidth={1.8} />
                    </span>
                    <span>الملف الشخصي</span>
                </button>
                <button className="nav-item" title="قريباً">
                    <span className="nav-icon">
                        <Settings size={22} strokeWidth={1.8} />
                    </span>
                    <span>الإعدادات</span>
                </button>
                {user?.mode === 'user' && (
                    <button className="nav-item" onClick={onLogout}>
                        <span className="nav-icon">
                            <LogOut size={22} strokeWidth={1.8} />
                        </span>
                        <span>تسجيل الخروج</span>
                    </button>
                )}

                {/* User / Guest info strip */}
                {user && (
                    <div className="user-strip">
                        <div className={`user-strip-avatar ${user.mode === 'guest' ? 'guest' : ''}`}>
                            {user.mode === 'guest' ? '👤' : (user.name ? user.name[0].toUpperCase() : '؟')}
                        </div>
                        <div className="user-strip-meta">
                            <div className="user-strip-name">
                                {user.mode === 'guest' ? 'ضيف' : user.name}
                            </div>
                            {user.mode === 'guest' && (
                                <div className="guest-badge user-strip-badge">وضع الضيف</div>
                            )}
                            {user.mode === 'user' && hasChannel && (
                                <div className="user-strip-role">
                                    <Tv size={12} /> صاحب قناة
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
