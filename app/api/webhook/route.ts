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

  // DEBUGGING: Yeh line verify karegi ki request aa bhi rahi hai ya nahi
  console.log("META WEBHOOK RECEIVED:", JSON.stringify(body, null, 2));

  // Check karo ki kya yeh instagram ya page (DM) event hai
  const isInstagram = body.object === 'instagram';
  const isPage = body.object === 'page';

  if (isInstagram || isPage) {
    const entry = body.entry?.[0];
    
    // Yahan extraction logic handle karo
    // Note: DMs aksar 'messaging' array mein aate hain
    const messaging = entry?.messaging?.[0]; 
    const changes = entry?.changes?.[0]?.value;
    
    // Log extract ki gayi values ko taaki pata chale data mil raha hai ya nahi
    console.log("EXTRACTED DATA:", { messaging, changes });

    // Agar messaging nahi mila, toh aage mat badho
    if (!messaging) return NextResponse.json({ status: 'ok' });

    // ... (Baaki tumhara Supabase aur Groq wala logic yahan rakho)
    
    // Ek basic success response
    return NextResponse.json({ status: 'success' });
  }

  return NextResponse.json({ status: 'ok' });
}