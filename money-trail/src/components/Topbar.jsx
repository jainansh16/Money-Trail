import SearchBar from "./SearchBar"; // ✅ Import it

const Topbar = () => {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem" }}>
      
      {/* LEFT: Custom SearchBar Component */}
      <SearchBar />

      {/* RIGHT: Profile Icon */}
      <div className="avatar" />
    </header>
  );
};

export default Topbar;
