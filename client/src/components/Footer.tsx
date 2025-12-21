import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white py-8 mt-auto w-full">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        
        {/* Left Section: Brand & License */}
        <div className="mb-4 md:mb-0 text-center md:text-left">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            CP Battles
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            © {new Date().getFullYear()} CP Battles • MIT Licensed
          </p>
        </div>

        {/* Middle Section: KWoC Badge */}
        <div className="mb-4 md:mb-0">
          <div className="bg-gray-800 px-4 py-2 rounded-full border border-gray-700">
            <span className="text-gray-300 text-sm">
              Built with <span className="text-red-500 animate-pulse">❤️</span> for 
              <a 
                href="https://kwoc.kossiitkgp.org/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="ml-1 font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                KWoC 2025
              </a>
            </span>
          </div>
        </div>

        {/* Right Section: Links */}
        <div className="flex space-x-6">
          <a 
            href="https://github.com/dipamsen/cpbattles" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-400 hover:text-white transition-transform transform hover:scale-110"
          >
            GitHub Repo
          </a>
          <a 
            href="https://github.com/dipamsen/cpbattles/graphs/contributors" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-gray-400 hover:text-white transition-transform transform hover:scale-110"
          >
            Contributors
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;