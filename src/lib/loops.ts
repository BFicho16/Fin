/**
 * Loops.so API integration utilities
 * 
 * This module provides functions to interact with Loops.so API
 * for managing email contacts and marketing campaigns.
 */

const LOOPS_API_BASE_URL = 'https://app.loops.so/api/v1';

export interface AddContactResult {
  success: boolean;
  error?: string;
}

/**
 * Adds a contact to Loops.so
 * 
 * @param email - User's email address
 * @param userId - User's unique ID (used as external_id for matching)
 * @returns Promise with success status and optional error message
 */
export async function addContactToLoops(
  email: string,
  userId: string
): Promise<AddContactResult> {
  const apiKey = process.env.LOOPS_API_KEY;

  if (!apiKey) {
    console.error('[Loops] LOOPS_API_KEY environment variable is not set');
    return {
      success: false,
      error: 'Loops API key not configured',
    };
  }

  if (!email || !userId) {
    console.error('[Loops] Missing required parameters: email or userId');
    return {
      success: false,
      error: 'Missing required parameters',
    };
  }

  try {
    const response = await fetch(`${LOOPS_API_BASE_URL}/contacts/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        external_id: userId, // Loops uses external_id for matching contacts with your user IDs
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Loops] API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      return {
        success: false,
        error: `Loops API error: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json().catch(() => ({}));
    console.log('[Loops] Contact added successfully:', { email, userId });
    return {
      success: true,
    };
  } catch (error) {
    console.error('[Loops] Network or parsing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

