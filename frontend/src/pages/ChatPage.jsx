import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import authService from "../services/auth.service";
import { 
  getAllUsers, 
  getConversationUsers, 
  getConversationMessages, 
  sendMessage, 
  startConversation, 
  searchUsers,
  getAcceptedUsers,
  getPendingRequests,
  sendInvitation,
  acceptInvitation
} from "../services/chat.service";

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState("");
  const [allSearchUsers, setAllSearchUsers] = useState([]);
  const [showInvitePanel, setShowInvitePanel] = useState(false);

  const currentUser = authService.getCurrentUser() || { id: 1, username: "Admin" };
  const isFirstLoadRef = useRef(true);  // Track first load to avoid auto-selection on refresh

  // Load selected user from localStorage on component mount
  useEffect(() => {
    console.log("🔄 ChatPage mounted - loading localStorage data");
    try {
      const savedSelectedUser = localStorage.getItem("chatSelectedUser");
      if (savedSelectedUser) {
        const user = JSON.parse(savedSelectedUser);
        console.log("📂 Loaded selected user from localStorage:", user.name);
        setSelectedUser(user);
      }
    } catch (e) {
      console.error("Error loading selected user from localStorage:", e);
    }
  }, []);

  // Save selected user to localStorage whenever it changes
  useEffect(() => {
    if (selectedUser) {
      console.log("💾 Saving selected user to localStorage:", selectedUser.name);
      localStorage.setItem("chatSelectedUser", JSON.stringify(selectedUser));
    }
  }, [selectedUser]);

  // Handle user selection from the users list
  const handleSelectUser = (user) => {
    console.log("👤 User clicked:", user.name, "ID:", user.id);
    console.log("📍 Previous selectedUser:", selectedUser?.name || "none");
    
    // Only update if it's a different user
    if (!selectedUser || selectedUser.id !== user.id) {
      console.log("✅ Setting selectedUser to:", user.name);
      setSelectedUser(user);
      console.log("💬 Clearing messages for new chat");
      setMessages([]);
    } else {
      console.log("⚠️ User already selected - skipping redundant update");
    }
  };

  const fetchUsers = async (isInitialLoad = false) => {
    try {
      // ✅ NEW: Fetch ONLY accepted users (not all users)
      const res = await getAcceptedUsers();
      
      console.log("🔗 Accepted Users - Total:", res.data.length);
      console.log("📊 Current User ID:", currentUser.id);
      console.log("📍 Is initial load?", isInitialLoad);
      
      // Filter users to exclude current user
      const fetchedUsers = (res.data || [])
        .filter(user => user.id !== currentUser.id)
        .map(user => ({
          id: user.id,
          name: user.username || `User #${user.id}`,
          active: true,
          lastMsg: "Click to start chat..."
        }));
      
      console.log("✅ Fetched Accepted Users List:", fetchedUsers);
      
      // ✅ MERGE strategy: Add new users from backend, keep existing ones
      // This prevents users from disappearing when the list is refreshed
      setUsers(prevUsers => {
        // Create a map of existing users for quick lookup
        const existingMap = new Map(prevUsers.map(u => [u.id, u]));
        
        // Add/update users from the latest fetch
        const mergedUsers = [];
        const addedIds = new Set();
        
        // First, add all fetched users (updated data from backend)
        fetchedUsers.forEach(user => {
          mergedUsers.push(user);
          addedIds.add(user.id);
        });
        
        // Then, keep any existing users not in the fetched list
        // (in case there's a temporary sync issue)
        prevUsers.forEach(user => {
          if (!addedIds.has(user.id)) {
            console.log("⚠️  Keeping existing user not in backend response:", user.name);
            mergedUsers.push(user);
          }
        });
        
        console.log("📊 Merged users list size:", mergedUsers.length);
        return mergedUsers;
      });
      
      // ✅ IMPORTANT: ONLY auto-select first user on INITIAL load, NEVER on refresh
      if (isInitialLoad && isFirstLoadRef.current && fetchedUsers.length > 0 && !selectedUser) {
        console.log("📍 First load detected - Auto-selecting first user:", fetchedUsers[0].name);
        setSelectedUser(fetchedUsers[0]);
        isFirstLoadRef.current = false;
      } else if (!isInitialLoad) {
        console.log("🔄 Periodic refresh - NOT auto-selecting (preserve user selection)");
      }
    } catch (e) {
      console.error("❌ Error fetching accepted users:", e);
      // Don't clear the list on error - keep existing users displayed
      console.log("⚠️  Keeping existing user list due to fetch error");
    }
  };

  const fetchPendingRequests = async () => {
    try {
      console.log("📥 Fetching pending chat requests");
      const res = await getPendingRequests();
      console.log("✅ Pending requests received:", res.data);
      setPendingRequests(res.data || []);
    } catch (e) {
      console.error("❌ Error fetching pending requests:", e);
      setPendingRequests([]);
    }
  };

  const fetchAllUsers = async () => {
    try {
      console.log("👥 Fetching all users for invitation");
      const res = await getAllUsers();
      console.log("✅ All users received:", res.data);
      // Filter out current user
      const filtered = (res.data || []).filter(user => user.id !== currentUser.id);
      setAllSearchUsers(filtered);
    } catch (e) {
      console.error("❌ Error fetching all users:", e);
      setAllSearchUsers([]);
    }
  };

  const handleAcceptRequest = async (requestId, senderId) => {
    try {
      console.log("✅ Accepting chat request ID:", requestId);
      
      // ✅ STEP 1: Accept the invitation on backend
      await acceptInvitation(requestId);
      console.log("✅ Chat request accepted!");
      
      // ✅ STEP 2: Immediately add sender to local state (optimistic update)
      // This prevents visual lag while fetching from backend
      const senderData = pendingRequests.find(req => req.id === requestId);
      if (senderData && !users.some(u => u.id === senderId)) {
        const newUser = {
          id: senderId,
          name: senderData.senderName,
          active: true,
          lastMsg: "Click to start chat..."
        };
        console.log("➕ Optimistically adding user to chat list:", newUser);
        setUsers(prev => [...prev, newUser]);
      }
      
      // ✅ STEP 3: Refresh pending requests (remove this request from pending list)
      console.log("🔄 Refreshing pending requests...");
      fetchPendingRequests();
      
      // ✅ STEP 4: Verify user is in accepted list (backend source of truth)
      // Use setTimeout to let state updates complete before checking
      setTimeout(async () => {
        console.log("✓ Verifying accepted users from backend...");
        try {
          const res = await getAcceptedUsers();
          const acceptedUserIds = (res.data || []).map(u => u.id);
          
          // Check if senderId is in the backend's accepted list
          if (acceptedUserIds.includes(senderId)) {
            console.log("✅ User confirmed in accepted users list from backend");
          } else {
            console.warn("⚠️ User NOT in backend accepted list - unexpected state!");
            // Force refresh if user missing
            await fetchUsers(false);
          }
        } catch (e) {
          console.error("❌ Error verifying accepted users:", e);
        }
      }, 500);
      
    } catch (e) {
      console.error("❌ Error accepting request:", e);
      alert("Failed to accept request: " + (e.response?.data?.message || e.message));
    }
  };

  const handleSendInvite = async (receiverId) => {
    try {
      console.log("📤 Sending invite to user ID:", receiverId);
      await sendInvitation(receiverId);
      console.log("✅ Invitation sent successfully!");
      alert("Invitation sent! Waiting for response...");
      setShowInvitePanel(false);
      setAllSearchUsers([]);
    } catch (e) {
      console.error("❌ Error sending invitation:", e);
      const errorMsg = e.response?.data?.message || e.message;
      alert("Failed to send invitation: " + errorMsg);
    }
  };

  useEffect(() => {
    // Initial load - pass true to allow auto-select
    fetchUsers(true);
    fetchPendingRequests();
    
    // Refresh user list every 5 seconds to catch new conversations
    // Pass false to prevent auto-select during refresh
    const userRefreshInterval = setInterval(() => {
      fetchUsers(false);
    }, 5000);

    // Refresh pending requests every 5 seconds
    const pendingRefreshInterval = setInterval(() => {
      fetchPendingRequests();
    }, 5000);
    
    return () => {
      clearInterval(userRefreshInterval);
      clearInterval(pendingRefreshInterval);
    };
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (selectedUser) {
      // Fetch messages for the selected user
      const fetchMessages = async () => {
        try {
          console.log(`📥 Fetching messages with user ${selectedUser.id} (${selectedUser.name})...`);
          console.log(`🔍 Verifying selectedUser is still:`, selectedUser.id, selectedUser.name);
          
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
          console.log(`🔍 Current selectedUser after fetch:`, selectedUser.id, selectedUser.name);
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
    } else {
      console.log(`⚠️ No selectedUser - not fetching messages`);
      setMessages([]);
    }
  }, [selectedUser]);

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

      // Step 3: Check if already in accepted list
      const userExists = users.some(u => u.id === foundUser.id);
      if (userExists) {
        console.log("✓ User already in chat list - selecting");
        const existingUser = users.find(u => u.id === foundUser.id);
        setSelectedUser(existingUser);
      } else {
        // Step 4: Send invitation to user
        console.log("📤 Sending invitation to new user");
        await sendInvitation(foundUser.id);
        alert(`✅ Invitation sent to ${foundUser.username}! They need to accept it before you can chat.`);
      }

      // Step 5: Close modal and clear input
      setShowNewChatModal(false);
      setNewChatUsername("");
      
    } catch (error) {
      console.error("Failed:", error);
      const errorMsg = error.response?.data?.message || error.message || "Failed to process request";
      alert(`Error: ${errorMsg}`);
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
                onClick={() => {
                  setShowInvitePanel(!showInvitePanel);
                  if (!showInvitePanel) {
                    fetchAllUsers();
                  }
                }}
                className="bg-blue-600 text-white text-xs px-3 py-1.5 rounded-full font-bold hover:bg-blue-700 transition"
              >
                + Invite
              </button>
            </div>

            {/* 🆕 Pending Requests Section */}
            {pendingRequests.length > 0 && (
              <div className="border-b border-gray-100 bg-amber-50">
                <div className="p-3 border-b border-amber-100">
                  <h3 className="text-xs font-bold text-amber-900">📥 Pending Requests ({pendingRequests.length})</h3>
                </div>
                <div className="max-h-[120px] overflow-y-auto">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="p-3 border-b border-amber-50 hover:bg-amber-100 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{req.senderName}</p>
                          <p className="text-xs text-gray-500 truncate">{req.senderEmail}</p>
                        </div>
                        <button
                          onClick={() => handleAcceptRequest(req.id, req.senderId)}
                          className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded font-medium whitespace-nowrap transition"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Invite Panel */}
            {showInvitePanel && (
              <div className="border-b border-gray-100 bg-blue-50">
                <div className="p-3 border-b border-blue-100 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-blue-900">👥 Invite Users</h3>
                  <button
                    onClick={() => setShowInvitePanel(false)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  {allSearchUsers.length > 0 ? (
                    allSearchUsers.map(user => {
                      const alreadyInvited = pendingRequests.some(req => req.senderId === user.id);
                      return (
                        <div key={user.id} className="p-3 border-b border-blue-50 hover:bg-blue-100 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{user.username}</p>
                              <p className="text-xs text-gray-500 truncate">{user.email}</p>
                            </div>
                            <button
                              onClick={() => handleSendInvite(user.id)}
                              disabled={alreadyInvited}
                              className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap transition ${
                                alreadyInvited
                                  ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                  : "bg-blue-500 hover:bg-blue-600 text-white"
                              }`}
                            >
                              {alreadyInvited ? "Pending" : "Invite"}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-gray-500">
                      Loading users...
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="p-3">
              <input type="text" placeholder="Search contacts..." className="w-full bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>

            <div className="flex-1 overflow-y-auto">
              {users.length > 0 ? (
                users.map(u => (
                  <div 
                    key={u.id} 
                    onClick={() => handleSelectUser(u)}
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
                ))
              ) : (
                <div className="p-4 text-center text-sm text-gray-500">
                  <p className="mb-2">No accepted connections yet</p>
                  <p className="text-xs">Invite someone or wait for an invitation to appear here</p>
                </div>
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

      {/* Old New Chat Modal - No longer used with invitation system */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Search User</h2>
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
                  Search
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