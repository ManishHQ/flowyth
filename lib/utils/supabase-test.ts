import { supabase } from '@/lib/supabase';

export class SupabaseTestUtil {
  // Test basic connection
  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from('available_tokens')
        .select('id')
        .limit(1);

      if (error) {
        console.error('❌ Supabase connection failed:', error);
        return false;
      }

      console.log('✅ Supabase connection successful');
      return true;
    } catch (err) {
      console.error('❌ Supabase connection error:', err);
      return false;
    }
  }

  // Test real-time capabilities
  static testRealtimeCapabilities() {
    console.log('🧪 Testing real-time capabilities...');

    const testChannel = supabase
      .channel('test_channel')
      .on('broadcast', { event: 'test' }, (payload) => {
        console.log('✅ Real-time broadcast works:', payload);
      })
      .subscribe((status) => {
        console.log('📡 Test channel status:', status);

        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription successful');

          // Send a test broadcast
          testChannel.send({
            type: 'broadcast',
            event: 'test',
            payload: { message: 'Real-time test successful!' }
          });

          // Cleanup after test
          setTimeout(() => {
            testChannel.unsubscribe();
            console.log('🧽 Test channel cleaned up');
          }, 2000);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription failed');
        }
      });

    return testChannel;
  }

  // Test PVP table access
  static async testPvpTableAccess() {
    try {
      console.log('🧪 Testing PVP table access...');

      const { data, error } = await supabase
        .from('pvp_matches')
        .select('id, status')
        .limit(5);

      if (error) {
        console.error('❌ PVP table access failed:', error);
        return false;
      }

      console.log('✅ PVP table access successful:', data?.length, 'matches found');
      return true;
    } catch (err) {
      console.error('❌ PVP table access error:', err);
      return false;
    }
  }

  // Test real-time on PVP table
  static testPvpRealtime() {
    console.log('🧪 Testing PVP real-time...');

    const pvpChannel = supabase
      .channel('test_pvp_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pvp_matches'
        },
        (payload) => {
          console.log('✅ PVP real-time update received:', payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 PVP channel status:', status);

        if (status === 'SUBSCRIBED') {
          console.log('✅ PVP real-time subscription successful');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ PVP real-time subscription failed');
        }
      });

    // Return cleanup function
    return () => {
      pvpChannel.unsubscribe();
      console.log('🧽 PVP test channel cleaned up');
    };
  }

  // Run all tests
  static async runAllTests() {
    console.log('🚀 Running Supabase diagnostic tests...');

    const connectionOk = await this.testConnection();
    const pvpAccessOk = await this.testPvpTableAccess();

    if (connectionOk && pvpAccessOk) {
      console.log('✅ Basic tests passed, testing real-time...');
      this.testRealtimeCapabilities();
      const cleanupPvp = this.testPvpRealtime();

      // Cleanup after 10 seconds
      setTimeout(() => {
        cleanupPvp();
      }, 10000);
    } else {
      console.error('❌ Basic tests failed, check your Supabase configuration');
    }
  }
}