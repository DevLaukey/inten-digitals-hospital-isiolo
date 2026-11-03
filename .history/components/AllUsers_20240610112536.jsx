import React from "react";

const users = [
  { name: "Kate Onyango", id: "UID8099843", role: "ADMIN" },
  { name: "Dennis Kyalo", id: "UID8099843", role: "STAFF" },
  { name: "Yvonne Kyalo", id: "UID8099843", role: "STAFF" },
  { name: "Levis Kimani", id: "UID8029343", role: "ADMIN" },
  { name: "Cynthia Mutuku", id: "UID88940923", role: "CASHIER" },
];

const AllUsersPage = () => {
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">ALL USERS</h2>
            <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
              Add User <i className="fas fa-plus ml-2"></i>
            </button>
          </div>
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">USER DETAILS</th>
                <th className="py-2 px-4 border-b">ROLE</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={index} className="border-b hover:bg-gray-100">
                  <td className="py-2 px-4 flex items-center">
                    <i className="fas fa-user-circle text-3xl mr-4"></i>
                    <div>
                      <p className="font-bold">{user.name}</p>
                      <p className="text-gray-600">{user.id}</p>
                    </div>
                  </td>
                  <td className="py-2 px-4">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </main>
      </div>
    </div>
  );
};

export default AllUsersPage;
