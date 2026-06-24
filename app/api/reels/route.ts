import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = process.env.IG_ACCESS_TOKEN;
    
    if (!token) {
      return NextResponse.json({ error: "Instagram token missing in .env.local" }, { status: 400 });
    }

    // Meta API endpoint
    const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&access_token=${token}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("Meta API Error:", data.error);
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    // Terminal mein log karte hain taaki hum dekh sakein Meta ne exactly kya bheja hai
    console.log("Data from Meta:", data.data);

    // Filter HATA diya gaya hai. Ab Images, Carousels, aur Videos sab aayenge.
    const allPosts = data.data || [];

    return NextResponse.json({ success: true, reels: allPosts });
  } catch (error) {
    console.error("Fetch Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch reels" }, { status: 500 });
  }
}