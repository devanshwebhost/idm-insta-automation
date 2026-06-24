// config/automations.ts

export const REEL_AUTOMATIONS: Record<string, { aiPrompt: string, triggerWords?: string[] }> = {
  // Apna actual Reel ID yahan replace karna baad mein
  "179876543210987": { 
    triggerWords: ["hello"],
    aiPrompt: "You are an edgy AI assistant for a creator. The user commented on an interactive video. Reply in exactly 1 short sentence in casual Gen-Z Hinglish. Use emojis. DO NOT exceed 15 words. End by saying 'Click here to visit site: https://indocsmedia.vercel.app'",
  },
  "DEFAULT": {
    aiPrompt: "You are a helpful AI. Reply in short Hinglish under 15 words.",
  }
};