import os
import requests
import random
from datetime import datetime
from dotenv import load_dotenv
from collections import defaultdict
from pymongo import MongoClient
from bson import ObjectId

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

def get_transfers(account_id):
    transfers = requests.get(f"{BASE}/accounts/{account_id}/transfers?key={API_KEY}").json()
    return transfers

def get_deposits(account_id):
    deposits = requests.get(f"{BASE}/accounts/{account_id}/deposits?key={API_KEY}").json()
    return deposits

def get_withdrawals(account_id):
    withdrawals = requests.get(f"{BASE}/accounts/{account_id}/withdrawals?key={API_KEY}").json()
    return withdrawals

def get_purchases(account_id):
    purchases = requests.get(f"{BASE}/accounts/{account_id}/purchases?key={API_KEY}").json()
    return purchases

def get_accounts(customer_id):
    res = requests.get(f"{BASE}/customers/{customer_id}/accounts?key={API_KEY}")
    res.raise_for_status()
    return res.json()

def rapid_transfer(transfers, deposits, withdrawals, account_id):
    for txn in deposits:
        txn["type"] = "deposit"
    for txn in withdrawals:
        txn["type"] = "withdrawal"

    for txn in transfers:
        txn["type"] = "transfer"
        # Classify direction based on account_id
        if txn.get("payer_id") == account_id:
            txn["direction"] = "outgoing"
        elif txn.get("payee_id") == account_id:
            txn["direction"] = "incoming"

    # Merge all transactions
    all_txns = deposits + withdrawals + transfers
    if not all_txns:
        return [], 0

    # Sort by date
    all_txns.sort(key=lambda txn: datetime.strptime(txn["transaction_date"], "%Y-%m-%d"))
    latest_date = all_txns[-1]["transaction_date"]

    # Filter transactions that occurred on the latest date
    same_day_txns = [txn for txn in all_txns if txn["transaction_date"] == latest_date]

    # Compute totals
    incoming_total = 0
    outgoing_total = 0

    for txn in same_day_txns:
        amt = float(txn.get("amount", 0.00))
        if txn["type"] == "deposit":
            incoming_total += amt
        elif txn["type"] == "withdrawal":
            outgoing_total += amt
        elif txn["type"] == "transfer":
            if txn.get("direction") == "incoming":
                incoming_total += amt
            elif txn.get("direction") == "outgoing":
                outgoing_total += amt

    # Check the conditions
    if incoming_total >= 5000 and incoming_total == outgoing_total:

        transaction_ids = []

        for txn in same_day_txns:

            transaction_ids.append(txn["_id"])

        return transaction_ids, 3

    return [], 0

def high_frequency(transfers, purchases):

    high_freq_weight = 0
    transfer_ids = []
    purchase_ids = []
    transfers_caught = False
    purchases_caught = False

    #transfers
    if len(transfers) > 4:
        current_transfers = transfers[-5:]
        latest_date = datetime.strptime(current_transfers[-1]["transaction_date"], "%Y-%m-%d")
        earliest_date = datetime.strptime(current_transfers[-5]["transaction_date"], "%Y-%m-%d")

        if latest_date == earliest_date:
            count = 0

            for transfer in current_transfers:
                if transfer.get("amount", 0.00) >= 1000:
                    count += 1

            if count == 5:
                transfers_caught = True
                high_freq_weight += 2


        if transfers_caught == True:
            for transfer in current_transfers:
                transfer_ids.append(transfer["_id"])

    #purchases
    if len(purchases) > 4:
        current_purchases = purchases[-5:]
        latest_date = datetime.strptime(current_purchases[-1]["transaction_date"], "%Y-%m-%d")
        earliest_date = datetime.strptime(current_purchases[-5]["transaction_date"], "%Y-%m-%d")

        if latest_date == earliest_date:
            count = 0

            for purchase in current_purchases:
                if purchase.get("amount", 0.00) >= 2000:
                    count += 1

            if count == 5:
                purchases_caught = True
                high_freq_weight += 2

        if purchases_caught == True:
            for purchase in current_purchases:
                purchase_ids.append(purchase["_id"])

    return transfer_ids, purchase_ids, high_freq_weight

