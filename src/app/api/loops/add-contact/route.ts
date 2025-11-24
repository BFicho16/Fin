import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { addContactToLoops } from '@/lib/loops';

/**
 * API route to add the authenticated user to Loops.so as a contact
 * 
 * This endpoint:
 * - Verifies the user is authenticated
 * - Extracts user email and ID from the session
 * - Calls Loops API to add the contact
 * - Returns success/error response without throwing
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!user.email) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 400 }
      );
    }

    // Add contact to Loops
    const result = await addContactToLoops(user.email, user.id);

    if (!result.success) {
      // Log error but don't fail the request
      console.error('[Loops API] Failed to add contact:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Failed to add contact to Loops' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Contact added to Loops successfully' 
    });
  } catch (error) {
    console.error('[Loops API] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

