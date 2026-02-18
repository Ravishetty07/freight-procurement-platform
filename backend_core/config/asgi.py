import os
import django
from django.core.asgi import get_asgi_application

# 1. Setup Django environment first
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# 2. Import Channels logic (Must happen AFTER django.setup)
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from apps.rfqs import routing # We will create this next

# 3. Define the Router
application = ProtocolTypeRouter({
    "http": get_asgi_application(), # Handle normal HTTP requests
    "websocket": AuthMiddlewareStack( # Handle WebSocket connections
        URLRouter(
            routing.websocket_urlpatterns
        )
    ),
})