import React, { useState, useEffect } from "react";

// วาง URL ของ Google Apps Script ล่าสุดของคุณที่นี่
const API_URL =
  "https://script.google.com/macros/s/AKfycbxCv7ZheMAbG-hXFblLfQJOvYJJfXIDfAfMdpgNC7atLSSgVxxRvJTaUQJdXc18lTdy7A/exec";

export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBook, setEditingBook] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // โหมดการดูหน้าเว็บ: "stock" (ดูคลังสินค้า) หรือ "summary" (ดูสรุปรายเดือน)
  const [viewMode, setViewMode] = useState("stock");
  const [monthlyData, setMonthlyData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState("");

  // State สำหรับแก้ไขสต็อกเดิม
  const [stockInput, setStockInput] = useState(0);
  const [soldInput, setSoldInput] = useState(0);
  const [noteInput, setNoteInput] = useState("");

  // State สำหรับการเพิ่มหนังสือใหม่
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    price: "",
    gp: "",
    stock: "",
    note: "",
  });

  // ฟังก์ชันดึงข้อมูลคลังสินค้า (JSONP)
  const fetchBooks = () => {
    setTimeout(() => {
      setLoading(true);
      const script = document.createElement("script");
      const callbackName = "jsonp_" + Math.round(100000 * Math.random());

      window[callbackName] = function (data) {
        if (data && data.error) {
          console.error("Apps Script Error:", data.error);
          alert("เกิดข้อผิดพลาดจาก Google Sheets: " + data.error);
        } else if (Array.isArray(data)) {
          setBooks(data);
        }
        setLoading(false);
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
        delete window[callbackName];
      };

      script.src = `${API_URL}?callback=${callbackName}`;

      script.onerror = () => {
        alert("ไม่สามารถเชื่อมต่อ Google Sheets ได้");
        setLoading(false);
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
        delete window[callbackName];
      };

      document.body.appendChild(script);
    }, 0);
  };

  // ฟังก์ชันดึงข้อมูลสรุปรายเดือน (JSONP)
  const fetchMonthlySummary = () => {
    setTimeout(() => {
      setLoading(true);
      const script = document.createElement("script");
      const callbackName =
        "jsonp_monthly_" + Math.round(100000 * Math.random());

      window[callbackName] = function (data) {
        if (data && data.error) {
          console.error("Apps Script Error:", data.error);
        } else {
          setMonthlyData(data);
          const months = Object.keys(data);
          if (months.length > 0 && !selectedMonth) {
            setSelectedMonth(months[months.length - 1]);
          }
        }
        setLoading(false);
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
        delete window[callbackName];
      };

      script.src = `${API_URL}?action=getMonthlySummary&callback=${callbackName}`;

      script.onerror = () => {
        setLoading(false);
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
        delete window[callbackName];
      };

      document.body.appendChild(script);
    }, 0);
  };

  // ดึงข้อมูลอัตโนมัติเมื่อเปิดหน้าเว็บ และทำระบบ Real-time ดึงข้อมูลทุกๆ 5 วินาที
  useEffect(() => {
    // 1. เรียกใช้งานทันทีครั้งแรกตอนเปิดหน้าเว็บ
    if (viewMode === "stock") {
      fetchBooks();
    } else if (viewMode === "summary") {
      fetchMonthlySummary();
    }

    // 2. ตั้งเวลาลูปดึงข้อมูลอัตโนมัติตลอดเวลา (ในตัวอย่างนี้ตั้งไว้ทุก 5000 มิลลิวินาที หรือ 5 วินาที)
    const interval = setInterval(() => {
      // ดึงเฉพาะข้อมูลของหน้าจอที่กำลังเปิดอยู่ เพื่อไม่ให้ระบบทำงานหนักเกินไป
      if (viewMode === "stock") {
        fetchBooks();
      } else if (viewMode === "summary") {
        fetchMonthlySummary();
      }
    }, 5000);

    // ล้าง Timer ออกเมื่อมีการสลับหน้าจอหรือปิดเว็บ เพื่อป้องกันไม่ให้เว็บหน่วง
    return () => clearInterval(interval);
  }, [viewMode]); // ระบบจะรีเซ็ตและนับเวลาใหม่ทุกครั้งที่คุณสลับโหมดหน้าจอ

  // ฟังก์ชันส่งข้อมูลเพิ่มหนังสือใหม่
  const handleAddBookSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addBook",
          title: newBook.title,
          author: newBook.author,
          price: newBook.price,
          gp: newBook.gp,
          stock: newBook.stock,
          note: newBook.note,
        }),
      });

      setTimeout(() => {
        setIsAdding(false);
        setNewBook({
          title: "",
          author: "",
          price: "",
          gp: "",
          stock: "",
          note: "",
        });
        fetchBooks();
      }, 1500);
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการเพิ่มหนังสือใหม่");
      setLoading(false);
    }
  };

  // ฟังก์ชันส่งข้อมูลอัปเดตสต็อก/ยอดขาย
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateStock",
          id: editingBook["ลำดับ"],
          stock: stockInput,
          sold: soldInput,
          note: noteInput,
        }),
      });

      setTimeout(() => {
        setEditingBook(null);
        fetchBooks();
      }, 1500);
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
      setLoading(false);
    }
  };

  const handleEditClick = (book) => {
    setEditingBook(book);
    setStockInput(Number(book["สต็อก"]) || 0);
    setSoldInput(Number(book["ขายออก"]) || 0);
    setNoteInput(book["หมายเหตุ"] || "");
  };

  const filteredBooks = books.filter(
    (book) =>
      String(book["ชื่อหนังสือ"] || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(book["ชื่อนักเขียน"] || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              ระบบเช็กสต็อกหนังสือ
            </h1>
            <p className="text-slate-500 mt-1">
              จัดการคลังสินค้าและสรุปยอดรายเดือนผ่าน Google Sheets
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setViewMode(viewMode === "stock" ? "summary" : "stock")
              }
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm font-medium transition cursor-pointer"
            >
              {viewMode === "stock" ? "📊 ดูสรุปรายเดือน" : "📋 ดูคลังสินค้า"}
            </button>
            {viewMode === "stock" && (
              <button
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm font-medium transition cursor-pointer"
              >
                ➕ เพิ่มหนังสือใหม่
              </button>
            )}
            <button
              onClick={viewMode === "stock" ? fetchBooks : fetchMonthlySummary}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition cursor-pointer disabled:opacity-50"
            >
              {loading ? "กำลังโหลด..." : "🔄 รีเฟรช"}
            </button>
          </div>
        </header>

        {/* ─── โหมด 1: ตารางคลังสินค้าปกติ ─── */}
        {viewMode === "stock" && (
          <>
            {/* ช่องค้นหา */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="🔍 ค้นหาชื่อหนังสือ หรือ ชื่อนักเขียน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md px-4 py-2.5 rounded-lg border border-slate-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
              />
            </div>

            {/* ตารางข้อมูลสต็อก */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
              {loading && books.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-medium">
                  กำลังโหลดคลังสินค้า...
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-semibold uppercase">
                      <th className="px-4 py-3">ลำดับ</th>
                      <th className="px-6 py-3">ชื่อหนังสือ</th>
                      <th className="px-6 py-3">ชื่อนักเขียน</th>
                      <th className="px-4 py-3 text-right">ราคาปก</th>
                      <th className="px-4 py-3 text-right">GP</th>
                      <th className="px-4 py-3 text-center">สต็อก</th>
                      <th className="px-4 py-3 text-center">ขายออก</th>
                      <th className="px-4 py-3 text-center bg-indigo-50/50 text-indigo-950 font-bold">
                        คงเหลือ
                      </th>
                      <th className="px-4 py-3 text-right font-bold text-emerald-800 bg-emerald-50/50">
                        ยอดรวม
                      </th>
                      <th className="px-6 py-3">หมายเหตุ</th>
                      <th className="px-4 py-3 text-center">จัดการสต็อก</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBooks.map((book, index) => (
                      <tr
                        key={index}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-4 py-4 text-slate-400 font-medium">
                          {book["ลำดับ"]}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-900">
                          {book["ชื่อหนังสือ"]}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {book["ชื่อนักเขียน"]}
                        </td>
                        <td className="px-4 py-4 text-right">
                          ฿{Number(book["ราคาปก"] || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {(Number(book["GP"] || 0) * 100).toFixed(0)}%
                        </td>
                        <td className="px-4 py-4 text-center text-slate-600 font-semibold">
                          {book["สต็อก"]}
                        </td>
                        <td className="px-4 py-4 text-center text-rose-600 font-semibold">
                          {book["ขายออก"]}
                        </td>
                        <td className="px-4 py-4 text-center font-bold bg-indigo-50/20 text-indigo-700">
                          {book["คงเหลือ"]}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-emerald-700 bg-emerald-50/20">
                          ฿{Number(book["ยอดรวม"] || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate">
                          {book["หมายเหตุ"] || "-"}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleEditClick(book)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-xs transition cursor-pointer"
                          >
                            ✏️ อัปเดตสต็อก
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ─── โหมด 2: ตารางสรุปยอดขายรายเดือน ─── */}
        {viewMode === "summary" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  สรุปยอดขายแยกตามรายเดือน
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  คำนวณจากประวัติการปรับปรุงยอดขายออก
                </p>
              </div>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- เลือกเดือนที่ต้องการดู --</option>
                {Object.keys(monthlyData)
                  .sort()
                  .reverse()
                  .map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                    <th className="px-6 py-3">ชื่อหนังสือ</th>
                    <th className="px-6 py-3 text-center">
                      จำนวนที่ขายได้ในเดือนนี้
                    </th>
                    <th className="px-6 py-3 text-right">
                      รายรับรวม (ราคาหัก GP แล้ว)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedMonth && monthlyData[selectedMonth] ? (
                    Object.keys(monthlyData[selectedMonth]).map(
                      (title, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            {title}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-indigo-600">
                            {monthlyData[selectedMonth][title].qty} เล่ม
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-emerald-700">
                            ฿
                            {monthlyData[selectedMonth][
                              title
                            ].total.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ),
                    )
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="p-12 text-center text-slate-400 font-medium"
                      >
                        ยังไม่มีประวัติการบันทึกยอดขายในระบบ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── POPUP 1: เพิ่มหนังสือใหม่ ─── */}
        {isAdding && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-emerald-50">
                <h3 className="text-lg font-bold text-emerald-950">
                  ➕ เพิ่มหนังสือเล่มใหม่
                </h3>
              </div>

              <form onSubmit={handleAddBookSubmit} className="p-6 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    ชื่อหนังสือ
                  </label>
                  <input
                    type="text"
                    required
                    value={newBook.title}
                    onChange={(e) =>
                      setNewBook({ ...newBook, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    ชื่อนักเขียน
                  </label>
                  <input
                    type="text"
                    required
                    value={newBook.author}
                    onChange={(e) =>
                      setNewBook({ ...newBook, author: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      ราคาปก (฿)
                    </label>
                    <input
                      type="number"
                      required
                      value={newBook.price}
                      onChange={(e) =>
                        setNewBook({ ...newBook, price: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      GP (%)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="เช่น 30"
                      value={newBook.gp}
                      onChange={(e) =>
                        setNewBook({ ...newBook, gp: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      สต็อกเริ่มแรก
                    </label>
                    <input
                      type="number"
                      required
                      value={newBook.stock}
                      onChange={(e) =>
                        setNewBook({ ...newBook, stock: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    หมายเหตุ
                  </label>
                  <textarea
                    value={newBook.note}
                    onChange={(e) =>
                      setNewBook({ ...newBook, note: e.target.value })
                    }
                    rows="2"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800"
                  ></textarea>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition cursor-pointer"
                  >
                    {loading ? "กำลังบันทึก..." : "💾 บันทึกเล่มใหม่"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── POPUP 2: แก้ไขและอัปเดตสต็อกเดิม ─── */}
        {editingBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">
                  ✏️ อัปเดตข้อมูลหนังสือ
                </h3>
                <p className="text-sm text-slate-500 mt-1 truncate">
                  {editingBook["ชื่อหนังสือ"]}
                </p>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    จำนวนสต็อกตั้งต้น (รวมทั้งหมด)
                  </label>
                  <input
                    type="number"
                    value={stockInput}
                    onChange={(e) => setStockInput(Number(e.target.value))}
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    จำนวนรวมที่ขายออกไปแล้ว
                  </label>
                  <input
                    type="number"
                    value={soldInput}
                    onChange={(e) => setSoldInput(Number(e.target.value))}
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">
                    หมายเหตุ
                  </label>
                  <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    rows="2"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-800"
                  ></textarea>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingBook(null)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition cursor-pointer"
                  >
                    {loading ? "กำลังบันทึก..." : "💾 บันทึกข้อมูล"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
