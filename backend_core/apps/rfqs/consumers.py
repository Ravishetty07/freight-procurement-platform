import json
from channels.generic.websocket import AsyncWebsocketConsumer

class RFQConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """
        Client connects to: ws://localhost:8000/ws/rfq/<rfq_id>/
        """
        self.rfq_id = self.scope['url_route']['kwargs']['rfq_id']
        self.room_group_name = f'rfq_{self.rfq_id}'

        # Join the "Room" for this specific RFQ
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()
        print(f"✅ WebSocket Connected: {self.room_group_name}")

    async def disconnect(self, close_code):
        # Leave the room
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket (Frontend)
    async def receive(self, text_data):
        # We generally don't receive data here (we use API for that).
        # But we need to handle "Broadcasts" sent from the Backend (Signals).
        pass

    # Custom Handler: Send "New Bid" notification to Frontend
    async def bid_update(self, event):
        message = event['message']

        # Send JSON to the Frontend Client
        await self.send(text_data=json.dumps({
            'type': 'bid_update',
            'data': message
        }))