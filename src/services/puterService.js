/**
 * ═══════════════════════════════════════════════════════════════
 *  صُحبة — Puter.js Service Layer (AI Moderation Only)
 * ═══════════════════════════════════════════════════════════════
 * 
 * ⚠️ هذا الملف لم يعد يُستخدم كقاعدة بيانات رئيسية.
 * تم نقل كل الخدمات إلى supabaseService.js
 * 
 * يُحتفظ بهذا الملف فقط كمرجع.
 * خدمة الـ Moderation بالذكاء الاصطناعي نُقلت إلى moderationService.js
 * 
 * يمكنك حذف هذا الملف بأمان.
 */

// Re-export everything from the unified service for backward compatibility
export {
    authService,
    profileService as userService,
    channelService,
    postService,
    videoService,
    shortsService,
    commentService,
    followService,
    notificationService,
    bookmarkService,
    messageService,
    storageService,
    likeService,
} from './supabaseService';

export { moderationService } from './moderationService';
