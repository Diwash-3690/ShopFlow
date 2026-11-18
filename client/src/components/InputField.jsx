import React from "react";

function InputField({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  name,
  required = false,
  error = "",
}) {
  return (
    <div className="space-y-1.5 text-left">
      {label && (
        <label className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition ${
          error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-200"
        }`}
      />
      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
    </div>
  );
}

export default InputField;
