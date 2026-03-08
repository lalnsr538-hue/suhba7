import React, { useState, useEffect } from 'react';
import { User, Mail, Calendar, Edit3, Settings, Grid, Bookmark, Loader2, LayoutPanelLeft, Share2 } from 'lucide-react';
import { profileService, postService, bookmarkService } from '../services/supabaseService';

const Profile = ({ user, onNavigate }) => {
    const [profileData, setProfileData] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [savedItems, setSavedItems] = useState([]);
    const [activeTab, setActiveTab] = useState('posts');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.mode !== 'guest') {
            loadProfile();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const [profile, posts, saved] = await Promise.all([
                profileService.getById(user.id),
                postService.getByUser(user.id),
                bookmarkService.getAll(user.id)
            ]);

            setProfileData(profile);
            setUserPosts((posts || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
            setSavedItems(saved || []);
        } catch (err) {
            console.error('Error loading profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = (post) => {
        const url = window.location.origin + '?id=' + post.id;
        navigator.clipboard.writeText(url).then(() => {
            alert('تم نسخ رابط المنشور!');
        });
    };

    if (!user || user.mode === 'guest') {
        return (
            <div className="profile-page page-center page-message">
                <div className="empty-icon-bg float">
                    <User size={32} color="var(--emerald-400)" />
                </div>
                <h2 className="page-message-title">تسجيل الدخول مطلوب</h2>
                <p className="page-message-text">يجب أن تكون مسجلاً لعرض وتعديل ملفك الشخصي.</p>
            </div>
        );
    }

    if (loading || !profileData) {
        return (
            <div className="profile-page page-center">
                <Loader2 size={40} className="animate-spin" color="var(--emerald-400)" />
            </div>
        );
    }

    return (
        <div className="profile-page page-container page-wide animate-fade-in">

            {/* Header Profile Section */}
            <div className="profile-header glass-card">
                <div className="profile-avatar">
                    {profileData.display_name?.[0] || '?'}
                    <button className="profile-avatar-edit" title="قريباً">
                        <Edit3 size={14} />
                    </button>
                </div>

                <h1 className="profile-name">
                    {profileData.display_name}
                </h1>

                <div className="profile-meta-row">
                    <span className="profile-meta-item">
                        <Mail size={16} /> {profileData.email}
                    </span>
                    <span className="profile-meta-item">
                        <Calendar size={16} /> انضم {new Date(profileData.created_at).toLocaleDateString('ar-EG')}
                    </span>
                </div>

                <div className="profile-bio">
                    {profileData.bio || 'لا توجد نبذة شخصية بعد. يمكنك إضافة نبذة ليتعرف عليك الآخرون بسهولة.'}
                </div>

                <div className="profile-actions">
                    <button className="btn-brand">
                        تعديل الملف
                    </button>
                    <button className="btn-ghost">
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {/* Profile Statistics */}
            <div className="profile-stats glass-card">
                <div className="profile-stat">
                    <div className="profile-stat-value">{userPosts.length}</div>
                    <div className="profile-stat-label">منشور</div>
                </div>
                <div className="profile-stat">
                    <div className="profile-stat-value">{savedItems.length}</div>
                    <div className="profile-stat-label">محفوظات</div>
                </div>
            </div>

            {/* Content Tabs */}
            <div className="profile-tabs">
                <button
                    className={`profile-tab ${activeTab === 'posts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('posts')}
                >
                    <Grid size={18} /> منشوراتي
                </button>
                <button
                    className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`}
                    onClick={() => setActiveTab('saved')}
                >
                    <Bookmark size={18} /> العناصر المحفوظة
                </button>
            </div>

            {/* Tab Content */}
            <div className="profile-content">
                {activeTab === 'posts' && (
                    <div className="posts-tab animate-fade-up">
                        {userPosts.length === 0 ? (
                            <div className="empty-state page-empty-block">
                                <LayoutPanelLeft size={32} color="var(--text-muted)" />
                                <p className="empty-subtitle">لم تقم بنشر أي شيء بعد.</p>
                                <button className="btn-brand profile-create-btn" onClick={() => onNavigate('create')}>
                                    إنشاء منشور جديد
                                </button>
                            </div>
                        ) : (
                            <div className="profile-posts-list">
                                {userPosts.map((post) => (
                                    <div key={post.id} className="post-card glass-card profile-post-card">
                                        <p className="profile-post-text">{post.content}</p>
                                        <div className="profile-post-meta">
                                            <div className="profile-post-meta-left">
                                                <span>{new Date(post.created_at).toLocaleDateString('ar-EG')}</span>
                                                <span>{post.likes || 0} إعجاب</span>
                                            </div>
                                            <button onClick={() => handleShare(post)} className="profile-share-btn" title="مشاركة">
                                                <Share2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'saved' && (
                    <div className="saved-tab animate-fade-up">
                        {savedItems.length === 0 ? (
                            <div className="empty-state page-empty-block">
                                <Bookmark size={32} color="var(--text-muted)" />
                                <p className="empty-subtitle">لم تقم بحفظ أي عناصر بعد.</p>
                            </div>
                        ) : (
                            <div className="saved-grid">
                                {savedItems.map(item => (
                                    <div key={item.id} className="saved-item-card glass-card">
                                        <div className="saved-item-thumb">
                                            <LayoutPanelLeft size={24} color="var(--text-muted)" />
                                        </div>
                                        <h4 className="saved-item-title">محتوى محفوظ</h4>
                                        <span className="saved-item-type">{item.content_type}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

export default Profile;