def dormant_to_active(transfers, deposits, withdrawals):
    
    dormant_weight = 2
    transactions = []

    for transfer in transfers:
        transactions.append(transfer)

    for deposit in deposits:
        transactions.append(deposit)

    for withdrawal in withdrawals:
        transactions.append(withdrawal)

    if len(transactions) <= 1:
        return "", 0

    transactions.sort(key=lambda txn: datetime.strptime(txn["transaction_date"], "%Y-%m-%d"))

    latest = transactions[-1]
    second_latest = transactions[-2]
    transaction_id = latest["_id"]

    #we will have to send the mongodb list of dormant transactions already looked at and compare
    #it to the current latest transaction and see if we already did it. if we did, we return an 
    #empty string and a sus score of 0 otherwise we continue with the rest of the code 

    latest_date = datetime.strptime(latest["transaction_date"], "%Y-%m-%d")
    second_latest_date = datetime.strptime(second_latest["transaction_date"], "%Y-%m-%d")
    days_diff = (latest_date - second_latest_date).days
    latest_amount = float(latest.get("amount", 0.00))
    latest_type = latest.get("type", "")

    # Check the conditions
    if days_diff >= 30 and latest_type in ["deposit", "p2p", "withdrawal"] and latest_amount >= 1000:
        
        return transaction_id, dormant_weight

    return "", 0

def find_all_transfers(customers):
    # STEP 1: Gather all transfers from all customer accounts

    from_account_transfers = []
    for customer in customers:
        accounts = get_accounts(customer["_id"])
        for acct in accounts:
            transfers = get_transfers(acct["_id"])
            for t in transfers:
                if "payer_id" in t and "payee_id" in t and "amount" in t:
                    from_account_transfers.append({
                        "_id": t["_id"],
                        "payer_id": t["payer_id"],
                        "payee_id": t["payee_id"],
                        "amount": float(t["amount"]),
                        "transaction_date": t.get("transaction_date", None)
                    })

    return from_account_transfers

def detect_circular_funds(start_transfer, all_transfers):

    # STEP 1: Build a graph where each node is an account,
    # and each edge stores payee_id, amount, and transaction_id
    graph = defaultdict(list)
    for t in all_transfers:
        if "payer_id" in t and "payee_id" in t and "amount" in t and "_id" in t:
            graph[t["payer_id"]].append({
                "payee_id": t["payee_id"],
                "amount": float(t["amount"]),
                "transaction_id": t["_id"]
            })

    # STEP 2: Recursive DFS to find cycle of same-amount transfers
    def dfs(account_path, txn_path, visited, origin, amount_to_match):
        current = account_path[-1]

        # A valid cycle must return to origin and include at least 4 accounts
        if len(account_path) > 4 and current == origin:
            return txn_path  # valid cycle → return transaction IDs

        for edge in graph[current]:
            neighbor = edge["payee_id"]
            amt = edge["amount"]
            txn_id = edge["transaction_id"]

            # Skip visited accounts (except origin at end) and mismatched amounts
            if neighbor in visited:
                continue
            if amt != amount_to_match:
                continue

            new_account_path = account_path + [neighbor]
            new_txn_path = txn_path + [txn_id]
            cycle = dfs(new_account_path, new_txn_path, visited | {neighbor}, origin, amount_to_match)
            if cycle:
                return cycle

        return None

    # STEP 3: Extract info from starting transfer
    payer = start_transfer.get("payer_id")
    payee = start_transfer.get("payee_id")
    amount = float(start_transfer.get("amount", 0.0))
    start_txn_id = start_transfer.get("_id")

    # Validate required fields
    if not payer or not payee or not start_txn_id or amount == 0:
        return [], 0  # Invalid starting point

    # STEP 4: Start DFS
    account_path = [payer, payee]
    txn_path = [start_txn_id]
    visited = {payee}  # allow return to payer at the end
    cycle_txn_ids = dfs(account_path, txn_path, visited, payer, amount)

    # STEP 5: Return results
    if cycle_txn_ids:
        return cycle_txn_ids, 3
    else:
        return [], 0


