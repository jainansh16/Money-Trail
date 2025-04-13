// moneyTrail.js
// At the very top of server.js

const API_KEY = 'e2891b406c32fa6257f37327a5ed4fe8';
const MONGO_DB_NAME = 'Bitcamp_2025';
const MONGO_COLLECTION = 'Users';
const MONGO_CONNECTION = 'mongodb+srv://ajain316:Gd1r8cMhizZjWb82@cluster0.lg477.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// No need to require dotenv in this case

// ----- Imports & Environment Setup -----
const axios = require('axios');
//const dotenv = require('dotenv');
const { MongoClient, ObjectId } = require('mongodb');

// Load environment variables
//dotenv.config({ path: '/Users/anshjain/Desktop/Money-Trail/credentials/.env' });
//console.log("Loaded API Key:", API_KEY);

const BASE = 'http://api.nessieisreal.com';
const dbName = MONGO_DB_NAME;
const collectionName = MONGO_COLLECTION;
const connectionString = MONGO_CONNECTION;


// Set up MongoDB connection (using the native driver)
const client = new MongoClient(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });
let db, users;  // will be assigned after connecting to MongoDB

// ----- Helper Functions -----

// Random integer helper, equivalent to random_int in Python
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Create a merchant via the API (similar to create_merchant)
async function createMerchant(name, category, city = "New York", state = "NY") {
  try {
    const res = await axios.post(`${BASE}/merchants?key=${API_KEY}`, {
      name,
      category,
      address: {
        street_number: "123",
        street_name: "Main St",
        city,
        state,
        zip: "10001"
      },
      geocode: {
        lat: 40.7128,
        lng: -74.0060
      }
    });
    const merchant = res.data.objectCreated;
    console.log(`Merchant created: ${merchant.name} (ID: ${merchant._id})`);
    return merchant._id;
  } catch (e) {
    console.log("Error creating merchant:", e.message);
    if (e.response) {
      console.log("Full response:", e.response.data);
    }
    return null;
  }
}

// Create several merchants given a list of names and categories
async function createMerchants() {
  const categories = [
    ["Trader Joe's", "Groceries"],
    ["Shell Consulting", "Consulting"]
  ];
  const createdIds = [];
  for (const [name, category] of categories) {
    const merchantId = await createMerchant(name, category);
    if (merchantId) {
      createdIds.push(merchantId);
    }
  }
  return createdIds;
}

// Get a customer's account id via the API
async function getAccountId(customerId) {
  const res = await axios.get(`${BASE}/customers/${customerId}/accounts?key=${API_KEY}`);
  return res.data[0]._id;
}

// Create a customer
async function createCustomer(firstName, lastName, streetNo, streetName, city, state, zipCode) {
  const res = await axios.post(`${BASE}/customers?key=${API_KEY}`, {
    first_name: firstName,
    last_name: lastName,
    address: {
      street_number: streetNo,
      street_name: streetName,
      city,
      state,
      zip: zipCode
    }
  });
  return res.data.objectCreated._id;
}

// Create an account for a customer
async function createAccount(customerId) {
  const res = await axios.post(`${BASE}/customers/${customerId}/accounts?key=${API_KEY}`, {
    type: "Checking",
    nickname: "Hacked Checking",
    rewards: 0,
    balance: 5000
  });
  return res.data.objectCreated._id;
}

// Make a purchase
async function makePurchase(accountId, merchantId, amount, desc) {
  const purchaseDate = new Date().toISOString().split("T")[0];
  await axios.post(`${BASE}/accounts/${accountId}/purchases?key=${API_KEY}`, {
    merchant_id: merchantId,
    medium: "balance",
    purchase_date: purchaseDate,
    amount,
    status: "completed",
    description: desc
  });
}

// Make a deposit
async function makeDeposit(accountId, amount, description = "Standard deposit") {
  const transactionDate = new Date().toISOString().split("T")[0];
  await axios.post(`${BASE}/accounts/${accountId}/deposits?key=${API_KEY}`, {
    medium: "balance",
    amount,
    transaction_date: transactionDate,
    status: "completed",
    description: description
  });
}

// Make a withdrawal
async function makeWithdrawal(accountId, amount, description = "Standard withdrawal") {
  const transactionDate = new Date().toISOString().split("T")[0];
  await axios.post(`${BASE}/accounts/${accountId}/withdrawals?key=${API_KEY}`, {
    medium: "balance",
    amount,
    transaction_date: transactionDate,
    status: "completed",
    description: description
  });
}

// Make a transfer
async function makeTransfer(fromAccountId, toAccountId, amount, description, apiKey = API_KEY, baseUrl = BASE) {
  const transactionDate = new Date().toISOString().split("T")[0];
  const url = `${baseUrl}/accounts/${fromAccountId}/transfers?key=${apiKey}`;
  const payload = {
    medium: "balance",
    payee_id: toAccountId,
    amount,
    transaction_date: transactionDate,
    description
  };
  try {
    await axios.post(url, payload);
    console.log(`✅ Transfer of $${amount} from ${fromAccountId} to ${toAccountId}: ${description}`);
  } catch (e) {
    console.log(`❌ Failed to transfer from ${fromAccountId} to ${toAccountId}: ${e.message}`);
  }
}

// Create customers and accounts then insert user documents into MongoDB
async function createCustomersAndAccounts() {
  const firstNames = ["Alice", "Bob", "Charlie", "David"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown"];
  const customerList = [];
  for (let i = 0; i < firstNames.length; i++) {
    const customerId = await createCustomer(firstNames[i], lastNames[i], "123", "Bitcamp Way", "College Park", "MD", "20740");
    const accountId = await createAccount(customerId);
    customerList.push({
      first_name: firstNames[i],
      last_name: lastNames[i],
      customer_id: customerId
    });
    console.log(`✅ Created account for ${firstNames[i]} ${lastNames[i]} (Customer ID: ${customerId}, Account ID: ${accountId})`);

    const user = {
      _id: accountId,
      customer_id: customerId,
      isFraud: false,
      score: 0,
      rapid: [],
      frequency_transfer: [],
      frequency_purchase: [],
      dormant: [],
      circular: []
    };
    await users.insertOne(user);
  }
  return customerList;
}

// Simulate purchases
async function simulatePurchases(customers, merchants) {
  for (const customer of customers) {
    const accountId = await getAccountId(customer.customer_id);
    const name = customer.first_name;
    // Normal purchases
    for (let i = 0; i < 5; i++) {
      await makePurchase(accountId, merchants[0], randomInt(20, 150), "Groceries");
    }
    // Suspicious purchases for certain names
    if (["Bob", "David"].includes(name)) {
      for (let i = 0; i < 12; i++) {
        await makePurchase(accountId, merchants[1], randomInt(100, 300), "Consulting LLC - Possible shell");
      }
    }
    console.log(`🛒 Purchases simulated for ${name} | Suspicious? ${["Bob", "David"].includes(name) ? 'Yes' : 'No'}`);
  }
}

// Simulate withdrawals (similar structure as simulatePurchases)
async function simulateWithdrawals(customers) {
  for (const customer of customers) {
    const accountId = await getAccountId(customer.customer_id);
    const name = customer.first_name;
    // Normal withdrawals
    for (let i = 0; i < 3; i++) {
      await makeWithdrawal(accountId, randomInt(20, 100), "ATM Withdrawal");
    }
    // Fraudulent behavior for certain users
    if (["Bob", "David"].includes(name)) {
      for (let i = 0; i < 5; i++) {
        await makeWithdrawal(accountId, randomInt(400, 1000), "Suspicious ATM Withdrawal");
      }
    }
    console.log(`🏧 Withdrawals simulated for ${name} | Suspicious? ${["Bob", "David"].includes(name) ? 'Yes' : 'No'}`);
  }
}

// Simulate deposits (similar structure as simulatePurchases)
async function simulateDeposits(customers) {
  for (const customer of customers) {
    const accountId = await getAccountId(customer.customer_id);
    const name = customer.first_name;
    // Normal deposits
    for (let i = 0; i < 2; i++) {
      await makeDeposit(accountId, randomInt(300, 1500), "Direct Deposit");
    }
    // Fraudulent deposits for certain users
    if (["Bob", "David"].includes(name)) {
      for (let i = 0; i < 4; i++) {
        await makeDeposit(accountId, randomInt(5000, 10000), "Offshore Transfer - Investigate");
      }
    }
    console.log(`🏦 Deposits simulated for ${name} | Suspicious? ${["Bob", "David"].includes(name) ? 'Yes' : 'No'}`);
  }
}

// Simulate transfers between customer pairs
async function simulateTransfers(customerPairs) {
  for (let i = 0; i < customerPairs.length; i++) {
    const [fromCustomer, toCustomer] = customerPairs[i];
    const fromAccount = await getAccountId(fromCustomer.customer_id);
    const toAccount = await getAccountId(toCustomer.customer_id);
    // Normal transfer on odd indices
    if (i % 2 !== 0) {
      await makeTransfer(fromAccount, toAccount, 100, "Monthly Utility Bill");
    }
    // Fraudulent transfer on even indices
    if (i % 2 === 0) {
      await makeTransfer(fromAccount, toAccount, 1000, "Suspicious Large Transfer to Unknown Payee");
    }
  }
}

// ----- API Query Functions -----

async function getTransfers(accountId) {
  const res = await axios.get(`${BASE}/accounts/${accountId}/transfers?key=${API_KEY}`);
  return res.data;
}

async function getDeposits(accountId) {
  const res = await axios.get(`${BASE}/accounts/${accountId}/deposits?key=${API_KEY}`);
  return res.data;
}

async function getWithdrawals(accountId) {
  const res = await axios.get(`${BASE}/accounts/${accountId}/withdrawals?key=${API_KEY}`);
  return res.data;
}

async function getPurchases(accountId) {
  const res = await axios.get(`${BASE}/accounts/${accountId}/purchases?key=${API_KEY}`);
  return res.data;
}

async function getAccounts(customerId) {
  const res = await axios.get(`${BASE}/customers/${customerId}/accounts?key=${API_KEY}`);
  return res.data;
}

// ----- Suspicion-Detection Functions -----

// Rapid transfer: merge transactions, sort by date, and check conditions
function rapidTransfer(transfers, deposits, withdrawals, accountId) {
  deposits.forEach(txn => txn.type = "deposit");
  withdrawals.forEach(txn => txn.type = "withdrawal");
  transfers.forEach(txn => {
    txn.type = "transfer";
    if (txn.payer_id === accountId) {
      txn.direction = "outgoing";
    } else if (txn.payee_id === accountId) {
      txn.direction = "incoming";
    }
  });
  
  let allTxns = [...deposits, ...withdrawals, ...transfers];
  if (allTxns.length === 0) return { transactionIds: [], weight: 0 };
  
  allTxns.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
  const latestDate = allTxns[allTxns.length - 1].transaction_date;
  const sameDayTxns = allTxns.filter(txn => txn.transaction_date === latestDate);
  
  let incomingTotal = 0, outgoingTotal = 0;
  sameDayTxns.forEach(txn => {
    const amt = parseFloat(txn.amount || 0);
    if (txn.type === "deposit") {
      incomingTotal += amt;
    } else if (txn.type === "withdrawal") {
      outgoingTotal += amt;
    } else if (txn.type === "transfer") {
      if (txn.direction === "incoming") incomingTotal += amt;
      else if (txn.direction === "outgoing") outgoingTotal += amt;
    }
  });
  
  if (incomingTotal >= 5000 && incomingTotal === outgoingTotal) {
    const transactionIds = sameDayTxns.map(txn => txn._id);
    return { transactionIds, weight: 3 };
  }
  return { transactionIds: [], weight: 0 };
}

// High-frequency transactions detection
function highFrequency(transfers, purchases) {
  let highFreqWeight = 0;
  let transferIds = [];
  let purchaseIds = [];
  let transfersCaught = false, purchasesCaught = false;
  
  if (transfers.length > 4) {
    const currentTransfers = transfers.slice(-5);
    const latestDate = new Date(currentTransfers[currentTransfers.length - 1].transaction_date);
    const earliestDate = new Date(currentTransfers[0].transaction_date);
    if (latestDate.getTime() === earliestDate.getTime()) {
      let count = 0;
      currentTransfers.forEach(transfer => {
        if (parseFloat(transfer.amount || 0) >= 1000) count++;
      });
      if (count === 5) {
        transfersCaught = true;
        highFreqWeight += 2;
      }
    }
    if (transfersCaught) transferIds = currentTransfers.map(t => t._id);
  }
  
  if (purchases.length > 4) {
    const currentPurchases = purchases.slice(-5);
    const latestDate = new Date(currentPurchases[currentPurchases.length - 1].transaction_date);
    const earliestDate = new Date(currentPurchases[0].transaction_date);
    if (latestDate.getTime() === earliestDate.getTime()) {
      let count = 0;
      currentPurchases.forEach(purchase => {
        if (parseFloat(purchase.amount || 0) >= 2000) count++;
      });
      if (count === 5) {
        purchasesCaught = true;
        highFreqWeight += 2;
      }
    }
    if (purchasesCaught) purchaseIds = currentPurchases.map(p => p._id);
  }
  
  return { transferIds, purchaseIds, highFreqWeight };
}

// Detect dormant-to-active behavior
function dormantToActive(transfers, deposits, withdrawals) {
  const dormantWeight = 2;
  let transactions = [...transfers, ...deposits, ...withdrawals];
  if (transactions.length <= 1) return { transactionId: "", weight: 0 };

  transactions.sort((a, b) => new Date(a.transaction_date) - new Date(b.transaction_date));
  const latest = transactions[transactions.length - 1];
  const secondLatest = transactions[transactions.length - 2];
  const latestDate = new Date(latest.transaction_date);
  const secondLatestDate = new Date(secondLatest.transaction_date);
  const daysDiff = (latestDate - secondLatestDate) / (1000 * 3600 * 24);
  const latestAmount = parseFloat(latest.amount || 0);
  const latestType = latest.type || "";

  if (daysDiff >= 30 && ["deposit", "p2p", "withdrawal"].includes(latestType) && latestAmount >= 1000) {
    return { transactionId: latest._id, weight: dormantWeight };
  }
  return { transactionId: "", weight: 0 };
}

// Find all transfers across all accounts for a list of customers
async function findAllTransfers(customers) {
  const fromAccountTransfers = [];
  for (const customer of customers) {
    const accounts = await getAccounts(customer._id);
    for (const acct of accounts) {
      const transfers = await getTransfers(acct._id);
      transfers.forEach(t => {
        if (t.payer_id && t.payee_id && t.amount) {
          fromAccountTransfers.push({
            _id: t._id,
            payer_id: t.payer_id,
            payee_id: t.payee_id,
            amount: parseFloat(t.amount),
            transaction_date: t.transaction_date || null
          });
        }
      });
    }
  }
  return fromAccountTransfers;
}

// Detect circular funds using DFS on a transaction graph
function detectCircularFunds(startTransfer, allTransfers) {
  const graph = {};
  allTransfers.forEach(t => {
    if (t.payer_id && t.payee_id && t.amount && t._id) {
      if (!graph[t.payer_id]) graph[t.payer_id] = [];
      graph[t.payer_id].push({
        payee_id: t.payee_id,
        amount: parseFloat(t.amount),
        transaction_id: t._id
      });
    }
  });

  function dfs(accountPath, txnPath, visited, origin, amountToMatch) {
    const current = accountPath[accountPath.length - 1];
    if (accountPath.length > 4 && current === origin) return txnPath;
    if (!graph[current]) return null;
    for (const edge of graph[current]) {
      const neighbor = edge.payee_id;
      if (visited.has(neighbor)) continue;
      if (edge.amount !== amountToMatch) continue;
      const newAccountPath = [...accountPath, neighbor];
      const newTxnPath = [...txnPath, edge.transaction_id];
      const newVisited = new Set(visited);
      newVisited.add(neighbor);
      const cycle = dfs(newAccountPath, newTxnPath, newVisited, origin, amountToMatch);
      if (cycle) return cycle;
    }
    return null;
  }
  const payer = startTransfer.payer_id;
  const payee = startTransfer.payee_id;
  const amount = parseFloat(startTransfer.amount || 0);
  const startTxnId = startTransfer._id;
  if (!payer || !payee || !startTxnId || amount === 0) return { cycleTxnIds: [], weight: 0 };

  const accountPath = [payer, payee];
  const txnPath = [startTxnId];
  const visited = new Set([payee]);
  const cycleTxnIds = dfs(accountPath, txnPath, visited, payer, amount);
  if (cycleTxnIds) return { cycleTxnIds, weight: 3 };
  else return { cycleTxnIds: [], weight: 0 };
}

// ----- Main Function -----

async function main() {
  try {
    await client.connect();
    db = client.db(dbName);
    users = db.collection(collectionName);

    const accountId = '67fac5c59683f20dd5194fd3';
    let doc = await users.findOne({ _id: accountId });
    let sus = doc.score;

    const transfers = await getTransfers(accountId);
    const deposits = await getDeposits(accountId);
    const withdrawals = await getWithdrawals(accountId);
    const purchases = await getPurchases(accountId);

    // Dormant detection
    const { transactionId: dormantId, weight: dormantWeight } = dormantToActive(transfers, deposits, withdrawals);
    if (doc && dormantId) {
      const existingDormant = doc.dormant || [];
      if (!existingDormant.includes(dormantId)) {
        await users.updateOne({ _id: doc._id }, { $push: { dormant: dormantId } });
        sus += dormantWeight;
      }
    }

    // High frequency detection
    const { transferIds: frequencyTransferIds, purchaseIds: frequencyPurchaseIds } = highFrequency(transfers, purchases);
    if (doc && frequencyTransferIds.length > 0) {
      let retrievedUser = await users.findOne({ _id: accountId });
      let existingTransfers = retrievedUser.frequency_transfer || [];
      const tempList = frequencyTransferIds.map(fId => !existingTransfers.includes(fId));
      if (tempList.every(v => v)) {
        await users.updateOne({ _id: doc._id }, { $push: { frequency_transfer: { $each: frequencyTransferIds } } });
        sus += 2;
      }
    }
    if (doc && frequencyPurchaseIds.length > 0) {
      let retrievedUser = await users.findOne({ _id: accountId });
      let existingPurchases = retrievedUser.frequency_purchase || [];
      const tempList = frequencyPurchaseIds.map(fId => !existingPurchases.includes(fId));
      if (tempList.every(v => v)) {
        await users.updateOne({ _id: doc._id }, { $push: { frequency_purchase: { $each: frequencyPurchaseIds } } });
        sus += 2;
      }
    }

    // Rapid transfers
    const { transactionIds: rapidTransactionIds, weight: rapidWeight } = rapidTransfer(transfers, deposits, withdrawals, accountId);
    if (doc && rapidTransactionIds.length > 0) {
      let retrievedUser = await users.findOne({ _id: accountId });
      let existingRapid = retrievedUser.rapid || [];
      const tempList = rapidTransactionIds.map(rId => !existingRapid.includes(rId));
      if (tempList.every(v => v)) {
        await users.updateOne({ _id: doc._id }, { $push: { rapid: { $each: rapidTransactionIds } } });
        sus += rapidWeight;
      }
    }

    if (sus > 10) sus = 10;
    console.log("sus is ", sus);
    await users.updateOne({ _id: doc._id }, { $set: { score: sus } });
    if (sus >= 7) {
      await users.updateOne({ _id: doc._id }, { $set: { isFraud: true } });
    }

    // Circular funds detection
    const startTransfer = transfers[transfers.length - 1];
    const customersRes = await axios.get(`${BASE}/customers?key=${API_KEY}`);
    const customers = customersRes.data;
    const allTransfers = await findAllTransfers(customers);
    const { cycleTxnIds: circularTransactions, weight: circularWeight } = detectCircularFunds(startTransfer, allTransfers);
    console.log("flagged transactions:", circularTransactions);
    console.log("circular weight:", circularWeight);

    if (circularTransactions.length > 0) {
      let circularAccounts = [];
      for (const transferId of circularTransactions) {
        const txnRes = await axios.get(`${BASE}/transfers/${transferId}?key=${API_KEY}`);
        circularAccounts.push(txnRes.data.payer_id);
      }
      for (const account of circularAccounts) {
        let retrievedUser = await users.findOne({ _id: account });
        let existingCircular = retrievedUser.circular || [];
        const tempList = circularTransactions.map(cId => !existingCircular.includes(cId));
        if (tempList.every(v => v)) {
            await users.updateOne({ _id: account }, { $push: { circular: circularTransactions } });
            let score = retrievedUser.score;
          score += circularWeight;
          if (score > 10) score = 10;
          await users.updateOne({ _id: account }, { $set: { score: score } });
          if (score >= 7) {
            await users.updateOne({ _id: account }, { $set: { isFraud: true } });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in main execution:", error);
  } finally {
    await client.close();
  }
}

// ----- Execute Main -----
main();

