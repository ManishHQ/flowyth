'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

export function ConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('Checking...');

  useEffect(() => {
    // Test basic connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('available_tokens')
          .select('id')
          .limit(1);

        setIsConnected(!error);

        if (!error) {
          // Test real-time capability
          const testChannel = supabase
            .channel('connection_test')
            .subscribe((status) => {
              setRealtimeStatus(status);
              console.log('Real-time status:', status);

              if (status === 'SUBSCRIBED') {
                setTimeout(() => {
                  testChannel.unsubscribe();
                }, 2000);
              }
            });
        }
      } catch (err) {
        setIsConnected(false);
        setRealtimeStatus('Error');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span>Connection:</span>
      <Badge variant={isConnected ? "default" : "destructive"}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </Badge>
      <span>Real-time:</span>
      <Badge
        variant={
          realtimeStatus === 'SUBSCRIBED' ? "default" :
          realtimeStatus === 'CHANNEL_ERROR' ? "destructive" : "secondary"
        }
      >
        {realtimeStatus}
      </Badge>
    </div>
  );
}