import React from "react";

const products = [
  { name: "Product Name", description: "Product Description" },
  { name: "Product Name", description: "Product Description" },
  { name: "Product Name", description: "Product Description" },
  { name: "Product Name", description: "Product Description" },
  { name: "Product Name", description: "Product Description" },
  { name: "Product Name", description: "Product Description" },
];

const ProductListingPage = () => {
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
            <h2 className="text-2xl font-bold">PRODUCT LISTING</h2>
            <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600">
              Add <i className="fas fa-plus ml-2"></i>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <div key={index} className="p-4 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-700 mb-4">{product.description}</p>
                <div className="flex justify-between">
                  <button className="px-4 py-2 bg-transparent text-blue-600 font-bold border border-blue-600 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600">
                    Edit
                  </button>
                  <button className="px-4 py-2 bg-transparent text-pink-600 font-bold border border-pink-600 rounded-lg hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-600">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProductListingPage;
