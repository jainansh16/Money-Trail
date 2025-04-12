import os
import sys
import requests
from dotenv import load_dotenv

# Load your API key
load_dotenv(dotenv_path="./credentials/.env")
API_KEY = 'e2891b406c32fa6257f37327a5ed4fe8'
if not API_KEY:
    sys.exit("No API key provided. Set NESSIE_API_KEY or pass as command line arg.")
else:
    print("Loaded API Key:", API_KEY)
BASE_URL = "http://api.nessieisreal.com"
CUSTOMER_ENDPOINT = f"{BASE_URL}/customers"
PARAMS = {"key": API_KEY}

try:
    resp = requests.get(CUSTOMER_ENDPOINT, params=PARAMS)
    resp.raise_for_status()
    customers = resp.json()
except requests.RequestException as err:
    sys.exit(f"❌ Failed to fetch customers: {err}")

print(f"🔍 Found {len(customers)} customers...")

for cust in customers:
    cust_id = cust.get("_id")
    if not cust_id:
        print(f"⚠️  Skipping customer with no ID: {cust}")
        continue

    delete_url = f"{CUSTOMER_ENDPOINT}/{cust_id}"
    try:
        del_resp = requests.delete(delete_url, params=PARAMS)
        del_resp.raise_for_status()
        print(f"✅ Deleted customer {cust_id}")
    except requests.RequestException as err:
        print(f"❌ Failed to delete {cust_id}: {err}")