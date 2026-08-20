import React from "react";
import { Wallet, LogOut, User, Sparkles } from "lucide-react";

interface HeaderProps {
  user: { name: string; email: string };
  onSignOut: () => void;
}

export default function Header({ user, onSignOut }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 h-16">
      <div className="mx-auto px-6 sm:px-8 h-full">
        <div className="flex justify-between h-full items-center">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Wallet className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 tracking-tight block">
                Finlytics AI
              </span>
              <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block -mt-1 flex items-center gap-0.5">
                <Sparkles className="h-3 w-3" /> Intelligent Finance
              </span>
            </div>
          </div>

          {/* User info and Signout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-800">{user.name}</span>
              <span className="text-[10px] text-slate-500 font-medium">{user.email}</span>
            </div>
            
            <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-200">
              <User className="h-4 w-4" />
            </div>

            <div className="h-4 w-px bg-slate-200"></div>

            <button
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-700 text-xs font-bold rounded-md border border-slate-200 hover:border-red-200 transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
