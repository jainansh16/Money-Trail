import os
import requests
import random
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="./credentials/.env")
API_KEY = os.getenv("API_KEY")
print("Loaded API Key:", API_KEY)

BASE = 'http://api.nessieisreal.com'

# Initialize merchant list
merchants = []

def random_int(min_val, max_val):
    return random.randint(min_val, max_val)

def create_merchant(name, category, city="New York", state="NY"):
    try:
        res = requests.post(f"{BASE}/merchants?key={API_KEY}", json={
            "name": name,
            "category": category,
            "address": {
                "street_number": "123",
                "street_name": "Main St",
                "city": city,
                "state": state,
                "zip": "10001"
            },
            "geocode": {
                "lat": 40.7128,
                "lng": -74.0060
            }
        })
        res.raise_for_status()
        data = res.json()
        merchant = data["objectCreated"]  # ✅ Extract actual merchant object
        print(f"Merchant created: {merchant['name']} (ID: {merchant['_id']})")
        return merchant["_id"]
    except Exception as e:
        print("Error creating merchant:", e)
        try:
            print("Full response:", res.text)
        except:
            pass
        return None

def create_merchants():
    categories = [
        ("Trader Joe's", "Groceries"),
        ("Shell Consulting", "Consulting")
    ]
    created_ids = []
    for name, category in categories:
        merchant_id = create_merchant(name, category)
        if merchant_id:
            created_ids.append(merchant_id)
    return created_ids

def create_customer(first_name, last_name, street_no, street_name, city, state, zip_code):
    res = requests.post(f"{BASE}/customers?key={API_KEY}", json={
        "first_name": first_name,
        "last_name": last_name,
        "address": {
            "street_number": street_no,
            "street_name": street_name,
            "city": city,
            "state": state,
            "zip": zip_code
        }
    })
    res.raise_for_status()
    data = res.json()
    return data['objectCreated']['_id']

def create_account(customer_id):
    res = requests.post(f"{BASE}/customers/{customer_id}/accounts?key={API_KEY}", json={
        "type": "Checking",
        "nickname": "Hacked Checking",
        "rewards": 0,
        "balance": random_int(2000, 8000)
    })
    res.raise_for_status()
    data = res.json()
    return data['objectCreated']['_id']

def make_purchase(account_id, merchant_id, amount, desc):
    res = requests.post(f"{BASE}/accounts/{account_id}/purchases?key={API_KEY}", json={
        "merchant_id": merchant_id,
        "medium": "balance",
        "purchase_date": datetime.now().strftime('%Y-%m-%d'),
        "amount": amount,
        "status": "completed",
        "description": desc
    })
    res.raise_for_status()

def simulate():
    first_names = ["Alice", "Bob", "Charlie", "David"]
    last_names = ["Smith", "Johnson", "Williams", "Brown"]

    for i in range(len(first_names)):
        customer_id = create_customer(first_names[i], last_names[i], "123", "Bitcamp Way", "College Park", "MD", "20740")
        account_id = create_account(customer_id)

        # Normal purchases
        for _ in range(5):
            make_purchase(account_id, merchants[0], random_int(20, 150), "Groceries")

        # Suspicious behavior
        if first_names[i] in ["Bob", "David"]:
            for _ in range(12):
                make_purchase(account_id, merchants[1], random_int(100, 300), "Consulting LLC - Possible shell")

        print(f"Created customer {first_names[i]} with suspicious activity? {first_names[i] in ['Bob', 'David']}")

if __name__ == "__main__":
    merchants = create_merchants()
    if len(merchants) == 2:
        simulate()
    else:
        print("Could not initialize merchants. Simulation aborted.")
