"use client"
import React from "react";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";

const DashboardPage = () => {
  const barData = {
    labels: [
      "Category A",
      "Category B",
      "Category C",
      "Category D",
      "Category E",
      "Category F",
    ],
    datasets: [
      {
        label: "Categories",
        data: [25, 18, 30, 22, 15, 12],
        backgroundColor: [
          "#ff6384",
          "#ff9f40",
          "#ffcd56",
          "#4bc0c0",
          "#36a2eb",
          "#9966ff",
        ],
      },
    ],
  };

  const pieData = {
    labels: [
      "Hispanic",
      "White",
      "African American",
      "American Indian",
      "Asian/Pacific Islander",
      "Other",
    ],
    datasets: [
      {
        data: [45.4, 35.7, 9.3, 0.4, 8.9, 0.3],
        backgroundColor: [
          "#ff6384",
          "#36a2eb",
          "#ffcd56",
          "#4bc0c0",
          "#ff9f40",
          "#9966ff",
        ],
      },
    ],
  };

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="p-4 bg-blue-100 rounded-lg shadow-md">
              <h3 className="text-xl font-bold">23984</h3>
              <p className="text-gray-700">Number of Customers</p>
            </div>
            <div className="p-4 bg-orange-100 rounded-lg shadow-md">
              <h3 className="text-xl font-bold">15%</h3>
              <p className="text-gray-700">Sales this week</p>
            </div>
            <div className="p-4 bg-green-100 rounded-lg shadow-md">
              <h3 className="text-xl font-bold">30%</h3>
              <p className="text-gray-700">Expenses</p>
            </div>
            <div className="p-4 bg-white rounded-lg shadow-md col-span-1 lg:col-span-3 flex items-center">
              <div className="mr-4">
                <img
                  src="burger.png"
                  alt="Trending Product"
                  className="w-20 h-20 object-cover rounded-full"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold">Trending Product</h3>
                <p className="text-gray-700">150 Orders</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-4 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4">Bar Chart</h3>
              <Bar data={barData} />
            </div>
            <div className="p-4 bg-white rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4">Pie Chart</h3>
              <Pie data={pieData} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
