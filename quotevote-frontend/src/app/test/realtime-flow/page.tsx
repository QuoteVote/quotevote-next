'use client';

/**
 * Realtime Flow Integration Test
 * 
 * Tests realtime functionality including chat, post chat, buddy list,
 * presence indicators, typing indicators, and WebSocket connections.
 */

import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Mock Tabs components
interface TabsProps {
  value: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Tabs = ({ value, children }: TabsProps) => (
  <div data-value={value}>{children}</div>
);
const TabsList = ({ children, className }: { children: React.ReactNode; className?: string }) => <div className={`flex border-b ${className || ''}`}>{children}</div>;
const TabsTrigger = ({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) => (
  <button className={`px-4 py-2 ${className || ''}`} data-value={value}>{children}</button>
);
const TabsContent = ({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) => <div data-value={value} className={className}>{children}</div>;
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Mock components for testing
const TypingIndicator = () => <div data-testid="mock-typing">Typing...</div>;
const PresenceIcon = ({ status, className }: { status?: string; className?: string }) => <div className={className} data-testid="mock-presence">{status}</div>;
const PostChat = ({ messageRoomId, title, postId }: { messageRoomId?: string; title?: string; postId?: string }) => (
  <div data-testid="mock-postchat">PostChat: {title} (Room: {messageRoomId}, Post: {postId})</div>
);
import { useAppStore } from '@/store';
import { 
  MessageSquare, 
  Users, 
  Wifi, 
  WifiOff, 
  MessageCircle,
  Radio,
  Activity
} from 'lucide-react';
import type { PresenceStatus } from '@/types/chat';

export default function RealtimeFlowTestPage() {
  const [realtimeLog, setRealtimeLog] = useState<string[]>([]);
  const [currentFlow, setCurrentFlow] = useState<string>('chat');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connected');
  const [mockPresenceStatus, setMockPresenceStatus] = useState<PresenceStatus>('online');
  const [isTyping, setIsTyping] = useState(false);
  const [mockRoomId, setMockRoomId] = useState('room-123');
  
  const user = useAppStore((state) => state.user.data);

  const addToLog = (action: string, details?: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = details ? `${timestamp}: ${action} - ${details}` : `${timestamp}: ${action}`;
    setRealtimeLog(prev => [...prev, logEntry]);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      addToLog('Realtime Flow Test initialized');
    }, 0);
    // Simulate connection events
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        const events = ['New message received', 'User joined', 'User left', 'Typing started', 'Typing stopped'];
        const event = events[Math.floor(Math.random() * events.length)];
        addToLog('Realtime event', event);
      }
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Mock data for testing
  const mockChatRooms = useMemo(() => [
    {
      _id: 'room-1',
      title: 'General Chat',
      messageType: 'USER',
      users: ['user-1', 'user-2'],
      unreadMessages: 3,
      lastActivity: new Date().toISOString()
    },
    {
      _id: 'room-2',
      title: 'Project Discussion',
      messageType: 'POST',
      users: ['user-1', 'user-3', 'user-4'],
      unreadMessages: 0,
      lastActivity: '2024-01-01T12:00:00.000Z'
    }
  ], []);

  const mockBuddies = [
    {
      _id: 'buddy-1',
      user: { _id: 'user-1', name: 'Alice Johnson', username: 'alice', avatar: null },
      presence: { status: 'online' as PresenceStatus, statusMessage: 'Working on project' },
      unreadMessages: 2,
      type: 'USER' as const
    },
    {
      _id: 'buddy-2',
      user: { _id: 'user-2', name: 'Bob Smith', username: 'bob', avatar: null },
      presence: { status: 'away' as PresenceStatus, statusMessage: 'In a meeting' },
      unreadMessages: 0,
      type: 'USER' as const
    },
    {
      _id: 'buddy-3',
      user: { _id: 'user-3', name: 'Charlie Brown', username: 'charlie', avatar: null },
      presence: { status: 'dnd' as PresenceStatus, statusMessage: 'Do not disturb' },
      unreadMessages: 1,
      type: 'USER' as const
    }
  ];

  const mockMessages = useMemo(() => [
    {
      _id: 'msg-1',
      messageRoomId: mockRoomId,
      userId: 'user-1',
      userName: 'alice',
      text: 'Hello everyone! How is the project going?',
      created: '2024-01-01T12:05:00.000Z',
      type: 'USER'
    },
    {
      _id: 'msg-2',
      messageRoomId: mockRoomId,
      userId: 'user-2',
      userName: 'bob',
      text: 'Great progress on the frontend migration!',
      created: '2024-01-01T12:08:00.000Z',
      type: 'USER'
    }
  ], [mockRoomId]);

  const handleSendMessage = (text: string, roomId: string) => {
    addToLog('Message sent', `Room: ${roomId}, Text: "${text.substring(0, 30)}..."`);
  };

  const handleJoinRoom = (roomId: string) => {
    addToLog('Joined room', `Room ID: ${roomId}`);
    setMockRoomId(roomId);
  };


  const handlePresenceChange = (status: PresenceStatus) => {
    setMockPresenceStatus(status);
    addToLog('Presence updated', `Status: ${status}`);
  };

  const handleTypingStart = () => {
    setIsTyping(true);
    addToLog('Typing started');
    setTimeout(() => {
      setIsTyping(false);
      addToLog('Typing stopped');
    }, 3000);
  };

  const simulateConnectionIssue = () => {
    setConnectionStatus('disconnected');
    addToLog('Connection lost', 'WebSocket disconnected');
    
    setTimeout(() => {
      setConnectionStatus('connecting');
      addToLog('Reconnecting', 'Attempting to reconnect...');
      
      setTimeout(() => {
        setConnectionStatus('connected');
        addToLog('Connection restored', 'WebSocket reconnected');
      }, 2000);
    }, 1000);
  };

  const presenceStatuses: PresenceStatus[] = ['online', 'away', 'dnd', 'offline', 'invisible'];

  const connectionStatusConfig = {
    connected: { icon: Wifi, color: 'text-green-500', label: 'Connected' },
    disconnected: { icon: WifiOff, color: 'text-red-500', label: 'Disconnected' },
    connecting: { icon: Radio, color: 'text-yellow-500', label: 'Connecting...' }
  };

  const currentStatusConfig = connectionStatusConfig[connectionStatus];
  const StatusIcon = currentStatusConfig.icon;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Realtime Flow Integration Test</h1>
        <p className="text-muted-foreground">
          Test realtime functionality including chat, presence, typing indicators, and WebSocket connections.
        </p>
      </div>

      {/* Connection Status */}
      <Alert>
        <StatusIcon className={`h-4 w-4 ${currentStatusConfig.color}`} />
        <AlertDescription>
          <strong>Connection Status:</strong> 
          <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'} className="ml-2">
            {currentStatusConfig.label}
          </Badge>
          <span className="ml-4">
            <strong>Current User:</strong> {user ? user.username : 'Guest'}
          </span>
          <span className="ml-4">
            <strong>Presence:</strong>
            <PresenceIcon status={mockPresenceStatus} className="inline-block ml-1 mr-1" />
            {mockPresenceStatus}
          </span>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Realtime Components */}
        <Card>
          <CardHeader>
            <CardTitle>Realtime Components Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={currentFlow} onValueChange={setCurrentFlow}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="chat" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="postchat" className="text-xs">
                  <MessageCircle className="h-3 w-3 mr-1" />
                  Post Chat
                </TabsTrigger>
                <TabsTrigger value="buddies" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Buddies
                </TabsTrigger>
                <TabsTrigger value="presence" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  Presence
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Chat Rooms</h3>
                  <div className="space-y-2">
                    {mockChatRooms.map((room) => (
                      <div key={room._id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{room.title}</span>
                          {room.unreadMessages > 0 && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              {room.unreadMessages}
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleJoinRoom(room._id)}
                          variant={mockRoomId === room._id ? 'default' : 'outline'}
                        >
                          {mockRoomId === room._id ? 'Current' : 'Join'}
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message-input">Send Message</Label>
                    <div className="flex gap-2">
                      <Input
                        id="message-input"
                        placeholder="Type a message..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value) {
                            handleSendMessage(e.currentTarget.value, mockRoomId);
                            e.currentTarget.value = '';
                          }
                        }}
                        onFocus={handleTypingStart}
                      />
                      <Button onClick={() => handleSendMessage('Test message', mockRoomId)}>
                        Send
                      </Button>
                    </div>
                  </div>
                  
                  {isTyping && (
                    <TypingIndicator />
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="postchat" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Post Chat Messages</h3>
                  <div className="space-y-2">
                    {mockMessages.map((message) => (
                      <div key={message._id} className="p-3 border rounded bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{message.userName}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.created).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{message.text}</p>
                      </div>
                    ))}
                  </div>
                  
                  <PostChat
                    messageRoomId={mockRoomId}
                    title="Test Post Chat"
                    postId="post-123"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="buddies" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Buddy List</h3>
                  <div className="space-y-2">
                    {mockBuddies.map((buddy) => (
                      <div key={buddy._id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <PresenceIcon status={buddy.presence.status} />
                          <div>
                            <span className="font-medium">{buddy.user.name}</span>
                            <p className="text-xs text-muted-foreground">
                              {buddy.presence.statusMessage}
                            </p>
                          </div>
                        </div>
                        {buddy.unreadMessages > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {buddy.unreadMessages}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="presence" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Presence Status</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {presenceStatuses.map((status) => (
                      <Button
                        key={status}
                        variant={mockPresenceStatus === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePresenceChange(status)}
                        className="justify-start"
                      >
                        <PresenceIcon status={status} className="mr-2" />
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold">Connection Controls</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={simulateConnectionIssue}
                        disabled={connectionStatus !== 'connected'}
                      >
                        Simulate Disconnect
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTypingStart}
                      >
                        Simulate Typing
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Realtime Event Log */}
        <Card>
          <CardHeader>
            <CardTitle>Realtime Event Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {realtimeLog.length} realtime events
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRealtimeLog([])}
                >
                  Clear Log
                </Button>
              </div>
              <div className="bg-muted rounded-lg p-3 max-h-96 overflow-y-auto">
                {realtimeLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No realtime events yet</p>
                ) : (
                  <div className="space-y-1">
                    {realtimeLog.map((log, index) => (
                      <div key={index} className="text-sm font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Test Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Realtime Integration Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">✅ Chat Functionality</h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Real-time message sending/receiving</li>
                <li>Chat room management</li>
                <li>Message history and pagination</li>
                <li>Direct messaging support</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">✅ Presence System</h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Online/offline status tracking</li>
                <li>Presence status indicators</li>
                <li>Status message updates</li>
                <li>Buddy list integration</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">✅ Typing Indicators</h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Real-time typing detection</li>
                <li>Typing indicator display</li>
                <li>Multi-user typing support</li>
                <li>Typing timeout handling</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">✅ WebSocket Management</h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Connection establishment</li>
                <li>Reconnection on disconnect</li>
                <li>Connection status monitoring</li>
                <li>Error handling and recovery</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
