import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { X, Send, MessageSquare, User, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const BidChatDrawer = ({ isOpen, onClose, bidId, chatTitle }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Fetch messages when the drawer opens or bidId changes
    useEffect(() => {
        if (isOpen && bidId) {
            fetchMessages();
            // Optional: Auto-refresh messages every 10 seconds
            const interval = setInterval(fetchMessages, 10000);
            return () => clearInterval(interval);
        }
    }, [isOpen, bidId]);

    // Auto-scroll to the bottom of the chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const response = await api.get(`/chat/messages/bid/${bidId}/`);
            setMessages(response.data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setSending(true);
        try {
            await api.post('/chat/messages/', {
                bid: bidId,
                message: newMessage
            });
            setNewMessage("");
            fetchMessages(); // Instantly refresh chat
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            {/* Darkened Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 transition-opacity"
                    onClick={onClose}
                ></div>
            )}

            {/* Slide-out Drawer */}
            <div className={`fixed top-0 right-0 h-full w-full sm:w-[450px] bg-gray-50 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                
                {/* Header */}
                <div className="h-20 px-6 flex justify-between items-center bg-white border-b border-gray-200 shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange-50 p-2.5 rounded-xl border border-orange-100">
                            <MessageSquare className="h-5 w-5 text-[#EF7D00]" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 leading-tight">Negotiation Chat</h2>
                            <p className="text-xs font-bold text-gray-500 mt-0.5">{chatTitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-500 transition border border-gray-200">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Message History Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex justify-center items-center h-full text-gray-400">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                            <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
                            <p className="text-sm font-bold text-gray-500">No messages yet.</p>
                            <p className="text-xs text-gray-400 mt-1">Start the conversation to clarify quote details.</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMine = msg.is_mine;
                            return (
                                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black text-gray-500 uppercase tracking-wide">
                                            {isMine ? 'You' : msg.sender_name}
                                        </span>
                                        <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                    <div className={`px-5 py-3 rounded-2xl max-w-[85%] text-sm font-medium shadow-sm ${
                                        isMine 
                                            ? 'bg-gray-900 text-white rounded-tr-sm' 
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                                    }`}>
                                        {msg.message}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                    <form onSubmit={handleSendMessage} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Type your message..."
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#EF7D00] focus:bg-white transition-all font-medium"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={sending || !newMessage.trim()}
                            className="bg-[#EF7D00] hover:bg-[#D96F00] disabled:bg-gray-300 text-white p-3 rounded-xl transition shadow-md flex items-center justify-center"
                        >
                            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default BidChatDrawer;