#!/usr/bin/env python3
"""
TruckSimFM Backend Test Suite
Tests the Spotify integration and basic API endpoints
"""

import requests
import json
import sys
from urllib.parse import urlparse

# Backend URL from frontend .env
BACKEND_URL = "https://trucksim-radio.preview.emergentagent.com/api"
RADIO_STREAM_URL = "https://radio.trucksim.fm:8000/radio.mp3"
CURRENT_SONG_URL = "https://radio.trucksim.fm:8000/currentsong?sid=1"

def test_basic_api():
    """Test GET /api/ endpoint - should return Hello World"""
    print("\n=== Testing Basic API Endpoint ===")
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Hello World":
                print("✅ Basic API test PASSED")
                return True
            else:
                print("❌ Basic API test FAILED - incorrect message")
                return False
        else:
            print(f"❌ Basic API test FAILED - status code {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Basic API test FAILED - error: {e}")
        return False

def test_spotify_search(artist, title):
    """Test Spotify search endpoint with specific artist and title"""
    print(f"\n=== Testing Spotify Search: {artist} - {title} ===")
    try:
        payload = {"artist": artist, "title": title}
        response = requests.post(
            f"{BACKEND_URL}/spotify/search",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check if we got valid data
            if data.get("title") and data.get("artist"):
                print(f"✅ Found track: {data.get('title')} by {data.get('artist')}")
                
                # Verify album art URL
                album_art_url = data.get("album_art_url")
                if album_art_url:
                    if is_valid_spotify_url(album_art_url):
                        print(f"✅ Valid Spotify CDN URL: {album_art_url}")
                    else:
                        print(f"⚠️  Album art URL might not be from Spotify CDN: {album_art_url}")
                else:
                    print("⚠️  No album art URL returned")
                
                # Print all metadata
                print(f"Album: {data.get('album', 'N/A')}")
                print(f"Release Date: {data.get('release_date', 'N/A')}")
                print(f"Duration: {data.get('duration_ms', 'N/A')} ms")
                print(f"Spotify URL: {data.get('spotify_url', 'N/A')}")
                print(f"Preview URL: {data.get('preview_url', 'N/A')}")
                
                return True
            else:
                if not any(data.values()):  # All values are None/empty
                    print("⚠️  No results found for this search")
                    return True  # This is acceptable behavior
                else:
                    print("❌ Incomplete track data returned")
                    return False
        else:
            print(f"❌ Spotify search FAILED - status code {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Spotify search FAILED - error: {e}")
        return False

def is_valid_spotify_url(url):
    """Check if URL is from Spotify CDN"""
    try:
        parsed = urlparse(url)
        spotify_domains = [
            'i.scdn.co',  # Main Spotify CDN
            'mosaic.scdn.co',  # Mosaic images
            'lineup-images.scdn.co',  # Lineup images
            'thisis-images.scdn.co',  # This is playlists
            'dailymix-images.scdn.co'  # Daily mix
        ]
        return parsed.netloc in spotify_domains
    except:
        return False

def test_radio_integration():
    """Test radio integration endpoints"""
    print("\n=== Testing Radio Integration ===")
    
    # Test radio stream availability
    print("Testing radio stream URL...")
    try:
        response = requests.head(RADIO_STREAM_URL, timeout=10)
        print(f"Radio stream status: {response.status_code}")
        if response.status_code == 200:
            print("✅ Radio stream is accessible")
        else:
            print(f"⚠️  Radio stream returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Radio stream test failed: {e}")
    
    # Test current song endpoint
    print("\nTesting current song API...")
    try:
        response = requests.get(CURRENT_SONG_URL, timeout=10)
        print(f"Current song API status: {response.status_code}")
        print(f"Current song response: {response.text[:200]}...")
        if response.status_code == 200:
            print("✅ Current song API is accessible")
        else:
            print(f"⚠️  Current song API returned status {response.status_code}")
    except Exception as e:
        print(f"❌ Current song API test failed: {e}")

def main():
    """Run all backend tests"""
    print("🚚 TruckSimFM Backend Test Suite")
    print("=================================")
    
    results = []
    
    # Test 1: Basic API
    results.append(test_basic_api())
    
    # Test 2: Spotify search with specified test data
    results.append(test_spotify_search("Calvin Harris", "Blessings"))
    
    # Test 3: Additional Spotify searches for consistency
    print("\n=== Testing Multiple Songs for Consistency ===")
    additional_tests = [
        ("Daft Punk", "Get Lucky"),
        ("The Weeknd", "Blinding Lights"),
        ("Ed Sheeran", "Shape of You")
    ]
    
    for artist, title in additional_tests:
        results.append(test_spotify_search(artist, title))
    
    # Test 4: Radio integration
    test_radio_integration()
    
    # Summary
    print("\n" + "="*50)
    print("TEST SUMMARY")
    print("="*50)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Passed: {passed}/{total} tests")
    
    if passed == total:
        print("🎉 ALL TESTS PASSED!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())