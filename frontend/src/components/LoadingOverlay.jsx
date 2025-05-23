import ReactDOM from "react-dom";
import React from "react";
import "./LoadingOverlay.css";

export default function LoadingOverlay() {
  return ReactDOM.createPortal(
    <div className="loading-overlay">
      <div className="spinner" />
    </div>,
    document.body
  );
}
