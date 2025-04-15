// // server.js
// // This version includes base functionality AND refined fraud detection logic based on user criteria.

// // --- Hardcoded Configuration ---
// const API_KEY = 'e2891b406c32fa6257f37327a5ed4fe8'; // Consider moving to environment variables
// const MONGO_DB_NAME = 'Bitcamp_2025';
// const MONGO_COLLECTION = 'Users';
// const FRAUD_EVENTS_COLLECTION = 'fraudEvents'; // Collection for logging events
// const MONGO_CONNECTION =
//   'mongodb+srv://ajain316:Gd1r8cMhizZjWb82@cluster0.lg477.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Consider moving to environment variables

// const BASE = 'http://api.nessieisreal.com';

// // --- Imports ---
// const express = require('express');
// const cors = require('cors');
// const bodyParser = require('body-parser');
// const axios = require('axios');
// const { MongoClient } = require('mongodb');
// const { ObjectId } = require('mongodb'); // Keep ObjectId in case needed later

// // --- Setup MongoDB Connection ---
// const client = new MongoClient(MONGO_CONNECTION);
// let db, users, fraudEvents; // Added fraudEvents collection variable

// // --- Nessie API Helper Functions ---

// async function createCustomer(firstName, lastName) {
//   const url = `${BASE}/customers?key=${API_KEY}`;
//   console.log(`[Nessie Call] POST ${url}`);
//   const res = await axios.post(url, {
//     first_name: firstName,
//     last_name: lastName,
//     address: { street_number: '123', street_name: 'Bitcamp Way', city: 'College Park', state: 'MD', zip: '20740' },
//   });
//   console.log(`[Nessie Call] POST ${url} - SUCCESS`);
//   return res.data.objectCreated._id;
// }

// async function createAccount(customerId) {
//   const url = `${BASE}/customers/${customerId}/accounts?key=${API_KEY}`;
//    console.log(`[Nessie Call] POST ${url}`);
//   const res = await axios.post(url, { type: 'Checking', nickname: 'Primary Checking', rewards: 0, balance: 5000 });
//    console.log(`[Nessie Call] POST ${url} - SUCCESS`);
//   return res.data.objectCreated._id;
// }

// async function makeDeposit(accountId, amount) {
//   const transactionDate = new Date().toISOString().split('T')[0];
//   const url = `${BASE}/accounts/${accountId}/deposits?key=${API_KEY}`;
//   console.log(`[Nessie Call] POST ${url} - Amount: ${amount}`);
//   await axios.post(url, { medium: 'balance', amount: Number(amount), transaction_date: transactionDate, status: 'completed', description: 'Direct Deposit' });
//   console.log(`[Nessie Call] POST ${url} - SUCCESS`);
//   return { message: 'Deposit completed' };
// }

// async function makeWithdrawal(accountId, amount) {
//   const transactionDate = new Date().toISOString().split('T')[0];
//   const url = `${BASE}/accounts/${accountId}/withdrawals?key=${API_KEY}`;
//    console.log(`[Nessie Call] POST ${url} - Amount: ${amount}`);
//   await axios.post(url, { medium: 'balance', amount: Number(amount), transaction_date: transactionDate, status: 'completed', description: 'Withdrawal' });
//   console.log(`[Nessie Call] POST ${url} - SUCCESS`);
//   return { message: 'Withdrawal completed' };
// }

// // Modified to return transferId needed for circular check trigger
// async function makeTransfer(fromAccountId, toAccountId, amount) {
//   const transactionDate = new Date().toISOString().split('T')[0];
//   const url = `${BASE}/accounts/${fromAccountId}/transfers?key=${API_KEY}`;
//   console.log(`[Nessie Call] POST ${url} - Amount: ${amount} To: ${toAccountId}`);
//   const payload = { medium: 'balance', payee_id: toAccountId, amount: Number(amount), transaction_date: transactionDate, description: 'Transfer' };
//   const response = await axios.post(url, payload);
//   console.log(`[Nessie Call] POST ${url} - SUCCESS`);
//   return { message: 'Transfer completed', transferId: response.data?.objectCreated?._id };
// }


// // Helper function to fetch transaction data from Nessie API (with debug logging)
// async function fetchNessieData(url) {
//   console.log(`[Debug] Fetching Nessie data from: ${url}`); // Log URL being fetched
//   try {
//     const response = await axios.get(url);
//     const data = response.data;
//     // Ensure response is always an array, even if Nessie returns single object or nothing
//     const dataArray = Array.isArray(data) ? data : (data ? [data] : []);
//     console.log(`[Debug] SUCCESS fetching ${url}. Count: ${dataArray.length}`); // Log success and count
//     return { status: 'fulfilled', value: dataArray }; // Return array
//   } catch (error) {
//     // Log Nessie API errors but don't crash the whole request
//     const errorData = error.response?.data || error.message;
//     // Handle 404 specifically - means no transactions of this type, not a server error
//     if (error.response && error.response.status === 404) {
//         console.log(`[Debug] INFO fetching ${url}: 404 Not Found (No transactions of this type).`);
//         return { status: 'fulfilled', value: [] }; // Treat 404 as success with empty array
//     } else {
//         console.error(`[Debug] FAILURE fetching ${url}:`, JSON.stringify(errorData)); // Log failure details
//         return { status: 'rejected', reason: errorData }; // Propagate other errors
//     }
//   }
// }


// // --- Fraud Detection Logic (Refined based on User Criteria) ---

// // Helper to parse date string safely
// function parseDate(dateString) {
//     try { return new Date(dateString); } catch (e) { return null; }
// }

// // Detects rapid deposit/withdrawal cycles on the same day
// // Criteria: Deposit/Transfer In >= $5000, same day outflow returns balance. Weight: 3
// async function detectRapidTransfer(accountId, deposits, withdrawals, transfers) {
//     const allTxns = [
//         ...deposits.map(t => ({ ...t, type: 'deposit' })),
//         ...withdrawals.map(t => ({ ...t, type: 'withdrawal' })),
//         ...transfers.map(t => ({ ...t, type: 'transfer', direction: t.payer_id === accountId ? 'outgoing' : (t.payee_id === accountId ? 'incoming' : null) }))
//     ];
//     if (!allTxns || allTxns.length === 0) return { ids: [], weight: 0 };
//     allTxns.sort((a, b) => parseDate(b.transaction_date) - parseDate(a.transaction_date));
//     const latestDateStr = allTxns[0].transaction_date;
//     if (!latestDateStr) return { ids: [], weight: 0 }; // Need a date to check
//     const sameDayTxns = allTxns.filter(txn => txn.transaction_date === latestDateStr);
//     let incomingTotal = 0, outgoingTotal = 0;
//     const transactionIds = [];
//     for (const txn of sameDayTxns) {
//         const amt = parseFloat(txn.amount || 0);
//         if (isNaN(amt)) continue;
//         transactionIds.push(txn._id);
//         if (txn.type === 'deposit' || (txn.type === 'transfer' && txn.direction === 'incoming')) { incomingTotal += amt; }
//         else if (txn.type === 'withdrawal' || (txn.type === 'transfer' && txn.direction === 'outgoing')) { outgoingTotal += amt; }
//     }
//     // Check if inflow >= 5000 and inflow equals outflow
//     if (incomingTotal >= 5000 && incomingTotal > 0 && incomingTotal === outgoingTotal) { // Ensure some activity occurred
//         console.log(`[Fraud Check] Rapid Transfer detected for account ${accountId}. In: ${incomingTotal}, Out: ${outgoingTotal}`);
//         return { ids: transactionIds, weight: 3 }; // Return all involved same-day txn IDs
//     }
//     return { ids: [], weight: 0 };
// }

// // Detects high frequency transfers
// // Criteria: 5 or more transfers on the same day (check last 5 transfers). Weight: 2
// async function detectHighFrequency(accountId, transfers) { // Only checks transfers now
//     let weight = 0;
//     const transferIds = [];

//     if (transfers && transfers.length >= 5) {
//         // Sort newest first to easily get the last 5
//         transfers.sort((a, b) => parseDate(b.transaction_date) - parseDate(a.transaction_date));
//         const recentTransfers = transfers.slice(0, 5);
//         const firstDate = recentTransfers[0].transaction_date;
//         const lastDate = recentTransfers[4].transaction_date;

//         // Check if the 1st and 5th most recent transfers occurred on the same date
//         if (firstDate && firstDate === lastDate) { // Ensure dates are valid
//             console.log(`[Fraud Check] High Frequency Transfers detected for account ${accountId} (5+ on same day: ${firstDate}).`);
//             weight = 2; // Assign weight if condition met
//             recentTransfers.forEach(t => transferIds.push(t._id)); // Collect IDs of the 5 transfers
//         }
//     }
//     // Return only transfer related info
//     // Note: weight is 0 if condition not met, transferIds is empty
//     return { transferIds, weight };
// }

// // Detects large transaction after a period of dormancy
// // Criteria: Last txn >= 30 days ago, new txn (dep/wd/trans) >= $1000. Weight: 2
// async function detectDormantToActive(accountId, deposits, withdrawals, transfers) {
//     const allTxns = [
//         ...deposits.map(t => ({ ...t, type: 'deposit' })),
//         ...withdrawals.map(t => ({ ...t, type: 'withdrawal' })),
//         ...transfers.map(t => ({ ...t, type: 'transfer' })) // Use simple type 'transfer'
//     ];
//      if (!allTxns || allTxns.length < 2) return { id: null, weight: 0 };
//      // Sort oldest to newest by date
//      allTxns.sort((a, b) => parseDate(a.transaction_date) - parseDate(b.transaction_date));

//      const latest = allTxns[allTxns.length - 1];
//      const secondLatest = allTxns[allTxns.length - 2];

//      const latestDate = parseDate(latest.transaction_date);
//      const secondLatestDate = parseDate(second_latest.transaction_date);
//      const latestAmount = parseFloat(latest.amount || 0);
//      // Check if the latest transaction is one of the relevant types
//      const isRelevantType = ['deposit', 'withdrawal', 'transfer', 'p2p'].includes(latest.type?.toLowerCase()); // Nessie uses 'p2p' for transfers sometimes

//      if (!latestDate || !secondLatestDate || isNaN(latestAmount)) return { id: null, weight: 0 }; // Basic data validation

//      const daysDiff = (latestDate - secondLatestDate) / (1000 * 60 * 60 * 24);

//      // Check dormancy condition (>= 30 days) and activity condition (relevant type and >= $1000)
//      if (daysDiff >= 30 && isRelevantType && latestAmount >= 1000) {
//          console.log(`[Fraud Check] Dormant to Active detected for account ${accountId}. Days Diff: ${daysDiff.toFixed(1)}, Amount: ${latestAmount}`);
//          return { id: latest._id, weight: 2 }; // Return ID of the triggering transaction
//      }
//      return { id: null, weight: 0 };
// }

// // --- Circular Funds Detection Logic ---
// // Fetches ALL transfers from ALL known accounts (Potentially Slow!)
// async function fetchAllNessieTransfers() {
//     console.log('[Circular Check] Fetching all customer accounts from Nessie...');
//     let allAccounts = [];
//     try {
//         const customersResponse = await axios.get(`${BASE}/customers?key=${API_KEY}`);
//         const customerIds = customersResponse.data.map(c => c._id);
//         const accountPromises = customerIds.map(custId =>
//             axios.get(`${BASE}/customers/${custId}/accounts?key=${API_KEY}`)
//                  .then(res => res.data).catch(err => { console.error(`Failed to get accounts for customer ${custId}:`, err.message); return []; })
//         );
//         const accountsNested = await Promise.all(accountPromises);
//         allAccounts = accountsNested.flat();
//         console.log(`[Circular Check] Found ${allAccounts.length} total accounts.`);
//     } catch (error) { console.error('[Circular Check] Failed to fetch all customer accounts:', error.response?.data || error.message); return []; }
//     if (allAccounts.length === 0) return [];
//     console.log('[Circular Check] Fetching transfers for all accounts...');
//     const transferPromises = allAccounts.map(acc => fetchNessieData(`${BASE}/accounts/${acc._id}/transfers?key=${API_KEY}`));
//     const results = await Promise.allSettled(transferPromises);
//     let allTransfers = [];
//     results.forEach(result => { if (result.status === 'fulfilled' && result.value.status === 'fulfilled') { allTransfers = allTransfers.concat(result.value.value); } });
//     console.log(`[Circular Check] Fetched ${allTransfers.length} total transfers.`);
//     return allTransfers;
// }
// // Fetches details of a single transfer by its ID
// async function fetchSingleTransfer(transferId) {
//     if (!transferId) return null;
//     console.log(`[Circular Check] Fetching details for transfer ID: ${transferId}`);
//     try { const response = await axios.get(`${BASE}/transfers/${transferId}?key=${API_KEY}`); return response.data; }
//     catch (error) { console.error(`[Circular Check] Failed to fetch transfer ${transferId}:`, error.response?.data || error.message); return null; }
// }

// // Detects circular fund transfers
// // Criteria: >= 4 different accounts, same amount, returns to origin. Weight: 3
// async function detectCircularFunds(startTransfer, allTransfers) {
//   console.log(`[Circular Check] Starting detection based on transfer ID: ${startTransfer?._id}`);
//   const graph = new Map();
//   allTransfers.forEach(t => {
//     if (t && t.payer_id && t.payee_id && t.amount != null && t._id) {
//         const amountNum = parseFloat(t.amount);
//         if (!isNaN(amountNum)) {
//              if (!graph.has(t.payer_id)) { graph.set(t.payer_id, []); }
//              graph.get(t.payer_id).push({ payee_id: t.payee_id, amount: amountNum, transaction_id: t._id });
//         }
//     }
//   });
//   console.log(`[Circular Check] Built graph with ${graph.size} nodes.`);

//   function dfs(accountPath, txnPath, visited, origin, amountToMatch) {
//     const current = accountPath[accountPath.length - 1];
//     if (accountPath.length > 10) { console.log('[Circular Check] DFS path limit reached.'); return null; } // Limit path length

//     const edges = graph.get(current) || [];
//     for (const edge of edges) {
//       const neighbor = edge.payee_id; const amt = edge.amount; const txn_id = edge.transaction_id;
//       if (amt !== amountToMatch) continue; // Amount must match
//       if (neighbor === origin) { // Potential cycle completion
//           const uniqueAccountsInPath = new Set(accountPath);
//           // Check if path involves at least 4 different accounts
//           if (accountPath.length >= 4 && uniqueAccountsInPath.size >= 4) {
//              console.log(`[Circular Check] Cycle found: ${accountPath.join(' -> ')} -> ${neighbor}`);
//              return [...txnPath, txn_id]; // Valid cycle found
//           } else { continue; } // Cycle too short
//       }
//       if (visited.has(neighbor)) continue; // Already visited in this specific path

//       // Recursive call
//       const cycle = dfs([...accountPath, neighbor], [...txnPath, txn_id], new Set([...visited, neighbor]), origin, amountToMatch);
//       if (cycle) return cycle; // Propagate found cycle
//     }
//     return null; // No cycle found
//   }

//   const payer = startTransfer?.payer_id; const payee = startTransfer?.payee_id;
//   const amount = parseFloat(startTransfer?.amount || 0); const start_txn_id = startTransfer?._id;
//   if (!payer || !payee || !start_txn_id || isNaN(amount) || amount === 0) { console.log('[Circular Check] Invalid start transfer data.'); return { ids: [], weight: 0 }; }
//    console.log(`[Circular Check] Starting DFS: Payer=${payer}, Payee=${payee}, Amount=${amount}`);
//   const cycleTxnIds = dfs([payer, payee], [start_txn_id], new Set([payee]), payer, amount);

//   if (cycleTxnIds && cycleTxnIds.length > 0) { console.log(`[Circular Check] Detected cycle transaction IDs: ${cycleTxnIds.join(', ')}`); return { ids: cycleTxnIds, weight: 3 }; }
//   else { console.log('[Circular Check] No cycle detected.'); return { ids: [], weight: 0 }; }
// }

// // --- Combined Fraud Check & DB Update Function (Refined Event Logging) ---
// async function runFraudChecksAndUpdateScore(accountId) {
//      if (!users || !fraudEvents) { console.error("[Fraud Check] MongoDB collections not ready."); return; }
//      console.log(`[Fraud Check] Running standard checks for account: ${accountId}`);
//      try {
//         // Fetch history
//         const endpoints = [ `${BASE}/accounts/${accountId}/deposits?key=${API_KEY}`, `${BASE}/accounts/${accountId}/withdrawals?key=${API_KEY}`, `${BASE}/accounts/${accountId}/transfers?key=${API_KEY}`, `${BASE}/accounts/${accountId}/purchases?key=${API_KEY}` ];
//         const results = await Promise.allSettled(endpoints.map(fetchNessieData));
//         const deposits = results[0].status === 'fulfilled' ? results[0].value.value : [];
//         const withdrawals = results[1].status === 'fulfilled' ? results[1].value.value : [];
//         const transfers = results[2].status === 'fulfilled' ? results[2].value.value : [];
//         const purchases = results[3].status === 'fulfilled' ? results[3].value.value : []; // Keep fetch?

//         // Run checks
//         const rapidResult = await detectRapidTransfer(accountId, deposits, withdrawals, transfers);
//         const frequencyResult = await detectHighFrequency(accountId, transfers); // Use refined version
//         const dormantResult = await detectDormantToActive(accountId, deposits, withdrawals, transfers);

//         const currentUser = await users.findOne({ _id: accountId });
//         if (!currentUser) { console.error(`[Fraud Check] User ${accountId} not found.`); return; }

//         let scoreIncrease = 0;
//         const updates = { $addToSet: {} };
//         const eventsToLog = [];

//         // Process Rapid
//         if (rapidResult.weight > 0 && rapidResult.ids.length > 0) {
//             const existing = currentUser.rapid || [];
//             const alreadyRecorded = existing.some(set => set.length === rapidResult.ids.length && rapidResult.ids.every(id => set.includes(id)) && set.every(id => rapidResult.ids.includes(id)) );
//             if (!alreadyRecorded) {
//                 scoreIncrease += rapidResult.weight; updates.$addToSet.rapid = rapidResult.ids;
//                 const message = `Rapid Transfer detected for account ${accountId}.`;
//                 console.log(`[Fraud Check] ${message}`);
//                 eventsToLog.push({ timestamp: new Date(), accountId, flagType: 'Rapid Transfer', message, transactionIds: rapidResult.ids });
//             } else { console.log(`[Fraud Check] Rapid Transfer event already recorded.`); }
//         }
//         // Process High Freq Transfer
//          if (frequencyResult.weight > 0 && frequencyResult.transferIds.length > 0) {
//              const existing = currentUser.frequency_transfer || [];
//              const alreadyRecorded = existing.some(set => set.length === frequencyResult.transferIds.length && frequencyResult.transferIds.every(id => set.includes(id)) && set.every(id => frequencyResult.transferIds.includes(id)));
//              if (!alreadyRecorded) {
//                  scoreIncrease += frequencyResult.weight; updates.$addToSet.frequency_transfer = frequencyResult.transferIds;
//                  const message = `High Frequency Transfers detected for account ${accountId}.`;
//                  console.log(`[Fraud Check] ${message}`);
//                  eventsToLog.push({ timestamp: new Date(), accountId, flagType: 'High Frequency Transfer', message, transactionIds: frequencyResult.transferIds });
//              } else { console.log(`[Fraud Check] High Freq Transfer event already recorded.`); }
//         }
//         // Process Dormant
//         if (dormantResult.weight > 0 && dormantResult.id) {
//             if (!currentUser.dormant || !currentUser.dormant.includes(dormantResult.id)) {
//                 scoreIncrease += dormantResult.weight;
//                 // Use $addToSet for single ID to prevent duplicates if called multiple times before DB updates fully
//                 updates.$addToSet.dormant = dormantResult.id;
//                 const message = `Dormant to Active detected for account ${accountId}.`;
//                 console.log(`[Fraud Check] ${message}`);
//                  eventsToLog.push({ timestamp: new Date(), accountId, flagType: 'Dormant to Active', message, transactionIds: [dormantResult.id] });
//             } else {
//                  console.log(`[Fraud Check] Dormant to Active event already recorded.`);
//                  delete updates.$addToSet.dormant; // Remove from update if already present
//             }
//         }

//         // Apply updates to User collection & Log Events
//         if (scoreIncrease > 0) {
//             const currentScore = currentUser.score || 0;
//             let newScore = currentScore + scoreIncrease; newScore = Math.min(newScore, 10);
//             const updateOps = { $set: { score: newScore } };
//             if (Object.keys(updates.$addToSet).length > 0) { updateOps.$addToSet = updates.$addToSet; }
//             if (newScore >= 7) { updateOps.$set.isFraud = true; }
//             console.log(`[Fraud Check] Updating score for ${accountId}: ${currentScore} -> ${newScore}`);
//             await users.updateOne({ _id: accountId }, updateOps);
//             console.log(`[DB] Updated score/flags for account ${accountId}.`);

//             // Log detected events to fraudEvents collection
//             if (eventsToLog.length > 0) {
//                 console.log(`[DB] Logging ${eventsToLog.length} fraud events for account ${accountId}.`);
//                 try { await fraudEvents.insertMany(eventsToLog); console.log(`[DB] Successfully logged fraud events.`); }
//                 catch (logError) { console.error(`[DB] Error logging fraud events for account ${accountId}:`, logError); }
//             }
//         } else { console.log(`[Fraud Check] No new standard flags detected for account ${accountId}. Score remains ${currentUser.score}.`); }

//      } catch (error) { console.error(`[Fraud Check] Error during standard fraud checks for account ${accountId}:`, error); }
// }


// // --- Express App Setup ---
// const app = express();
// app.use(cors());
// app.use(bodyParser.json());
// app.get('/', (req, res) => { res.json({ message: 'Server is running!' }); });


// // --- API Endpoints ---
// app.post('/api/createCustomer', async (req, res) => {
//     try {
//       const { firstName, lastName } = req.body;
//       if (!firstName || !lastName) return res.status(400).json({ message: 'Missing customer name' });
//       const customerId = await createCustomer(firstName, lastName);
//       const accountId = await createAccount(customerId);
//       const user = {
//         _id: accountId, customer_id: customerId, first_name: firstName, last_name: lastName,
//         isFraud: false, score: 0, rapid: [], frequency_transfer: [], frequency_purchase: [], dormant: [], circular: [],
//       };
//       await users.insertOne(user);
//       console.log(`[DB] Inserted user for ${firstName} ${lastName} with _id: ${accountId}`);
//       res.status(201).json({ message: `Created account for ${firstName} ${lastName}`, accountId });
//     } catch (error) {
//       console.error('Error in /api/createCustomer:', error.response?.data || error.message || error);
//       res.status(500).json({ message: 'Error creating customer', error: error.message });
//     }
// });

// app.post('/api/transaction', async (req, res) => {
//     let accountIdForCheck = null;
//     try {
//       const { firstName, lastName, amount, type } = req.body;
//       const numericAmount = parseFloat(amount);
//       if (isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: 'Invalid amount.' });
//       const user = await users.findOne({ first_name: firstName, last_name: lastName });
//       if (!user) return res.status(404).json({ message: 'User not found' });
//       accountIdForCheck = user._id;
//       if (!type || (type !== 'deposit' && type !== 'withdraw' && type !== 'payment')) return res.status(400).json({ message: 'Invalid transaction type.' });
//       if (!amount) return res.status(400).json({ message: 'Missing amount.' });

//       let result = (type === 'deposit') ? await makeDeposit(accountIdForCheck, numericAmount) : await makeWithdrawal(accountIdForCheck, numericAmount);

//       // Run Fraud Checks Asynchronously
//       if (accountIdForCheck) { runFraudChecksAndUpdateScore(accountIdForCheck).catch(err => console.error(`[Error] Post-transaction fraud check failed for ${accountIdForCheck}:`, err)); }

//       res.status(200).json(result);
//     } catch (error) {
//       console.error('Transaction error:', error.response?.data || error.message || error);
//       res.status(500).json({ message: 'Transaction error', error: error.message, nessie_message: error.response?.data?.message });
//     }
// });

// app.post('/api/transfer', async (req, res) => {
//     let fromAccountIdForCheck = null;
//     let toAccountIdForCheck = null;
//     let createdTransferId = null;
//     try {
//       const { fromCustomer, toCustomer, amount } = req.body;
//       const numericAmount = parseFloat(amount);
//       if (isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: 'Invalid amount.' });
//       if (!fromCustomer?.firstName || !fromCustomer?.lastName || !toCustomer?.firstName || !toCustomer?.lastName || !amount) {
//            return res.status(400).json({ message: 'Missing required fields.' });
//       }
//       const fromUser = await users.findOne({ first_name: fromCustomer.firstName, last_name: fromCustomer.lastName });
//       const toUser = await users.findOne({ first_name: toCustomer.firstName, last_name: toCustomer.lastName });
//       if (!fromUser || !toUser) {
//           let message = !fromUser ? 'Sender not found.' : 'Recipient not found.';
//           if (!fromUser && !toUser) message = 'Sender and recipient not found.';
//           return res.status(404).json({ message: message });
//       }
//       fromAccountIdForCheck = fromUser._id;
//       toAccountIdForCheck = toUser._id;

//       const result = await makeTransfer(fromAccountIdForCheck, toAccountIdForCheck, numericAmount);
//       createdTransferId = result.transferId; // Capture ID returned by updated makeTransfer

//        // Run Standard Fraud Checks for Sender
//        if (fromAccountIdForCheck) { runFraudChecksAndUpdateScore(fromAccountIdForCheck).catch(err => console.error(`[Error] Post-transfer(sender) fraud check failed for ${fromAccountIdForCheck}:`, err)); }
//        // if (toAccountIdForCheck) { runFraudChecksAndUpdateScore(toAccountIdForCheck).catch(...) } // Optional check for recipient

//        // Trigger Circular Check Asynchronously
//        if (createdTransferId) {
//             console.log(`[API /api/transfer] Triggering circular check for transfer ID: ${createdTransferId}`);
//             const port = process.env.PORT || 3000; // Ensure port is correctly determined
//             const checkUrl = `http://localhost:${port}/api/runCircularCheck/${createdTransferId}`;
//             console.log(`[API /api/transfer] Attempting to POST to trigger circular check: ${checkUrl}`); // Log URL
//             axios.post(checkUrl)
//                  .catch(err => {
//                      const errorMsg = err.response ? `Status ${err.response.status}: ${err.message}` : err.message;
//                      console.error(`[Error] Failed to trigger circular check for transfer ${createdTransferId}: ${errorMsg}`);
//                  });
//        }

//       res.status(200).json({ message: result.message }); // Respond with original message

//     } catch (error) {
//       console.error('Transfer error:', error.response?.data || error.message || error);
//       res.status(500).json({ message: 'Transfer error', error: error.message, nessie_message: error.response?.data?.message });
//     }
// });

// app.get('/api/getAccounts', async (req, res) => {
//   // Added logging kept for debugging
//   console.log('[API /api/getAccounts] Request received.');
//   try {
//     if (!users) return res.status(500).json({ message: 'Database connection not ready' });
//     console.log('[API /api/getAccounts] Attempting to query database...');
//     const accountsFromDb = await users.find({}).project({ _id: 1, first_name: 1, last_name: 1, score: 1 }).toArray();
//     console.log(`[API /api/getAccounts] Database query completed. Found ${accountsFromDb ? accountsFromDb.length : 'null/undefined'} accounts.`);
//     console.log('[API /api/getAccounts] Sending response...');
//     res.status(200).json(accountsFromDb);
//     console.log('[API /api/getAccounts] Response sent.');
//   } catch (error) {
//     console.error('[API /api/getAccounts] Error fetching accounts:', error);
//     if (!res.headersSent) { res.status(500).json({ message: 'Error fetching accounts from database', error: error.message }); }
//   }
// });

// app.get('/api/getAccount/:id', async (req, res) => {
//   const accountId = req.params.id;
//   // Removed most debug logging for cleaner version, kept basic entry log
//   console.log(`[API /api/getAccount] Request received for ${accountId}`);
//   try {
//     if (!accountId) return res.status(400).json({ message: 'Account ID parameter is required.' });
//     if (!users) return res.status(500).json({ message: 'Database connection not ready' });

//     // 1. Fetch account details from MongoDB
//     const accountDetails = await users.findOne({ _id: accountId });
//     if (!accountDetails) return res.status(404).json({ message: `Account not found with ID: ${accountId}` });

//     // 2. Fetch transactions from Nessie API concurrently
//     const transactionEndpoints = [ `${BASE}/accounts/${accountId}/deposits?key=${API_KEY}`, `${BASE}/accounts/${accountId}/withdrawals?key=${API_KEY}`, `${BASE}/accounts/${accountId}/transfers?key=${API_KEY}`, `${BASE}/accounts/${accountId}/purchases?key=${API_KEY}` ];
//     const results = await Promise.allSettled(transactionEndpoints.map(fetchNessieData));
//     let combinedTransactions = [];

//     // Process results (same logic as before, without debug logs)
//     results.forEach((result, index) => {
//         if (result.status === 'fulfilled') {
//             const nessieResult = result.value;
//             if (nessieResult.status === 'fulfilled' && Array.isArray(nessieResult.value)) {
//                 const transactionsArray = nessieResult.value;
//                 if (transactionsArray.length > 0) {
//                     let baseType = ['Deposit', 'Withdrawal', 'Transfer', 'Purchase'][index];
//                     transactionsArray.forEach(t => {
//                         let processedTransaction = { ...t };
//                         if (baseType === 'Transfer') { const isOutgoing = t.payer_id === accountId; processedTransaction.type = isOutgoing ? 'Transfer Out' : 'Transfer In'; processedTransaction.partner_id = isOutgoing ? t.payee_id : t.payer_id; }
//                         else if (baseType === 'Purchase') { processedTransaction.type = 'Purchase'; processedTransaction.partner_id = t.merchant_id; }
//                         else { processedTransaction.type = baseType; }
//                         combinedTransactions.push(processedTransaction);
//                     });
//                 }
//             } else if (nessieResult.status === 'rejected') { console.error(`Nessie fetch error for index ${index}: ${JSON.stringify(nessieResult.reason)}`); }
//         } else { console.error(`Promise rejected for index ${index}: ${JSON.stringify(result.reason)}`); }
//     });

//     // 3. Sort transactions
//     combinedTransactions.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
//     console.log(`[API /api/getAccount] Found ${combinedTransactions.length} transactions for ${accountId}.`);

//     // 4. Send combined response
//     res.status(200).json({ accountDetails: accountDetails, transactions: combinedTransactions });

//   } catch (error) {
//     console.error(`[API /api/getAccount] Error for ${accountId}:`, error);
//     res.status(500).json({ message: 'Error fetching account details and transactions', error: error.message });
//   }
// });

// // Endpoint to Run Circular Check
// app.post('/api/runCircularCheck/:transferId', async (req, res) => {
//     const transferId = req.params.transferId;
//     console.log(`[API /api/runCircularCheck] Received request for transfer ID: ${transferId}`);
//     if (!transferId) return res.status(400).json({ message: 'Transfer ID is required.' });
//     if (!fraudEvents) { console.error("[Circular Check] MongoDB fraudEvents collection not ready."); return res.status(500).json({ message: 'Database connection not ready' }); }

//     try {
//         const startTransfer = await fetchSingleTransfer(transferId);
//         if (!startTransfer) return res.status(404).json({ message: `Transfer ${transferId} not found.` });
//         // WARNING: Potentially very slow
//         const allTransfers = await fetchAllNessieTransfers();
//         if (!allTransfers || allTransfers.length === 0) {
//              console.log('[Circular Check] No transfers found to analyze.');
//              return res.status(200).json({ message: 'Circular check skipped: No transfers found.' });
//         }
//         const circularResult = await detectCircularFunds(startTransfer, allTransfers);

//         if (circularResult.weight > 0 && circularResult.ids.length > 0) {
//             console.log(`[Circular Check] Cycle detected involving transactions: ${circularResult.ids.join(', ')}`);
//             const accountsInCycle = new Set();
//             const cycleTransfers = allTransfers.filter(t => circularResult.ids.includes(t._id));
//             cycleTransfers.forEach(t => { if (t.payer_id) accountsInCycle.add(t.payer_id); if (t.payee_id) accountsInCycle.add(t.payee_id); });
//             console.log(`[Circular Check] Updating score for accounts: ${Array.from(accountsInCycle).join(', ')}`);

//             const eventsToLog = []; // Prepare events for logging

//             // Update MongoDB for all involved accounts
//             const updatePromises = Array.from(accountsInCycle).map(async (accId) => {
//                 const user = await users.findOne({ _id: accId });
//                 if (user) {
//                     const currentScore = user.score || 0; let newScore = currentScore + circularResult.weight; newScore = Math.min(newScore, 10);
//                     const updateOps = { $set: { score: newScore }, $addToSet: { circular: circularResult.ids } };
//                     if (newScore >= 7) { updateOps.$set.isFraud = true; }

//                     // Check if this cycle was already logged for this user to avoid duplicate event entries
//                     const existingCirculars = user.circular || [];
//                     const alreadyLogged = existingCirculars.some(set => set.length === circularResult.ids.length && circularResult.ids.every(id => set.includes(id)) && set.every(id => circularResult.ids.includes(id)));

//                     if (!alreadyLogged) {
//                          eventsToLog.push({ // Add event to log list *only if* it's new for this user
//                             timestamp: new Date(), accountId: accId, flagType: 'Circular Funds',
//                             message: `Account involved in circular funds transfer.`,
//                             transactionIds: circularResult.ids
//                          });
//                     }
//                     // Perform the update regardless of whether event was logged before
//                     return users.updateOne({ _id: accId }, updateOps);
//                 }
//             });
//             await Promise.all(updatePromises);
//             console.log(`[DB] Updated scores/flags for ${accountsInCycle.size} accounts involved in circular transfer.`);

//              // --- Log detected events to fraudEvents collection ---
//              if (eventsToLog.length > 0) {
//                 console.log(`[DB] Logging ${eventsToLog.length} circular fraud events.`);
//                 try { await fraudEvents.insertMany(eventsToLog); console.log(`[DB] Successfully logged circular fraud events.`); }
//                 catch (logError) { console.error(`[DB] Error logging circular fraud events:`, logError); }
//             }
//              // --- End logging ---
//         }
//         res.status(200).json({ message: 'Circular check processed.', cycleFound: (circularResult.weight > 0) });
//     } catch (error) {
//         console.error(`[Error] Failed processing circular check for transfer ${transferId}:`, error);
//         res.status(500).json({ message: 'Error during circular check processing.', error: error.message });
//     }
// });

// // Endpoint to Get Recent Fraud Events
// app.get('/api/getRecentFraudEvents', async (req, res) => {
//     console.log('[API /api/getRecentFraudEvents] Request received.');
//     if (!fraudEvents || !users) {
//         return res.status(500).json({ message: 'Database connection not ready' });
//     }
//     try {
//         const limit = parseInt(req.query.limit) || 5; // Get limit from query param, default 5

//         // Fetch recent events, sort by timestamp descending
//         const recentEvents = await fraudEvents.find({})
//             .sort({ timestamp: -1 }) // -1 for descending order
//             .limit(limit)
//             .toArray();

//         // Optional: Fetch user names for the account IDs in the events
//         const accountIds = [...new Set(recentEvents.map(event => event.accountId))]; // Get unique account IDs
//         let accountMap = new Map();
//         if (accountIds.length > 0) {
//              const accountInfos = await users.find({ _id: { $in: accountIds } })
//                                              .project({ _id: 1, first_name: 1, last_name: 1 })
//                                              .toArray();
//              accountMap = new Map(accountInfos.map(acc => [acc._id, `${acc.first_name || ''} ${acc.last_name || ''}`.trim()]));
//         }


//         // Add user names to the events
//         const eventsWithNames = recentEvents.map(event => ({
//             ...event,
//             accountName: accountMap.get(event.accountId) || 'Unknown Account'
//         }));

//         console.log(`[API /api/getRecentFraudEvents] Found ${eventsWithNames.length} recent events.`);
//         res.status(200).json(eventsWithNames);

//     } catch (error) {
//         console.error('[API /api/getRecentFraudEvents] Error fetching recent fraud events:', error);
//         res.status(500).json({ message: 'Error fetching recent fraud events', error: error.message });
//     }
// });


// // --- Connect to MongoDB and Start Server ---
// client.connect()
//   .then(() => {
//     db = client.db(MONGO_DB_NAME);
//     users = db.collection(MONGO_COLLECTION);
//     fraudEvents = db.collection(FRAUD_EVENTS_COLLECTION); // Initialize fraudEvents collection
//     console.log(`Connected to MongoDB database: ${MONGO_DB_NAME}`);
//     console.log(`Collections initialized: ${MONGO_COLLECTION}, ${FRAUD_EVENTS_COLLECTION}`);
//     const PORT = process.env.PORT || 3000;
//     app.listen(PORT, () => { console.log(`Express server running on port ${PORT}`); });
//   })
//   .catch((err) => {
//     console.error('FATAL: Error connecting to MongoDB:', err);
//     process.exit(1);
//   });



// server.js
// This version includes base functionality AND refined fraud detection logic.
// ALL functions and endpoints are fully implemented below.

// --- Hardcoded Configuration ---
const API_KEY = 'e2891b406c32fa6257f37327a5ed4fe8'; // Consider moving to environment variables
const MONGO_DB_NAME = 'Bitcamp_2025';
const MONGO_COLLECTION = 'Users';
const FRAUD_EVENTS_COLLECTION = 'fraudEvents'; // Collection for logging events
const MONGO_CONNECTION =
  'mongodb+srv://ajain316:Gd1r8cMhizZjWb82@cluster0.lg477.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'; // Consider moving to environment variables

const BASE = 'http://api.nessieisreal.com';

// --- Imports ---
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb'); // Keep ObjectId in case needed later

// --- Setup MongoDB Connection ---
const client = new MongoClient(MONGO_CONNECTION);
let db, users, fraudEvents; // Added fraudEvents collection variable

// --- Nessie API Helper Functions ---

async function createCustomer(firstName, lastName) {
  const url = `${BASE}/customers?key=${API_KEY}`;
  console.log(`[Nessie Call] POST ${url}`);
  const res = await axios.post(url, {
    first_name: firstName,
    last_name: lastName,
    address: { street_number: '123', street_name: 'Bitcamp Way', city: 'College Park', state: 'MD', zip: '20740' },
  });
  console.log(`[Nessie Call] POST ${url} - SUCCESS`);
  return res.data.objectCreated._id;
}

async function createAccount(customerId) {
  const url = `${BASE}/customers/${customerId}/accounts?key=${API_KEY}`;
   console.log(`[Nessie Call] POST ${url}`);
  const res = await axios.post(url, { type: 'Checking', nickname: 'Primary Checking', rewards: 0, balance: 5000 });
   console.log(`[Nessie Call] POST ${url} - SUCCESS`);
  return res.data.objectCreated._id;
}

async function makeDeposit(accountId, amount) {
  const transactionDate = new Date().toISOString().split('T')[0];
  const url = `${BASE}/accounts/${accountId}/deposits?key=${API_KEY}`;
  console.log(`[Nessie Call] POST ${url} - Amount: ${amount}`);
  await axios.post(url, { medium: 'balance', amount: Number(amount), transaction_date: transactionDate, status: 'completed', description: 'Direct Deposit' });
  console.log(`[Nessie Call] POST ${url} - SUCCESS`);
  return { message: 'Deposit completed' };
}

async function makeWithdrawal(accountId, amount) {
  const transactionDate = new Date().toISOString().split('T')[0];
  const url = `${BASE}/accounts/${accountId}/withdrawals?key=${API_KEY}`;
   console.log(`[Nessie Call] POST ${url} - Amount: ${amount}`);
  await axios.post(url, { medium: 'balance', amount: Number(amount), transaction_date: transactionDate, status: 'completed', description: 'Withdrawal' });
  console.log(`[Nessie Call] POST ${url} - SUCCESS`);
  return { message: 'Withdrawal completed' };
}

// Modified to return transferId needed for circular check trigger
async function makeTransfer(fromAccountId, toAccountId, amount) {
  const transactionDate = new Date().toISOString().split('T')[0];
  const url = `${BASE}/accounts/${fromAccountId}/transfers?key=${API_KEY}`;
  console.log(`[Nessie Call] POST ${url} - Amount: ${amount} To: ${toAccountId}`);
  const payload = { medium: 'balance', payee_id: toAccountId, amount: Number(amount), transaction_date: transactionDate, description: 'Transfer' };
  const response = await axios.post(url, payload);
  console.log(`[Nessie Call] POST ${url} - SUCCESS`);
  return { message: 'Transfer completed', transferId: response.data?.objectCreated?._id };
}


// Helper function to fetch transaction data from Nessie API (with debug logging)
async function fetchNessieData(url) {
  console.log(`[Debug] Fetching Nessie data from: ${url}`); // Log URL being fetched
  try {
    const response = await axios.get(url);
    const data = response.data;
    // Ensure response is always an array, even if Nessie returns single object or nothing
    const dataArray = Array.isArray(data) ? data : (data ? [data] : []);
    console.log(`[Debug] SUCCESS fetching ${url}. Count: ${dataArray.length}`); // Log success and count
    return { status: 'fulfilled', value: dataArray }; // Return array
  } catch (error) {
    // Log Nessie API errors but don't crash the whole request
    const errorData = error.response?.data || error.message;
    // Handle 404 specifically - means no transactions of this type, not a server error
    if (error.response && error.response.status === 404) {
        console.log(`[Debug] INFO fetching ${url}: 404 Not Found (No transactions of this type).`);
        return { status: 'fulfilled', value: [] }; // Treat 404 as success with empty array
    } else {
        console.error(`[Debug] FAILURE fetching ${url}:`, JSON.stringify(errorData)); // Log failure details
        return { status: 'rejected', reason: errorData }; // Propagate other errors
    }
  }
}


// --- Fraud Detection Logic (Refined based on User Criteria) ---

// Helper to parse date string safely
function parseDate(dateString) {
    try { return new Date(dateString); } catch (e) { return null; }
}

// Detects rapid deposit/withdrawal cycles on the same day
// Criteria: Deposit/Transfer In >= $5000, same day outflow returns balance. Weight: 3
async function detectRapidTransfer(accountId, deposits, withdrawals, transfers) {
    const allTxns = [
        ...deposits.map(t => ({ ...t, type: 'deposit' })),
        ...withdrawals.map(t => ({ ...t, type: 'withdrawal' })),
        ...transfers.map(t => ({ ...t, type: 'transfer', direction: t.payer_id === accountId ? 'outgoing' : (t.payee_id === accountId ? 'incoming' : null) }))
    ];
    if (!allTxns || allTxns.length === 0) return { ids: [], weight: 0 };
    allTxns.sort((a, b) => parseDate(b.transaction_date) - parseDate(a.transaction_date));
    const latestDateStr = allTxns[0].transaction_date;
    if (!latestDateStr) return { ids: [], weight: 0 }; // Need a date to check
    const sameDayTxns = allTxns.filter(txn => txn.transaction_date === latestDateStr);
    let incomingTotal = 0, outgoingTotal = 0;
    const transactionIds = [];
    for (const txn of sameDayTxns) {
        const amt = parseFloat(txn.amount || 0);
        if (isNaN(amt)) continue;
        transactionIds.push(txn._id);
        if (txn.type === 'deposit' || (txn.type === 'transfer' && txn.direction === 'incoming')) { incomingTotal += amt; }
        else if (txn.type === 'withdrawal' || (txn.type === 'transfer' && txn.direction === 'outgoing')) { outgoingTotal += amt; }
    }
    // Check if inflow >= 5000 and inflow equals outflow
    if (incomingTotal >= 5000 && incomingTotal > 0 && incomingTotal === outgoingTotal) { // Ensure some activity occurred
        console.log(`[Fraud Check] Rapid Transfer detected for account ${accountId}. In: ${incomingTotal}, Out: ${outgoingTotal}`);
        return { ids: transactionIds, weight: 3 }; // Return all involved same-day txn IDs
    }
    return { ids: [], weight: 0 };
}

// Detects high frequency transfers
// Criteria: 5 or more transfers on the same day (check last 5 transfers). Weight: 2
async function detectHighFrequency(accountId, transfers) { // Only checks transfers now
    let weight = 0;
    const transferIds = [];

    if (transfers && transfers.length >= 5) {
        // Sort newest first to easily get the last 5
        transfers.sort((a, b) => parseDate(b.transaction_date) - parseDate(a.transaction_date));
        const recentTransfers = transfers.slice(0, 5);
        const firstDate = recentTransfers[0].transaction_date;
        const lastDate = recentTransfers[4].transaction_date;

        // Check if the 1st and 5th most recent transfers occurred on the same date
        if (firstDate && firstDate === lastDate) { // Ensure dates are valid
            console.log(`[Fraud Check] High Frequency Transfers detected for account ${accountId} (5+ on same day: ${firstDate}).`);
            weight = 2; // Assign weight if condition met
            recentTransfers.forEach(t => transferIds.push(t._id)); // Collect IDs of the 5 transfers
        }
    }
    // Return only transfer related info
    // Note: weight is 0 if condition not met, transferIds is empty
    return { transferIds, weight };
}

// Detects large transaction after a period of dormancy
// Criteria: Last txn >= 30 days ago, new txn (dep/wd/trans) >= $1000. Weight: 2
async function detectDormantToActive(accountId, deposits, withdrawals, transfers) {
    const allTxns = [
        ...deposits.map(t => ({ ...t, type: 'deposit' })),
        ...withdrawals.map(t => ({ ...t, type: 'withdrawal' })),
        ...transfers.map(t => ({ ...t, type: 'transfer' })) // Use simple type 'transfer'
    ];
     if (!allTxns || allTxns.length < 2) return { id: null, weight: 0 };
     // Sort oldest to newest by date
     allTxns.sort((a, b) => parseDate(a.transaction_date) - parseDate(b.transaction_date));

     const latest = allTxns[allTxns.length - 1];
     const secondLatest = allTxns[allTxns.length - 2];

     const latestDate = parseDate(latest.transaction_date);
     const secondLatestDate = parseDate(secondLatest.transaction_date);
     const latestAmount = parseFloat(latest.amount || 0);
     // Check if the latest transaction is one of the relevant types
     const isRelevantType = ['deposit', 'withdrawal', 'transfer', 'p2p'].includes(latest.type?.toLowerCase()); // Nessie uses 'p2p' for transfers sometimes

     if (!latestDate || !secondLatestDate || isNaN(latestAmount)) return { id: null, weight: 0 }; // Basic data validation

     const daysDiff = (latestDate - secondLatestDate) / (1000 * 60 * 60 * 24);

     // Check dormancy condition (>= 30 days) and activity condition (relevant type and >= $1000)
     if (daysDiff >= 30 && isRelevantType && latestAmount >= 1000) {
         console.log(`[Fraud Check] Dormant to Active detected for account ${accountId}. Days Diff: ${daysDiff.toFixed(1)}, Amount: ${latestAmount}`);
         return { id: latest._id, weight: 2 }; // Return ID of the triggering transaction
     }
     return { id: null, weight: 0 };
}

// --- Circular Funds Detection Logic ---
// Fetches ALL transfers from ALL known accounts (Potentially Slow!)
async function fetchAllNessieTransfers() {
    console.log('[Circular Check] Fetching all customer accounts from Nessie...');
    let allAccounts = [];
    try {
        const customersResponse = await axios.get(`${BASE}/customers?key=${API_KEY}`);
        const customerIds = customersResponse.data.map(c => c._id);
        const accountPromises = customerIds.map(custId =>
            axios.get(`${BASE}/customers/${custId}/accounts?key=${API_KEY}`)
                 .then(res => res.data).catch(err => { console.error(`Failed to get accounts for customer ${custId}:`, err.message); return []; })
        );
        const accountsNested = await Promise.all(accountPromises);
        allAccounts = accountsNested.flat();
        console.log(`[Circular Check] Found ${allAccounts.length} total accounts.`);
    } catch (error) { console.error('[Circular Check] Failed to fetch all customer accounts:', error.response?.data || error.message); return []; }
    if (allAccounts.length === 0) return [];
    console.log('[Circular Check] Fetching transfers for all accounts...');
    const transferPromises = allAccounts.map(acc => fetchNessieData(`${BASE}/accounts/${acc._id}/transfers?key=${API_KEY}`));
    const results = await Promise.allSettled(transferPromises);
    let allTransfers = [];
    results.forEach(result => { if (result.status === 'fulfilled' && result.value.status === 'fulfilled') { allTransfers = allTransfers.concat(result.value.value); } });
    console.log(`[Circular Check] Fetched ${allTransfers.length} total transfers.`);
    return allTransfers;
}
// Fetches details of a single transfer by its ID
async function fetchSingleTransfer(transferId) {
    if (!transferId) return null;
    console.log(`[Circular Check] Fetching details for transfer ID: ${transferId}`);
    try { const response = await axios.get(`${BASE}/transfers/${transferId}?key=${API_KEY}`); return response.data; }
    catch (error) { console.error(`[Circular Check] Failed to fetch transfer ${transferId}:`, error.response?.data || error.message); return null; }
}

// Detects circular fund transfers
// Criteria: >= 4 different accounts, same amount, returns to origin. Weight: 3
async function detectCircularFunds(startTransfer, allTransfers) {
  console.log(`[Circular Check] Starting detection based on transfer ID: ${startTransfer?._id}`);
  const graph = new Map();
  allTransfers.forEach(t => {
    if (t && t.payer_id && t.payee_id && t.amount != null && t._id) {
        const amountNum = parseFloat(t.amount);
        if (!isNaN(amountNum)) {
             if (!graph.has(t.payer_id)) { graph.set(t.payer_id, []); }
             graph.get(t.payer_id).push({ payee_id: t.payee_id, amount: amountNum, transaction_id: t._id });
        }
    }
  });
  console.log(`[Circular Check] Built graph with ${graph.size} nodes.`);

  function dfs(accountPath, txnPath, visited, origin, amountToMatch) {
    const current = accountPath[accountPath.length - 1];
    if (accountPath.length > 10) { console.log('[Circular Check] DFS path limit reached.'); return null; } // Limit path length

    const edges = graph.get(current) || [];
    for (const edge of edges) {
      const neighbor = edge.payee_id; const amt = edge.amount; const txn_id = edge.transaction_id;
      if (amt !== amountToMatch) continue; // Amount must match
      if (neighbor === origin) { // Potential cycle completion
          const uniqueAccountsInPath = new Set(accountPath);
          // Check if path involves at least 4 different accounts
          if (accountPath.length >= 4 && uniqueAccountsInPath.size >= 4) {
             console.log(`[Circular Check] Cycle found: ${accountPath.join(' -> ')} -> ${neighbor}`);
             return [...txnPath, txn_id]; // Valid cycle found
          } else { continue; } // Cycle too short
      }
      if (visited.has(neighbor)) continue; // Already visited in this specific path

      // Recursive call
      const cycle = dfs([...accountPath, neighbor], [...txnPath, txn_id], new Set([...visited, neighbor]), origin, amountToMatch);
      if (cycle) return cycle; // Propagate found cycle
    }
    return null; // No cycle found
  }

  const payer = startTransfer?.payer_id; const payee = startTransfer?.payee_id;
  const amount = parseFloat(startTransfer?.amount || 0); const start_txn_id = startTransfer?._id;
  if (!payer || !payee || !start_txn_id || isNaN(amount) || amount === 0) { console.log('[Circular Check] Invalid start transfer data.'); return { ids: [], weight: 0 }; }
   console.log(`[Circular Check] Starting DFS: Payer=${payer}, Payee=${payee}, Amount=${amount}`);
  const cycleTxnIds = dfs([payer, payee], [start_txn_id], new Set([payee]), payer, amount);

  if (cycleTxnIds && cycleTxnIds.length > 0) { console.log(`[Circular Check] Detected cycle transaction IDs: ${cycleTxnIds.join(', ')}`); return { ids: cycleTxnIds, weight: 3 }; }
  else { console.log('[Circular Check] No cycle detected.'); return { ids: [], weight: 0 }; }
}

// --- Combined Fraud Check & DB Update Function (Refined Event Logging) ---
async function runFraudChecksAndUpdateScore(accountId) {
     if (!users || !fraudEvents) { console.error("[Fraud Check] MongoDB collections not ready."); return; }
     console.log(`[Fraud Check] Running standard checks for account: ${accountId}`);
     try {
        // Fetch history
        const endpoints = [ `${BASE}/accounts/${accountId}/deposits?key=${API_KEY}`, `${BASE}/accounts/${accountId}/withdrawals?key=${API_KEY}`, `${BASE}/accounts/${accountId}/transfers?key=${API_KEY}`, `${BASE}/accounts/${accountId}/purchases?key=${API_KEY}` ];
        const results = await Promise.allSettled(endpoints.map(fetchNessieData));
        const deposits = results[0].status === 'fulfilled' ? results[0].value.value : [];
        const withdrawals = results[1].status === 'fulfilled' ? results[1].value.value : [];
        const transfers = results[2].status === 'fulfilled' ? results[2].value.value : [];
        const purchases = results[3].status === 'fulfilled' ? results[3].value.value : []; // Keep fetch?

        // Run checks
        const rapidResult = await detectRapidTransfer(accountId, deposits, withdrawals, transfers);
        const frequencyResult = await detectHighFrequency(accountId, transfers); // Use refined version
        const dormantResult = await detectDormantToActive(accountId, deposits, withdrawals, transfers);

        const currentUser = await users.findOne({ _id: accountId });
        if (!currentUser) { console.error(`[Fraud Check] User ${accountId} not found.`); return; }

        let scoreIncrease = 0;
        const updates = { $addToSet: {} };
        const eventsToLog = [];

        // Process Rapid
        if (rapidResult.weight > 0 && rapidResult.ids.length > 0) {
            const existing = currentUser.rapid || [];
            const alreadyRecorded = existing.some(set => set.length === rapidResult.ids.length && rapidResult.ids.every(id => set.includes(id)) && set.every(id => rapidResult.ids.includes(id)) );
            if (!alreadyRecorded) {
                scoreIncrease += rapidResult.weight; updates.$addToSet.rapid = rapidResult.ids;
                const message = `Rapid Transfer detected for account ${accountId}.`;
                console.log(`[Fraud Check] ${message}`);
                eventsToLog.push({ timestamp: new Date(), accountId, flagType: 'Rapid Transfer', message, transactionIds: rapidResult.ids });
            } else { console.log(`[Fraud Check] Rapid Transfer event already recorded.`); }
        }
        // Process High Freq Transfer
         if (frequencyResult.weight > 0 && frequencyResult.transferIds.length > 0) {
             const existing = currentUser.frequency_transfer || [];
             const alreadyRecorded = existing.some(set => set.length === frequencyResult.transferIds.length && frequencyResult.transferIds.every(id => set.includes(id)) && set.every(id => frequencyResult.transferIds.includes(id)));
             if (!alreadyRecorded) {
                 scoreIncrease += frequencyResult.weight; updates.$addToSet.frequency_transfer = frequencyResult.transferIds;
                 const message = `High Frequency Transfers detected for account ${accountId}.`;
                 console.log(`[Fraud Check] ${message}`);
                 eventsToLog.push({ timestamp: new Date(), accountId, flagType: 'High Frequency Transfer', message, transactionIds: frequencyResult.transferIds });
             } else { console.log(`[Fraud Check] High Freq Transfer event already recorded.`); }
        }
        // Process Dormant
        if (dormantResult.weight > 0 && dormantResult.id) {
            if (!currentUser.dormant || !currentUser.dormant.includes(dormantResult.id)) {
                scoreIncrease += dormantResult.weight;
                // Use $addToSet for single ID to prevent duplicates if called multiple times before DB updates fully
                updates.$addToSet.dormant = dormantResult.id;
                const message = `Dormant to Active detected for account ${accountId}.`;
                console.log(`[Fraud Check] ${message}`);
                 eventsToLog.push({ timestamp: new Date(), accountId, flagType: 'Dormant to Active', message, transactionIds: [dormantResult.id] });
            } else {
                 console.log(`[Fraud Check] Dormant to Active event already recorded.`);
                 delete updates.$addToSet.dormant; // Remove from update if already present
            }
        }

        // Apply updates to User collection & Log Events
        if (scoreIncrease > 0) {
            const currentScore = currentUser.score || 0;
            let newScore = currentScore + scoreIncrease; newScore = Math.min(newScore, 10);
            const updateOps = { $set: { score: newScore } };
            if (Object.keys(updates.$addToSet).length > 0) { updateOps.$addToSet = updates.$addToSet; }
            if (newScore >= 7) { updateOps.$set.isFraud = true; }
            console.log(`[Fraud Check] Updating score for ${accountId}: ${currentScore} -> ${newScore}`);
            await users.updateOne({ _id: accountId }, updateOps);
            console.log(`[DB] Updated score/flags for account ${accountId}.`);

            // Log detected events to fraudEvents collection
            if (eventsToLog.length > 0) {
                console.log(`[DB] Logging ${eventsToLog.length} fraud events for account ${accountId}.`);
                try { await fraudEvents.insertMany(eventsToLog); console.log(`[DB] Successfully logged fraud events.`); }
                catch (logError) { console.error(`[DB] Error logging fraud events for account ${accountId}:`, logError); }
            }
        } else { console.log(`[Fraud Check] No new standard flags detected for account ${accountId}. Score remains ${currentUser.score}.`); }

     } catch (error) { console.error(`[Fraud Check] Error during standard fraud checks for account ${accountId}:`, error); }
}


// --- Express App Setup ---
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.get('/', (req, res) => { res.json({ message: 'Server is running!' }); });


// --- API Endpoints ---
app.post('/api/createCustomer', async (req, res) => {
    try {
      const { firstName, lastName } = req.body;
      if (!firstName || !lastName) return res.status(400).json({ message: 'Missing customer name' });
      const customerId = await createCustomer(firstName, lastName);
      const accountId = await createAccount(customerId);
      const user = {
        _id: accountId, customer_id: customerId, first_name: firstName, last_name: lastName,
        isFraud: false, score: 0, rapid: [], frequency_transfer: [], frequency_purchase: [], dormant: [], circular: [],
      };
      await users.insertOne(user);
      console.log(`[DB] Inserted user for ${firstName} ${lastName} with _id: ${accountId}`);
      res.status(201).json({ message: `Created account for ${firstName} ${lastName}`, accountId });
    } catch (error) {
      console.error('Error in /api/createCustomer:', error.response?.data || error.message || error);
      res.status(500).json({ message: 'Error creating customer', error: error.message });
    }
});

app.post('/api/transaction', async (req, res) => {
    let accountIdForCheck = null;
    try {
      const { firstName, lastName, amount, type } = req.body;
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: 'Invalid amount.' });
      const user = await users.findOne({ first_name: firstName, last_name: lastName });
      if (!user) return res.status(404).json({ message: 'User not found' });
      accountIdForCheck = user._id;
      if (!type || (type !== 'deposit' && type !== 'withdraw' && type !== 'payment')) return res.status(400).json({ message: 'Invalid transaction type.' });
      if (!amount) return res.status(400).json({ message: 'Missing amount.' });

      let result = (type === 'deposit') ? await makeDeposit(accountIdForCheck, numericAmount) : await makeWithdrawal(accountIdForCheck, numericAmount);

      // Run Fraud Checks Asynchronously
      if (accountIdForCheck) { runFraudChecksAndUpdateScore(accountIdForCheck).catch(err => console.error(`[Error] Post-transaction fraud check failed for ${accountIdForCheck}:`, err)); }

      res.status(200).json(result);
    } catch (error) {
      console.error('Transaction error:', error.response?.data || error.message || error);
      res.status(500).json({ message: 'Transaction error', error: error.message, nessie_message: error.response?.data?.message });
    }
});

app.post('/api/transfer', async (req, res) => {
    let fromAccountIdForCheck = null;
    let toAccountIdForCheck = null;
    let createdTransferId = null;
    try {
      const { fromCustomer, toCustomer, amount } = req.body;
      const numericAmount = parseFloat(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ message: 'Invalid amount.' });
      if (!fromCustomer?.firstName || !fromCustomer?.lastName || !toCustomer?.firstName || !toCustomer?.lastName || !amount) {
           return res.status(400).json({ message: 'Missing required fields.' });
      }
      const fromUser = await users.findOne({ first_name: fromCustomer.firstName, last_name: fromCustomer.lastName });
      const toUser = await users.findOne({ first_name: toCustomer.firstName, last_name: toCustomer.lastName });
      if (!fromUser || !toUser) {
          let message = !fromUser ? 'Sender not found.' : 'Recipient not found.';
          if (!fromUser && !toUser) message = 'Sender and recipient not found.';
          return res.status(404).json({ message: message });
      }
      fromAccountIdForCheck = fromUser._id;
      toAccountIdForCheck = toUser._id;

      const result = await makeTransfer(fromAccountIdForCheck, toAccountIdForCheck, numericAmount);
      createdTransferId = result.transferId; // Capture ID returned by updated makeTransfer

       // Run Standard Fraud Checks for Sender
       if (fromAccountIdForCheck) { runFraudChecksAndUpdateScore(fromAccountIdForCheck).catch(err => console.error(`[Error] Post-transfer(sender) fraud check failed for ${fromAccountIdForCheck}:`, err)); }
       // if (toAccountIdForCheck) { runFraudChecksAndUpdateScore(toAccountIdForCheck).catch(...) } // Optional check for recipient

       // Trigger Circular Check Asynchronously
       if (createdTransferId) {
            console.log(`[API /api/transfer] Triggering circular check for transfer ID: ${createdTransferId}`);
            const port = process.env.PORT || 3000; // Ensure port is correctly determined
            const checkUrl = `http://localhost:${port}/api/runCircularCheck/${createdTransferId}`;
            console.log(`[API /api/transfer] Attempting to POST to trigger circular check: ${checkUrl}`); // Log URL
            axios.post(checkUrl)
                 .catch(err => {
                     const errorMsg = err.response ? `Status ${err.response.status}: ${err.message}` : err.message;
                     console.error(`[Error] Failed to trigger circular check for transfer ${createdTransferId}: ${errorMsg}`);
                 });
       }

      res.status(200).json({ message: result.message }); // Respond with original message

    } catch (error) {
      console.error('Transfer error:', error.response?.data || error.message || error);
      res.status(500).json({ message: 'Transfer error', error: error.message, nessie_message: error.response?.data?.message });
    }
});

app.get('/api/getAccounts', async (req, res) => {
  // Added logging kept for debugging
  console.log('[API /api/getAccounts] Request received.');
  try {
    if (!users) return res.status(500).json({ message: 'Database connection not ready' });
    console.log('[API /api/getAccounts] Attempting to query database...');
    const accountsFromDb = await users.find({}).project({ _id: 1, first_name: 1, last_name: 1, score: 1 }).toArray();
    console.log(`[API /api/getAccounts] Database query completed. Found ${accountsFromDb ? accountsFromDb.length : 'null/undefined'} accounts.`);
    console.log('[API /api/getAccounts] Sending response...');
    res.status(200).json(accountsFromDb);
    console.log('[API /api/getAccounts] Response sent.');
  } catch (error) {
    console.error('[API /api/getAccounts] Error fetching accounts:', error);
    if (!res.headersSent) { res.status(500).json({ message: 'Error fetching accounts from database', error: error.message }); }
  }
});

app.get('/api/getAccount/:id', async (req, res) => {
  const accountId = req.params.id;
  // Removed most debug logging for cleaner version, kept basic entry log
  console.log(`[API /api/getAccount] Request received for ${accountId}`);
  try {
    if (!accountId) return res.status(400).json({ message: 'Account ID parameter is required.' });
    if (!users || !fraudEvents) return res.status(500).json({ message: 'Database connection not ready' }); // Check fraudEvents too

    // --- Fetch account details, transactions, and fraud events concurrently ---
    const accountDetailsPromise = users.findOne({ _id: accountId });
    const transactionEndpoints = [ `${BASE}/accounts/${accountId}/deposits?key=${API_KEY}`, `${BASE}/accounts/${accountId}/withdrawals?key=${API_KEY}`, `${BASE}/accounts/${accountId}/transfers?key=${API_KEY}`, `${BASE}/accounts/${accountId}/purchases?key=${API_KEY}` ];
    const transactionsPromise = Promise.allSettled(transactionEndpoints.map(fetchNessieData));
    const fraudEventsPromise = fraudEvents.find({ accountId: accountId }).sort({ timestamp: -1 }).toArray(); // Fetch specific events

    // --- Wait for all fetches ---
    const [accountDetails, transactionResults, accountFraudEvents] = await Promise.all([ accountDetailsPromise, transactionsPromise, fraudEventsPromise ]);
    // --- End concurrent ---

    if (!accountDetails) return res.status(404).json({ message: `Account not found with ID: ${accountId}` });
    console.log(`[API /api/getAccount] Found account details.`);

    // Process transactions
    let combinedTransactions = [];
    transactionResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            const nessieResult = result.value;
            if (nessieResult.status === 'fulfilled' && Array.isArray(nessieResult.value)) {
                const transactionsArray = nessieResult.value;
                if (transactionsArray.length > 0) {
                    let baseType = ['Deposit', 'Withdrawal', 'Transfer', 'Purchase'][index];
                    transactionsArray.forEach(t => {
                        let processedTransaction = { ...t };
                        if (baseType === 'Transfer') { const isOutgoing = t.payer_id === accountId; processedTransaction.type = isOutgoing ? 'Transfer Out' : 'Transfer In'; processedTransaction.partner_id = isOutgoing ? t.payee_id : t.payer_id; }
                        else if (baseType === 'Purchase') { processedTransaction.type = 'Purchase'; processedTransaction.partner_id = t.merchant_id; }
                        else { processedTransaction.type = baseType; }
                        combinedTransactions.push(processedTransaction);
                    });
                }
            } else if (nessieResult.status === 'rejected') { console.error(`Nessie fetch error for index ${index}: ${JSON.stringify(nessieResult.reason)}`); }
        } else { console.error(`Promise rejected for index ${index}: ${JSON.stringify(result.reason)}`); }
    });

    // Sort transactions
    combinedTransactions.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
    console.log(`[API /api/getAccount] Found ${combinedTransactions.length} transactions for ${accountId}.`);
    console.log(`[API /api/getAccount] Found ${accountFraudEvents.length} fraud events for ${accountId}.`);

    // Send combined response
    res.status(200).json({
        accountDetails: accountDetails,
        transactions: combinedTransactions,
        fraudEvents: accountFraudEvents // Include the fetched fraud events
    });

  } catch (error) {
    console.error(`[API /api/getAccount] Error for ${accountId}:`, error);
    res.status(500).json({ message: 'Error fetching account details, transactions, and events', error: error.message });
  }
});

// Endpoint to Run Circular Check
app.post('/api/runCircularCheck/:transferId', async (req, res) => {
    const transferId = req.params.transferId;
    console.log(`[API /api/runCircularCheck] Received request for transfer ID: ${transferId}`);
    if (!transferId) return res.status(400).json({ message: 'Transfer ID is required.' });
    if (!fraudEvents || !users) { console.error("[Circular Check] MongoDB collections not ready."); return res.status(500).json({ message: 'Database connection not ready' }); }

    try {
        const startTransfer = await fetchSingleTransfer(transferId);
        if (!startTransfer) return res.status(404).json({ message: `Transfer ${transferId} not found.` });
        // WARNING: Potentially very slow
        const allTransfers = await fetchAllNessieTransfers();
        if (!allTransfers || allTransfers.length === 0) {
             console.log('[Circular Check] No transfers found to analyze.');
             return res.status(200).json({ message: 'Circular check skipped: No transfers found.' });
        }
        const circularResult = await detectCircularFunds(startTransfer, allTransfers);

        if (circularResult.weight > 0 && circularResult.ids.length > 0) {
            console.log(`[Circular Check] Cycle detected involving transactions: ${circularResult.ids.join(', ')}`);
            const accountsInCycle = new Set();
            const cycleTransfers = allTransfers.filter(t => circularResult.ids.includes(t._id));
            cycleTransfers.forEach(t => { if (t.payer_id) accountsInCycle.add(t.payer_id); if (t.payee_id) accountsInCycle.add(t.payee_id); });
            console.log(`[Circular Check] Updating score for accounts: ${Array.from(accountsInCycle).join(', ')}`);

            const eventsToLog = []; // Prepare events for logging

            // Update MongoDB for all involved accounts
            const updatePromises = Array.from(accountsInCycle).map(async (accId) => {
                const user = await users.findOne({ _id: accId });
                if (user) {
                    const currentScore = user.score || 0; let newScore = currentScore + circularResult.weight; newScore = Math.min(newScore, 10);
                    const updateOps = { $set: { score: newScore }, $addToSet: { circular: circularResult.ids } };
                    if (newScore >= 7) { updateOps.$set.isFraud = true; }

                    const existingCirculars = user.circular || [];
                    const alreadyLogged = existingCirculars.some(set => set.length === circularResult.ids.length && circularResult.ids.every(id => set.includes(id)) && set.every(id => circularResult.ids.includes(id)));
                    if (!alreadyLogged) {
                         eventsToLog.push({ timestamp: new Date(), accountId: accId, flagType: 'Circular Funds', message: `Account involved in circular funds transfer.`, transactionIds: circularResult.ids });
                    }
                    return users.updateOne({ _id: accId }, updateOps);
                }
            });
            await Promise.all(updatePromises);
            console.log(`[DB] Updated scores/flags for ${accountsInCycle.size} accounts involved in circular transfer.`);

             // Log detected events
             if (eventsToLog.length > 0) {
                console.log(`[DB] Logging ${eventsToLog.length} circular fraud events.`);
                try { await fraudEvents.insertMany(eventsToLog); console.log(`[DB] Successfully logged circular fraud events.`); }
                catch (logError) { console.error(`[DB] Error logging circular fraud events:`, logError); }
            }
        }
        res.status(200).json({ message: 'Circular check processed.', cycleFound: (circularResult.weight > 0) });
    } catch (error) {
        console.error(`[Error] Failed processing circular check for transfer ${transferId}:`, error);
        res.status(500).json({ message: 'Error during circular check processing.', error: error.message });
    }
});

// Endpoint to Get Recent Fraud Events (for Dashboard)
app.get('/api/getRecentFraudEvents', async (req, res) => {
    console.log('[API /api/getRecentFraudEvents] Request received.');
    if (!fraudEvents || !users) { return res.status(500).json({ message: 'Database connection not ready' }); }
    try {
        const limit = parseInt(req.query.limit) || 5;
        const recentEvents = await fraudEvents.find({}).sort({ timestamp: -1 }).limit(limit).toArray();
        const accountIds = [...new Set(recentEvents.map(event => event.accountId))];
        let accountMap = new Map();
        if (accountIds.length > 0) {
             const accountInfos = await users.find({ _id: { $in: accountIds } }).project({ _id: 1, first_name: 1, last_name: 1 }).toArray();
             accountMap = new Map(accountInfos.map(acc => [acc._id, `${acc.first_name || ''} ${acc.last_name || ''}`.trim()]));
        }
        const eventsWithNames = recentEvents.map(event => ({ ...event, accountName: accountMap.get(event.accountId) || 'Unknown Account' }));
        console.log(`[API /api/getRecentFraudEvents] Found ${eventsWithNames.length} recent events.`);
        res.status(200).json(eventsWithNames);
    } catch (error) {
        console.error('[API /api/getRecentFraudEvents] Error fetching recent fraud events:', error);
        res.status(500).json({ message: 'Error fetching recent fraud events', error: error.message });
    }
});


// --- Connect to MongoDB and Start Server ---
client.connect()
  .then(() => {
    db = client.db(MONGO_DB_NAME);
    users = db.collection(MONGO_COLLECTION);
    fraudEvents = db.collection(FRAUD_EVENTS_COLLECTION); // Initialize fraudEvents collection
    console.log(`Connected to MongoDB database: ${MONGO_DB_NAME}`);
    console.log(`Collections initialized: ${MONGO_COLLECTION}, ${FRAUD_EVENTS_COLLECTION}`);
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => { console.log(`Express server running on port ${PORT}`); });
  })
  .catch((err) => {
    console.error('FATAL: Error connecting to MongoDB:', err);
    process.exit(1);
  });