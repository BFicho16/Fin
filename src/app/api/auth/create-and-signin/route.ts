import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { addContactToLoops } from '@/lib/loops';

export async function POST(request: NextRequest) {
  try {
    const { email, guestSessionId } = await request.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log('[create-and-signin] Starting for email:', email);
    const adminClient = createAdminClient();

    let userId: string;
    let session;

    // First, check if user already exists by listing users and searching by email
    // This avoids ambiguous "Database error" messages when user exists
    console.log('[create-and-signin] Checking if user exists...');
    const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
    
    console.log('[create-and-signin] List users result:', {
      hasData: !!usersData,
      hasUsers: !!usersData?.users,
      usersCount: usersData?.users?.length || 0,
      error: listError?.message,
    });
    
    let existingUser = null;
    if (!listError && usersData?.users) {
      // Check for exact match and also case-insensitive match
      existingUser = usersData.users.find((u: any) => 
        u.email?.toLowerCase() === email.toLowerCase()
      );
      console.log('[create-and-signin] Found existing user?', !!existingUser);
      if (!existingUser) {
        // Log all emails for debugging
        console.log('[create-and-signin] Available emails:', usersData.users.map((u: any) => u.email));
      }
    }

    if (existingUser) {
      // User already exists
      userId = existingUser.id;
      console.log('[create-and-signin] Using existing user ID:', userId);
    } else {
      // User doesn't exist, create them
      console.log('[create-and-signin] User does not exist, creating new user...');
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: email,
        email_confirm: true,
      });

      if (createError) {
        console.error('[create-and-signin] Failed to create user:', {
          message: createError.message,
          status: createError.status,
          name: createError.name,
          code: (createError as any).code,
          fullError: JSON.stringify(createError, null, 2),
        });
        
        // Check if this might be a user exists error despite not finding them in list
        // (could be pagination issue or case sensitivity)
        const errorMessage = createError.message?.toLowerCase() || '';
        const mightBeUserExists = 
          errorMessage.includes('duplicate') ||
          errorMessage.includes('unique') ||
          errorMessage.includes('constraint') ||
          (createError as any).code === 'unexpected_failure';
        
        if (mightBeUserExists) {
          console.log('[create-and-signin] Error might indicate user exists, trying to find with pagination...');
          // Try listing more users or check with getUserById if we can find them another way
          // For now, suggest checking Supabase dashboard
          return Response.json(
            { 
              error: 'User may already exist or database constraint issue',
              details: createError.message,
              suggestion: 'Check Supabase Auth logs for more details. This could be a database trigger or constraint issue.',
            },
            { status: 500 }
          );
        }
        
        return Response.json(
          { error: 'Failed to create user', details: createError.message },
          { status: 500 }
        );
      }

      if (!newUser?.user) {
        console.error('[create-and-signin] No user data returned from createUser');
        return Response.json(
          { error: 'Failed to create user - no user data returned' },
          { status: 500 }
        );
      }

      userId = newUser.user.id;
      console.log('[create-and-signin] New user created with ID:', userId);

      // Add user to Loops (non-blocking, silent failure)
      if (newUser.user.email) {
        addContactToLoops(newUser.user.email, userId).catch((error) => {
          // Silent failure - don't block user creation flow
          console.error('[create-and-signin] Failed to add contact to Loops:', error);
        });
      }
    }

    // Generate a magic link for the user (works for both new and existing)
    // Use 'recovery' type which might work better for programmatic use, or try 'signup'
    console.log('[create-and-signin] Generating magic link...');
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (linkError || !linkData) {
      console.error('[create-and-signin] Failed to generate link:', linkError);
      return Response.json(
        { error: 'Failed to generate sign-in link', details: linkError?.message },
        { status: 500 }
      );
    }

    console.log('[create-and-signin] Magic link generated, extracting hashed_token...');
    
    // According to Supabase docs and web research, generateLink() returns hashed_token in properties
    // This is the correct way to programmatically create a session
    const hashedToken = (linkData.properties as any)?.hashed_token;
    
    if (!hashedToken) {
      console.error('[create-and-signin] No hashed_token in linkData.properties:', {
        properties: linkData.properties,
        allKeys: Object.keys(linkData.properties || {}),
      });
      return Response.json(
        { error: 'No hashed_token found in magic link response' },
        { status: 500 }
      );
    }

    // Exchange hashed_token for session using admin client
    // This is the programmatic way to create a session without requiring user to click email link
    console.log('[create-and-signin] Verifying OTP with hashed_token to create session...');
    const { data: sessionData, error: sessionError } = await adminClient.auth.verifyOtp({
      token_hash: hashedToken,
      type: 'email',
    });

    if (sessionError || !sessionData.session) {
      console.error('[create-and-signin] Failed to verify OTP:', sessionError);
      return Response.json(
        { error: 'Failed to create session', details: sessionError?.message },
        { status: 500 }
      );
    }

    session = sessionData.session;
    console.log('[create-and-signin] Session created successfully');

    // Return session data
    return Response.json({
      success: true,
      userId,
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        token_type: session.token_type,
        user: session.user,
      },
    });
  } catch (error) {
    console.error('[create-and-signin] Unhandled error:', error);
    console.error('[create-and-signin] Error stack:', error instanceof Error ? error.stack : 'No stack');
    return Response.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

