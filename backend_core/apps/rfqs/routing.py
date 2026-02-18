from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Route: ws://localhost:8000/ws/rfq/123/
    re_path(r'ws/rfq/(?P<rfq_id>\w+)/$', consumers.RFQConsumer.as_asgi()),
]