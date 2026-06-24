import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase'; // Apna supabase client import karo

// app/api/webhook/route.ts

// export async function GET(req: Request) {
//   const { searchParams } = new URL(req.url);
  
//   const mode = searchParams.get('hub.mode');
//   const token = searchParams.get('hub.verify_token');
//   const challenge = searchParams.get('hub.challenge');

//   // Yahan apna koi bhi secret token rakhein (jo aap dashboard mein dalenge)
//   const MY_VERIFY_TOKEN = "indocs_media_secret_token";

//   if (mode === 'subscribe' && token === MY_VERIFY_TOKEN) {
//     return new Response(challenge, { status: 200 });
//   } else {
//     return new Response('Forbidden', { status: 403 });
//   }
// }

// // ... aapka existing POST function niche hi rahega

// export async function POST(req: Request) {
//     console.log("--- REQUEST HIT THE SERVER ---");
//   const body = await req.json();
//   console.log("BODY RECEIVED:", body);

//   if (body.object === 'instagram') {
//     const entry = body.entry?.[0];

//     // 1. DM/Message handle karne ke liye (Aapka purana logic)
//     if (entry.messaging) {
//       const messaging = entry.messaging[0];
//       // ... aapka existing DM handling code ...
//     }

//     // 2. Reactions handle karne ke liye (Naya Logic)
//     if (entry.changes) {
//       const change = entry.changes[0];
//       if (change.field === 'message_reactions') {
//         const { sender, reaction } = change.value;
//         console.log(`User ${sender.id} reacted with ${reaction.emoji}`);
        
//         // Yahan reaction handle karne ka code likho (jaise DB update)
//       }
//     }
//   }

//   return NextResponse.json({ status: 'success' });
// }

export async function POST(req: Request) {
  const body = await req.json();
  const entry = body.entry?.[0];

  if (entry?.messaging) {
    const messaging = entry.messaging[0];
    
    // SAFETY: Pehle check karo ki 'sender' exist karta hai ya nahi
    const senderId = messaging.sender?.id; 

    // 1. Agar TEXT MESSAGE hai
    if (messaging.message?.text) {
      console.log("DM RECEIVED from:", senderId, "Text:", messaging.message.text);
      // Yahan apna bot logic chalao
    } 
    // 2. Agar REACTION hai
    else if (messaging.reaction) {
      console.log("REACTION RECEIVED from:", senderId, "Emoji:", messaging.reaction.emoji);
      // Yahan reaction handle karo (yahan senderId undefined ho sakta hai, isliye crash nahi hoga)
    }
  }

  return NextResponse.json({ status: 'success' });
}