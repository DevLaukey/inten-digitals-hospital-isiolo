import React from "react";

const products = [
  {
    name: "Juicy Chicken Burgers",
    price: "Ksh 900",
    discount: "15% Ksh 900 off",
    image: "burger.jpg",
  },
  {
    name: "Juicy Chicken Burgers",
    price: "Ksh 900",
    discount: "15% Ksh 900 off",
    image: "burger.jpg",
  },
  {
    name: "Juicy Chicken Burgers",
    price: "Ksh 900",
    discount: "15% Ksh 900 off",
    image: "burger.jpg",
  },
  {
    name: "Juicy Chicken Burgers",
    price: "Ksh 900",
    discount: "15% Ksh 900 off",
    image: "burger.jpg",
  },
  {
    name: "Juicy Pork Burgers",
    price: "Ksh 900",
    discount: "Price per item",
    image: "burger.jpg",
  },
  {
    name: "Juicy Pork Burgers",
    price: "Ksh 900",
    discount: "Price per item",
    image: "burger.jpg",
  },
  {
    name: "Juicy Pork Burgers",
    price: "Ksh 900",
    discount: "Price per item",
    image: "burger.jpg",
  },
  {
    name: "Juicy Pork Burgers",
    price: "Ksh 900",
    discount: "Price per item",
    image: "burger.jpg",
  },
];

const categories = [
  "ALL",
  "Kid's Corner",
  "Snacks",
  "Main meal",
  "Drinks",
  "Family Pack",
];

const ClientSide = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="flex items-center justify-between p-4 bg-white shadow-md">
        <div className="flex items-center">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center mr-4">
            <span className="text-2xl font-bold text-white">LOGO</span>
          </div>
          <h1 className="text-2xl font-bold">TODAY'S SPECIAL</h1>
        </div>
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Search for product"
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button className="ml-4 px-4 py-2 bg-yellow-500 text-white font-bold rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500">
            Filter <i className="fas fa-filter ml-2"></i>
          </button>
        </div>
      </header>
      <main className="flex-grow p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {products.slice(0, 4).map((product, index) => (
            <div key={index} className="p-4 bg-white rounded-lg shadow-md">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-gray-500 text-sm">{product.discount}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xl font-bold">{product.price}</span>
                <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
                  Order
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center mb-6">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`px-4 py-2 font-bold rounded-lg mx-2 focus:outline-none ${
                category === "ALL"
                  ? "bg-blue-600 text-white"
                  : "bg-transparent border border-blue-600 text-blue-600 hover:bg-blue-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.slice(4).map((product, index) => (
            <div key={index} className="p-4 bg-white rounded-lg shadow-md">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="text-gray-500 text-sm">{product.discount}</p>
              <div className="flex justify-between items-center mt-4">
                <span className="text-xl font-bold">{product.price}</span>
                <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
                  Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default ClientSide;
