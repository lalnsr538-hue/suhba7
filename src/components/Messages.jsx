import React from 'react';
import { MessageCircle, Search, Mail, ShieldCheck } from 'lucide-react';

const Messages = ({ user }) => {
    if (!user || user.mode === 'guest') {
        return (
            <div className="messages-page page-center page-message">
                <div className="empty-icon-bg float">
                    <Mail size={32} color="var(--emerald-400)" />
                </div>
                <h2 className="page-message-title">تسجيل الدخول مطلوب</h2>
                <p className="page-message-text">يجب أن تكون مسجلاً لإرسال واستقبال الرسائل المباشرة.</p>
            </div>
        );
    }

    return (
        <div className="messages-page page-container page-wide animate-fade-in">
            <h2 className="page-title">
                <MessageCircle size={24} color="var(--emerald-400)" /> الرسائل
            </h2>

            <div className="search-bar-large">
                <Search size={20} color="var(--text-muted)" />
                <input
                    type="text"
                    placeholder="ابحث عن أصدقاء أو رسائل..."
                    className="search-bar-input"
                />
            </div>

            <div className="messages-container">
                <div className="empty-icon-bg float messages-shield-icon">
                    <ShieldCheck size={40} color="var(--gold-500)" />
                </div>
                <h3 className="messages-title">الرسائل المشفرة قريباً</h3>
                <p className="messages-desc">
                    نحن نعمل على بناء نظام مراسلة آمن ومشفر بالكامل لضمان خصوصيتك. ستتمكن من الدردشة مع أصدقائك بخصوصية تامة قريباً!
                </p>
                <div className="demo-contacts">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="demo-contact-avatar" />
                    ))}
                </div>
                <span className="pulse-dot" />
            </div>
        </div>
    );
};

export default Messages;
