import os
import requests
import random
from datetime import datetime
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv(dotenv_path="/Users/anshjain/Desktop/Money-Trail/credentials/.env")
API_KEY = os.getenv("API_KEY")
print("Loaded API Key:", API_KEY)
BASE = 'http://api.nessieisreal.com'
name = os.getenv("MONGO_DB_NAME")
collection = os.getenv("MONGO_COLLECTION")
connection_string = os.getenv("MONGO_CONNECTION")
client = MongoClient(connection_string)
db = client[name]
users = db[collection]

# Initialize merchant list
merchants = []
customers = []

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

def get_account_id(customer_id):
    account_id = requests.get(f"{BASE}/customers/{customer_id}/accounts?key={API_KEY}").json()[0]['_id']
    return account_id

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
        "balance": 5000
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
    
def make_deposit(account_id, amount, description="Standard deposit"):
    res = requests.post(f"{BASE}/accounts/{account_id}/deposits?key={API_KEY}", json={
        "medium": "balance",
        "amount": amount,
        "transaction_date": datetime.now().strftime('%Y-%m-%d'),
        "status": "completed",
        "description": description
    })
    res.raise_for_status()

def make_withdrawal(account_id, amount, description="Standard withdrawal"):
    res = requests.post(f"{BASE}/accounts/{account_id}/withdrawals?key={API_KEY}", json={
        "medium": "balance",
        "amount": amount,
        "transaction_date": datetime.now().strftime('%Y-%m-%d'),
        "status": "completed",
        "description": description
    })
    res.raise_for_status()

def make_transfer(from_account_id, to_account_id, amount, description, api_key, base_url="http://api.nessieisreal.com"):
    url = f"{base_url}/accounts/{from_account_id}/transfers?key={api_key}"
    payload = {
        "medium": "balance",
        "payee_id": to_account_id,
        "amount": amount,
        "transaction_date": datetime.now().strftime('%Y-%m-%d'),
        "description": description
    }

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        print(f"✅ Transfer of ${amount} from {from_account_id} to {to_account_id}: {description}")
    except requests.RequestException as e:
        print(f"❌ Failed to transfer from {from_account_id} to {to_account_id}: {e}")

def create_customers_and_accounts():
    first_names = ["Alice", "Bob", "Charlie", "David"]
    last_names = ["Smith", "Johnson", "Williams", "Brown"]

    for i in range(len(first_names)):
        customer_id = create_customer(first_names[i], last_names[i], "123", "Bitcamp Way", "College Park", "MD", "20740")
        account_id = create_account(customer_id)
        customers.append({
            "first_name": first_names[i],
            "last_name": last_names[i],
            "customer_id": customer_id
        })
        print(f"✅ Created account for {first_names[i]} {last_names[i]} (Customer ID: {customer_id}, Account ID: {account_id})")

        user = {
            "_id": account_id,
            "customer_id": customer_id,
            "isFraud": False,
            "score": 0,
            "rapid": [], 
            "frequency_transfer": [],
            "frequency_purchase": [],
            "dormant": [],
            "circular": []
        }

        users.insert_one(user)

    return customers

def simulate_purchases(customers, merchants):
    for c in customers:
        account_id = get_account_id(c["customer_id"])
        name = c["first_name"]

        # Normal purchases
        for _ in range(5):
            make_purchase(account_id, merchants[0], random_int(20, 150), "Groceries")

        # Suspicious purchases
        if name in ["Bob", "David"]:
            for _ in range(12):
                make_purchase(account_id, merchants[1], random_int(100, 300), "Consulting LLC - Possible shell")

        print(f"🛒 Purchases simulated for {name} | Suspicious? {'Yes' if name in ['Bob', 'David'] else 'No'}")

def simulate_withdrawals(customers):
    for c in customers:
        account_id = get_account_id(c["customer_id"])
        name = c["first_name"]

        # Normal withdrawals
        for _ in range(3):
            make_withdrawal(account_id, random_int(20, 100), "ATM Withdrawal")

        # Fraudulent behavior
        if name in ["Bob", "David"]:
            for _ in range(5):
                make_withdrawal(account_id, random_int(400, 1000), "Suspicious ATM Withdrawal")

        print(f"🏧 Withdrawals simulated for {name} | Suspicious? {'Yes' if name in ['Bob', 'David'] else 'No'}")

def simulate_deposits(customers):
    for c in customers:
        account_id = get_account_id(c["customer_id"])
        name = c["first_name"]
        print(name)
        # Normal deposits
        for _ in range(2):
            make_deposit(account_id, random_int(300, 1500), "Direct Deposit")

        # Fraudulent behavior
        if name in ["Bob", "David"]:
            for _ in range(4):
                make_deposit(account_id, random_int(5000, 10000), "Offshore Transfer - Investigate")

        print(f"🏦 Deposits simulated for {name} | Suspicious? {'Yes' if name in ['Bob', 'David'] else 'No'}")

def simulate_transfers(customer_pairs, api_key = API_KEY, base_url="http://api.nessieisreal.com"):

    for i, (from_customer, to_customer) in enumerate(customer_pairs):

        from_account = get_account_id(from_customer["customer_id"])
        to_account = get_account_id(to_customer["customer_id"])
    
        # Normal transfer
        if i % 2 != 0:
            make_transfer(
                from_account_id=from_account,
                to_account_id=to_account,
                amount=100,
                description="Monthly Utility Bill",
                api_key=api_key,
                base_url=base_url
            )

        # Fraudulent transfer (simulate on every even-indexed pair)
        if i % 2 == 0:
            make_transfer(
                from_account_id=from_account,
                to_account_id=to_account,
                amount=1000,
                description="Suspicious Large Transfer to Unknown Payee",
                api_key=api_key,
                base_url=base_url
            )

def main():
# Assume customers is already populated with account data
# Example structure: [{"first_name": "Alice", "account_id": "xyz123"}, ...]
    print(len(customers))
    create_customers_and_accounts()
    print("🔁 Starting customer simulation...\n")
    print(len(customers))
    print(customers)
    # merchants = create_merchants()
    #simulate_purchases(customers, merchants)
    # simulate_transfers([(customers[1], customers[3]), (customers[0], customers[2])])
    # simulate_withdrawals(customers)
    print("\n✅ Simulation complete.")


if __name__ == "__main__":
    main()
    # merchants = create_merchants()
    # if len(merchants) == 2:
    #     simulate()
    # else:
    #     print("Could not initialize merchants. Simulation aborted.")

