import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { password } = body;
    
    // .env se actual password uthao
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (password === adminPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, message: "Galat password bhai!" }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}