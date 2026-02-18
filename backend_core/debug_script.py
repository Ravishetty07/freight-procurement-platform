import requests
import sys

# --- CONFIGURATION ---
BASE_URL = "http://127.0.0.1:8000"
USERNAME = "admin"
PASSWORD = "password123"

def run_test():
    print("🚀 STARTING DEBUG CHECK...\n")

    # 1. LOGIN
    # NOTICE: This URL has /api/v1/
    target_url = f"{BASE_URL}/api/v1/token/" 
    
    print(f"👉 I am connecting to: {target_url}") 
    print("(If this URL does not say 'v1', you are running the wrong file!)\n")

    try:
        response = requests.post(target_url, data={"username": USERNAME, "password": PASSWORD})
        
        # If we get a 404 HTML page (which starts with <html...), print a clear error
        if response.status_code == 404:
            print("❌ ERROR: 404 Page Not Found.")
            print("   The server says this URL does not exist.")
            print("   Check your config/urls.py to ensure 'api/v1/' is defined.")
            return

        if response.status_code != 200:
            print(f"❌ Login Failed (Status {response.status_code}):")
            print(response.text[:200]) # Print first 200 chars only
            return
        
        token = response.json().get('access')
        print("✅ Login Successful! Token acquired.")
        
    except Exception as e:
        print(f"❌ Connection Error: {e}")
        return

if __name__ == "__main__":
    run_test()