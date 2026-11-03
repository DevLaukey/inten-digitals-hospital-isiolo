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
    <div className="flex items-center justify-center min-h-screen bg-white p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-lg">
        <div className="absolute inset-y-0 right-0 w-full md:w-1/2 bg-gray-50 shadow-md rounded-xl p-10">
          <div className="flex justify-center items-center mb-10">
            <div className="text-blue-500 text-4xl font-bold tracking-wider">
              LOGIN
            </div>
          </div>
          <div className="flex justify-center items-center mb-4">
            <div className="text-black text-2xl font-semibold tracking-wider">
              NAME
            </div>
          </div>
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-center text-black text-2xl font-bold">
            WELCOME BACK TO NAME
          </div>
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-full px-4 md:w-auto">
            <div className="flex items-center mb-4">
              <div className="w-full md:w-72 h-12 border-2 border-gray-300 rounded-md flex items-center pl-4">
                <div className="w-5 h-5 bg-black mr-4"></div>
                <input
                  type="text"
                  placeholder="User ID"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="bg-transparent text-black text-lg font-bold outline-none w-full"
                />
              </div>
            </div>
            <div className="flex items-center mb-4">
              <div className="w-full md:w-72 h-12 border-2 border-gray-300 rounded-md flex items-center pl-4">
                <div className="w-5 h-5 bg-black mr-4"></div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-transparent text-black text-lg font-bold outline-none w-full"
                />
              </div>
            </div>
            {error && (
              <div className="text-red-500 text-center mb-4">{error}</div>
            )}
          </div>
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2">
            <button
              onClick={handleLogin}
              className="w-36 h-10 bg-blue-500 text-white text-lg font-semibold rounded-md flex items-center justify-center"
            >
              Continue
            </button>
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-black text-sm font-semibold">
            Terms and conditions apply
          </div>
        </div>
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
          <div className="w-18 h-18 bg-white rounded-full border border-black flex items-center justify-center">
            <div className="text-blue-500 text-xl font-semibold">LOGO</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
