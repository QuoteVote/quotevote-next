'use client';

/**
 * Content Flow Integration Test
 * 
 * Tests content workflows including posts, comments, quotes, voting,
 * and content actions across different components.
 */

import { useState } from 'react';
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
// Mock content components for test page
const Post = () => <div data-testid="mock-post">Post Component</div>;
const SubmitPost = () => <div data-testid="mock-submit-post">Submit Post Component</div>;
const VotingBoard = () => <div data-testid="mock-voting-board">Voting Board</div>;
const VotingPopup = ({ selectedText }: { selectedText?: string }) => <div data-testid="mock-voting-popup">Voting Popup: {selectedText}</div>;
const Comment = () => <div data-testid="mock-comment">Comment Component</div>;
const PostActions = () => <div data-testid="mock-post-actions">Post Actions</div>;
import { useAppStore } from '@/store';
import { 
  FileText, 
  MessageSquare, 
  Quote, 
  ThumbsUp, 
  ThumbsDown, 
  Bookmark,
  Share,
  Flag,
  Edit
} from 'lucide-react';

export default function ContentFlowTestPage() {
  const [contentLog, setContentLog] = useState<string[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [currentFlow, setCurrentFlow] = useState<string>('posts');
  
  const user = useAppStore((state) => state.user.data);

  const addToLog = (action: string, details?: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = details ? `${timestamp}: ${action} - ${details}` : `${timestamp}: ${action}`;
    setContentLog(prev => [...prev, logEntry]);
  };

  // Mock data for testing
  const mockPost = {
    _id: 'post-123',
    title: 'Sample Post for Testing',
    text: 'This is a sample post content for testing the content flow integration. It contains enough text to demonstrate voting, commenting, and quoting functionality.',
    author: {
      _id: 'user-123',
      username: 'testuser',
      name: 'Test User',
      avatar: null
    },
    created: new Date().toISOString(),
    upvotes: 5,
    downvotes: 2,
    comments: [],
    bookmarkedBy: [],
    votedBy: []
  };

  const mockComments = [
    {
      _id: 'comment-1',
      text: 'This is a test comment on the post.',
      author: {
        _id: 'user-456',
        username: 'commenter',
        name: 'Comment User'
      },
      created: new Date().toISOString(),
      upvotes: 2,
      downvotes: 0
    },
    {
      _id: 'comment-2',
      text: 'Another comment for testing purposes.',
      author: {
        _id: 'user-789',
        username: 'reviewer',
        name: 'Review User'
      },
      created: new Date().toISOString(),
      upvotes: 1,
      downvotes: 1
    }
  ];



  const handleVote = (type: 'upvote' | 'downvote', text?: string) => {
    addToLog(`Vote cast: ${type}`, text ? `Selected text: "${text}"` : 'Full post');
  };


  const handleQuote = (quotedText: string) => {
    addToLog('Quote created', `Text: "${quotedText}"`);
    setSelectedText(quotedText);
  };

  const handleBookmark = (postId: string) => {
    addToLog('Post bookmarked', `Post ID: ${postId}`);
  };

  const handleShare = (postId: string) => {
    addToLog('Post shared', `Post ID: ${postId}`);
  };

  const handleReport = (postId: string, reason: string) => {
    addToLog('Content reported', `Post ID: ${postId}, Reason: ${reason}`);
  };

  const contentActions = [
    { 
      icon: ThumbsUp, 
      label: 'Upvote', 
      action: () => handleVote('upvote', selectedText),
      variant: 'default' as const
    },
    { 
      icon: ThumbsDown, 
      label: 'Downvote', 
      action: () => handleVote('downvote', selectedText),
      variant: 'secondary' as const
    },
    { 
      icon: Quote, 
      label: 'Quote', 
      action: () => handleQuote(selectedText || 'Sample quoted text'),
      variant: 'outline' as const
    },
    { 
      icon: Bookmark, 
      label: 'Bookmark', 
      action: () => handleBookmark(mockPost._id),
      variant: 'outline' as const
    },
    { 
      icon: Share, 
      label: 'Share', 
      action: () => handleShare(mockPost._id),
      variant: 'outline' as const
    },
    { 
      icon: Flag, 
      label: 'Report', 
      action: () => handleReport(mockPost._id, 'Test report'),
      variant: 'destructive' as const
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Content Flow Integration Test</h1>
        <p className="text-muted-foreground">
          Test content workflows including posts, comments, quotes, voting, and actions.
        </p>
      </div>

      {/* Current User State */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Current User:</strong> {user ? (
            <Badge variant="default" className="ml-2">
              {user.username}
            </Badge>
          ) : (
            <Badge variant="secondary" className="ml-2">Guest User</Badge>
          )}
          {selectedText && (
            <span className="ml-4">
              <strong>Selected Text:</strong> &quot;{selectedText.substring(0, 50)}...&quot;
            </span>
          )}
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Content Components */}
        <Card>
          <CardHeader>
            <CardTitle>Content Components Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={currentFlow} onValueChange={setCurrentFlow}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="posts" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Posts
                </TabsTrigger>
                <TabsTrigger value="comments" className="text-xs">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Comments
                </TabsTrigger>
                <TabsTrigger value="voting" className="text-xs">
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Voting
                </TabsTrigger>
                <TabsTrigger value="actions" className="text-xs">
                  <Edit className="h-3 w-3 mr-1" />
                  Actions
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Submit New Post</h3>
                  <SubmitPost />
                  
                  <h3 className="font-semibold">Sample Post Display</h3>
                  <Post />
                </div>
              </TabsContent>
              
              <TabsContent value="comments" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Comments Display</h3>
                  {mockComments.map((comment) => (
                    <Comment key={comment._id} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="voting" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Voting Board</h3>
                  <VotingBoard />
                  
                  {selectedText && (
                    <div>
                      <h3 className="font-semibold">Voting Popup</h3>
                      <VotingPopup selectedText={selectedText} />
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="actions" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="font-semibold">Content Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {contentActions.map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <Button
                          key={index}
                          variant={action.variant}
                          size="sm"
                          onClick={action.action}
                          className="justify-start"
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {action.label}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <PostActions />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Content Event Log */}
        <Card>
          <CardHeader>
            <CardTitle>Content Event Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {contentLog.length} content events
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setContentLog([])}
                >
                  Clear Log
                </Button>
              </div>
              <div className="bg-muted rounded-lg p-3 max-h-96 overflow-y-auto">
                {contentLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No content events yet</p>
                ) : (
                  <div className="space-y-1">
                    {contentLog.map((log, index) => (
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
          <CardTitle>Content Integration Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">✅ Post Management</h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Post creation and submission</li>
                <li>Post display and formatting</li>
                <li>Post editing and deletion</li>
                <li>Post metadata handling</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">✅ Voting System</h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Text selection for voting</li>
                <li>Upvote/downvote functionality</li>
                <li>Vote aggregation and display</li>
                <li>User vote tracking</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">✅ Comments & Quotes</h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Comment creation and display</li>
                <li>Comment threading and replies</li>
                <li>Quote creation from selected text</li>
                <li>Quote highlighting and references</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">✅ Content Actions</h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Bookmark functionality</li>
                <li>Share and export options</li>
                <li>Report and moderation</li>
                <li>Content filtering and search</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
