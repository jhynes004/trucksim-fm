#!/usr/bin/env python3
"""
Backend API Tests for TruckSimFM Radio Streaming App
Tests the FastAPI backend endpoints using the public URL.
"""

import requests
import json
import sys
import os

# Backend URL from frontend/.env
BACKEND_URL = "https://trucksim-stream.preview.emergentagent.com/api"

def test_api_root():
    """Test GET /api/ endpoint - should return {"message": "Hello World"}"""
    print("🧪 Testing GET /api/ endpoint...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/")
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("message") == "Hello World":
                    print("   ✅ API root endpoint working correctly")
                    return True
                else:
                    print(f"   ❌ Unexpected response content: {data}")
                    return False
            except json.JSONDecodeError:
                print(f"   ❌ Response is not valid JSON: {response.text}")
                return False
        else:
            print(f"   ❌ API endpoint returned status {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Cannot connect to backend at {BACKEND_URL}")
        return False
    except requests.exceptions.Timeout:
        print("   ❌ Request timed out")
        return False
    except Exception as e:
        print(f"   ❌ Unexpected error: {str(e)}")
        return False

def test_status_endpoints():
    """Test POST and GET /api/status endpoints"""
    print("🧪 Testing /api/status endpoints...")
    
    try:
        # Test POST /api/status
        test_data = {"client_name": "TruckSimFM_Test_Client"}
        post_response = requests.post(f"{BACKEND_URL}/status", json=test_data)
        print(f"   POST Status Code: {post_response.status_code}")
        
        if post_response.status_code == 200:
            try:
                post_data = post_response.json()
                print(f"   POST Response: {json.dumps(post_data, indent=2)}")
                
                # Verify response structure
                if all(key in post_data for key in ["id", "client_name", "timestamp"]):
                    print("   ✅ POST /api/status working correctly")
                    post_success = True
                else:
                    print("   ❌ POST response missing required fields")
                    post_success = False
            except json.JSONDecodeError:
                print(f"   ❌ POST response is not valid JSON: {post_response.text}")
                post_success = False
        else:
            print(f"   ❌ POST /api/status returned status {post_response.status_code}")
            print(f"   Response: {post_response.text}")
            post_success = False
            
        # Test GET /api/status
        get_response = requests.get(f"{BACKEND_URL}/status")
        print(f"   GET Status Code: {get_response.status_code}")
        
        if get_response.status_code == 200:
            try:
                get_data = get_response.json()
                print(f"   GET Response: {json.dumps(get_data, indent=2)}")
                
                # Verify it's a list
                if isinstance(get_data, list):
                    print("   ✅ GET /api/status working correctly")
                    get_success = True
                else:
                    print("   ❌ GET response should be a list")
                    get_success = False
            except json.JSONDecodeError:
                print(f"   ❌ GET response is not valid JSON: {get_response.text}")
                get_success = False
        else:
            print(f"   ❌ GET /api/status returned status {get_response.status_code}")
            print(f"   Response: {get_response.text}")
            get_success = False
            
        return post_success and get_success
        
    except requests.exceptions.ConnectionError:
        print(f"   ❌ Cannot connect to backend at {BACKEND_URL}")
        return False
    except requests.exceptions.Timeout:
        print("   ❌ Request timed out")
        return False
    except Exception as e:
        print(f"   ❌ Unexpected error: {str(e)}")
        return False

def run_backend_tests():
    """Run all backend tests"""
    print("🚀 Starting TruckSimFM Backend API Tests")
    print(f"🔗 Testing backend at: {BACKEND_URL}")
    print("=" * 60)
    
    results = []
    
    # Test 1: Root API endpoint
    results.append(("GET /api/ endpoint", test_api_root()))
    
    # Test 2: Status endpoints  
    results.append(("Status endpoints", test_status_endpoints()))
    
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY:")
    print("=" * 60)
    
    all_passed = True
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"   {status}: {test_name}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    if all_passed:
        print("🎉 ALL BACKEND TESTS PASSED!")
        return 0
    else:
        print("💥 SOME BACKEND TESTS FAILED!")
        return 1

if __name__ == "__main__":
    exit_code = run_backend_tests()
    sys.exit(exit_code)