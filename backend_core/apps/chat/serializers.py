from rest_framework import serializers
from .models import ChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = ['id', 'bid', 'sender', 'sender_name', 'sender_role', 'message', 'created_at', 'is_read', 'is_mine']
        read_only_fields = ['sender', 'is_read']

    def get_is_mine(self, obj):
        # Tells the frontend if the logged-in user sent this message (so we can color it blue vs gray)
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            return obj.sender == request.user
        return False