from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import RFQ, Shipment, Bid

# 1. Inline Shipments (Full Edit/Delete Control)
class ShipmentInline(TabularInline):
    model = Shipment
    extra = 0
    show_change_link = True
    # Removed readonly_fields so Admin can edit target_price and volume

# 2. Inline Bids (Full Edit/Delete Control)
class BidInline(TabularInline):
    model = Bid
    extra = 0
    show_change_link = True
    # Removed can_delete=False and readonly_fields. Admin can now delete/modify bids!

@admin.register(RFQ)
class RFQAdmin(ModelAdmin):
    # Added visibility toggles and deadline to the main table view
    list_display = ('id', 'title', 'created_by', 'status', 'visible_target_price', 'visible_bids', 'deadline')
    
    # 🚀 GOD MODE: Allows you to toggle checkboxes and change status directly from the table!
    list_editable = ('status', 'visible_target_price', 'visible_bids', 'deadline')
    
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
    list_display = ('id', 'rfq', 'origin_port', 'destination_port', 'volume', 'target_price')
    
    # 🚀 GOD MODE: Quickly fix typos in ports or change pricing right from the list
    list_editable = ('origin_port', 'destination_port', 'volume', 'target_price')
    
    list_filter = ('container_type', 'rfq__status')
    search_fields = ('origin_port', 'destination_port', 'rfq__title')
    inlines = [BidInline]

@admin.register(Bid)
class BidAdmin(ModelAdmin):
    list_display = ('id', 'shipment', 'vendor', 'amount', 'is_winner', 'counter_offer_status')
    
    # 🚀 GOD MODE: Force award a contract or override a bid amount from the admin panel
    list_editable = ('amount', 'is_winner', 'counter_offer_status')
    
    list_filter = ('is_winner', 'counter_offer_status')
    search_fields = ('vendor__username', 'vendor__company_name', 'shipment__rfq__title')