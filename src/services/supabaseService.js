/**
 * ═══════════════════════════════════════════════════════════════
 *  صُحبة — Supabase Service Layer (Unified)
 *  كل عمليات قاعدة البيانات والتخزين والمصادقة
 * ═══════════════════════════════════════════════════════════════
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase URL or Anon Key is missing! Check your .env file.');
}

export const supabase = (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
  : null;

// ─── AUTH SERVICE ─────────────────────────────────────────────────────────────

export const authService = {
  /** تسجيل حساب جديد */
  async signUp(email, password, displayName) {
    if (!supabase) throw new Error('Supabase not configured.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });
    if (error) throw error;
    return data.user;
  },

  /** تسجيل الدخول */
  async signIn(email, password) {
    if (!supabase) throw new Error('Supabase not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.user;
  },

  /** تسجيل الخروج */
  async signOut() {
    if (!supabase) throw new Error('Supabase not configured.');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return true;
  },

  /** الحصول على المستخدم الحالي */
  async getCurrentUser() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  /** الحصول على الجلسة الحالية */
  async getSession() {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  /** مراقبة تغيرات حالة المصادقة */
  onAuthStateChange(callback) {
    if (!supabase) return { unsubscribe: () => { } };
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(event, session);
      }
    );
    return subscription;
  },
};

// ─── PROFILE SERVICE ──────────────────────────────────────────────────────────

