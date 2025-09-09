import React, { useState } from "react";
import PropTypes from "prop-types";
import { signup, login } from "../lib/api.js";

const initialState = {
  email: "",
  password: "",
  confirmPassword: "",
  displayName: "",
};

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [fields, setFields] = useState(initialState);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
    setError("");
    setSuccess("");
  };

  const validate = () => {
    if (!fields.email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) return "Enter a valid email.";
    if (!fields.password) return "Password is required.";
    if (mode === "signup") {
      if (!fields.displayName) return "Display name is required.";
      if (fields.password !== fields.confirmPassword) return "Passwords do not match.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const v = validate();
    if (v) return setError(v);
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await login(fields.email, fields.password);
        setSuccess("Login successful!");
        onAuth(res);
      } else {
        await signup(fields.email, fields.password, fields.displayName);
        setSuccess("Signup successful! Please log in.");
        setMode("login");
        setFields(initialState);
      }
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-[#1F2937]">
      <div className="flex w-full max-w-3xl shadow-lg rounded-2xl overflow-hidden bg-white dark:bg-[#232b3a]">
        {/* Left: Logo/Tagline */}
        <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-[#3B82F6] text-white p-10">
          <div className="mb-6">
            {/* Placeholder logo */}
            <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-4xl font-bold">
              💬
            </div>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Welcome to ChatApp</h2>
          <p className="text-lg opacity-80">Connect. Chat. Enjoy.</p>
        </div>
        {/* Right: Form */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">
          <h1 className="text-2xl font-bold text-[#111827] dark:text-[#F9FAFB] mb-6 text-center">
            {mode === "login" ? "Sign in to your account" : "Create an account"}
          </h1>
          <form className="space-y-4" onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                Email address
              </label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#3B82F6] focus:outline-none bg-[#F9FAFB] dark:bg-[#232b3a] text-[#111827] dark:text-[#F9FAFB]"
                type="email"
                id="email"
                name="email"
                value={fields.email}
                onChange={handleChange}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="password">
                Password
              </label>
              <input
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#3B82F6] focus:outline-none bg-[#F9FAFB] dark:bg-[#232b3a] text-[#111827] dark:text-[#F9FAFB]"
                type="password"
                id="password"
                name="password"
                value={fields.password}
                onChange={handleChange}
                required
              />
            </div>
            {mode === "signup" && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="confirmPassword">
                    Confirm password
                  </label>
                  <input
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#3B82F6] focus:outline-none bg-[#F9FAFB] dark:bg-[#232b3a] text-[#111827] dark:text-[#F9FAFB]"
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={fields.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="displayName">
                    Display name
                  </label>
                  <input
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-[#3B82F6] focus:outline-none bg-[#F9FAFB] dark:bg-[#232b3a] text-[#111827] dark:text-[#F9FAFB]"
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={fields.displayName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}
            {error && <div className="text-red-600 text-sm text-center">{error}</div>}
            {success && <div className="text-green-600 text-sm text-center">{success}</div>}
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-[#3B82F6] text-white font-semibold text-lg mt-2 hover:bg-blue-600 transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>
          <div className="mt-6 text-center text-sm">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="text-[#3B82F6] hover:underline font-medium"
                  onClick={() => {
                    setMode("signup");
                    setError("");
                    setSuccess("");
                  }}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-[#3B82F6] hover:underline font-medium"
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setSuccess("");
                  }}
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

AuthForm.propTypes = {
  onAuth: PropTypes.func.isRequired,
};
