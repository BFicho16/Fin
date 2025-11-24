/**
 * Backfill script to add all existing Supabase users to Loops.so
 * 
 * Usage:
 *   npm run backfill-loops
 *   or
 *   npx tsx scripts/backfill-loops-contacts.ts
 * 
 * Make sure your .env file has:
 *   - LOOPS_API_KEY
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

// Load environment variables from .env file
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file from project root
config({ path: resolve(process.cwd(), '.env') });

import { createAdminClient } from '../src/lib/supabase/admin';
import { addContactToLoops } from '../src/lib/loops';

interface User {
  id: string;
  email?: string;
}

async function backfillLoopsContacts() {
  console.log('🚀 Starting Loops contacts backfill...\n');

  // Check for required environment variables
  if (!process.env.LOOPS_API_KEY) {
    console.error('❌ Error: LOOPS_API_KEY environment variable is not set');
    console.error('   Please set it in your .env file or environment');
    process.exit(1);
  }

  const adminClient = createAdminClient();
  
  let page = 1;
  let hasMore = true;
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  const errors: Array<{ email?: string; userId: string; error: string }> = [];

  console.log('📋 Fetching users from Supabase...\n');

  while (hasMore) {
    try {
      // Fetch users with pagination (100 per page is default)
      const { data, error } = await adminClient.auth.admin.listUsers({
        page,
        perPage: 100,
      });

      if (error) {
        console.error(`❌ Error fetching users (page ${page}):`, error.message);
        break;
      }

      const users = data?.users || [];
      
      if (users.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`📄 Processing page ${page} (${users.length} users)...`);

      // Process users sequentially to avoid rate limiting
      // Loops API has rate limits, so we process one at a time with delays
      for (const user of users) {
        if (!user.email) {
          console.log(`⚠️  Skipping user ${user.id} - no email address`);
          continue;
        }

        totalProcessed++;
        
        // Retry logic for rate limiting
        let retries = 3;
        let result;
        
        while (retries > 0) {
          result = await addContactToLoops(user.email, user.id);
          
          // If successful or not a rate limit error, break
          if (result.success || !result.error?.includes('429')) {
            break;
          }
          
          // Rate limited - wait and retry
          if (result.error?.includes('429')) {
            retries--;
            if (retries > 0) {
              const waitTime = (4 - retries) * 2000; // Exponential backoff: 2s, 4s, 6s
              console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          } else {
            break;
          }
        }

        if (result.success) {
          totalSuccess++;
          process.stdout.write(`✅ ${user.email}\n`);
        } else {
          totalFailed++;
          errors.push({
            email: user.email,
            userId: user.id,
            error: result.error || 'Unknown error',
          });
          process.stdout.write(`❌ ${user.email}: ${result.error}\n`);
        }

        // Delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Check if there are more pages
      hasMore = users.length === 100; // If we got exactly 100, there might be more
      page++;

    } catch (error) {
      console.error(`❌ Unexpected error on page ${page}:`, error);
      hasMore = false;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Backfill Summary:');
  console.log('='.repeat(60));
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`✅ Successful: ${totalSuccess}`);
  console.log(`❌ Failed: ${totalFailed}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach((err, index) => {
      console.log(`  ${index + 1}. ${err.email || err.userId}: ${err.error}`);
    });
  }

  console.log('\n✨ Backfill complete!');
}

// Run the script
backfillLoopsContacts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

