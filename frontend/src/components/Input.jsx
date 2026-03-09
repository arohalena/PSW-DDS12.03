import React from "react";
import "../styles/Input.css";

export default function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  error
}) {
  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}

      <input
        className="input-field"
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />

      {error && <p className="input-error">{error}</p>}
    </div>
  );
}