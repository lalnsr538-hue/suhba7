import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Loader2, Film } from 'lucide-react';
import { shortsService, followService, likeService, notificationService } from '../services/supabaseService';
import CommentsSection from './CommentsSection';

const ShortsFeed = ({ user }) => {
    const [shorts, setShorts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeComments, setActiveComments] = useState(null);
    const [followedChannels, setFollowedChannels] = useState(new Set());
    const [likedShorts, setLikedShorts] = useState(new Set());
    const [loadingFollow, setLoadingFollow] = useState(false);

    useEffect(() => {
        loadShorts();
        if (user && user.mode !== 'guest') {
            loadFollowing();
        }
    }, [user]);

    const loadFollowing = async () => {
        try {
            const list = await followService.getFollowing(user.id);
            setFollowedChannels(new Set(list));
        } catch (err) {
            console.error('Error loading following channels:', err);
        }
    };

    const loadShorts = async () => {
        setLoading(true);
        try {
            const data = await shortsService.getFeed(10);
            setShorts(data);

            // Load liked status
            if (user && user.mode !== 'guest') {
                const likedSet = new Set();
                for (const s of data) {
                    const isLiked = await likeService.isLiked(user.id, s.id, 'short');
                    if (isLiked) likedSet.add(s.id);
                }
                setLikedShorts(likedSet);
            }
        } catch (err) {
            console.error('Error loading shorts:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (short) => {
        if (!user || user.mode === 'guest') {
            alert('يجب تسجيل الدخول للإعجاب بالمحتوى');
            return;
        }

        const wasLiked = likedShorts.has(short.id);
        const diff = wasLiked ? -1 : 1;

        // Optimistic UI update
        setLikedShorts(prev => {
            const next = new Set(prev);
            if (wasLiked) next.delete(short.id);
            else next.add(short.id);
            return next;
        });
        setShorts(prev => prev.map(s => {
            if (s.id === short.id) {
                return { ...s, likes: Math.max(0, (s.likes || 0) + diff) };
            }
            return s;
        }));

        try {
            await likeService.toggle(user.id, short.id, 'short');

            if (!wasLiked && short.author_id !== user.id) {
                await notificationService.push(short.author_id, {
                    type: 'like',
                    message: `أعجب بمقطعك القصير`,
                    fromUser: user.name || user.displayName,
                    contentId: short.id
                });
            }
        } catch (err) {
            console.error('Like error:', err);
            loadShorts();
        }
    };

    const handleShare = (short) => {
        const url = window.location.origin + '?short=' + short.id;
        navigator.clipboard.writeText(url).then(() => {
            alert('تم نسخ رابط المقطع إلى الحافظة!');
        }).catch(err => {
            console.error('Failed to copy share link:', err);
        });
    };

    const handleCommentClick = (shortId) => {
        setActiveComments(activeComments === shortId ? null : shortId);
    };

    const handleFollow = async (short) => {
        if (!user || user.mode === 'guest') {
            alert('يجب تسجيل الدخول للمتابعة.');
            return;
        }

        setLoadingFollow(true);
        try {
            const result = await followService.toggle(user.id, short.channel_id);
            setFollowedChannels(prev => {
                const next = new Set(prev);
                if (result.following) next.add(short.channel_id);
                else next.delete(short.channel_id);
                return next;
            });

            if (result.following) {
                await notificationService.push(short.author_id, {
                    type: 'follow',
                    message: `بدأ بمتابعة قناتك`,
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
            <div className="shorts-page page-center">
                <Loader2 size={40} className="animate-spin" color="var(--emerald-400)" />
            </div>
        );
    }

    if (shorts.length === 0) {
        return (
            <div className="shorts-page page-center">
                <div className="empty-state animate-fade-up">
                    <div className="empty-icon-bg float">
                        <Film size={32} color="var(--emerald-400)" />
                    </div>
                    <p className="empty-title">لا توجد مقاطع قصيرة حتى الآن.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="shorts-feed shorts-page">
            {shorts.map((short) => (
                <article key={short.id} className="short-item">
                    <div className="short-player">
                        <video
                            src={short.video_url}
                            controls
                            className="short-video"
                        />

                        <div className="short-overlay-bottom">
                            <div className="short-author-row">
                                <div className="post-avatar post-avatar-initial short-author-avatar">
                                    {short.author_name?.[0] || '؟'}
                                </div>
                                <span className="short-author-name">{short.author_name}</span>
                                {user?.id !== short.author_id && (
                                    <button
                                        className={`short-follow-btn ${followedChannels.has(short.channel_id) ? 'following' : ''}`}
                                        onClick={() => handleFollow(short)}
                                        disabled={loadingFollow}
                                    >
                                        {followedChannels.has(short.channel_id) ? 'تمت المتابعة' : 'متابعة'}
                                    </button>
                                )}
                            </div>
                            {short.caption && <p className="short-caption">{short.caption}</p>}
                        </div>

                        <div className="short-overlay-actions">
                            <button
                                className="short-action-btn"
                                onClick={() => handleLike(short)}
                            >
                                <div className={`icon-circle ${likedShorts.has(short.id) ? 'liked' : ''}`}>
                                    <Heart size={24} fill={likedShorts.has(short.id) ? '#f43f5e' : 'none'} color={likedShorts.has(short.id) ? '#f43f5e' : 'white'} />
                                </div>
                                <span>{short.likes || 0}</span>
                            </button>

                            <button
                                className={`short-action-btn ${activeComments === short.id ? 'active' : ''}`}
                                onClick={() => handleCommentClick(short.id)}
                            >
                                <div className={`icon-circle ${activeComments === short.id ? 'active' : ''}`}>
                                    <MessageCircle size={24} color={activeComments === short.id ? '#1e293b' : 'white'} />
                                </div>
                                <span>{short.comments_count || 0}</span>
                            </button>

                            <button className="short-action-btn" onClick={() => handleShare(short)}>
                                <div className="icon-circle">
                                    <Share2 size={24} />
                                </div>
                                <span>مشاركة</span>
                            </button>

                            <button className="short-action-btn" title="خيارات">
                                <div className="icon-circle icon-circle-ghost">
                                    <MoreHorizontal size={24} />
                                </div>
                            </button>
                        </div>

                        {activeComments === short.id && (
                            <div className="short-comments-panel animate-fade-up">
                                <div className="short-comments-header">
                                    <h3>التعليقات</h3>
                                    <button onClick={() => setActiveComments(null)} className="short-comments-close" aria-label="إغلاق">
                                        ×
                                    </button>
                                </div>
                                <div className="short-comments-body">
                                    <CommentsSection
                                        contentId={short.id}
                                        contentType="short"
                                        contentOwnerId={short.author_id}
                                        user={user}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </article>
            ))}
        </div>
    );
};

export default ShortsFeed;
