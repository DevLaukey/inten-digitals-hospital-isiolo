import React from 'react'

function Register() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md px-8 py-6 bg-white shadow-md rounded-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">LOGO</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-blue-600">REGISTRATION</h2>
          <h3 className="text-center text-lg font-medium text-gray-700 mt-2">
            WELCOME TO NAME
          </h3>
        </div>
        <form>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="name">
              <i className="fas fa-user"></i> Your Name
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="businessName">
              <i className="fas fa-briefcase"></i> Business Name
            </label>
            <input
              type="text"
              id="businessName"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="industry">
              <i className="fas fa-industry"></i> Industry
            </label>
            <input
              type="text"
              id="industry"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="email">
              <i className="fas fa-envelope"></i> Work Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="phone">
              <i className="fas fa-phone"></i> Phone/ WhatsApp
            </label>
            <input
              type="tel"
              id="phone"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 mb-2" htmlFor="country">
              <i className="fas fa-globe"></i> Country
            </label>
            <input
              type="text"
              id="country"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            Let's Continue
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register