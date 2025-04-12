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

  const handleCreateCustomer = () => {
    if (createForm.firstName && createForm.lastName) {
      setCreateStatus({ success: true, message: `Created account for ${createForm.firstName} ${createForm.lastName}` });
    } else {
      setCreateStatus({ success: false, message: "Please fill in both first and last name." });
    }
  };

  const handleTransaction = (type) => {
    if (transactionForm.firstName && transactionForm.lastName && transactionForm.amount) {
      setTransactionStatus({ success: true, message: `${type.toUpperCase()} of $${transactionForm.amount} completed.` });
    } else {
      setTransactionStatus({ success: false, message: "All fields are required for this transaction." });
    }
  };

  const handleTransfer = () => {
    const { fromFirst, fromLast, toFirst, toLast, amount } = transferForm;
    if (fromFirst && fromLast && toFirst && toLast && amount) {
      setTransferStatus({ success: true, message: `Transferred $${amount} successfully.` });
    } else {
      setTransferStatus({ success: false, message: "Please fill in all transfer fields." });
    }
  };

  return (
    <div className="account-actions-container">
      <h1 className="page-title">Account Actions</h1>

      {/* Create Customer */}
      <div className="section-box">
        <h2>Create New Customer</h2>
        <div className="form-row">
          <input type="text" placeholder="First Name" className="input"
            value={createForm.firstName}
            onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
          />
          <input type="text" placeholder="Last Name" className="input"
            value={createForm.lastName}
            onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
          />
        </div>
        <button className="btn primary" onClick={handleCreateCustomer}>Create Account</button>
        {createStatus && (
          <p className={`status-message ${createStatus.success ? 'status-success' : 'status-error'}`}>
            {createStatus.message}
          </p>
        )}
      </div>

      {/* Deposit / Withdrawal / Payment */}
      <div className="section-box">
        <h2>Deposit / Withdrawal / Payment</h2>
        <div className="form-row">
          <input type="text" placeholder="First Name" className="input"
            value={transactionForm.firstName}
            onChange={(e) => setTransactionForm({ ...transactionForm, firstName: e.target.value })}
          />
          <input type="text" placeholder="Last Name" className="input"
            value={transactionForm.lastName}
            onChange={(e) => setTransactionForm({ ...transactionForm, lastName: e.target.value })}
          />
          <input type="number" placeholder="Amount" className="input"
            value={transactionForm.amount}
            onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
          />
        </div>
        <div className="button-group">
          <button className="btn success" onClick={() => handleTransaction("deposit")}>Deposit</button>
          <button className="btn warning" onClick={() => handleTransaction("withdraw")}>Withdraw</button>
          <button className="btn info" onClick={() => handleTransaction("payment")}>Payment</button>
        </div>
        {transactionStatus && (
          <p className={`status-message ${transactionStatus.success ? 'status-success' : 'status-error'}`}>
            {transactionStatus.message}
          </p>
        )}
      </div>

      {/* Transfer */}
      <div className="section-box">
        <h2>Transfer Between Accounts</h2>
        <div className="form-row">
          <input type="text" placeholder="Payer First Name" className="input"
            value={transferForm.fromFirst}
            onChange={(e) => setTransferForm({ ...transferForm, fromFirst: e.target.value })}
          />
          <input type="text" placeholder="Payer Last Name" className="input"
            value={transferForm.fromLast}
            onChange={(e) => setTransferForm({ ...transferForm, fromLast: e.target.value })}
          />
          <input type="text" placeholder="Recipient First Name" className="input"
            value={transferForm.toFirst}
            onChange={(e) => setTransferForm({ ...transferForm, toFirst: e.target.value })}
          />
          <input type="text" placeholder="Recipient Last Name" className="input"
            value={transferForm.toLast}
            onChange={(e) => setTransferForm({ ...transferForm, toLast: e.target.value })}
          />
          <input type="number" placeholder="Amount" className="input"
            value={transferForm.amount}
            onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
          />
        </div>
        <button className="btn info" onClick={handleTransfer}>Transfer</button>
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