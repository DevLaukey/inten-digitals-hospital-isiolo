"use client"
import { supabase } from "@/config/supabase";
import React, { useState } from "react";


function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    const { user, session, error } = await supabase.auth.signIn({
      email: userId,
      password: password,
    });

    if (error) {
      setError(error.message);
    } else {
      console.log("Logged in:", user);
      // Handle successful login, redirect or update UI
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-8 py-6 bg-white shadow-md rounded-lg">
        <div className="flex justify-center mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-2xl font-bold text-blue-600">LOGO</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">LOGIN</h2>
          </div>
        </div>
        <h3 className="text-center text-lg font-medium text-gray-700 mb-8">
          WELCOME BACK TO NAME
        </h3>
        <form>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="userId">
              User ID
            </label>
            <input
              type="text"
              id="userId"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            Continue
          </button>
        </form>
        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-gray-600 hover:underline">
            Terms and conditions apply
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;
