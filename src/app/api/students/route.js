import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase Client with Service Role Key (for admin tasks)
const supabaseUrl = process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith('http')
  ? `https://${process.env.SUPABASE_URL}.supabase.co`
  : process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Helper to seed admin on first call
async function seedAdmin() {
  try {
    const { data } = await supabaseAdmin.auth.admin.listUsers();
    if (data && data.users) {
      const adminExists = data.users.some(u => u.email === 'admin@pieenear.com');
      if (!adminExists) {
        await supabaseAdmin.auth.admin.createUser({
          email: 'admin@pieenear.com',
          password: 'admin123',
          email_confirm: true,
          user_metadata: { name: 'Super Admin', role: 'admin' }
        });
      }
    }
  } catch (error) {
    console.error("Admin seeding failed:", error);
  }
}

export async function GET() {
  try {
    await seedAdmin();
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) throw error;
    
    // Format response to match the student profiles
    const students = data.users
      .filter(u => u.email !== 'admin@pieenear.com') // Hide admin from student roster
      .map(u => ({
        id: u.id,
        name: u.user_metadata?.name || 'Unnamed',
        email: u.email,
        password: u.user_metadata?.password || '••••••••', // Send metadata saved password
        course: u.user_metadata?.course || 'Full-Stack Web Development',
        joinedDate: u.user_metadata?.joinedDate || 'June 2026',
        status: u.user_metadata?.status || 'Active'
      }));

    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, email, password, course } = body;
    
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        course,
        password, // Save original password in metadata so admin can see it in roster
        joinedDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
        status: "Active"
      }
    });

    if (error) throw error;
    return NextResponse.json({ success: true, user: data.user });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, name, email, password, course, status } = body;
    
    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const updateData = {};

    if (email) updateData.email = email;
    if (password) updateData.password = password;
    
    // Fetch existing user to merge metadata
    const { data: userRecord, error: fetchError } = await supabaseAdmin.auth.admin.getUserById(id);
    if (fetchError) throw fetchError;
    
    const existingMetadata = userRecord?.user?.user_metadata || {};
    updateData.user_metadata = {
      ...existingMetadata,
    };
    
    if (name) updateData.user_metadata.name = name;
    if (course) updateData.user_metadata.course = course;
    if (status) updateData.user_metadata.status = status;
    if (password) updateData.user_metadata.password = password;

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, updateData);
    if (error) throw error;

    return NextResponse.json({ success: true, user: data.user });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
