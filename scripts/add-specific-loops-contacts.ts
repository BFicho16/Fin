/**
 * Script to add specific users to Loops.so
 * 
 * Usage:
 *   npx tsx scripts/add-specific-loops-contacts.ts
 */

// Load environment variables from .env file
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

import { createAdminClient } from '../src/lib/supabase/admin';
import { addContactToLoops } from '../src/lib/loops';

const emailsToAdd = [
  'amolibri@gmail.com',
  'alsylvia.lange@gmail.com',
  'musicbum553@aol.com',
  'murphy71082@gmail.com',
  'rori516@aol.com',
];

async function addSpecificContacts() {
  console.log('🚀 Adding specific users to Loops...\n');

  if (!process.env.LOOPS_API_KEY) {
    console.error('❌ Error: LOOPS_API_KEY environment variable is not set');
    process.exit(1);
  }

  const adminClient = createAdminClient();
  
  let totalSuccess = 0;
  let totalFailed = 0;
  const errors: Array<{ email: string; error: string }> = [];

  console.log(`📋 Looking up ${emailsToAdd.length} users in Supabase...\n`);

  for (const email of emailsToAdd) {
    try {
      // Find user by email in Supabase
      const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
      
      if (listError) {
        console.error(`❌ Error fetching users:`, listError.message);
        totalFailed++;
        errors.push({ email, error: `Failed to fetch users: ${listError.message}` });
        continue;
      }

      const user = usersData?.users?.find((u: any) => 
        u.email?.toLowerCase() === email.toLowerCase()
      );

      if (!user) {
        console.log(`⚠️  User not found: ${email}`);
        totalFailed++;
        errors.push({ email, error: 'User not found in Supabase' });
        continue;
      }

      if (!user.email) {
        console.log(`⚠️  User has no email: ${user.id}`);
        totalFailed++;
        errors.push({ email, error: 'User has no email address' });
        continue;
      }

      console.log(`📧 Processing: ${email} (${user.id})`);

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
        console.log(`✅ ${email} - Added successfully\n`);
      } else {
        totalFailed++;
        errors.push({
          email,
          error: result.error || 'Unknown error',
        });
        console.log(`❌ ${email} - ${result.error}\n`);
      }

      // Delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      totalFailed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push({ email, error: errorMessage });
      console.error(`❌ Unexpected error for ${email}:`, errorMessage);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Summary:');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${totalSuccess}`);
  console.log(`❌ Failed: ${totalFailed}`);
  
  if (errors.length > 0) {
    console.log('\n❌ Errors:');
    errors.forEach((err, index) => {
      console.log(`  ${index + 1}. ${err.email}: ${err.error}`);
    });
  }

  console.log('\n✨ Complete!');
}

// Run the script
addSpecificContacts()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });

