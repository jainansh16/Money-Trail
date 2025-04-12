import os
import requests
import random
from datetime import datetime
from dotenv import load_dotenv
from collections import defaultdict

# Load environment variables
load_dotenv(dotenv_path="/Users/anshjain/Desktop/Money-Trail/credentials/.env")
API_KEY = os.getenv("API_KEY")
print("Loaded API Key:", API_KEY)

BASE = 'http://api.nessieisreal.com'

def get_transfers(account_id):
    transfers = requests.get(f"{BASE}/accounts/{account_id}/transfers?key={API_KEY}").json()
    # print("transfers:", transfers)
    return transfers

def get_deposits(account_id):
    deposits = requests.get(f"{BASE}/accounts/{account_id}/deposits?key={API_KEY}").json()
    print("deposits:", deposits)
    return deposits

def get_withdrawals(account_id):
    withdrawals = requests.get(f"{BASE}/accounts/{account_id}/withdrawals?key={API_KEY}").json()
    print("withdrawals:", withdrawals)
    return withdrawals

def get_purchases(account_id):
    purchases = requests.get(f"{BASE}/accounts/{account_id}/purchases?key={API_KEY}").json()
    print("purchases:", purchases)
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

    # STEP 1: Build graph from all transfers
    graph = defaultdict(list)
    for t in all_transfers:
        if "payer_id" in t and "payee_id" in t and "amount" in t:
            graph[t["payer_id"]].append((t["payee_id"], float(t["amount"])))

    flagged_accounts = set()

    # STEP 2: DFS starting from the given transfer
    def dfs(path, visited, origin, amount_to_match):
        current = path[-1]
        if len(path) > 4 and current == origin:
            return path  # valid cycle

        for neighbor, amt in graph[current]:
            if neighbor in visited:
                continue
            if amt != amount_to_match:
                continue

            new_path = path + [neighbor]
            print("visited | neighbor is :", visited | {neighbor})
            cycle = dfs(new_path, visited | {neighbor}, origin, amount_to_match)
            if cycle:
                return cycle

        return None

    # Extract start info
    payer = start_transfer.get("payer_id")
    payee = start_transfer.get("payee_id")
    amount = float(start_transfer.get("amount", 0.0))

    if not payer or not payee or amount == 0:
        return [], 0  # Invalid starting transfer

    path = [payer, payee]
    visited = {payee}
    cycle = dfs(path, visited, payer, amount)

    if cycle:
        flagged_accounts.update(cycle[:-1])  # exclude repeated start
    
    return list(flagged_accounts), 3 if flagged_accounts else 0

def main():

    sus = 0
    transfers = get_transfers("67fac5c59683f20dd5194fd3")
    deposits = get_deposits("67fac5c59683f20dd5194fd3")
    withdrawals = get_withdrawals("67fac5c59683f20dd5194fd3")
    purchases = get_purchases("67fac5c59683f20dd5194fd3")
    start_transfer = transfers[-1]
    print(start_transfer)
    customers = requests.get(f"{BASE}/customers?key={API_KEY}").json()
    all_transfers = find_all_transfers(customers)
    flagged_accounts, circular_weight = detect_circular_funds(start_transfer, all_transfers)
    print("flagged accounts:", flagged_accounts)
    print("circular weight:", circular_weight)

    # transaction_ids, rapid_weight = rapid_transfer(transfers, deposits, withdrawals, "67fab94b9683f20dd5194fc1")
    # print("ids:", transaction_ids)
    # print("weight:", rapid_weight)
    #when doing mongodb, if dormant_transaction is not an 
    #empty string then we add it to the list of dormant transactions we have already checked
    # dormant_transaction, dormant_weight = dormant_to_active(transfers, deposits, withdrawals)
    # sus += dormant_weight

if __name__ == "__main__":
    main()