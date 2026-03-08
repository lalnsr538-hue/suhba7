import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Video, Loader2 } from 'lucide-react';
import { postService, videoService, likeService, bookmarkService, notificationService } from '../services/supabaseService';
import CommentsSection from './CommentsSection';

const HomeFeed = ({ user }) => {
    const [feedData, setFeedData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeComments, setActiveComments] = useState(null);
    const [savedItems, setSavedItems] = useState(new Set());
    const [likedItems, setLikedItems] = useState(new Set());
    const [loadingBookmarks, setLoadingBookmarks] = useState(false);

    useEffect(() => {
        loadFeed();
        if (user && user.mode !== 'guest') {
            loadBookmarks();
        }
    }, [user]);

    const loadBookmarks = async () => {
        try {
            const items = await bookmarkService.getAll(user.id);
            const itemIds = items.map(b => b.content_id);
            setSavedItems(new Set(itemIds));
        } catch (err) {
            console.error('Error loading bookmarks:', err);
        }
    };

    const loadFeed = async () => {
        setLoading(true);
        try {
            const [posts, videos] = await Promise.all([
                postService.getFeed(20),
                videoService.getFeed(20)
            ]);

            const combined = [
                ...posts.map(p => ({ ...p, _type: 'post' })),
                ...videos.map(v => ({ ...v, _type: 'video' }))
            ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            setFeedData(combined);

            // تحميل حالة الإعجابات للمستخدم المسجل
            if (user && user.mode !== 'guest') {
                const likedSet = new Set();
                for (const item of combined) {
                    const isLiked = await likeService.isLiked(user.id, item.id, item._type);
                    if (isLiked) likedSet.add(item.id);
                }
                setLikedItems(likedSet);
            }
        } catch (err) {
            console.error('Error loading feed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCommentClick = (itemId) => {
        setActiveComments(activeComments === itemId ? null : itemId);
    };

    const handleBookmark = async (item) => {
        if (!user || user.mode === 'guest') {
            alert('يجب تسجيل الدخول لحفظ المحتوى');
            return;
        }

        try {
            setLoadingBookmarks(true);
            const isSaved = savedItems.has(item.id);

            if (isSaved) {
                await bookmarkService.remove(user.id, item.id, item._type);
                setSavedItems(prev => {
                    const next = new Set(prev);
                    next.delete(item.id);
                    return next;
                });
            } else {
                await bookmarkService.add(user.id, item.id, item._type);
                setSavedItems(prev => new Set(prev).add(item.id));
            }
        } catch (err) {
            console.error('Bookmark error:', err);
            alert('حدث خطأ أثناء حفظ المحتوى.');
        } finally {
            setLoadingBookmarks(false);
        }
    };

    const handleLike = async (item) => {
        if (!user || user.mode === 'guest') {
            alert('يجب تسجيل الدخول للإعجاب بالمحتوى');
            return;
        }

        const wasLiked = likedItems.has(item.id);
        const diff = wasLiked ? -1 : 1;

        // Optimistic UI update
        setLikedItems(prev => {
            const next = new Set(prev);
            if (wasLiked) next.delete(item.id);
            else next.add(item.id);
            return next;
        });
        setFeedData(prev => prev.map(p => {
            if (p.id === item.id) {
                return { ...p, likes: Math.max(0, (p.likes || 0) + diff) };
            }
            return p;
        }));

        try {
            await likeService.toggle(user.id, item.id, item._type);

            // إرسال إشعار إذا أعجب
            if (!wasLiked && item.author_id !== user.id) {
                await notificationService.push(item.author_id, {
                    type: 'like',
                    message: `أعجب بـ ${item._type === 'post' ? 'منشورك' : 'الفيديو الخاص بك'}`,
                    fromUser: user.name || user.displayName,
                    contentId: item.id
                });
            }
        } catch (err) {
            console.error('Like error:', err);
            loadFeed(); // revert on error
        }
    };

    const handleShare = (item) => {
        const url = window.location.origin + '?id=' + item.id;
        navigator.clipboard.writeText(url).then(() => {
            alert('تم نسخ رابط المحتوى إلى الحافظة!');
        }).catch(err => {
            console.error('Failed to copy share link:', err);
        });
    };

    if (loading) {
        return (
            <div className="feed-column feed-loader">
                <Loader2 size={40} className="animate-spin" color="var(--emerald-400)" />
            </div>
        );
    }

    return (
        <div className="feed-column">
            {/* Stories Placeholder */}
            <div className="glass stories-placeholder">
                <div className="stories-bar stories-placeholder-bar">
                    <div className="animate-fade-in stories-placeholder-item">
                        <span className="text-secondary text-sm">القصص — قريباً</span>
                    </div>
                </div>
            </div>

            {feedData.length === 0 ? (
                <div className="empty-state animate-fade-up">
                    <div className="empty-icon-bg float">
                        <MessageCircle size={32} color="var(--emerald-400)" />
                    </div>
                    <p className="empty-title">لا توجد منشورات حتى الآن.</p>
                    <p className="empty-subtitle">كن أول من ينشر محتوى نافع في صُحبة!</p>
                </div>
            ) : (
                <div className="post-list">
                    {feedData.map((item, i) => (
                        <article key={item.id} className={`post-card animate-fade-up stagger-${(i % 5) + 1}`}>

                            {/* Header */}
                            <div className="post-header">
                                <div className="post-user-info">
                                    <div className="post-avatar post-avatar-initial">
                                        {item.author_name?.[0] || '؟'}
                                    </div>
                                    <div>
                                        <div className="post-user-name">{item.author_name}</div>
                                        <div className="post-user-meta">
                                            <span>{new Date(item.created_at).toLocaleDateString('ar-EG')}</span>
                                            {item._type === 'video' && (
                                                <>
                                                    <span>·</span>
                                                    <span className="post-type-tag">
                                                        <Video size={12} /> فيديو
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button className="btn-ghost" title="خيارات">
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="post-body">
                                {item._type === 'video' ? (
                                    <>
                                        <h3 className="post-video-title">{item.title}</h3>
                                        <p className="post-video-desc">{item.description}</p>
                                        {item.video_url && (
                                            <div className="post-media-frame">
                                                <video
                                                    src={item.video_url}
                                                    controls
                                                    className="post-video-player"
                                                />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <p>{item.content}</p>
                                        {item.image_url && (
                                            <div className="post-media">
                                                <img
                                                    src={item.image_url}
                                                    alt="محتوى المنشور"
                                                    className="post-image"
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Footer / Actions */}
                            <div className="post-actions">
                                <div className="post-actions-group">
                                    <button
                                        className={`btn-action ${likedItems.has(item.id) ? 'is-active' : ''}`}
                                        onClick={() => handleLike(item)}
                                    >
                                        <Heart size={20} fill={likedItems.has(item.id) ? 'currentColor' : 'none'} />
                                        <span>{item.likes || 0}</span>
                                    </button>
                                    <button
                                        className={`btn-action ${activeComments === item.id ? 'is-active' : ''}`}
                                        onClick={() => handleCommentClick(item.id)}
                                    >
                                        <MessageCircle size={20} />
                                        <span>{item.comments_count || 0}</span>
                                    </button>
                                    <button className="btn-action" onClick={() => handleShare(item)} title="مشاركة">
                                        <Share2 size={20} />
                                    </button>
                                </div>
                                <button
                                    className={`btn-action ${savedItems.has(item.id) ? 'is-saved' : ''}`}
                                    onClick={() => handleBookmark(item)}
                                    disabled={loadingBookmarks}
                                >
                                    <Bookmark size={20} fill={savedItems.has(item.id) ? 'currentColor' : 'none'} />
                                </button>
                            </div>

                            {/* Comments Section */}
                            {activeComments === item.id && (
                                <CommentsSection
                                    contentId={item.id}
                                    contentType={item._type}
                                    contentOwnerId={item.author_id}
                                    user={user}
                                />
                            )}
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HomeFeed;
