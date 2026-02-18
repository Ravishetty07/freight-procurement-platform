from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import RFQ, Shipment, Bid

# 1. Inline Shipments: Allows adding shipments INSIDE the RFQ page
class ShipmentInline(admin.TabularInline):
    model = Shipment
    extra = 0 # Don't show empty rows by default
    show_change_link = True # Allow clicking to edit full details
    readonly_fields = ('target_price',) # Prevent accidental edits to AI price

# 2. Inline Bids: Allows seeing bids INSIDE the Shipment page
class BidInline(admin.TabularInline):
    model = Bid
    extra = 0
    readonly_fields = ('amount', 'vendor', 'submitted_at')
    can_delete = False # Admin shouldn't delete bids usually (audit trail)

@admin.register(RFQ)
class RFQAdmin(ModelAdmin):
    list_display = ('id', 'title', 'created_by', 'status', 'deadline', 'is_public')
    list_filter = ('status', 'created_by', 'created_at') # Sidebar filters
    search_fields = ('title', 'created_by__username') # Search box
    inlines = [ShipmentInline] # Shows shipments here!
    actions = ['mark_as_open', 'mark_as_closed']

    # Custom Actions (Bulk Edit)
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
    inlines = [BidInline] # Shows bids directly under the shipment!

@admin.register(Bid)
class BidAdmin(ModelAdmin):
    list_display = ('id', 'vendor', 'amount', 'shipment', 'rank', 'is_winner')
    list_filter = ('vendor', 'is_winner')
    search_fields = ('vendor__username', 'shipment__origin_port')