export const profileService = {
  /** جلب ملف المستخدم */
  async getById(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  /** تحديث ملف المستخدم */
  async update(userId, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** تحديث اسم العرض */
  async updateDisplayName(userId, displayName) {
    return this.update(userId, { display_name: displayName });
  },

  /** تحديث السيرة الذاتية */
  async updateBio(userId, bio) {
    return this.update(userId, { bio });
  },

  /** تحديث صورة المستخدم */
  async updateAvatar(userId, avatarUrl) {
    return this.update(userId, { avatar_url: avatarUrl });
  },
};

// ─── CHANNEL SERVICE ──────────────────────────────────────────────────────────

export const channelService = {
  /** إنشاء قناة جديدة */
  async create({ ownerId, name, description, avatarUrl }) {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('يجب تسجيل الدخول أولاً لإنشاء قناة.');
    }

    if (ownerId && ownerId !== currentUser.id) {
      throw new Error('تعذر التحقق من هوية الحساب. أعد تسجيل الدخول ثم حاول مرة أخرى.');
    }

    const effectiveOwnerId = currentUser.id;

    // تحقق أن المستخدم ليس لديه قناة بالفعل
    const existing = await this.getByOwner(effectiveOwnerId);
    if (existing) throw new Error('لديك قناة بالفعل. يمكنك إنشاء قناة واحدة فقط.');

    const { data, error } = await supabase
      .from('channels')
      .insert([{
        owner_id: effectiveOwnerId,
        name,
        description: description || '',
        avatar_url: avatarUrl || null,
      }])
      .select()
      .single();
    if (error) {
      if (String(error.message || '').includes('row-level security policy')) {
        throw new Error('صلاحيات إنشاء القناة مرفوضة (RLS). تأكد أن سياسة channels_insert_own موجهة لـ authenticated وأن الشرط auth.uid() = owner_id.');
      }
      throw error;
    }

    // ربط القناة بملف المستخدم
    await profileService.update(effectiveOwnerId, { channel_id: data.id });

    return data;
  },

  /** جلب قناة بالـ ID */
  async getById(channelId) {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  /** جلب قناة المستخدم */
  async getByOwner(userId) {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /** تحديث القناة */
  async update(channelId, updates) {
    const { data, error } = await supabase
      .from('channels')
      .update(updates)
      .eq('id', channelId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** جلب كل القنوات */
  async listAll(limit = 50) {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  /** زيادة/نقصان عدّاد */
  async incrementCounter(channelId, field, delta = 1) {
    // استخدام RPC أو update مباشر
    const channel = await this.getById(channelId);
    if (!channel) return null;
    const newVal = Math.max(0, (channel[field] || 0) + delta);
    return this.update(channelId, { [field]: newVal });
  },
};

// ─── POST SERVICE ─────────────────────────────────────────────────────────────

export const postService = {
  /** إنشاء منشور جديد */
  async create({ authorId, authorName, content, imageUrl }) {
    const { data, error } = await supabase
      .from('posts')
      .insert([{
        author_id: authorId,
        author_name: authorName,
        content,
        image_url: imageUrl || null,
        status: 'published',
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** جلب منشور واحد */
  async getById(postId) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();
    if (error) throw error;
    return data;
  },

  /** جلب خلاصة المنشورات (الأحدث أولاً) */
  async getFeed(limit = 20) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  /** جلب منشورات مستخدم معين */
  async getByUser(userId, limit = 20) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  /** حذف منشور */
  async remove(postId) {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
    if (error) throw error;
    return true;
  },

  /** تحديث منشور */
  async update(postId, updates) {
    const { data, error } = await supabase
      .from('posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ─── VIDEO SERVICE ────────────────────────────────────────────────────────────

export const videoService = {
  /** إنشاء فيديو */
  async create({ channelId, authorId, authorName, title, description, videoUrl, thumbnailUrl }) {
    const { data, error } = await supabase
      .from('videos')
      .insert([{
        channel_id: channelId,
        author_id: authorId,
        author_name: authorName,
        title,
        description: description || '',
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl || null,
        status: 'published',
      }])
      .select()
      .single();
    if (error) throw error;

    // زيادة عداد الفيديوهات في القناة
    await channelService.incrementCounter(channelId, 'videos_count');

    return data;
  },

  /** جلب فيديو واحد */
  async getById(videoId) {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();
    if (error) throw error;
    return data;
  },

  /** جلب خلاصة الفيديوهات */
  async getFeed(limit = 20) {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  /** جلب فيديوهات قناة */
  async getByChannel(channelId, limit = 20) {
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  /** حذف فيديو */
  async remove(videoId, channelId) {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);
    if (error) throw error;

    await channelService.incrementCounter(channelId, 'videos_count', -1);
    return true;
  },
};

// ─── SHORTS SERVICE ───────────────────────────────────────────────────────────

export const shortsService = {
  /** إنشاء مقطع قصير */
  async create({ channelId, authorId, authorName, caption, videoUrl }) {
    const { data, error } = await supabase
      .from('shorts')
      .insert([{
        channel_id: channelId,
        author_id: authorId,
        author_name: authorName,
        caption: caption || '',
        video_url: videoUrl,
        status: 'published',
      }])
      .select()
      .single();
    if (error) throw error;

    await channelService.incrementCounter(channelId, 'shorts_count');

    return data;
  },

  /** جلب خلاصة المقاطع */
  async getFeed(limit = 30) {
    const { data, error } = await supabase
      .from('shorts')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  /** جلب مقاطع قناة */
  async getByChannel(channelId, limit = 30) {
    const { data, error } = await supabase
      .from('shorts')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  /** جلب مقطع واحد */
  async getById(shortId) {
    const { data, error } = await supabase
      .from('shorts')
      .select('*')
      .eq('id', shortId)
      .single();
    if (error) throw error;
    return data;
  },

  /** حذف مقطع */
  async remove(shortId, channelId) {
    const { error } = await supabase
      .from('shorts')
      .delete()
      .eq('id', shortId);
    if (error) throw error;

    await channelService.incrementCounter(channelId, 'shorts_count', -1);
    return true;
  },
};

// ─── LIKES SERVICE ────────────────────────────────────────────────────────────

export const likeService = {
  /** إضافة/إزالة إعجاب (toggle) */
  async toggle(userId, contentId, contentType) {
    // تحقق هل المستخدم أعجب بالمحتوى مسبقاً
    const { data: existing } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .maybeSingle();

    if (existing) {
      // إزالة الإعجاب
      await supabase.from('likes').delete().eq('id', existing.id);
      // تنقيص عداد الإعجابات
      await this._updateLikeCount(contentId, contentType, -1);
      return { liked: false };
    } else {
      // إضافة إعجاب
      const { error } = await supabase
        .from('likes')
        .insert([{ user_id: userId, content_id: contentId, content_type: contentType }]);
      if (error) throw error;
      await this._updateLikeCount(contentId, contentType, 1);
      return { liked: true };
    }
  },

  /** التحقق هل المستخدم أعجب بالمحتوى */
  async isLiked(userId, contentId, contentType) {
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .maybeSingle();
    return !!data;
  },

  /** جلب كل الإعجابات لمحتوى معين */
  async getLikedUserIds(contentId, contentType) {
    const { data, error } = await supabase
      .from('likes')
      .select('user_id')
      .eq('content_id', contentId)
      .eq('content_type', contentType);
    if (error) throw error;
    return (data || []).map(l => l.user_id);
  },

  /** تحديث عداد الإعجابات في الجدول المناسب */
  async _updateLikeCount(contentId, contentType, delta) {
    const table = contentType === 'post' ? 'posts' : contentType === 'video' ? 'videos' : 'shorts';
    const { data: item } = await supabase.from(table).select('likes').eq('id', contentId).single();
    if (item) {
      const newCount = Math.max(0, (item.likes || 0) + delta);
      await supabase.from(table).update({ likes: newCount }).eq('id', contentId);
    }
  },
};

// ─── COMMENT SERVICE ──────────────────────────────────────────────────────────

export const commentService = {
  /** إضافة تعليق */
  async add(contentId, contentType, { authorId, authorName, text }) {
    const { data, error } = await supabase
      .from('comments')
      .insert([{
        content_id: contentId,
        content_type: contentType,
        author_id: authorId,
        author_name: authorName,
        text,
      }])
      .select()
      .single();
    if (error) throw error;

    // زيادة عداد التعليقات
    const table = contentType === 'post' ? 'posts' : contentType === 'video' ? 'videos' : 'shorts';
    const { data: item } = await supabase.from(table).select('comments_count').eq('id', contentId).single();
    if (item) {
      await supabase.from(table).update({ comments_count: (item.comments_count || 0) + 1 }).eq('id', contentId);
    }

    return data;
  },

  /** جلب تعليقات محتوى معين */
  async getAll(contentId) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  /** حذف تعليق */
  async remove(commentId, contentId, contentType) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);
    if (error) throw error;

    // تنقيص عداد التعليقات
    const table = contentType === 'post' ? 'posts' : contentType === 'video' ? 'videos' : 'shorts';
    const { data: item } = await supabase.from(table).select('comments_count').eq('id', contentId).single();
    if (item) {
      await supabase.from(table).update({ comments_count: Math.max(0, (item.comments_count || 0) - 1) }).eq('id', contentId);
    }
    return true;
  },
};

// ─── FOLLOW SERVICE ───────────────────────────────────────────────────────────

export const followService = {
  /** متابعة/إلغاء متابعة قناة */
  async toggle(followerId, channelId) {
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('channel_id', channelId)
      .maybeSingle();

    if (existing) {
      await supabase.from('follows').delete().eq('id', existing.id);
      await channelService.incrementCounter(channelId, 'followers_count', -1);
      return { following: false };
    } else {
      const { error } = await supabase
        .from('follows')
        .insert([{ follower_id: followerId, channel_id: channelId }]);
      if (error) throw error;
      await channelService.incrementCounter(channelId, 'followers_count', 1);
      return { following: true };
    }
  },

  /** التحقق هل المستخدم يتابع */
  async isFollowing(followerId, channelId) {
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('channel_id', channelId)
      .maybeSingle();
    return !!data;
  },

  /** جلب القنوات التي يتابعها المستخدم */
  async getFollowing(followerId) {
    const { data, error } = await supabase
      .from('follows')
      .select('channel_id')
      .eq('follower_id', followerId);
    if (error) throw error;
    return (data || []).map(f => f.channel_id);
  },

  /** جلب متابعي قناة */
  async getFollowers(channelId) {
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('channel_id', channelId);
    if (error) throw error;
    return (data || []).map(f => f.follower_id);
  },
};

// ─── NOTIFICATION SERVICE ─────────────────────────────────────────────────────

export const notificationService = {
  /** إرسال إشعار */
  async push(userId, { type, message, fromUser, contentId }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type,
        message,
        from_user: fromUser || null,
        content_id: contentId || null,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** جلب إشعارات المستخدم */
  async getAll(userId, limit = 50) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  /** تحديد الكل كمقروء */
  async markAllRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
    return true;
  },

  /** عدد الغير مقروءة */
  async getUnreadCount(userId) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
    return count || 0;
  },
};

// ─── BOOKMARK SERVICE ─────────────────────────────────────────────────────────

export const bookmarkService = {
  /** إضافة محفوظ */
  async add(userId, contentId, contentType) {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert([{
        user_id: userId,
        content_id: contentId,
        content_type: contentType,
      }])
      .select()
      .single();
    if (error) {
      // إذا كان موجود بالفعل (UNIQUE violation)
      if (error.code === '23505') return null;
      throw error;
    }
    return data;
  },

  /** إزالة محفوظ */
  async remove(userId, contentId, contentType) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('content_type', contentType);
    if (error) throw error;
    return true;
  },

  /** جلب كل المحفوظات */
  async getAll(userId) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  /** التحقق هل محفوظ */
  async isBookmarked(userId, contentId, contentType) {
    const { data } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .maybeSingle();
    return !!data;
  },
};

// ─── MESSAGE SERVICE ──────────────────────────────────────────────────────────

export const messageService = {
  /** إرسال رسالة */
  async send(senderId, receiverId, text) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ sender_id: senderId, receiver_id: receiverId, text }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  /** جلب المحادثة بين مستخدمين */
  async getConversation(userId1, userId2, limit = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  /** تحديد الرسائل كمقروءة */
  async markRead(receiverId, senderId) {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('receiver_id', receiverId)
      .eq('sender_id', senderId)
      .eq('read', false);
    if (error) throw error;
    return true;
  },
};

// ─── STORAGE SERVICE ──────────────────────────────────────────────────────────

export const storageService = {
  /**
   * رفع ملف (صورة/فيديو)
   * @param {File} file - الملف
   * @param {string} bucket - اسم الـ bucket (avatars, media)
   * @param {string} folder - مجلد داخل الـ bucket (مثل userId)
   * @returns {Promise<string>} الرابط العام
   */
  async uploadFile(file, bucket = 'media', folder = '') {
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${file.name}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  },

  /** حذف ملف */
  async deleteFile(bucket, filePath) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    if (error) throw error;
    return true;
  },

  /** الحصول على رابط عام */
  getPublicUrl(bucket, filePath) {
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    return publicUrl;
  },
};
