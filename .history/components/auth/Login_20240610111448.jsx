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
   <div className="flex items-center justify-center min-h-screen bg-white">
    <div className="w-full max-w-md px-8 py-10 bg-white rounded-xl shadow-md">
        <div className="flex justify-center mb-4">
            <div className="w-18 h-18 flex items-center justify-center border border-black rounded-full">
                <div className="text-blue-500 text-xl font-semibold">LO<br />GO</div>
            </div>
        </div>
        <div className="flex justify-center mb-8">
            <div className="text-blue-500 text-4xl font-bold tracking-wider">LOGIN</div>
        </div>
        <div className="text-center text-black text-xl font-bold mb-8">
            WELCOME BACK TO NAME
        </div>
        <div className="space-y-4">
            <div className="flex items-center border-2 border-gray-300 rounded-md px-4 py-2">
                <svg className="w-5 h-5 mr-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 8a6 6 0 1112 0 6 6 0 01-12 0zm12 10a8 8 0 10-10 0h10zm-8-4a4 4 0 118 0H6z"/>
                </svg>
                <input type="text" placeholder="User ID" className="w-full text-lg font-bold focus:outline-none"/>
            </div>
            <div className="flex items-center border-2 border-gray-300 rounded-md px-4 py-2">
                <svg className="w-5 h-5 mr-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a4 4 0 014 4v3a1 1 0 01-1 1H7a1 1 0 01-1-1V10a4 4 0 014-4zm0 2a2 2 0 00-2 2v3h4v-3a2 2 0 00-2-2z"/>
                </svg>
                <input type="password" placeholder="Password" className="w-full text-lg font-bold focus:outline-none"/>
            </div>
        </div>
        <div className="flex justify-center mt-8">
            <button className="w-36 h-10 bg-blue-500 text-white text-lg font-semibold rounded-md flex items-center justify-center">Continue</button>
        </div>
        <div className="flex justify-center mt-4 text-black text-sm font-semibold">
            Terms and conditions apply
        </div>
    </div>
    <div className="absolute top-4 right-4 text-black text-xl font-semibold tracking-widest">
        NAME
    </div>
</div>
  );
}

export default Login;
