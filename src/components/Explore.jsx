import React, { useState, useEffect } from 'react';
import { Compass, Search, Tv, TrendingUp, Loader2 } from 'lucide-react';
import { channelService, videoService } from '../services/supabaseService';

const Explore = ({ onNavigate }) => {
    const [channels, setChannels] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadExploreData();
    }, []);

    const loadExploreData = async () => {
        setLoading(true);
        try {
            const [fetchedChannels, fetchedVideos] = await Promise.all([
                channelService.listAll(),
                videoService.getFeed(30)
            ]);

            setChannels(fetchedChannels || []);
            setVideos(fetchedVideos || []);
        } catch (err) {
            console.error('Error loading explore data:', err);
        } finally {
            setLoading(false);
        }
    };

    const query = searchQuery.toLowerCase();
    const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(query));
    const filteredVideos = videos.filter(v =>
        v.title.toLowerCase().includes(query) ||
        (v.description && v.description.toLowerCase().includes(query)) ||
        v.author_name.toLowerCase().includes(query)
    );

    if (loading) {
        return (
            <div className="explore-page page-center">
                <Loader2 size={40} className="animate-spin" color="var(--emerald-400)" />
            </div>
        );
    }

    return (
        <div className="explore-page page-container animate-fade-in">
            {/* Search Header */}
            <div className="explore-header">
                <h1 className="page-title">
                    <Compass size={24} color="var(--emerald-400)" /> استكشف
                </h1>
                <div className="search-bar-large">
                    <Search size={20} color="var(--text-muted)" />
                    <input
                        type="text"
                        placeholder="ابحث عن قنوات، مقاطع، أو مواضيع..."
                        className="search-bar-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Popular Channels */}
            {(filteredChannels.length > 0) && (
                <section className="explore-section">
                    <h2 className="section-title">
                        <Tv size={20} color="var(--emerald-400)" /> القنوات البارزة
                    </h2>
                    <div className="explore-channels-grid">
                        {filteredChannels.map(channel => (
                            <button
                                key={channel.id}
                                className="explore-channel-card glass-card"
                                onClick={() => onNavigate('view-channel', channel.id)}
                            >
                                <div className="explore-channel-avatar">
                                    {channel.name[0]}
                                </div>
                                <h3 className="explore-channel-name">{channel.name}</h3>
                                <div className="explore-channel-meta">
                                    اضغط لزيارة القناة
                                </div>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {/* Trending Videos */}
            <section className="explore-section">
                <h2 className="section-title">
                    <TrendingUp size={20} color="var(--gold-500)" /> فيديوهات رائجة
                </h2>

                {filteredVideos.length === 0 ? (
                    <div className="empty-state page-empty-block">
                        <Compass size={32} color="var(--text-muted)" />
                        <p className="empty-subtitle">لا توجد فيديوهات للعرض حالياً.</p>
                    </div>
                ) : (
                    <div className="explore-videos-grid">
                        {filteredVideos.map((video) => (
                            <button
                                key={video.id}
                                className="video-card glass-card animate-fade-up stagger-1"
                                onClick={() => onNavigate('view-channel', video.channel_id)}
                            >
                                <div className="video-thumbnail">
                                    {video.thumbnail_url ? (
                                        <img src={video.thumbnail_url} alt={video.title} className="video-thumbnail-image" />
                                    ) : (
                                        <div className="video-thumbnail-placeholder">
                                            <TrendingUp size={32} color="var(--text-muted)" />
                                        </div>
                                    )}
                                    <div className="video-badge">
                                        فيديو
                                    </div>
                                </div>
                                <div className="video-info">
                                    <h3 className="video-title">
                                        {video.title}
                                    </h3>
                                    <div className="video-meta">
                                        <span>{video.author_name}</span>
                                        <span>{video.likes || 0} إعجاب</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </section>

        </div>
    );
};

export default Explore;