def main():

    account_id = '67fac5c59683f20dd5194fd3'
    doc = users.find_one({"_id": account_id})
    sus = doc['score']
    transfers = get_transfers(account_id)
    deposits = get_deposits(account_id)
    withdrawals = get_withdrawals(account_id)
    purchases = get_purchases(account_id)
    
    ##dormant
    dormant_id, dormant_weight = dormant_to_active(transfers, deposits, withdrawals)
    if doc and dormant_id:
        existing_ids = doc.get("dormant", [])  
        if dormant_id not in existing_ids:
            db[collection].update_one(
                {"_id": doc["_id"]},
                {"$push": {"dormant": dormant_id}}
            )        
            sus += dormant_weight

    ##high frequency
    frequency_transaction_id, frequency_purchase_ids, frequency_weight = high_frequency(transfers, purchases)
    if doc and frequency_transaction_id:

        retrieved_user = users.find_one({"_id": account_id})
        existing_transactions = retrieved_user['frequency_transfer']
        temp_list = []

        for transfer in existing_transactions:

            temp = False

            for frequency_transition in frequency_transaction_id:

                if frequency_transition not in transfer:

                    temp = True

            temp_list.append(temp)
            
        if False not in temp_list:
            
            db[collection].update_one(
                {"_id": doc["_id"]},
                {"$push": {"frequency_transfer": frequency_transaction_id}}
            )

            sus += 2

    if doc and frequency_purchase_ids:

        retrieved_user = users.find_one({"_id": account_id})
        existing_transactions = retrieved_user['frequency_purchase']
        temp_list = []

        for transfer in existing_transactions:

            temp = False

            for frequency_transition in frequency_purchase_ids:

                if frequency_transition not in transfer:

                    temp = True

            temp_list.append(temp)
            
        if False not in temp_list:
            
            db[collection].update_one(
                {"_id": doc["_id"]},
                {"$push": {"frequency_purchase": frequency_purchase_ids}}
            )

            sus += 2
    
    ##rapid
    rapid_transaction_id, rapid_weight = rapid_transfer(transfers, deposits, withdrawals, account_id)
    if doc and rapid_transaction_id:

        retrieved_user = users.find_one({"_id": account_id})
        existing_transactions = retrieved_user['rapid']
        temp_list = []

        for transfer in existing_transactions:

            temp = False

            for rapid_transition in rapid_transaction_id:

                if rapid_transition not in transfer:

                    temp = True

            temp_list.append(temp)
            
        if False not in temp_list:
            
            db[collection].update_one(
                {"_id": doc["_id"]},
                {"$push": {"rapid": rapid_transaction_id}}
            )

            sus += rapid_weight

    if sus > 10:

        sus = 10

    print("sus is ", sus)

    users.update_one({'_id': doc['_id']}, {'$set': {'score': sus}})

    if sus >= 7:
    
        users.update_one({'_id': doc['_id']}, {'$set': {'isFraud': True}})

    #Circular
    start_transfer = transfers[-1]
    customers = requests.get(f"{BASE}/customers?key={API_KEY}").json()
    all_transfers = find_all_transfers(customers)
    circular_transactions, circular_weight = detect_circular_funds(start_transfer, all_transfers)
    print("flagged transactions:", circular_transactions)
    print("circular weight:", circular_weight)

    if circular_transactions:
    
        circular_accounts = []
        
        for transfer_id in circular_transactions:

            transaction = requests.get(f"{BASE}/transfers/{transfer_id}?key={API_KEY}").json()
            circular_accounts.append(transaction['payer_id'])

        for account in circular_accounts:

            retrieved_user = users.find_one({"_id": account})
            existing_transactions = retrieved_user['circular']
            temp_list = []

            for transfer in existing_transactions:

                temp = False

                for circle_transaction in circular_transactions:

                    if circle_transaction not in transfer:

                        temp = True

                temp_list.append(temp)
                
            if False not in temp_list:
                
                users.update_one(
                    {"_id": account},
                    {"$push": {"circular": circular_transactions}}
                )

                score = retrieved_user['score']
                score += circular_weight

                if score > 10:

                    score = 10
                
                users.update_one({'_id': account}, {'$set': {'score': score}})

                if score >= 7:
    
                    users.update_one({'_id': account}, {'$set': {'isFraud': True}})

if __name__ == "__main__":
    main()