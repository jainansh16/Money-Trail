//DataContext.jsx to load real data
import { createContext, useEffect, useState } from "react";

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [accountsData, setAccountsData] = useState(null);
  const [alertsData, setAlertsData] = useState(null);
  const [merchantsData, setMerchantsData] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/accounts")
      .then(res => res.json())
      .then(data => setAccountsData(data));

    fetch("http://localhost:5000/api/alerts")
      .then(res => res.json())
      .then(data => setAlertsData(data));

    fetch("http://localhost:5000/api/merchants")
      .then(res => res.json())
      .then(data => setMerchantsData(data));
  }, []);

  return (
    <DataContext.Provider value={{ accountsData, alertsData, merchantsData }}>
      {children}
    </DataContext.Provider>
  );
};