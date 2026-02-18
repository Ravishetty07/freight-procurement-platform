import pandas as pd
import google.generativeai as genai
import os
import traceback
from rest_framework import viewsets, permissions, status, serializers
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import RFQ, Shipment, Bid
from .serializers import RFQSerializer, ShipmentSerializer, BidSerializer

# --- 1. AI CONFIGURATION ---
GENAI_API_KEY = os.environ.get("GEMINI_API_KEY")

if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)
    model = genai.GenerativeModel('gemini-pro')
else:
    print("⚠️ WARNING: GEMINI_API_KEY not found. AI Pricing will default to 0.")
    model = None

# --- 2. HELPER FUNCTION ---
def get_ai_price_estimate(origin, destination, container_type):
    if not model:
        return 0.0
    try:
        prompt = f"Estimate freight rate USD for {container_type} from {origin} to {destination}. Return ONLY number."
        response = model.generate_content(prompt)
        cleaned_text = ''.join(c for c in response.text if c.isdigit() or c == '.')
        return float(cleaned_text) if cleaned_text else 0.0
    except Exception as e:
        print(f"❌ AI Error: {e}")
        return 0.0

# --- 3. VIEWSETS ---

class RFQViewSet(viewsets.ModelViewSet):
    serializer_class = RFQSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Admin sees all
        if user.role == 'ADMIN':
            return RFQ.objects.all().order_by('-created_at')
            
        # Vendor sees PUBLIC or OPEN RFQs
        if user.role == 'VENDOR':
            return RFQ.objects.filter(status='OPEN').order_by('-created_at')

        # Organization sees ONLY their own RFQs
        return RFQ.objects.filter(created_by=user).order_by('-created_at')

    def perform_create(self, serializer):
        # Your models.py uses 'created_by', so we set that here
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_shipments(self, request, pk=None):
        rfq = self.get_object()
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file provided"}, status=400)

        try:
            if file_obj.name.endswith('.csv'):
                df = pd.read_csv(file_obj)
            else:
                df = pd.read_excel(file_obj)

            created_count = 0
            for _, row in df.iterrows():
                origin = row.get('origin_port')
                destination = row.get('destination_port')
                container = row.get('container_type', '40HC')
                volume = row.get('volume', 1)
                ai_price = get_ai_price_estimate(origin, destination, container)

                Shipment.objects.create(
                    rfq=rfq,
                    origin_port=origin,
                    destination_port=destination,
                    container_type=container,
                    volume=volume,
                    ai_predicted_price=ai_price,
                    target_price=row.get('target_price') if pd.notna(row.get('target_price')) else None
                )
                created_count += 1
            return Response({"status": f"✅ Created {created_count} shipments from file."})
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class ShipmentViewSet(viewsets.ModelViewSet):
    queryset = Shipment.objects.all()
    serializer_class = ShipmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        try:
            # 1. Extract Data safely
            data = serializer.validated_data
            origin = data.get('origin_port', '')
            destination = data.get('destination_port', '')
            container = data.get('container_type', '40HC')
            
            # 2. Call AI
            ai_price = get_ai_price_estimate(origin, destination, container)
            print(f"🤖 AI Price Calculated: {ai_price}")

            # 3. Save
            # Note: The 'rfq' field is automatically handled by the serializer
            # because it is part of the request payload from the frontend.
            serializer.save(ai_predicted_price=ai_price)
            
        except Exception as e:
            print("❌ CRITICAL ERROR in Shipment Create:")
            traceback.print_exc()
            raise serializers.ValidationError({"detail": f"Backend Error: {str(e)}"})

class BidViewSet(viewsets.ModelViewSet):
    serializer_class = BidSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'VENDOR':
            return Bid.objects.filter(vendor=user)
        return Bid.objects.all()

    def perform_create(self, serializer):
        serializer.save(vendor=self.request.user)