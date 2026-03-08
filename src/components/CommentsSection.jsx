import React, { useState, useEffect } from 'react';
import { Send, Loader2, User } from 'lucide-react';
import { commentService, notificationService } from '../services/supabaseService';

const CommentsSection = ({ contentId, contentType, contentOwnerId, user }) => {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadComments();
    }, [contentId]);

    const loadComments = async () => {
        setLoading(true);
        try {
            const data = await commentService.getAll(contentId);
            setComments(data || []);
        } catch (err) {
            console.error('Error loading comments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user || user.mode === 'guest') return;

        setSubmitting(true);
        try {
            const comment = await commentService.add(contentId, contentType, {
                authorId: user.id,
                authorName: user.name || user.displayName,
                text: newComment.trim()
            });

            setComments(prev => [comment, ...prev]);
            setNewComment('');

            // Send Notification if we aren't commenting on our own post
            if (contentOwnerId && contentOwnerId !== user.id) {
                await notificationService.push(contentOwnerId, {
                    type: 'comment',
                    message: `علّق على ${contentType === 'post' ? 'منشورك' : 'الفيديو الخاص بك'}: "${comment.text.substring(0, 30)}..."`,
                    fromUser: user.name || user.displayName,
                    contentId
                });
            }

        } catch (err) {
            console.error('Error adding comment:', err);
            alert('حدث خطأ أثناء إضافة التعليق.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="comments-loading">
                <Loader2 size={24} className="animate-spin" color="var(--emerald-400)" />
            </div>
        );
    }

    return (
        <div className="comments-section">

            {/* Comments List */}
            <div className="comments-list">
                {comments.length === 0 ? (
                    <p className="comments-empty">لا توجد تعليقات بعد. كن أول من يعلق!</p>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="comment-item animate-fade-in">
                            <div className="comment-avatar">
                                {c.author_name?.[0] || '؟'}
                            </div>
                            <div className="comment-bubble">
                                <div className="comment-meta">
                                    <span className="comment-author">{c.author_name}</span>
                                    <span className="comment-date">{new Date(c.created_at).toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="comment-text">{c.text}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Comment Input */}
            {user && user.mode !== 'guest' ? (
                <form onSubmit={handleSubmit} className="comment-form">
                    <div className="comment-input-wrap">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="أضف تعليقاً..."
                            className="comment-input"
                            rows={1}
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = (e.target.scrollHeight) + 'px';
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newComment.trim() || submitting}
                        className="comment-submit-btn"
                    >
                        {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="comment-send-icon" />}
                    </button>
                </form>
            ) : (
                <div className="comments-login-note">
                    <span>يجب تسجيل الدخول لإضافة تعليق.</span>
                </div>
            )}
        </div>
    );
};

export default CommentsSection;
