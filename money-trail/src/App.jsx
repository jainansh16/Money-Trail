import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import AccountDetail from './pages/AccountDetail';

import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Merchants from './pages/Merchants';
import Alerts from './pages/Alerts';

import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Sidebar />
        <div className="main-content">
          <Topbar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/account/:id" element={<AccountDetail />} />
            <Route path="/merchants" element={<Merchants />} />
            <Route path="/alerts" element={<Alerts />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;