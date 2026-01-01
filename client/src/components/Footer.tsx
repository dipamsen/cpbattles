import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-white py-6 mt-auto w-full border-t border-slate-800">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          CP Battles
        </div>

        <div>
          <a
            href="https://github.com/dipamsen/cpbattles"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors font-medium"
          >
            {"</>"} Source on GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
