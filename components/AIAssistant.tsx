import React from "react";

const AIAssistant: React.FC = () => {
  return (
    <section
      className="chatbot-panel"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "400px",
        maxWidth: "90vw",
        height: "760px",
        zIndex: 9999,
        background: "#fff",
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}
    >
      <iframe
        src="https://innoguid.netlify.app"
        title="InnoGuide Chatbot"
        width="100%"
        height="100%"
        style={{
          border: "none",
        }}
        loading="lazy"
        allow="clipboard-write"
      />
    </section>
  );
};

export default AIAssistant;
