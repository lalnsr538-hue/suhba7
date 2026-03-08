/**
 * Moderation Service — فلترة المحتوى بالذكاء الاصطناعي
 * يستخدم Puter AI للفحص (مجاني ولا يحتاج API key)
 * ═══════════════════════════════════════════════════════════════
 */

const getPuter = () => {
  if (!window.puter) {
    console.warn('Puter.js SDK not loaded — moderation will be skipped.');
    return null;
  }
  return window.puter;
};

const SYSTEM_PROMPT = `صفتك مشرف محتوى في منصة تواصل اجتماعي "إسلامية" محافظة. 
مهمتك تحليل النص أو الصورة المرفقة، والرد الدقيق بكلمة واحدة فقط:
"مقبول" (إذا كان المحتوى هادف وخالي من المحرمات) 
أو "مرفوض" (إذا كان المحتوى يحتوي على: ألفاظ نابية، سب، شتم، تبرج، عري، موسيقى صاخبة، دعوة للرذيلة، أو أي شيء يصنف "حرام" بشكل صريح).
الرد بكلمة واحدة فقط دون أي شرح إضافي.`;

export const moderationService = {
  /** فحص نص */
  async checkText(text) {
    try {
      const puter = getPuter();
      if (!puter) return 'approved';

      const response = await puter.ai.chat(
        `${SYSTEM_PROMPT}\n\nالنص المُراد فحصه:\n"${text}"`,
        { model: 'gpt-4o-mini' }
      );
      const result = response?.message?.content?.trim() || 'مقبول';
      return result.includes('مرفوض') ? 'rejected' : 'approved';
    } catch (err) {
      console.error('Text moderation failed, defaulting to approved:', err);
      return 'approved';
    }
  },

  /** فحص صورة + نص */
  async checkMediaAndText(text, imageUrl) {
    try {
      const puter = getPuter();
      if (!puter) return 'approved';

      const response = await puter.ai.chat(
        `${SYSTEM_PROMPT}\n\nالنص التوضيحي المرفق للملف:\n"${text}"\n\nقم بفحص الملف والنص.`,
        imageUrl,
        { model: 'gpt-4o' }
      );
      const result = response?.message?.content?.trim() || 'مقبول';
      return result.includes('مرفوض') ? 'rejected' : 'approved';
    } catch (err) {
      console.error('Media moderation failed, defaulting to approved:', err);
      return 'approved';
    }
  },
};
