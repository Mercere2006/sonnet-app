import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';


import BookShowcase from './components/BookShowcase';
import AdminDashboard from './components/AdminDashboard';

const API_URL = import.meta.env.VITE_APP_SCRIPT_API_KEY;

export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBooks = async () => {
    try {
      const response = await fetch(`${API_URL}?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Network error");
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error(data?.message || "รูปแบบข้อมูลจาก Google Sheets ไม่ถูกต้อง");
      }
      setBooks(data);
      setLoading(false);
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
      throw error;
    }
  };

  useEffect(() => {
    fetchBooks().catch(() => {});
    const interval = setInterval(() => {
      fetchBooks().catch(() => {});
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="bg-[#fcfaf7] min-h-screen font-sans selection:bg-[#800020] selection:text-white">
        
        {/* Navbar โฉมใหม่: ธีมสีแดงเบอร์กันดีเข้มหรูหรา สไตล์ Sonnet & co. */}
        <nav className="bg-[#4a0414] border-b border-[#630f24] sticky top-0 z-40 shadow-md">
          <div className="max-w-8xl mx-auto px-4 sm:px-8 h-16 flex justify-between items-center">
            <Link to="/" className="font-serif font-black text-[#f1e6d2] tracking-wide text-lg sm:text-xl flex items-center gap-2">
              <span>Sonnet & co.</span>
            </Link>
            
            {/* โลโก้โซเชียลมีเดียในมุมขวาบน */}
            <div className="flex items-center gap-3">
              <a
                href="https://x.com/sonnetnco?s=20"
                target="_blank"
                rel="noopener noreferrer"
                title="ติดตาม Sonnet & co. บน Twitter (X)"
                className="w-9 h-9 rounded-full bg-slate-900/90 hover:bg-black text-white flex items-center justify-center font-bold text-sm shadow transition-all hover:scale-110 cursor-pointer border border-white/10"
              >
                𝕏
              </a>
              <a
                href="https://www.instagram.com/sonnetnco/"
                target="_blank"
                rel="noopener noreferrer"
                title="ติดตาม Sonnet & co. บน Instagram"
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:opacity-90 text-white flex items-center justify-center shadow transition-all hover:scale-110 cursor-pointer border border-white/10"
              >
                <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28-.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>
          </div>
        </nav>

        <main className="flex-1">
          <Routes>
            {/* หน้าร้านโชว์สินค้าสำหรับลูกค้า */}
            <Route 
              path="/" 
              element={<BookShowcase books={books} loading={loading} />} 
            />
            
            {/* หน้าแอดมินหลังบ้าน (ต้องพิมพ์ /admin เพื่อเข้า) */}
            <Route 
              path="/admin" 
              element={<AdminDashboard books={books} fetchBooks={fetchBooks} API_URL={API_URL} />} 
            />
          </Routes>
        </main>

        {/* Footer: ข้อความ Copyright แบบมินิมอลตรงกลางด้านล่าง */}
        <footer className="py-8 text-center text-[#8d6e63] text-[11px] font-medium tracking-widest uppercase mt-8 border-t border-[#efebe9]">
          © Copyright 2026 • All rights reserved
        </footer>

      </div>
    </Router>
  );
}
