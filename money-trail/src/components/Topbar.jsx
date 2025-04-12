const Topbar = () => {
    return (
      <header>
        {/* LEFT: Search Bar */}
        <input
          type="text"
          placeholder="Search accounts, merchants..."
          style={{
            padding: "0.5rem",
            borderRadius: "5px",
            border: "1px solid #ccc",
            width: "600px",
            maxWidth: "100%",
          }}
        />
  
        {/* RIGHT: Profile Icon */}
        <div className="avatar" />
      </header>
    );
  };
  
  export default Topbar;  