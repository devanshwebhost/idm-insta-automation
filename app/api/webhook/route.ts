import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase'; // Apna supabase client import karo

// app/api/webhook/route.ts

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Yahan apna koi bhi secret token rakhein (jo aap dashboard mein dalenge)
  const MY_VERIFY_TOKEN = "indocs_media_secret_token";

  if (mode === 'subscribe' && token === MY_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  } else {
    return new Response('Forbidden', { status: 403 });
  }
}

// ... aapka existing POST function niche hi rahega

export async function POST(req: Request) {
  const body = await req.json();

  // 1. Webhook Verification (Meta ke liye)
  if (body.object === 'instagram') {
    const entry = body.entry?.[0];
    const messaging = entry?.messaging?.[0] || entry?.changes?.[0]?.value;
    
    // Global Settings check karo (Bot On hai ya Off?)
    const { data: settings } = await supabase
      .from('global_settings')
      .select('is_bot_active, dm_master_prompt')
      .eq('id', 1)
      .single();

    if (!settings?.is_bot_active) {
      return NextResponse.json({ status: 'Bot is disabled' });
    }

    // 2. DM ya Comment handle karo (IMPROVED LOGIC)
    const isComment = !!messaging.comment; // Agar 'comment' object hai, toh yeh comment hai
    const isDM = !!messaging.message;     // Agar 'message' object hai, toh yeh DM hai

    const senderId = isComment ? messaging.from.id : messaging.sender.id;
    const text = isComment ? messaging.text : messaging.message.text;
    const mediaId = isComment ? messaging.media.id : null; // Comments mein media ID alag se aata hai
    const commentId = isComment ? messaging.id : null; // Comment reply ke liye comment ID zaroori hai

    if (!text || !senderId) {
      console.log("Webhook received but no text or sender ID found. Skipping.");
      return NextResponse.json({ status: 'ok' });
    }

    // 3. Automation check (kya ye kisi reel ka reply hai?)
    // Agar DM hai ya koi rule nahi mila, toh default DM prompt use karo
    let finalPrompt = settings.dm_master_prompt || "You are a helpful AI. Reply in short Hinglish under 15 words.";
    
    // Sirf comment ke case mein reel-specific rule check karo
    if (isComment && mediaId) {
      const { data: rule } = await supabase
        .from('automations')
        .select('ai_prompt')
        .eq('reel_id', mediaId)
        .single();
      
      if (rule) finalPrompt = rule.ai_prompt;
    }

    // 4. Groq AI ko call karo
    const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: finalPrompt },
          { role: "user", content: text }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const reply = aiData.choices[0].message.content;

    // 5. Instagram par reply bhejo (WITH ERROR LOGGING)
    try {
      let metaApiUrl = '';
      let payload = {};

      if (isDM) {
        console.log(`Attempting to send DM to: ${senderId}`);
        metaApiUrl = `https://graph.facebook.com/v21.0/me/messages?access_token=${process.env.IG_ACCESS_TOKEN}`;
        payload = {
          recipient: { id: senderId },
          message: { text: reply }
        };
      } else if (isComment && commentId) {
        console.log(`Attempting to reply to comment: ${commentId}`);
        metaApiUrl = `https://graph.facebook.com/v21.0/${commentId}/replies?access_token=${process.env.IG_ACCESS_TOKEN}`;
        payload = {
          message: reply
        };
      } else {
        console.log("Cannot reply: Not a DM and no commentId found.");
        return NextResponse.json({ status: 'ok' });
      }

      const metaResponse = await fetch(metaApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const metaData = await metaResponse.json();
      
      // YAHI HAI ASLI JADOO JO ERROR BATA YEGA
      console.log("META API RESPONSE:", metaData);

      if (!metaResponse.ok) {
        if(isDM) console.error("FAILED TO SEND DM. Meta Error:", metaData);
        if(isComment) console.error("FAILED TO REPLY TO COMMENT. Meta Error:", metaData);
      } else {
        if(isDM) console.log("DM SENT SUCCESSFULLY!");
        if(isComment) console.log("COMMENT REPLY SENT SUCCESSFULLY!");
      }

    } catch (error) {
      console.error("CRITICAL ERROR IN FETCH:", error);
    }

    return NextResponse.json({ status: 'success' });
  }

  return NextResponse.json({ status: 'ok' });
}