import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import BookShowcase from './components/BookShowcase';
import AdminDashboard from './components/AdminDashboard';

const API_URL = "https://script.google.com/macros/s/AKfycbxCv7ZheMAbG-hXFblLfQJOvYJJfXIDfAfMdpgNC7atLSSgVxxRvJTaUQJdXc18lTdy7A/exec";

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
              <span className="text-xl"></span>
              <span>Sonnet & co.</span>
            </Link>
            
            <div className="text-[11px] text-[#c9a77c] font-medium tracking-widest uppercase">
              © Copyright 2026 • All rights reserved
            </div>
          </div>
        </nav>

        <main>
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

      </div>
    </Router>
  );
}
