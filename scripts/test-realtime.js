// Quick script to test real-time functionality
// Run this in browser console on your PVP page

console.log('🚀 Starting Real-time Test...');

// Test 1: Basic Supabase connection
async function testBasicConnection() {
  console.log('📡 Testing basic Supabase connection...');

  try {
    const { supabase } = window;
    if (!supabase) {
      console.error('❌ Supabase not found on window object');
      return false;
    }

    const { data, error } = await supabase
      .from('available_tokens')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Basic connection failed:', error);
      return false;
    }

    console.log('✅ Basic connection successful');
    return true;
  } catch (err) {
    console.error('❌ Connection test error:', err);
    return false;
  }
}

// Test 2: Real-time subscription test
function testRealtimeSubscription() {
  console.log('📡 Testing real-time subscription...');

  const { supabase } = window;

  const testChannel = supabase
    .channel('realtime_test_' + Date.now())
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pvp_matches'
      },
      (payload) => {
        console.log('✅ Real-time update received:', payload);
      }
    )
    .subscribe((status) => {
      console.log('📡 Subscription status:', status);

      if (status === 'SUBSCRIBED') {
        console.log('✅ Real-time subscription successful!');

        // Cleanup after 5 seconds
        setTimeout(() => {
          testChannel.unsubscribe();
          console.log('🧽 Test channel cleaned up');
        }, 5000);
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Real-time subscription failed');
      }
    });

  return testChannel;
}

// Test 3: Create a test match to verify real-time updates
async function testMatchCreation() {
  console.log('🎮 Testing match creation with real-time updates...');

  const { supabase } = window;

  try {
    // Generate a test invite code
    const testCode = 'TEST' + Math.random().toString(36).substring(2, 6).toUpperCase();

    console.log('Creating test match with code:', testCode);

    const { data: newMatch, error } = await supabase
      .from('pvp_matches')
      .insert({
        invite_code: testCode,
        creator_wallet: 'test-wallet-' + Date.now(),
        duration_seconds: 60,
        status: 'waiting_for_opponent'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Match creation failed:', error);
      return null;
    }

    console.log('✅ Test match created:', newMatch);

    // Subscribe to updates for this specific match
    const matchChannel = supabase
      .channel('test_match_' + newMatch.id)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pvp_matches',
          filter: `id=eq.${newMatch.id}`
        },
        (payload) => {
          console.log('🎯 Match-specific update received:', payload);
        }
      )
      .subscribe();

    // Test updating the match after 2 seconds
    setTimeout(async () => {
      console.log('🔄 Updating test match...');

      const { data: updatedMatch, error: updateError } = await supabase
        .from('pvp_matches')
        .update({ status: 'selecting_coins' })
        .eq('id', newMatch.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Match update failed:', updateError);
      } else {
        console.log('✅ Match updated successfully:', updatedMatch);
      }
    }, 2000);

    // Cleanup after 10 seconds
    setTimeout(async () => {
      matchChannel.unsubscribe();

      // Delete test match
      await supabase
        .from('pvp_matches')
        .delete()
        .eq('id', newMatch.id);

      console.log('🧽 Test match cleaned up');
    }, 10000);

    return newMatch;
  } catch (err) {
    console.error('❌ Match creation test error:', err);
    return null;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🏁 Running comprehensive real-time tests...');

  const basicOk = await testBasicConnection();

  if (basicOk) {
    testRealtimeSubscription();
    await testMatchCreation();
    console.log('🎉 All tests initiated! Check console for results.');
  } else {
    console.error('❌ Basic connection failed, skipping other tests');
  }
}

// Expose test function to global scope
window.testRealtime = runAllTests;

console.log('✅ Real-time test script loaded!');
console.log('💡 Run window.testRealtime() to start tests');

// Auto-run if this script is executed directly
if (typeof module === 'undefined') {
  runAllTests();
}