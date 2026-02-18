from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RFQViewSet, ShipmentViewSet, BidViewSet

router = DefaultRouter()
router.register(r'rfqs', RFQViewSet, basename='rfq')
router.register(r'shipments', ShipmentViewSet, basename='shipment')
router.register(r'bids', BidViewSet, basename='bid')

urlpatterns = [
    path('', include(router.urls)),
]