import React, { useState, useEffect } from 'react';
import { storageService } from '../services/puterService';

const PuterMedia = ({ path, type = 'image', className, style, controls = false }) => {
    const [src, setSrc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let objectUrl = null;
        let isMounted = true;

        const loadMedia = async () => {
            if (!path) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                // Using window.puter directly or our storageService
                const blob = await storageService.readFile(path);
                if (isMounted && blob) {
                    objectUrl = URL.createObjectURL(blob);
                    setSrc(objectUrl);
                }
            } catch (err) {
                console.error('Error loading media from Puter:', err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadMedia();

        return () => {
            isMounted = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [path]);

    if (loading) {
        return <div className={`media-placeholder ${className}`} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.02)' }}><span className="spinner" /></div>;
    }

    if (!src) {
        return null; // or an error placeholder
    }

    if (type === 'video') {
        return (
            <video
                src={src}
                className={className}
                style={style}
                controls={controls}
                playsInline
            />
        );
    }

    return <img src={src} className={className} style={style} alt="Puter Media" loading="lazy" />;
};

export default PuterMedia;
