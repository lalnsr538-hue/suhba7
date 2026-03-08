import React from 'react';
import { TrendingUp, Users, Search } from 'lucide-react';

const RightPanel = () => {
    const trends = [];
    const suggestions = [];

    return (
        <div className="right-panel animate-slide-in">

            {/* Trending */}
            <div className="panel-section">
                <div className="panel-section-title">
                    <TrendingUp size={18} color="var(--emerald-400)" />
                    <span>المتداول حالياً</span>
                </div>
                {trends.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {trends.map(t => (
                            <div key={t.id} className="trend-item">
                                <span className="trend-tag">{t.tag}</span>
                                <span className="trend-count">{t.posts}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '12px' }}>
                        <Search size={28} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                        <p className="text-sm text-secondary" style={{ textAlign: 'center' }}>لا توجد مواضيع متداولة حالياً</p>
                    </div>
                )}
            </div>

            {/* Suggestions */}
            <div className="panel-section">
                <div className="panel-section-title">
                    <Users size={18} color="var(--gold-500)" />
                    <span>اقتراحات للمتابعة</span>
                </div>
                {suggestions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {suggestions.map(u => (
                            <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <img src={u.image} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--border-color)' }} />
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                                        <div className="text-xs text-muted">{u.handle}</div>
                                    </div>
                                </div>
                                <button className="btn-outline" style={{ fontSize: '12px', padding: '6px 16px' }}>متابعة</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '12px' }}>
                        <Users size={28} color="var(--text-muted)" style={{ opacity: 0.5 }} />
                        <p className="text-sm text-secondary" style={{ textAlign: 'center', lineHeight: 1.7 }}>
                            لا توجد اقتراحات حالياً<br />ابحث عن أصدقاء لإضافتهم
                        </p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div style={{ padding: '8px 12px', textAlign: 'center' }}>
                <p className="text-xs text-muted" style={{ lineHeight: 1.8 }}>
                    صُحبة © ٢٠٢٦ — منصة تواصل اجتماعي إسلامية
                </p>
            </div>
        </div>
    );
};

export default RightPanel;
