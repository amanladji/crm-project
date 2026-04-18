import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import authService from "../services/auth.service";
import { getAllUsers, getConversationUsers, getConversationMessages, sendMessage, startConversation, searchUsers } from "../services/chat.service";

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState("");

  const currentUser = authService.getCurrentUser() || { id: 1, username: "Admin" };
  const isFirstLoadRef = useRef(true);  // Track first load to avoid auto-selection on refresh

  const fetchUsers = async () => {
    try {
      // Fetch ALL users from the backend (not just conversations)
      const res = await getAllUsers();
      
      console.log("🔍 DEBUG: Raw API Response - Total Users:", res.data.length);
      console.log("📊 DEBUG: Current User ID:", currentUser.id);
      console.log("🔍 DEBUG: Currently selected user:", selectedUser?.id);
      
      // Filter users to exclude current user
      const filteredUsers = (res.data || [])
        .filter(user => user.id !== currentUser.id)
        .map(user => ({
          id: user.id,
          name: user.username || `User #${user.id}`,
          active: true,
          lastMsg: "Click to start chat..."
        }));
      
      console.log("✅ Final Users List (excluding current user):", filteredUsers);
      
      setUsers(filteredUsers);
      
      // ONLY auto-select first user on INITIAL load, not on every refresh
      if (isFirstLoadRef.current && filteredUsers.length > 0 && !selectedUser) {
        console.log("📍 First load detected - Auto-selecting first user:", filteredUsers[0].name);
        setSelectedUser(filteredUsers[0]);
        isFirstLoadRef.current = false;  // Mark first load as complete
      }
    } catch (e) {
      console.error("❌ Error fetching users:", e);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    // Refresh user list every 5 seconds to catch new conversations
    const userRefreshInterval = setInterval(fetchUsers, 5000);
    
    return () => clearInterval(userRefreshInterval);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (selectedUser) {
      // Fetch messages for the selected user
      const fetchMessages = async () => {
        try {
          console.log(`📥 Fetching messages with user ${selectedUser.id} (${selectedUser.name})...`);
          const res = await getConversationMessages(selectedUser.id);
          
          console.log(`✓ API Response received:`, {
            messageCount: (res.data || []).length,
            rawMessages: res.data
          });
          
          const msgs = (res.data || []).map(m => {
            const displaySender = m.senderId === currentUser.id ? "You" : (m.senderName || selectedUser.name);
            console.log(`  • Message ${m.id}: From=${displaySender}, Content='${m.content}'`);
            
            return {
              id: m.id || Date.now(),
              sender: displaySender,
              text: m.content || "",
              time: new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute:"2-digit" }),
              senderId: m.senderId,
              receiverId: m.receiverId,
              conversationId: m.conversationId
            };
          });
          
          console.log(`✅ Messages processed: ${msgs.length} messages ready to display`);
          setMessages(msgs);
        } catch (e) {
          console.error(`❌ Error fetching messages:`, {
            errorMessage: e.message,
            errorStatus: e.response?.status,
            selectedUserId: selectedUser?.id,
            currentUserId: currentUser?.id
          });
          // If API fails, just show empty messages (no fake data)
          setMessages([]);
        }
      };

      // Fetch immediately
      console.log(`🔔 useEffect triggered for selectedUser: ${selectedUser.name} (ID=${selectedUser.id})`);
      fetchMessages();

      // Poll for new messages every 2 seconds
      const interval = setInterval(fetchMessages, 2000);

      // Cleanup interval on unmount or when selectedUser changes
      return () => {
        console.log(`🔌 Clearing message poll for user ${selectedUser.name}`);
        clearInterval(interval);
      };
    }
  }, [selectedUser, currentUser.id]);

  const handleSend = async (e) => {
    e.preventDefault();

    // ✅ STEP 1: Validate Input Data
    if (!input.trim()) {
      console.warn("❌ Message content is empty");
      return;
    }

    if (!selectedUser) {
      console.warn("❌ No user selected for chat");
      alert("Please select a user to send a message");
      return;
    }

    if (!selectedUser.id) {
      console.warn("❌ Selected user has no ID");
      alert("Invalid user selected. Please try again.");
      return;
    }

    // ✅ STEP 2: Verify Current User
    if (!currentUser || !currentUser.id) {
      console.warn("❌ Current user not authenticated or missing ID");
      alert("You are not logged in. Please log in and try again.");
      return;
    }

    const messageContent = input.trim();
    const receiverId = selectedUser.id;
    const senderId = currentUser.id;

    // DEBUG LOG: Show what data is being sent
    console.log("📤 SENDING MESSAGE:", {
      senderId: senderId,
      senderUsername: currentUser.username,
      receiverId: receiverId,
      receiverName: selectedUser.name,
      content: messageContent,
      timestamp: new Date().toISOString()
    });

    // Clear input immediately for better UX
    setInput("");

    try {
      // 📡 SEND MESSAGE TO BACKEND
      console.log(`📡 Calling POST /api/chat/send...`);
      const response = await sendMessage(receiverId, messageContent);
      
      // ✅ STEP 3: VERIFY SEND RESPONSE
      // Check if response is valid and has required data
      if (!response || response.status < 200 || response.status >= 300) {
        throw new Error(`Invalid response status: ${response?.status}`);
      }
      
      if (!response.data) {
        throw new Error("Response has no data");
      }
      
      if (!response.data.id) {
        throw new Error("Message ID missing in response");
      }
      
      console.log(`✓ Send request succeeded (HTTP ${response.status})`, {
        messageId: response.data.id,
        conversationId: response.data.conversationId
      });

      // 📥 STEP 4: FETCH UPDATED CONVERSATION MESSAGES
      // This is the real verification that the message was saved
      console.log(`📥 Fetching messages to verify persistence...`);
      let fetchedMessages = [];
      
      try {
        const res = await getConversationMessages(receiverId);
        
        if (!res || !res.data) {
          throw new Error("No data in fetch response");
        }
        
        console.log(`✓ Fetch succeeded: ${(res.data || []).length} messages`);
        
        // ✅ STEP 5: PROCESS MESSAGES
        fetchedMessages = (res.data || []).map(m => {
          const displaySender = m.senderId === senderId ? "You" : (m.senderName || selectedUser.name);
          
          return {
            id: m.id || Date.now(),
            sender: displaySender,
            text: m.content || "",
            time: new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute:"2-digit" }),
            senderId: m.senderId,
            receiverId: m.receiverId,
            conversationId: m.conversationId
          };
        });
        
        console.log(`✓ Processed ${fetchedMessages.length} messages for display`);
      } catch (fetchError) {
        console.error("❌ FAILED TO FETCH MESSAGES after send:", {
          errorMessage: fetchError.message,
          status: fetchError.response?.status,
          errorData: fetchError.response?.data
        });
        
        // Re-throw to prevent showing fake success
        throw new Error(`Failed to verify message persistence: ${fetchError.message}`);
      }

      // ✅ STEP 6: UPDATE UI ONLY AFTER VERIFIED SUCCESS
      setMessages(fetchedMessages);
      
      // ✅ FINAL SUCCESS: Log ONLY AFTER entire flow succeeds
      console.log("✅ SUCCESS: Message sent and verified in conversation", {
        totalMessages: fetchedMessages.length,
        latestMessageId: fetchedMessages[fetchedMessages.length - 1]?.id,
        sentBy: currentUser.username,
        sentTo: selectedUser.name
      });
      
    } catch (error) {
      // ONLY THIS CATCH RUNS ON ANY FAILURE
      console.error("❌ SEND MESSAGE FAILED:", {
        phase: error.message.includes("verify") ? "verification" : "sending",
        errorMessage: error.message,
        statusCode: error.response?.status,
        responseData: error.response?.data,
        userData: { senderId, receiverId, content: messageContent }
      });
      
      // Restore input if send failed so user can try again
      setInput(messageContent);
      
      // Show user-friendly error message
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.role ||
                      error.message || 
                      "Failed to send message. Please try again.";
      alert(`❌ Error: ${errorMsg}`);
    }
  };

  const handleAddNewChat = async (e) => {
    e.preventDefault();
    
    if (!newChatUsername.trim()) {
      alert("Please enter an email or username");
      return;
    }

    try {
      // Step 1: Search for the user
      console.log("🔍 Searching for user:", newChatUsername);
      const searchResponse = await searchUsers(newChatUsername.trim());
      const foundUsers = searchResponse.data;

      if (!foundUsers || foundUsers.length === 0) {
        alert("User not found. Please check the email or username.");
        return;
      }

      // Step 2: Use the first matching user
      const foundUser = foundUsers[0];
      console.log("✓ User found:", foundUser);

      // Step 3: Start conversation with the found user
      try {
        await startConversation(foundUser.id);
      } catch (err) {
        console.log("Note: POST /conversations might not exist, continuing anyway");
      }

      // Step 4: Add user to chat list if not already there
      const userExists = users.some(u => u.id === foundUser.id);
      if (!userExists) {
        const newUser = {
          id: foundUser.id,
          name: foundUser.username || foundUser.name,
          active: true,
          lastMsg: "Click to start chat..."
        };
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        
        // Step 5: Open the chat with this user
        setSelectedUser(newUser);
        setMessages([]); // Clear messages for new chat
      } else {
        // If user already in list, just select them
        const existingUser = users.find(u => u.id === foundUser.id);
        setSelectedUser(existingUser);
      }

      // Step 6: Close modal and clear input
      setShowNewChatModal(false);
      setNewChatUsername("");
      
      console.log("✓ Chat started successfully");
      alert(`Chat started with ${foundUser.username}!`);
    } catch (error) {
      console.error("Failed to start chat:", error);
      alert(`Error: ${error.response?.data?.message || error.message || "Failed to search users"}`);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
        <Navbar title="Chats" />
        
        <main className="flex-1 flex overflow-hidden p-6 gap-6">
          {/* Left panel - Users List */}
          <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden hidden sm:flex">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h2 className="font-bold text-gray-800">Messages</h2>
              <button 
                onClick={() => setShowNewChatModal(true)}
                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-bold hover:bg-blue-700 transition"
              >
                + New Chat
              </button>
            </div>
            
            <div className="p-3">
              <input type="text" placeholder="Search contacts..." className="w-full bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>

            <div className="flex-1 overflow-y-auto">
              {users.map(u => (
                <div 
                  key={u.id} 
                  onClick={() => setSelectedUser(u)}
                  className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-3 ${selectedUser?.id === u.id ? "bg-blue-50" : ""}`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center justify-center text-white font-bold shadow-sm">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    {u.active && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{u.name}</h4>
                      <span className="text-xs text-gray-400">Now</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{u.lastMsg}</p>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="p-4 text-center text-sm text-gray-500">No users found. Add a new chat!</div>
              )}
            </div>
          </div>

          {/* Right panel - Chat Window */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
            {/* Header */}
            <div className="h-16 border-b border-gray-100 px-6 flex items-center justify-between bg-white z-10 w-full relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400 flex items-center justify-center text-white font-bold shadow-sm">
                  {selectedUser ? selectedUser.name.charAt(0).toUpperCase() : "?"}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{selectedUser ? selectedUser.name : "Select a user"}</h3>
                  {selectedUser && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`w-2 h-2 rounded-full ${selectedUser.active ? "bg-green-500" : "bg-gray-400"}`}></div>
                      <span className="text-xs text-gray-500 font-medium">{selectedUser.active ? "Online" : "Offline"}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 bg-gray-50/50 p-6 overflow-y-auto space-y-4 flex flex-col relative z-0">
               {messages.map((msg) => {
                 const isMe = msg.sender === "You";
                 return (
                   <div key={msg.id || Math.random()} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                     <div className={`max-w-[70%] rounded-2xl px-5 py-3 shadow-sm ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"}`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-[10px] mt-1 text-right ${isMe ? "text-blue-200" : "text-gray-400"}`}>{msg.time}</p>
                     </div>
                   </div>
                 );
               })}
               {messages.length === 0 && selectedUser && (
                 <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                   No messages yet. Say hi to {selectedUser.name}!
                 </div>
               )}
            </div>

            {/* Input Box */}
            <div className="p-4 bg-white border-t border-gray-100 relative z-20 w-full">
              <form onSubmit={handleSend} className="flex gap-2 relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type a message..." 
                  className="flex-1 bg-gray-100 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm transition-shadow relative z-30 pointer-events-auto"
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl shadow-md shadow-blue-500/20 transition-all font-medium flex items-center justify-center cursor-pointer pointer-events-auto z-30 relative disabled:opacity-50"
                  disabled={!input.trim() || !selectedUser}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* New Chat Modal Popup */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Start New Chat</h2>
              <button onClick={() => setShowNewChatModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddNewChat} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search by Email or Username</label>
                <input 
                  type="text" 
                  required
                  value={newChatUsername}
                  onChange={e => setNewChatUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none focus:border-blue-500"
                  placeholder="e.g. john@example.com or alice"
                />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
                  disabled={!newChatUsername.trim()}
                >
                  Start Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPage;