import React, { useState } from "react";
import './AccountActionsPage.css';

const AccountActionsPage = () => {
  const [createForm, setCreateForm] = useState({ firstName: "", lastName: "" });
  const [transactionForm, setTransactionForm] = useState({ firstName: "", lastName: "", amount: "" });
  const [transferForm, setTransferForm] = useState({
    fromFirst: "", fromLast: "", toFirst: "", toLast: "", amount: ""
  });

  const [createStatus, setCreateStatus] = useState(null);
  const [transactionStatus, setTransactionStatus] = useState(null);
  const [transferStatus, setTransferStatus] = useState(null);

  // Create New Customer Handler
  const handleCreateCustomer = async () => {
    if (createForm.firstName && createForm.lastName) {
      try {
        const response = await fetch('http://localhost:3000/api/createCustomer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: createForm.firstName,
            lastName: createForm.lastName
          })
        });
        const data = await response.json();
        if (response.ok) {
          setCreateStatus({ success: true, message: data.message });
        } else {
          setCreateStatus({ success: false, message: data.message });
        }
      } catch (error) {
        setCreateStatus({ success: false, message: error.message });
      }
    } else {
      setCreateStatus({ success: false, message: "Please fill in both first and last name." });
    }
  };

  // Transaction Handler for Deposit, Withdraw, Payment
  const handleTransaction = async (type) => {
    if (transactionForm.firstName && transactionForm.lastName && transactionForm.amount) {
      try {
        const response = await fetch('http://localhost:3000/api/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: transactionForm.firstName,
            lastName: transactionForm.lastName,
            amount: transactionForm.amount,
            type // should be "deposit", "withdraw", or "payment"
          })
        });
        const data = await response.json();
        if (response.ok) {
          setTransactionStatus({ success: true, message: data.message });
        } else {
          setTransactionStatus({ success: false, message: data.message });
        }
      } catch (error) {
        setTransactionStatus({ success: false, message: error.message });
      }
    } else {
      setTransactionStatus({ success: false, message: "All fields are required for this transaction." });
    }
  };

  // Transfer Handler
  const handleTransfer = async () => {
    const { fromFirst, fromLast, toFirst, toLast, amount } = transferForm;
    if (fromFirst && fromLast && toFirst && toLast && amount) {
      try {
        const response = await fetch('http://localhost:3000/api/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fromCustomer: { firstName: fromFirst, lastName: fromLast },
            toCustomer: { firstName: toFirst, lastName: toLast },
            amount: amount
          })
        });
        const data = await response.json();
        if (response.ok) {
          setTransferStatus({ success: true, message: data.message });
        } else {
          setTransferStatus({ success: false, message: data.message });
        }
      } catch (error) {
        setTransferStatus({ success: false, message: error.message });
      }
    } else {
      setTransferStatus({ success: false, message: "Please fill in all transfer fields." });
    }
  };

  return (
    <div className="account-actions-container">
      <h1 className="page-title">Account Actions</h1>

      {/* Create Customer Section */}
      <div className="section-box">
        <h2>Create New Customer</h2>
        <div className="form-row">
          <input
            type="text"
            placeholder="First Name"
            className="input"
            value={createForm.firstName}
            onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
          />
          <input
            type="text"
            placeholder="Last Name"
            className="input"
            value={createForm.lastName}
            onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
          />
        </div>
        <button className="btn primary" onClick={handleCreateCustomer}>
          Create Account
        </button>
        {createStatus && (
          <p className={`status-message ${createStatus.success ? 'status-success' : 'status-error'}`}>
            {createStatus.message}
          </p>
        )}
      </div>

      {/* Deposit / Withdrawal / Payment Section */}
      <div className="section-box">
        <h2>Deposit / Withdrawal / Payment</h2>
        <div className="form-row">
          <input
            type="text"
            placeholder="First Name"
            className="input"
            value={transactionForm.firstName}
            onChange={(e) => setTransactionForm({ ...transactionForm, firstName: e.target.value })}
          />
          <input
            type="text"
            placeholder="Last Name"
            className="input"
            value={transactionForm.lastName}
            onChange={(e) => setTransactionForm({ ...transactionForm, lastName: e.target.value })}
          />
          <input
            type="number"
            placeholder="Amount"
            className="input"
            value={transactionForm.amount}
            onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
          />
        </div>
        <div className="button-group">
          <button className="btn success" onClick={() => handleTransaction("deposit")}>
            Deposit
          </button>
          <button className="btn warning" onClick={() => handleTransaction("withdraw")}>
            Withdraw
          </button>
          <button className="btn info" onClick={() => handleTransaction("payment")}>
            Payment
          </button>
        </div>
        {transactionStatus && (
          <p className={`status-message ${transactionStatus.success ? 'status-success' : 'status-error'}`}>
            {transactionStatus.message}
          </p>
        )}
      </div>

      {/* Transfer Section */}
      <div className="section-box">
        <h2>Transfer Between Accounts</h2>
        <div className="form-row">
          <input
            type="text"
            placeholder="Payer First Name"
            className="input"
            value={transferForm.fromFirst}
            onChange={(e) => setTransferForm({ ...transferForm, fromFirst: e.target.value })}
          />
          <input
            type="text"
            placeholder="Payer Last Name"
            className="input"
            value={transferForm.fromLast}
            onChange={(e) => setTransferForm({ ...transferForm, fromLast: e.target.value })}
          />
          <input
            type="text"
            placeholder="Recipient First Name"
            className="input"
            value={transferForm.toFirst}
            onChange={(e) => setTransferForm({ ...transferForm, toFirst: e.target.value })}
          />
          <input
            type="text"
            placeholder="Recipient Last Name"
            className="input"
            value={transferForm.toLast}
            onChange={(e) => setTransferForm({ ...transferForm, toLast: e.target.value })}
          />
          <input
            type="number"
            placeholder="Amount"
            className="input"
            value={transferForm.amount}
            onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
          />
        </div>
        <button className="btn info" onClick={handleTransfer}>
          Transfer
        </button>
        {transferStatus && (
          <p className={`status-message ${transferStatus.success ? 'status-success' : 'status-error'}`}>
            {transferStatus.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default AccountActionsPage;
