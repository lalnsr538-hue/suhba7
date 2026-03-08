import React, { useState, useEffect } from 'react';
import { Tv, Users, Video, Film, Settings, PenLine, Loader2, Plus, UserPlus, UserCheck } from 'lucide-react';
import { channelService, videoService, shortsService, followService, notificationService } from '../services/supabaseService';

const ChannelView = ({ user, channelId, onNavigate }) => {
    const [channel, setChannel] = useState(null);
    const [videos, setVideos] = useState([]);
    const [shorts, setShorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('videos');
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [saving, setSaving] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loadingFollow, setLoadingFollow] = useState(false);

    const isOwner = user && channel && user.id === channel.owner_id;

    useEffect(() => {
        loadChannel();
    }, [channelId]);

    const loadChannel = async () => {
        setLoading(true);
        try {
            let ch = null;
            if (channelId) {
                ch = await channelService.getById(channelId);
            } else if (user?.id) {
                ch = await channelService.getByOwner(user.id);
            }
            if (ch) {
                setChannel(ch);
                setEditName(ch.name);
                setEditDesc(ch.description);
                const [vids, shrts] = await Promise.all([
                    videoService.getByChannel(ch.id),
                    shortsService.getByChannel(ch.id),
                ]);
                setVideos(vids);
                setShorts(shrts);

                if (user && user.mode !== 'guest' && user.id !== ch.owner_id) {
                    const following = await followService.isFollowing(user.id, ch.id);
                    setIsFollowing(following);
                }
            }
        } catch (err) {
            console.error('Error loading channel:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editName.trim()) return;
        setSaving(true);
        try {
            const updated = await channelService.update(channel.id, {
                name: editName.trim(),
                description: editDesc.trim(),
            });
            setChannel(updated);
            setEditing(false);
        } catch (err) {
            console.error('Error updating channel:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleFollowToggle = async () => {
        if (!user || user.mode === 'guest') {
            alert('يجب تسجيل الدخول لمتابعة القنوات.');
            return;
        }

        setLoadingFollow(true);
        try {
            const result = await followService.toggle(user.id, channel.id);
            setIsFollowing(result.following);
            setChannel(prev => ({
                ...prev,
                followers_count: Math.max(0, (prev.followers_count || 0) + (result.following ? 1 : -1))
            }));

            if (result.following) {
                await notificationService.push(channel.owner_id, {
                    type: 'follow',
                    message: `بدأ بمتابعة قناتك (${channel.name})`,
                    fromUser: user.name || user.displayName
                });
            }
        } catch (err) {
            console.error('Error toggling follow:', err);
        } finally {
            setLoadingFollow(false);
        }
    };

    if (loading) {
        return (
            <div className="coming-soon-page">
                <Loader2 size={40} color="var(--emerald-400)" className="animate-spin-slow" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>جاري التحميل...</p>
            </div>
        );
    }

    if (!channel) {
        return (
            <div className="coming-soon-page">
                <div className="empty-icon-bg animate-float" style={{ width: '100px', height: '100px', marginBottom: '24px' }}>
                    <Tv size={44} color="var(--emerald-400)" />
                </div>
                <h2 className="coming-soon-title">لا توجد قناة</h2>
                <p className="coming-soon-desc">لم يتم العثور على القناة المطلوبة.</p>
            </div>
        );
    }

    const tabs = [
        { key: 'videos', label: 'فيديوهات', icon: Video, count: videos.length },
        { key: 'shorts', label: 'مقاطع', icon: Film, count: shorts.length },
    ];

    return (
        <div className="channel-page">
            {/* Channel Header / Banner */}
            <div className="channel-banner">
                <div className="channel-banner-gradient" />
                <div className="channel-info-row">
                    <div className="channel-avatar-lg">
                        {channel.avatar_url ? (
                            <img src={channel.avatar_url} alt={channel.name} />
                        ) : (
                            <span>{channel.name[0]}</span>
                        )}
                    </div>

                    <div className="channel-meta">
                        {editing ? (
                            <div className="channel-edit-form">
                                <input
                                    className="form-input"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="اسم القناة"
                                    maxLength={50}
                                />
                                <textarea
                                    className="form-textarea"
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    placeholder="وصف القناة"
                                    maxLength={200}
                                    rows={2}
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        className="btn-brand"
                                        onClick={handleSaveEdit}
                                        disabled={saving}
                                        style={{ fontSize: '13px', padding: '8px 20px' }}
                                    >
                                        {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                                    </button>
                                    <button
                                        className="btn-welcome-ghost"
                                        onClick={() => setEditing(false)}
                                        style={{ fontSize: '13px', padding: '8px 16px' }}
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className="channel-name">{channel.name}</h1>
                                {channel.description && (
                                    <p className="channel-desc">{channel.description}</p>
                                )}
                                <div className="channel-stats">
                                    <span className="channel-stat">
                                        <Users size={16} />
                                        {channel.followers_count || 0} متابع
                                    </span>
                                    <span className="channel-stat">
                                        <Video size={16} />
                                        {channel.videos_count || 0} فيديو
                                    </span>
                                    <span className="channel-stat">
                                        <Film size={16} />
                                        {channel.shorts_count || 0} مقطع
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="channel-actions">
                        {isOwner ? (
                            !editing && (
                                <button
                                    className="btn-outline channel-action-btn"
                                    onClick={() => setEditing(true)}
                                >
                                    <PenLine size={16} />
                                    تعديل
                                </button>
                            )
                        ) : (
                            <button
                                className={isFollowing ? 'btn-outline channel-action-btn' : 'btn-brand channel-action-btn'}
                                onClick={handleFollowToggle}
                                disabled={loadingFollow}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 24px', fontWeight: 'bold'
                                }}
                            >
                                {isFollowing ? (
                                    <><UserCheck size={18} /> تم المتابعة</>
                                ) : (
                                    <><UserPlus size={18} /> متابعة القناة</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="channel-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`channel-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <tab.icon size={18} />
                        <span>{tab.label}</span>
                        <span className="channel-tab-count">{tab.count}</span>
                    </button>
                ))}
            </div>

            {/* Content Grid */}
            <div className="channel-content">
                {activeTab === 'videos' && (
                    videos.length > 0 ? (
                        <div className="content-grid">
                            {videos.map(v => (
                                <div key={v.id} className="content-card glass-card animate-fade-up">
                                    <div className="content-thumb">
                                        {v.thumbnail_url ? (
                                            <img src={v.thumbnail_url} alt={v.title} />
                                        ) : (
                                            <div className="content-thumb-placeholder">
                                                <Video size={32} color="var(--text-muted)" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="content-info">
                                        <h4>{v.title}</h4>
                                        <p>{v.views || 0} مشاهدة</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="channel-empty-tab">
                            <Video size={40} color="var(--text-muted)" style={{ opacity: 0.4 }} />
                            <p>لا توجد فيديوهات بعد</p>
                            {isOwner && (
                                <button className="btn-brand" style={{ marginTop: '12px', fontSize: '14px' }} onClick={() => onNavigate?.('create')}>
                                    <Plus size={16} style={{ marginLeft: '6px' }} />
                                    أضف فيديو
                                </button>
                            )}
                        </div>
                    )
                )}

                {activeTab === 'shorts' && (
                    shorts.length > 0 ? (
                        <div className="content-grid">
                            {shorts.map(s => (
                                <div key={s.id} className="content-card glass-card animate-fade-up">
                                    <div className="content-thumb vertical">
                                        <Film size={32} color="var(--text-muted)" />
                                    </div>
                                    <div className="content-info">
                                        <h4>{s.caption || 'مقطع قصير'}</h4>
                                        <p>{s.likes || 0} إعجاب</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="channel-empty-tab">
                            <Film size={40} color="var(--text-muted)" style={{ opacity: 0.4 }} />
                            <p>لا توجد مقاطع قصيرة بعد</p>
                            {isOwner && (
                                <button className="btn-brand" style={{ marginTop: '12px', fontSize: '14px' }} onClick={() => onNavigate?.('create')}>
                                    <Plus size={16} style={{ marginLeft: '6px' }} />
                                    أضف مقطع
                                </button>
                            )}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default ChannelView;
