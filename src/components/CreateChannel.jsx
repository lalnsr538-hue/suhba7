import React, { useState } from 'react';
import { Tv, PenLine, ImagePlus, ArrowRight, Loader2 } from 'lucide-react';
import { channelService } from '../services/supabaseService';

const CreateChannel = ({ user, onCreated, onCancel }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('يرجى إدخال اسم القناة');
            return;
        }
        if (name.trim().length < 3) {
            setError('اسم القناة يجب أن يكون 3 أحرف على الأقل');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const channel = await channelService.create({
                ownerId: user.id,
                name: name.trim(),
                description: description.trim(),
                avatarUrl: null,
            });
            onCreated(channel);
        } catch (err) {
            console.error('Channel creation error:', err);
            setError(err.message || 'حدث خطأ أثناء إنشاء القناة');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="channel-create-page">
            <div className="channel-create-card animate-fade-up">
                {/* Header */}
                <div className="channel-create-header">
                    <div className="channel-create-icon-bg animate-float">
                        <Tv size={36} color="var(--emerald-400)" />
                    </div>
                    <h2 className="channel-create-title">إنشاء قناة جديدة</h2>
                    <p className="channel-create-subtitle">
                        أنشئ قناتك وابدأ بمشاركة المحتوى الإسلامي الهادف مع العالم
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="channel-form">
                    <div className="form-group">
                        <label className="form-label">
                            <PenLine size={16} />
                            اسم القناة *
                        </label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="مثال: نفحات إيمانية"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={50}
                            dir="rtl"
                        />
                        <span className="form-hint">{name.length}/50 حرف</span>
                    </div>

                    <div className="form-group">
                        <label className="form-label">
                            <ImagePlus size={16} />
                            وصف القناة
                        </label>
                        <textarea
                            className="form-textarea"
                            placeholder="صف قناتك بإيجاز... ماذا ستقدم للمتابعين؟"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={200}
                            rows={3}
                            dir="rtl"
                        />
                        <span className="form-hint">{description.length}/200 حرف</span>
                    </div>

                    {error && (
                        <div className="form-error animate-fade-in">
                            {error}
                        </div>
                    )}

                    <div className="channel-form-actions">
                        <button
                            type="submit"
                            className="btn-welcome-primary"
                            disabled={loading || !name.trim()}
                        >
                            {loading ? (
                                <>
                                    <span className="btn-spinner" />
                                    جاري الإنشاء...
                                </>
                            ) : (
                                <>
                                    <Tv size={20} />
                                    إنشاء القناة
                                </>
                            )}
                        </button>

                        {onCancel && (
                            <button
                                type="button"
                                className="btn-welcome-ghost"
                                onClick={onCancel}
                            >
                                <ArrowRight size={18} />
                                رجوع
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateChannel;
