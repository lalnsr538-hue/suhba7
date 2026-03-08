import React, { useState, useCallback, useEffect } from 'react';
import { Home, Compass, PlaySquare, Bell, User } from 'lucide-react';
import Sidebar from './components/Sidebar';
import HomeFeed from './components/HomeFeed';
import ShortsFeed from './components/ShortsFeed';
import RightPanel from './components/RightPanel';
import WelcomeScreen from './components/WelcomeScreen';
import CreateChannel from './components/CreateChannel';
import ChannelView from './components/ChannelView';
import CreateContent from './components/CreateContent';
import Explore from './components/Explore';
import Notifications from './components/Notifications';
import Profile from './components/Profile';
import Messages from './components/Messages';
import UsageLockOverlay from './components/UsageLockOverlay';
import PrayerReminderBanner from './components/PrayerReminderBanner';
import { authService, channelService, profileService } from './services/supabaseService';
import { useDailyUsageLimit } from './hooks/useDailyUsageLimit';
import { usePrayerReminder } from './hooks/usePrayerReminder';
import './index.css';

function App() {
  const [authState, setAuthState] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home');
  const [userChannel, setUserChannel] = useState(null);
  const [selectedChannelId, setSelectedChannelId] = useState(null);
  const [hidePrayerInfo, setHidePrayerInfo] = useState(false);
  const usageLimit = useDailyUsageLimit({ enabled: !!authState });
  const prayerReminder = usePrayerReminder({ enabled: !!authState });
  const hasPrayerBanner = !!prayerReminder.reminder || !!prayerReminder.locationError || (!!prayerReminder.nextPrayer && !hidePrayerInfo);

  const mobileNavItems = [
    { icon: Home, view: 'home', label: 'الرئيسية' },
    { icon: Compass, view: 'explore', label: 'استكشف' },
    { icon: PlaySquare, view: 'shorts', label: 'مقاطع' },
    { icon: Bell, view: 'notifications', label: 'الإشعارات' },
    { icon: User, view: 'profile', label: 'حسابي' },
  ];

  const loadUserChannel = useCallback(async (userId) => {
    try {
      const channel = await channelService.getByOwner(userId);
      setUserChannel(channel);
    } catch (err) {
      console.error('Error loading channel:', err);
    }
  }, []);

  const hydrateAuthUser = useCallback(async (user) => {
    if (!user) {
      setAuthState(null);
      setUserChannel(null);
      return;
    }

    let profile = null;
    try {
      profile = await profileService.getById(user.id);
    } catch (err) {
      console.warn('Profile fetch skipped after auth:', err?.message || err);
    }

    const nameFromMeta = user.user_metadata?.display_name;
    setAuthState({
      mode: 'user',
      id: user.id,
      email: user.email,
      name: profile?.display_name || nameFromMeta || user.email,
      displayName: profile?.display_name || nameFromMeta || user.email,
      avatar: profile?.avatar_url || null,
    });
    loadUserChannel(user.id);
  }, [loadUserChannel]);

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      try {
        const session = await authService.getSession();
        if (!mounted) return;
        await hydrateAuthUser(session?.user || null);
      } catch (err) {
        // Supabase غير متاح (مثلاً: متغيرات البيئة مفقودة في Vercel)
        console.error('Auth bootstrap failed:', err?.message || err);
        if (mounted) setAuthLoading(false);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    bootstrapAuth();

    let subscription = null;
    try {
      subscription = authService.onAuthStateChange(async (_event, session) => {
        if (!mounted) return;
        await hydrateAuthUser(session?.user || null).catch(() => { });
        setAuthLoading(false);
      });
    } catch (err) {
      console.error('onAuthStateChange failed:', err?.message || err);
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe?.();
    };
  }, [hydrateAuthUser]);

  // Handlers
  const handleLogin = (userData) => {
    setAuthState({ mode: 'user', ...userData });
    loadUserChannel(userData.id);
    setAuthLoading(false);
  };

  const handleGuest = () => {
    setUserChannel(null);
    setAuthState({ mode: 'guest', id: 'guest', name: 'ضيف' });
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (err) {
      console.error('Sign out failed:', err);
    } finally {
      setUserChannel(null);
      setAuthState(null);
      setCurrentView('home');
      setHidePrayerInfo(false);
      setAuthLoading(false);
    }
  };

  const handleChannelCreated = (channel) => {
    setUserChannel(channel);
    setCurrentView('my-channel');
  };

  const handleNavigate = (view, payload = null) => {
    if (view === 'view-channel' && payload) {
      setSelectedChannelId(payload);
    }
    setCurrentView(view);
  };

  // ─── Show Welcome Screen if not authenticated ─────────────────────────────
  if (authLoading) {
    return (
      <div className="welcome-screen">
        <div className="welcome-card animate-fade-up" style={{ textAlign: 'center' }}>
          <p className="text-secondary">جارٍ التحقق من الجلسة...</p>
        </div>
      </div>
    );
  }

  if (!authState) {
    return <WelcomeScreen onLogin={handleLogin} onGuest={handleGuest} />;
  }

  if (usageLimit.locked) {
    return <UsageLockOverlay resetAt={usageLimit.resetAt} />;
  }

  // ─── Main App ─────────────────────────────────────────────────────────────
  return (
    <>
      {hasPrayerBanner && (
        <PrayerReminderBanner
          reminder={prayerReminder.reminder}
          nextPrayer={hidePrayerInfo ? null : prayerReminder.nextPrayer}
          locationError={prayerReminder.locationError}
          loadingLocation={prayerReminder.loading}
          onRetryLocation={() => {
            setHidePrayerInfo(false);
            prayerReminder.requestLocation();
          }}
          onDismiss={() => {
            if (prayerReminder.reminder) {
              prayerReminder.dismissReminder();
            } else {
              setHidePrayerInfo(true);
            }
          }}
        />
      )}

      <div className={`app-layout ${hasPrayerBanner ? 'app-layout-with-banner' : ''}`}>
        <Sidebar
          setView={setCurrentView}
          currentView={currentView}
          user={authState}
          hasChannel={!!userChannel}
          onLogout={handleLogout}
        />

        <main className="main-content">
          {currentView === 'home' && (
            <div className="home-grid">
              <HomeFeed user={authState} />
              <div className="aside-column">
                <RightPanel />
              </div>
            </div>
          )}

          {currentView === 'shorts' && <ShortsFeed user={authState} />}

          {/* Create Channel */}
          {currentView === 'create-channel' && (
            authState.mode === 'guest' ? (
              <div className="coming-soon-page">
                <h2 className="coming-soon-title">🔒</h2>
                <p className="coming-soon-desc">يجب تسجيل الدخول لإنشاء قناة</p>
              </div>
            ) : userChannel ? (
              // Already has channel → show it
              <ChannelView
                user={authState}
                channelId={userChannel.id}
                onNavigate={setCurrentView}
              />
            ) : (
              <CreateChannel
                user={authState}
                onCreated={handleChannelCreated}
                onCancel={() => setCurrentView('home')}
              />
            )
          )}

          {/* My Channel View */}
          {currentView === 'my-channel' && userChannel && (
            <ChannelView
              user={authState}
              channelId={userChannel.id}
              onNavigate={handleNavigate}
            />
          )}

          {/* Create Content View */}
          {currentView === 'create' && (
            authState.mode === 'guest' ? (
              <div className="coming-soon-page">
                <h2 className="coming-soon-title">🔒</h2>
                <p className="coming-soon-desc">يجب تسجيل الدخول لنشر محتوى</p>
              </div>
            ) : (
              <CreateContent
                user={authState}
                hasChannel={!!userChannel}
                channelId={userChannel?.id}
                onNavigate={handleNavigate}
              />
            )
          )}

          {/* Phase 5 Pages */}
          {currentView === 'explore' && <Explore onNavigate={handleNavigate} />}
          {currentView === 'notifications' && <Notifications user={authState} />}
          {currentView === 'profile' && <Profile user={authState} onNavigate={handleNavigate} />}
          {currentView === 'messages' && <Messages user={authState} />}

          {/* View Public Channel */}
          {currentView === 'view-channel' && (
            <ChannelView
              user={authState}
              channelId={selectedChannelId}
              onNavigate={handleNavigate}
            />
          )}

        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        {mobileNavItems.map(item => (
          <button
            key={item.view}
            className={`mobile-nav-item ${currentView === item.view ? 'active' : ''}`}
            onClick={() => setCurrentView(item.view)}
          >
            <item.icon size={22} strokeWidth={currentView === item.view ? 2.5 : 1.5} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

export default App;
