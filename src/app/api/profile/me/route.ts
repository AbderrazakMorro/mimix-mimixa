import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userTokenPayload = await verifyJWT(token);
    if (!userTokenPayload || !userTokenPayload.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const supabase = createServerSupabase();

    // Fetch Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userTokenPayload.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError);
    }

    // Fetch Settings
    const { data: settings, error: settingsError } = await supabase
      .from('profile_settings')
      .select('*')
      .eq('user_id', userTokenPayload.id)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching settings:', settingsError);
    }

    // Fetch Stats
    const { data: stats, error: statsError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userTokenPayload.id)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Error fetching stats:', statsError);
    }

    return NextResponse.json({
      profile: profile || null,
      settings: settings || null,
      stats: stats || null,
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userTokenPayload = await verifyJWT(token);
    if (!userTokenPayload || !userTokenPayload.id) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { display_name, username, bio, avatar_url, avatar_id, settings: settingsUpdate } = body;

    const supabase = createServerSupabase();

    // Prepare update payload
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };
    
    // 1. Handle Username (Pseudo) uniqueness check
    if (username !== undefined && username.trim() !== '') {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', userTokenPayload.id)
        .single();
      
      if (existingUser) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 400 });
      }
      updates.username = username;
    }

    if (display_name !== undefined) updates.display_name = display_name;
    if (bio !== undefined) updates.bio = bio;

    // 2. Handle Avatar Selection (by id or directly by url)
    if (avatar_id) {
      const { data: avatarData } = await supabase
        .from('avatars')
        .select('image_url')
        .eq('id', avatar_id)
        .single();
      
      if (avatarData) {
        updates.avatar_url = avatarData.image_url;
      }
    } else if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url;
    }

    // Update Profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userTokenPayload.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    // 3. Keep main 'users' table in sync for auth/backwards compatibility
    const userUpdates: Record<string, string> = {};
    if (updates.username) userUpdates.username = updates.username as string;
    if (updates.avatar_url) userUpdates.avatar_url = updates.avatar_url as string;

    if (Object.keys(userUpdates).length > 0) {
      await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', userTokenPayload.id);
    }

    // 4. Update Settings if provided
    let updatedSettings = null;
    if (settingsUpdate) {
      const { data: sData, error: sError } = await supabase
        .from('profile_settings')
        .update({
          ...settingsUpdate,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userTokenPayload.id)
        .select()
        .single();
      
      if (sError) {
        console.error('Error updating settings:', sError);
      } else {
        updatedSettings = sData;
      }
    }

    return NextResponse.json({ 
      success: true, 
      profile: updatedProfile,
      settings: updatedSettings
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
