from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import RFQ, Shipment, Bid

# 1. Inline Shipments: Allows adding shipments INSIDE the RFQ page
class ShipmentInline(admin.TabularInline):
    model = Shipment
    extra = 0 # Don't show empty rows by default
    show_change_link = True # Allow clicking to edit full details
    readonly_fields = ('target_price',) 

# 2. Inline Bids: Allows seeing bids INSIDE the Shipment page
class BidInline(admin.TabularInline):
    model = Bid
    extra = 0
    # FIXED: Changed 'submitted_at' to 'created_at'
    readonly_fields = ('amount', 'vendor', 'created_at')
    can_delete = False # Admin shouldn't delete bids usually (audit trail)

@admin.register(RFQ)
class RFQAdmin(ModelAdmin):
    # FIXED: Removed 'is_public'
    list_display = ('id', 'title', 'created_by', 'status', 'deadline')
    list_filter = ('status', 'created_by', 'created_at') 
    search_fields = ('title', 'created_by__username') 
    inlines = [ShipmentInline] 
    actions = ['mark_as_open', 'mark_as_closed']

    def mark_as_open(self, request, queryset):
        queryset.update(status='OPEN')
    mark_as_open.short_description = "Mark selected RFQs as OPEN"

    def mark_as_closed(self, request, queryset):
        queryset.update(status='CLOSED')
    mark_as_closed.short_description = "Mark selected RFQs as CLOSED"

@admin.register(Shipment)
class ShipmentAdmin(ModelAdmin):
    list_display = ('id', 'origin_port', 'destination_port', 'rfq', 'target_price')
    list_filter = ('container_type', 'rfq__status')
    search_fields = ('origin_port', 'destination_port')
    inlines = [BidInline] 

@admin.register(Bid)
class BidAdmin(ModelAdmin):
    # FIXED: Removed 'rank'
    list_display = ('id', 'vendor', 'amount', 'shipment', 'is_winner')
    list_filter = ('vendor', 'is_winner')
    search_fields = ('vendor__username', 'shipment__origin_port')