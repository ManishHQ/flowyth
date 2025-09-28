'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { PvpMatch } from '@/lib/supabase';

interface RealtimeDebugProps {
  matchId?: string;
}

export function RealtimeDebug({ matchId }: RealtimeDebugProps) {
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const [lastUpdate, setLastUpdate] = useState<PvpMatch | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);

  const testRealtime = () => {
    if (!matchId) {
      alert('No match ID provided');
      return;
    }

    console.log('Testing real-time connection for match:', matchId);
    setConnectionStatus('Connecting...');

    const channel = supabase
      .channel(`debug_pvp_match_${matchId}`, {
        config: {
          broadcast: { self: false },
          presence: { key: `debug_${matchId}` }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pvp_matches',
          filter: `id=eq.${matchId}`
        },
        (payload) => {
          console.log('📡 Real-time update received:', payload);
          setLastUpdate(payload.new as PvpMatch);
          setUpdateCount(prev => prev + 1);
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
        setConnectionStatus(status);
      });

    setSubscription(channel);
  };

  const disconnect = () => {
    if (subscription) {
      subscription.unsubscribe();
      setSubscription(null);
      setConnectionStatus('Disconnected');
      console.log('📡 Disconnected from real-time');
    }
  };

  const testUpdate = async () => {
    if (!matchId) return;

    try {
      console.log('🧪 Testing update...');
      const randomStatus = Math.random() > 0.5 ? 'selecting_coins' : 'waiting_for_opponent';

      const { data, error } = await supabase
        .from('pvp_matches')
        .update({
          status: randomStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', matchId)
        .select()
        .single();

      if (error) {
        console.error('❌ Update failed:', error);
        alert(`Update failed: ${error.message}`);
      } else {
        console.log('✅ Update successful:', data);
      }
    } catch (err) {
      console.error('❌ Test update error:', err);
    }
  };

  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [subscription]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBSCRIBED': return 'bg-green-500';
      case 'CONNECTING':
      case 'Connecting...': return 'bg-yellow-500';
      case 'CHANNEL_ERROR': return 'bg-red-500';
      case 'CLOSED':
      case 'Disconnected': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm">🔧 Real-time Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status:</span>
            <Badge className={`text-white ${getStatusColor(connectionStatus)}`}>
              {connectionStatus}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Updates:</span>
            <Badge variant="outline">{updateCount}</Badge>
          </div>

          {matchId && (
            <div className="text-xs text-muted-foreground break-all">
              Match: {matchId}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Button
            onClick={testRealtime}
            disabled={!!subscription}
            size="sm"
            className="w-full"
          >
            Connect Real-time
          </Button>

          <Button
            onClick={disconnect}
            disabled={!subscription}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Disconnect
          </Button>

          {matchId && (
            <Button
              onClick={testUpdate}
              variant="secondary"
              size="sm"
              className="w-full"
            >
              Test Update
            </Button>
          )}
        </div>

        {lastUpdate && (
          <div className="mt-4 p-2 bg-muted rounded text-xs">
            <div className="font-semibold">Last Update:</div>
            <div>Status: {lastUpdate.status}</div>
            <div>Creator: {lastUpdate.creator_coin || 'None'}</div>
            <div>Opponent: {lastUpdate.opponent_coin || 'None'}</div>
            <div className="text-muted-foreground">
              {new Date(lastUpdate.updated_at).toLocaleTimeString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}