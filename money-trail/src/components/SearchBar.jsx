import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    const input = query.trim().toLowerCase();

    const accounts = [
      { id: "123456", name: "John Doe" },
      { id: "789012", name: "Ansh Jain" },
      { id: "832541", name: "Mary Johnson" },
      { id: "763215", name: "David Black" },
      { id: "987654", name: "Susan White" }
    ];

    const merchants = ["ShellCorp", "ShellCorp LLC", "TravelCo", "CashDrop Express"];

    const alerts = [
      "High-Risk Transaction",
      "Pattern Detected",
      "Unusual Merchant Spike",
      "alert"
    ];

    const accountMatch = accounts.find(
      (acc) => acc.id === input || acc.name.toLowerCase().includes(input)
    );
    if (accountMatch) {
      navigate(`/account/${accountMatch.id}`);
      setQuery("");
      return;
    }

    const merchantMatch = merchants.find((m) => m.toLowerCase().includes(input));
    if (merchantMatch) {
      navigate("/merchants");
      setQuery("");
      setTimeout(() => {
        const element = [...document.querySelectorAll("td")].find(td =>
          td.textContent.toLowerCase().includes(merchantMatch.toLowerCase())
        );
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.style.backgroundColor = "#ffff99";
          setTimeout(() => element.style.backgroundColor = "", 1500);
        }
      }, 300);
      return;
    }

    const alertMatch = alerts.find((a) => a.toLowerCase().includes(input));
    if (alertMatch) {
      navigate("/alerts");
      setQuery("");
      setTimeout(() => {
        const el = [...document.querySelectorAll(".alert-box")].find(box =>
          box.textContent.toLowerCase().includes(input)
        );
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.style.border = "3px solid #FFD700";
          setTimeout(() => el.style.border = "", 1500);
        }
      }, 300);
      return;
    }

    alert("No matching account, merchant, or alert found.");
    setQuery(""); // Optional clear on fail
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <input
        type="text"
        placeholder="Search accounts, merchants..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        className="input search-input"
    />
  );
};

export default SearchBar;