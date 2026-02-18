import requests
import sys

# --- CONFIGURATION ---
BASE_URL = "http://127.0.0.1:8000"
USERNAME = "admin"
PASSWORD = "password123"

def run_test():
    print("🚀 STARTING FINAL SYSTEM TEST...\n")

    # 1. LOGIN
    print(f"1. Logging in as {USERNAME}...")
    auth_url = f"{BASE_URL}/api/v1/token/" 
    
    try:
        response = requests.post(auth_url, data={"username": USERNAME, "password": PASSWORD})
        if response.status_code != 200:
            print(f"❌ Login Failed: {response.text}")
            return
        
        token = response.json().get('access')
        print("✅ Login Successful!")
        headers = {"Authorization": f"Bearer {token}"}
        
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

    # 2. CREATE RFQ
    print("\n2. Creating a Test RFQ...")
    rfq_data = {
        "title": "Final System Test RFQ",
        "deadline": "2026-12-31T23:59:59Z",
        "status": "OPEN"
    }
    
    # URL: /api/v1/rfqs/
    rfq_url = f"{BASE_URL}/api/v1/rfqs/"
    response = requests.post(rfq_url, json=rfq_data, headers=headers)
    
    if response.status_code == 201:
        rfq_id = response.json()['id']
        print(f"✅ RFQ Created! ID: {rfq_id}")
    else:
        print(f"❌ RFQ Failed: {response.text}")
        return

    # 3. ADD SHIPMENT (THE AI TEST)
    print("\n3. Adding Shipment (Asking Gemini for Price)...")
    shipment_data = {
        "rfq": rfq_id,
        "origin_port": "Shanghai",
        "destination_port": "Los Angeles",
        "container_type": "40HC",
        "volume": 5
    }
    
    # URL: /api/v1/shipments/
    shipment_url = f"{BASE_URL}/api/v1/shipments/"
    response = requests.post(shipment_url, json=shipment_data, headers=headers)
    
    if response.status_code == 201:
        data = response.json()
        shipment_id = data['id']
        ai_price = data.get('ai_predicted_price')
        
        print(f"✅ Shipment Added! ID: {shipment_id}")
        
        if ai_price and ai_price > 0:
            print(f"✨ GEMINI AI SUCCESS! Predicted Price: ${ai_price}")
        else:
            print("⚠️ Shipment created, but AI Price is $0.0 (Check API Key environment variable)")
    else:
        print(f"❌ Shipment Failed: {response.text}")
        return

    print("\n🎉 SYSTEM FULLY OPERATIONAL. Backend is ready for Frontend!")

if __name__ == "__main__":
    run_test()