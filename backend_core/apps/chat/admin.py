from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import ChatMessage

@admin.register(ChatMessage)
class ChatMessageAdmin(ModelAdmin):
    # Display key information, including a snippet of the actual message
    list_display = ('id', 'bid', 'sender', 'message_snippet', 'is_read', 'created_at')
    
    # 🚀 GOD MODE: Quickly mark messages as read/unread from the table
    list_editable = ('is_read',)
    
    # Filter by who sent it or if it's been read
    list_filter = ('is_read', 'created_at', 'sender')
    
    # 🚀 GLOBAL SEARCH: Search every single chat message on the platform by keyword!
    search_fields = ('message', 'sender__username', 'sender__company_name')
    
    # Show newest messages at the top of the admin panel
    ordering = ('-created_at',)

    # Helper function to keep the table clean by shortening long messages
    def message_snippet(self, obj):
        if len(obj.message) > 60:
            return obj.message[:60] + "..."
        return obj.message
    message_snippet.short_description = "Message Content"