from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # --- 1. AUTHENTICATION (Specific paths MUST come first) ---
    # These must be above 'api/v1/' or they will get blocked
    path('api/v1/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/v1/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # --- 2. APP ROUTES (Generic includes come last) ---
    # These catch everything else starting with 'api/v1/'
    path('api/v1/', include('apps.rfqs.urls')),
    path('api/v1/analytics/', include('apps.analytics.urls')),
]

def dashboard_callback(request, context):
    context.update({
        "custom_variable": "value",
    })
    return context