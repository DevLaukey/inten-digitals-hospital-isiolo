import React from 'react'

function AddProduct() {
  return (
import React from 'react';

const AddProductPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-grow">
        <aside className="w-64 bg-white border-r">
          <div className="p-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">LOGO</span>
            </div>
            <nav>
              <a href="#" className="flex items-center p-2 text-blue-600 font-bold">
                <i className="fas fa-home mr-2"></i> HOME
              </a>
              <a href="#" className="flex items-center p-2 text-gray-700 hover:text-blue-600">
                <i className="fas fa-box mr-2"></i> PRODUCTS
              </a>
              <a href="#" className="flex items-center p-2 text-gray-700 hover:text-blue-600">
                <i className="fas fa-chart-line mr-2"></i> REPORTS
              </a>
              <a href="#" className="flex items-center p-2 text-gray-700 hover:text-blue-600">
                <i className="fas fa-users mr-2"></i> USERS
              </a>
            </nav>
          </div>
          <div className="mt-auto p-4">
            <a href="#" className="flex items-center p-2 text-gray-700 hover:text-blue-600">
              <i className="fas fa-cog mr-2"></i> SETTINGS
            </a>
            <a href="#" className="flex items-center p-2 text-gray-700 hover:text-blue-600">
              <i className="fas fa-question-circle mr-2"></i> HELP
            </a>
            <a href="#" className="flex items-center p-2 text-blue-600 font-bold">
              <i className="fas fa-life-ring mr-2"></i> SUPPORT
            </a>
          </div>
        </aside>
        <main className="flex-grow p-6 bg-gray-50">
          <h2 className="text-2xl font-bold mb-6">ADD A NEW PRODUCT</h2>
          <form className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Description</h3>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="productName">
                  Product Name
                </label>
                <input
                  type="text"
                  id="productName"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2" htmlFor="businessDescription">
                  Business Description
                </label>
                <input
                  type="text"
                  id="businessDescription"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product Image</h3>
              <div className="flex flex-col items-center justify-center w-full h-32 px-4 py-2 border-2 border-dashed rounded-lg cursor-pointer hover:border-blue-600">
                <span className="text-blue-600">Drag & Drop</span>
                <span className="text-gray-600">or</span>
                <button
                  type="button"
                  className="px-4 py-2 mt-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  Browse
                </button>
              </div>
            </div>
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-4">Category</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="category">
                    Category
                  </label>
                  <input
                    type="text"
                    id="category"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="brand">
                    Brand
                  </label>
                  <input
                    type="text"
                    id="brand"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4">Pricing and Inventory</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="sellingPrice">
                    Selling Price
                  </label>
                  <input
                    type="text"
                    id="sellingPrice"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="buyingPrice">
                    Buying Price
                  </label>
                  <input
                    type="text"
                    id="buyingPrice"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="discount">
                    Discount
                  </label>
                  <input
                    type="text"
                    id="discount"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="vat">
                    VAT
                  </label>
                  <input
                    type="text"
                    id="vat"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4">Inventory</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="quantity">
                    Quantity
                  </label>
                  <input
                    type="text"
                    id="quantity"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2" htmlFor="vendor">
                    Vendor
                  </label>
                  <input
                    type="text"
                    id="vendor"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-between col-span-2">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Add Product
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-transparent text-blue-600 font-bold border border-blue-600 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                Schedule
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AddProductPage;
  )
}

export default AddProduct