import React, { useState, useRef } from 'react';
import { PenLine, Video as VideoIcon, Film, ImagePlus, Loader2 } from 'lucide-react';
import { postService, videoService, shortsService, storageService } from '../services/supabaseService';

const CreateContent = ({ user, hasChannel, channelId, onNavigate }) => {
    const [activeTab, setActiveTab] = useState('post'); // 'post', 'video', 'short'

    // Post state
    const [postText, setPostText] = useState('');
    const [postImage, setPostImage] = useState(null);

    // Video state
    const [videoTitle, setVideoTitle] = useState('');
    const [videoDesc, setVideoDesc] = useState('');
    const [videoFile, setVideoFile] = useState(null);

    // Short state
    const [shortCaption, setShortCaption] = useState('');
    const [shortFile, setShortFile] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fileInputRef = useRef(null);

    const tabs = [
        { id: 'post', label: 'منشور جديد', icon: PenLine },
        { id: 'video', label: 'رفع فيديو', icon: VideoIcon, requiresChannel: true },
        { id: 'short', label: 'مقطع قصير', icon: Film, requiresChannel: true },
    ];

    const handlePublishPost = async (e) => {
        e.preventDefault();
        if (!postText.trim()) {
            setError('يرجى كتابة محتوى المنشور');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let imageUrl = null;
            if (postImage) {
                imageUrl = await storageService.uploadFile(postImage, 'media', user.id);
            }

            await postService.create({
                authorId: user.id,
                authorName: user.name,
                content: postText.trim(),
                imageUrl
            });

            setSuccess('تم نشر المنشور بنجاح! سيظهر قريباً في تفاصيل الصفحة الرئيسية.');
            setTimeout(() => onNavigate('home'), 2000);
        } catch (err) {
            console.error(err);
            setError(err.message || 'حدث خطأ أثناء النشر. حاول مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    const handlePublishVideo = async (e) => {
        e.preventDefault();
        if (!videoTitle.trim() || !videoFile) {
            setError('يرجى تحديد فيديو وكتابة عنوان');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const videoUrl = await storageService.uploadFile(videoFile, 'media', user.id);

            await videoService.create({
                channelId,
                authorId: user.id,
                authorName: user.name,
                title: videoTitle.trim(),
                description: videoDesc.trim(),
                videoUrl,
                thumbnailUrl: null // Could add a thumbnail picker later
            });

            setSuccess('تم رفع الفيديو بنجاح!');
            setTimeout(() => onNavigate('my-channel'), 2000);
        } catch (err) {
            console.error(err);
            setError(err.message || 'حدث خطأ أثناء الرفع.');
        } finally {
            setLoading(false);
        }
    };

    const handlePublishShort = async (e) => {
        e.preventDefault();
        if (!shortFile) {
            setError('يرجى تحديد مقطع فيديو');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const videoUrl = await storageService.uploadFile(shortFile, 'media', user.id);

            await shortsService.create({
                channelId,
                authorId: user.id,
                authorName: user.name,
                caption: shortCaption.trim(),
                videoUrl
            });

            setSuccess('تم نشر المقطع بنجاح!');
            setTimeout(() => onNavigate('shorts'), 2000);
        } catch (err) {
            console.error(err);
            setError(err.message || 'حدث خطأ أثناء الرفع.');
        } finally {
            setLoading(false);
        }
    };

    // --- Render helpers ---

    const handleFileChange = (e, type) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (type === 'image') setPostImage(file);
        if (type === 'video') setVideoFile(file);
        if (type === 'short') setShortFile(file);
    };

    const clearFile = (type) => {
        if (type === 'image') setPostImage(null);
        if (type === 'video') setVideoFile(null);
        if (type === 'short') setShortFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="create-content-page animate-fade-in">
            <div className="create-content-card glass-card">

                <div className="create-header">
                    <h2 className="create-title">إنشاء محتوى</h2>
                    <p className="create-subtitle">ماذا تود أن تشارك مع أصدقائك وجمهورك اليوم؟</p>
                </div>

                {/* Tab Selection */}
                <div className="create-tabs">
                    {tabs.map((tab) => {
                        const isDisabled = tab.requiresChannel && !hasChannel;
                        return (
                            <button
                                key={tab.id}
                                className={`create-tab-btn ${activeTab === tab.id ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                                onClick={() => !isDisabled && setActiveTab(tab.id)}
                                title={isDisabled ? 'يتطلب إنشاء قناة أولاً' : ''}
                            >
                                <tab.icon size={18} />
                                <span>{tab.label}</span>
                                {isDisabled && <span className="tab-lock">🔒</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Status Messages */}
                {error && <div className="form-error" style={{ marginBottom: '16px' }}>{error}</div>}
                {success && <div className="form-success animate-fade-in" style={{ marginBottom: '16px' }}>{success}</div>}

                {/* POST FORM */}
                {activeTab === 'post' && (
                    <form className="create-form animate-fade-up" onSubmit={handlePublishPost}>
                        <div className="form-group">
                            <label className="form-label">محتوى المنشور *</label>
                            <textarea
                                className="form-textarea"
                                placeholder="بم تفكر؟ شارك فائدة، آية، أو فكرة..."
                                value={postText}
                                onChange={(e) => setPostText(e.target.value)}
                                maxLength={500}
                                rows={4}
                            />
                            <span className="form-hint">{postText.length}/500</span>
                        </div>

                        <div className="form-group">
                            <label className="form-label">إرفاق صورة (اختياري)</label>
                            <div className="file-drop-area">
                                <input
                                    type="file"
                                    accept="image/png, image/jpeg, image/webp"
                                    ref={fileInputRef}
                                    onChange={(e) => handleFileChange(e, 'image')}
                                    style={{ display: 'none' }}
                                />

                                {postImage ? (
                                    <div className="file-preview">
                                        <ImagePlus size={24} color="var(--emerald-400)" />
                                        <span className="file-name">{postImage.name}</span>
                                        <button type="button" className="btn-remove-file" onClick={() => clearFile('image')}>✕</button>
                                    </div>
                                ) : (
                                    <button type="button" className="btn-select-file" onClick={() => fileInputRef.current?.click()}>
                                        <ImagePlus size={20} /> اختر صورة للرفع
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="create-actions">
                            <button type="submit" className="btn-brand" disabled={loading || !postText.trim()}>
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <PenLine size={18} />}
                                {loading ? 'جاري النشر...' : 'نشر المشاركة'}
                            </button>
                        </div>
                    </form>
                )}

                {/* VOD FORM (Channels only) */}
                {activeTab === 'video' && (
                    <form className="create-form animate-fade-up" onSubmit={handlePublishVideo}>
                        <div className="form-group">
                            <label className="form-label">عنوان الفيديو *</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="مثال: كيف تحفظ القرآن بسهولة"
                                value={videoTitle}
                                onChange={(e) => setVideoTitle(e.target.value)}
                                maxLength={100}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">تفاصيل الفيديو</label>
                            <textarea
                                className="form-textarea"
                                placeholder="اكتب وصفاً مفيداً للفيديو..."
                                value={videoDesc}
                                onChange={(e) => setVideoDesc(e.target.value)}
                                maxLength={1000}
                                rows={3}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">ملف الفيديو *</label>
                            <div className="file-drop-area">
                                <input
                                    type="file"
                                    accept="video/mp4, video/webm"
                                    ref={fileInputRef}
                                    onChange={(e) => handleFileChange(e, 'video')}
                                    style={{ display: 'none' }}
                                />

                                {videoFile ? (
                                    <div className="file-preview">
                                        <VideoIcon size={24} color="var(--emerald-400)" />
                                        <span className="file-name">{videoFile.name} ({Math.round(videoFile.size / 1024 / 1024)}MB)</span>
                                        <button type="button" className="btn-remove-file" onClick={() => clearFile('video')}>✕</button>
                                    </div>
                                ) : (
                                    <button type="button" className="btn-select-file" onClick={() => fileInputRef.current?.click()}>
                                        <VideoIcon size={20} /> اختر فيديو (MP4/WebM)
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="create-info-box">
                            <p>🛡️ <strong>فحص المحتوى نشط:</strong> يمر أي محتوى بخوارزميات الذكاء الاصطناعي قبل نشره للتأكد من خلوه من المخالفات الشرعية وسياسة التطبيق.</p>
                        </div>

                        <div className="create-actions">
                            <button type="submit" className="btn-brand" disabled={loading || !videoTitle.trim() || !videoFile}>
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <VideoIcon size={18} />}
                                {loading ? 'جاري الرفع... يرجى الانتظار' : 'رفع الفيديو'}
                            </button>
                        </div>
                    </form>
                )}

                {/* SHORTS FORM (Channels only) */}
                {activeTab === 'short' && (
                    <form className="create-form animate-fade-up" onSubmit={handlePublishShort}>
                        <div className="form-group">
                            <label className="form-label">تسمية توضيحية (Caption)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="وصف أو عنوان المقطع القصير..."
                                value={shortCaption}
                                onChange={(e) => setShortCaption(e.target.value)}
                                maxLength={100}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">المقطع القصير (Video) *</label>
                            <div className="file-drop-area vertical-hint">
                                <input
                                    type="file"
                                    accept="video/mp4, video/webm"
                                    ref={fileInputRef}
                                    onChange={(e) => handleFileChange(e, 'short')}
                                    style={{ display: 'none' }}
                                />

                                {shortFile ? (
                                    <div className="file-preview">
                                        <Film size={24} color="var(--emerald-400)" />
                                        <span className="file-name">{shortFile.name}</span>
                                        <button type="button" className="btn-remove-file" onClick={() => clearFile('short')}>✕</button>
                                    </div>
                                ) : (
                                    <button type="button" className="btn-select-file" onClick={() => fileInputRef.current?.click()}>
                                        <Film size={20} /> اختر مقطعاً عمودياً
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="create-actions">
                            <button type="submit" className="btn-brand" disabled={loading || !shortFile}>
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Film size={18} />}
                                {loading ? 'جاري الرفع... يرجى الانتظار' : 'نشر المقطع'}
                            </button>
                        </div>
                    </form>
                )}

            </div>
        </div>
    );
};

export default CreateContent;
