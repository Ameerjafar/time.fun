"use client";
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Users, ArrowLeft, MessageCircle, Plus, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
  type: 'sent' | 'received';
}

interface Group {
  id: string;
  name: string;
  members: string[];
  isActive: boolean;
}

const GroupChatPage = () => {
  const { user } = useAuth();
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [groups, setGroups] = useState<Group[]>([
    { id: '1', name: 'General Discussion', members: ['Alice', 'Bob', 'Carol'], isActive: true },
    { id: '2', name: 'Development Team', members: ['David', 'Elena', 'Frank'], isActive: true },
    { id: '3', name: 'Design Chat', members: ['Grace', 'Henry', 'Ivy'], isActive: false },
  ]);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const websocket = new WebSocket('ws://localhost:8081');
      
      websocket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        
        // Register user with the WebSocket server
        if (user?.name) {
          websocket.send(JSON.stringify({
            type: 'connection',
            name: user.name
          }));
        }
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received group message:', data);
          
          // Handle incoming group messages
          if (data.content && data.sender && data.groupName === selectedGroup?.name) {
            const newMsg: Message = {
              id: Date.now().toString(),
              content: data.content,
              sender: data.sender,
              timestamp: new Date(),
              type: data.sender === user?.name ? 'sent' : 'received'
            };
            setMessages(prev => [...prev, newMsg]);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      setWs(websocket);
    };

    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [user, selectedGroup]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !ws || !selectedGroup || !user) return;

    const messageData = {
      type: 'GROUPMESSAGE',
      groupName: selectedGroup.name,
      data: JSON.stringify({
        content: newMessage,
        sender: user.name,
        timestamp: new Date().toISOString()
      })
    };

    ws.send(JSON.stringify(messageData));

    // Add message to local state
    const newMsg: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: user.name,
      timestamp: new Date(),
      type: 'sent'
    };

    setMessages(prev => [...prev, newMsg]);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const selectGroup = (group: Group) => {
    setSelectedGroup(group);
    setMessages([]); // Clear messages when switching groups
  };

  const createGroup = () => {
    if (!newGroupName.trim()) return;
    
    const newGroup: Group = {
      id: Date.now().toString(),
      name: newGroupName,
      members: [user?.name || 'You'],
      isActive: true
    };
    
    setGroups(prev => [...prev, newGroup]);
    setNewGroupName('');
    setShowCreateGroup(false);
    selectGroup(newGroup);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-bold mb-2">Please Login</h2>
          <p className="text-gray-400">You need to be logged in to access group chat</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Group Chats</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-400">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateGroup(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Group</span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex h-[calc(100vh-80px)]">
        {/* Groups List */}
        <div className="w-1/3 bg-gray-900 border-r border-gray-800">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Groups</h2>
            <div className="space-y-2">
              {groups.map((group) => (
                <motion.button
                  key={group.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => selectGroup(group)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedGroup?.id === group.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{group.name}</p>
                      <p className="text-sm text-gray-400">
                        {group.members.length} members
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${group.isActive ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedGroup ? (
            <>
              {/* Chat Header */}
              <div className="bg-gray-900 border-b border-gray-800 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedGroup.name}</h3>
                      <p className="text-sm text-gray-400">
                        {selectedGroup.members.length} members
                      </p>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.type === 'sent'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-800 text-white'
                        }`}
                      >
                        {message.type === 'received' && (
                          <p className="text-xs text-gray-400 mb-1">{message.sender}</p>
                        )}
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="bg-gray-900 border-t border-gray-800 p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
                    disabled={!isConnected}
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Users className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Select a Group</h3>
                <p>Choose a group to start chatting or create a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 p-6 rounded-lg w-96"
          >
            <h3 className="text-xl font-semibold mb-4">Create New Group</h3>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Group name..."
              className="w-full bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 mb-4"
            />
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={createGroup}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateGroup(false)}
                className="flex-1 bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default GroupChatPage;
