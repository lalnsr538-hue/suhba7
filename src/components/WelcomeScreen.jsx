import React, { useState } from 'react';
import { authService, profileService } from '../services/supabaseService';

const WelcomeScreen = ({ onLogin, onGuest }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setNotice('');
        try {
            if (!email || !password || !displayName) {
                setError('يرجى ملء جميع الحقول');
                setLoading(false);
                return;
            }
            if (password.length < 6) {
                setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
                setLoading(false);
                return;
            }

            const user = await authService.signUp(email, password, displayName);
            if (!user) {
                throw new Error('تعذر إنشاء الحساب. حاول مرة أخرى.');
            }

            // الـ Trigger في Supabase ينشئ الـ profile تلقائياً
            // لكن نحدّث اسم العرض إذا لزم
            try {
                await profileService.update(user.id, { display_name: displayName });
            } catch {
                // الـ trigger ربما لم يُنفّذ بعد، لا بأس
            }

            const session = await authService.getSession();
            if (!session?.user) {
                setNotice('تم إنشاء الحساب. فعّل بريدك الإلكتروني ثم سجّل الدخول.');
                setIsSignUp(false);
                setPassword('');
                setLoading(false);
                return;
            }

            onLogin({
                id: user.id,
                email: user.email,
                name: displayName,
                displayName: displayName,
                avatar: null,
            });
        } catch (err) {
            console.error('Sign up error:', err);
            if (err.message?.includes('already registered')) {
                setError('هذا البريد مسجل بالفعل. جرّب تسجيل الدخول.');
            } else {
                setError(err.message || 'حدث خطأ أثناء التسجيل. حاول مرة أخرى.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setNotice('');
        try {
            if (!email || !password) {
                setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
                setLoading(false);
                return;
            }
            const user = await authService.signIn(email, password);
            if (!user) {
                throw new Error('فشل تسجيل الدخول. حاول مرة أخرى.');
            }

            // جلب ملف المستخدم
            let profile = null;
            try {
                profile = await profileService.getById(user.id);
            } catch (profileErr) {
                console.warn('Profile fetch failed on sign-in, continuing:', profileErr?.message || profileErr);
            }
            onLogin({
                id: user.id,
                email: user.email,
                name: profile?.display_name || user.email,
                displayName: profile?.display_name || user.email,
                avatar: profile?.avatar_url || null,
            });
        } catch (err) {
            console.error('Sign in error:', err);
            if (err.message?.includes('Invalid login')) {
                setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
            } else {
                setError(err.message || 'تعذّر تسجيل الدخول. تحقق من بيانات الدخول.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGuest = () => {
        onGuest();
    };

    return (
        <div className="welcome-screen">
            {/* Background effects */}
            <div className="welcome-glow welcome-glow-1" />
            <div className="welcome-glow welcome-glow-2" />

            {/* Card */}
            <div className="welcome-card animate-fade-up">

                {/* Logo */}
                <div className="welcome-logo-wrapper">
                    <div className="welcome-logo-icon animate-pulse-glow">ص</div>
                    <div>
                        <h1 className="welcome-logo-name">صُحبة</h1>
                        <p className="welcome-logo-tagline">Suhba — Islamic Social</p>
                    </div>
                </div>

                {/* Divider */}
                <div className="welcome-divider" />

                {/* Headline */}
                <div className="welcome-headline">
                    <h2>أهلاً بك 👋</h2>
                    <p>
                        منصة اجتماعية إسلامية آمنة للمحتوى الهادف.
                        <br />سجّل دخولك أو تابع كضيف.
                    </p>
                </div>

                {/* Features quick list */}
                <div className="welcome-features">
                    {[
                        { icon: '🛡️', text: 'محتوى آمن خالٍ من الحرام' },
                        { icon: '📿', text: 'مقاطع دينية وأناشيد' },
                        { icon: '🤝', text: 'تواصل مع أهل الخير' },
                    ].map((f, i) => (
                        <div key={i} className={`welcome-feature-item stagger-${i + 1} animate-fade-up`}>
                            <span className="feature-icon">{f.icon}</span>
                            <span>{f.text}</span>
                        </div>
                    ))}
                </div>

                {/* Auth Form */}
                <form className="welcome-auth-form" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
                    {isSignUp && (
                        <input
                            type="text"
                            placeholder="اسم المستخدم"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            disabled={loading}
                            className="auth-input"
                        />
                    )}
                    <input
                        type="email"
                        placeholder="البريد الإلكتروني"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="auth-input"
                    />
                    <input
                        type="password"
                        placeholder="كلمة المرور"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        className="auth-input"
                    />

                    {/* CTA Buttons */}
                    <div className="welcome-actions">
                        <button
                            type="submit"
                            className="btn-welcome-primary"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="btn-spinner" />
                            ) : (
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <polyline points="10 17 15 12 10 7" />
                                    <line x1="15" y1="12" x2="3" y2="12" />
                                </svg>
                            )}
                            {loading ? 'جاري المعالجة...' : (isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول')}
                        </button>

                        <button
                            type="button"
                            className="btn-welcome-ghost"
                            onClick={() => { setIsSignUp(!isSignUp); setError(''); setNotice(''); }}
                            disabled={loading}
                        >
                            {isSignUp ? 'لديك حساب بالفعل؟ سجل الدخول' : 'ليس لديك حساب؟ أنشئ واحداً'}
                        </button>

                        <div className="welcome-or">
                            <span>أو</span>
                        </div>

                        <button
                            type="button"
                            className="btn-welcome-ghost"
                            onClick={handleGuest}
                            disabled={loading}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            المتابعة كضيف
                        </button>

                        {error && (
                            <p className="welcome-error animate-fade-in">{error}</p>
                        )}
                        {notice && (
                            <p className="form-success animate-fade-in">{notice}</p>
                        )}
                    </div>
                </form>

                {/* Footer note */}
                <p className="welcome-footer-note">
                    بالمتابعة فأنت توافق على{' '}
                    <span style={{ color: 'var(--emerald-400)', cursor: 'pointer' }}>سياسة الاستخدام</span>
                    {' '}الإسلامية لصُحبة
                </p>
            </div>
        </div>
    );
};

export default WelcomeScreen;
