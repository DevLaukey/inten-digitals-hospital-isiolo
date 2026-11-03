import Image from "next/image";

export default function Home() {
  return (
    <div class="flex items-center justify-center h-screen bg-white">
      <div class="relative w-full max-w-6xl h-full bg-white">
        <div class="absolute inset-y-0 right-0 w-1/2 bg-gray-50 shadow-md rounded-xl p-10">
          <div class="flex justify-center items-center mb-10">
            <div class="text-blue-500 text-4xl font-bold tracking-wider">
              LOGIN
            </div>
          </div>
          <div class="flex justify-center items-center mb-4">
            <div class="text-black text-2xl font-semibold tracking-wider">
              NAME
            </div>
          </div>
          <div class="absolute top-1/4 left-1/2 transform -translate-x-1/2 text-center text-black text-2xl font-bold">
            WELCOME BACK TO NAME
          </div>
          <div class="absolute top-1/3 left-1/2 transform -translate-x-1/2">
            <div class="flex items-center mb-4">
              <div class="w-72 h-12 border-2 border-gray-300 rounded-md flex items-center pl-4">
                <div class="w-5 h-5 bg-black mr-4"></div>
                <div class="text-black text-lg font-bold">User ID</div>
              </div>
            </div>
            <div class="flex items-center mb-4">
              <div class="w-72 h-12 border-2 border-gray-300 rounded-md flex items-center pl-4">
                <div class="w-5 h-5 bg-black mr-4"></div>
                <div class="text-black text-lg font-bold">Password</div>
              </div>
            </div>
          </div>
          <div class="absolute bottom-16 left-1/2 transform -translate-x-1/2">
            <button class="w-36 h-10 bg-blue-500 text-white text-lg font-semibold rounded-md flex items-center justify-center">
              Continue
            </button>
          </div>
          <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-black text-sm font-semibold">
            Terms and conditions apply
          </div>
        </div>
        <div class="absolute top-10 left-1/2 transform -translate-x-1/2">
          <div class="w-18 h-18 bg-white rounded-full border border-black flex items-center justify-center">
            <div class="text-blue-500 text-xl font-semibold">LOGO</div>
          </div>
        </div>
      </div>
    </div>
  );
}
