import React from "react";

const AddUserPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-grow">
        <aside className="w-64 bg-white border-r">
          <div className="p-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">LOGO</span>
            </div>
            <nav>
              <a
                href="#"
                className="flex items-center p-2 text-blue-600 font-bold"
              >
                <i className="fas fa-home mr-2"></i> HOME
              </a>
              <a
                href="#"
                className="flex items-center p-2 text-gray-700 hover:text-blue-600"
              >
                <i className="fas fa-box mr-2"></i> PRODUCTS
              </a>
              <a
                href="#"
                className="flex items-center p-2 text-gray-700 hover:text-blue-600"
              >
                <i className="fas fa-chart-line mr-2"></i> REPORTS
              </a>
              <a
                href="#"
                className="flex items-center p-2 text-gray-700 hover:text-blue-600"
              >
                <i className="fas fa-users mr-2"></i> USERS
              </a>
            </nav>
          </div>
          <div className="mt-auto p-4">
            <a
              href="#"
              className="flex items-center p-2 text-gray-700 hover:text-blue-600"
            >
              <i className="fas fa-cog mr-2"></i> SETTINGS
            </a>
            <a
              href="#"
              className="flex items-center p-2 text-gray-700 hover:text-blue-600"
            >
              <i className="fas fa-question-circle mr-2"></i> HELP
            </a>
            <a
              href="#"
              className="flex items-center p-2 text-blue-600 font-bold"
            >
              <i className="fas fa-life-ring mr-2"></i> SUPPORT
            </a>
          </div>
        </aside>
        <main className="flex-grow p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-6">ADD A NEW USER</h2>
          <form>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="firstName">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label
                  className="block text-gray-700 mb-2"
                  htmlFor="middleName"
                >
                  Middle Name
                </label>
                <input
                  type="text"
                  id="middleName"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div>
                <label
                  className="block text-gray-700 mb-2"
                  htmlFor="nationalId"
                >
                  National ID/Passport
                </label>
                <input
                  type="text"
                  id="nationalId"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="gender">
                  Gender
                </label>
                <input
                  type="text"
                  id="gender"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label
                  className="block text-gray-700 mb-2"
                  htmlFor="mobileNumber"
                >
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="mobileNumber"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="town">
                  Town
                </label>
                <input
                  type="text"
                  id="town"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="street">
                  Street
                </label>
                <input
                  type="text"
                  id="street"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="role">
                  Role
                </label>
                <input
                  type="text"
                  id="role"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label
                  className="block text-gray-700 mb-2"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <div className="flex justify-between">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                ADD USER
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-transparent text-blue-600 font-bold border border-blue-600 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                VIEW USERS
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AddUserPage;
