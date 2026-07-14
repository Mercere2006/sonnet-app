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
  const [typeFilter, setTypeFilter] = useState("ทั้งหมด");
  const [viewMode, setViewMode] = useState("stock");

  const [stockInput, setStockInput] = useState(0);
  const [soldInput, setSoldInput] = useState(0);
  const [noteInput, setNoteInput] = useState("");

  const [newBook, setNewBook] = useState({
    type: "นักเขียนอิสระ",
    title: "",
    author: "",
    price: "",
    gp: "",
    stock: "",
    cost: "",
    salePrice: "",
    note: "",
  });

  const fetchBooks = async () => {
    try {
      const proxyUrl = `https://corsproxy.io/?url=${encodeURIComponent(API_URL)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Network response failed");
      const data = await response.json();

      if (data && data.error) {
        console.error("Apps Script Error:", data.error);
      } else if (Array.isArray(data)) {
        setBooks(data);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      try {
        const directResponse = await fetch(API_URL);
        const directText = await directResponse.text();
        const directData = JSON.parse(directText);
        if (Array.isArray(directData)) setBooks(directData);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
    const interval = setInterval(() => {
      fetchBooks();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
          type: newBook.type,
          title: newBook.title,
          author: newBook.author,
          price: newBook.price,
          gp: newBook.gp,
          stock: newBook.stock,
          cost: newBook.cost,
          salePrice: newBook.salePrice,
          note: newBook.note,
        }),
      });

      setTimeout(() => {
        setIsAdding(false);
        setNewBook({
          type: "นักเขียนอิสระ",
          title: "",
          author: "",
          price: "",
          gp: "",
          stock: "",
          cost: "",
          salePrice: "",
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

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      String(book["ชื่อหนังสือ"] || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(book["ชื่อนักเขียน"] || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesType =
      typeFilter === "ทั้งหมด" || String(book["ประเภท"] || "") === typeFilter;
    return matchesSearch && matchesType;
  });

  const freelanceAuthors = Array.from(
    new Set(
      books
        .filter((b) => b["ประเภท"] === "นักเขียนอิสระ" && b["ชื่อนักเขียน"])
        .map((b) => b["ชื่อนักเขียน"]),
    ),
  );

  const getFreelanceProfitSummary = () => {
    const authorSummary = {};
    books
      .filter((b) => b["ประเภท"] === "นักเขียนอิสระ")
      .forEach((book) => {
        const author = book["ชื่อนักเขียน"] || "ไม่ระบุชื่อนักเขียน";
        const title = book["ชื่อหนังสือ"] || "ไม่ระบุชื่อหนังสือ";
        const sold = Number(book["ขายออก"]) || 0;
        const price = Number(book["ราคาปก"]) || 0;
        const gp = Number(book["GP"]) || 0;
        const shopProfit = sold * (price * gp);

        if (!authorSummary[author]) {
          authorSummary[author] = { books: [], totalQty: 0, totalProfit: 0 };
        }
        if (sold > 0) {
          authorSummary[author].books.push({ title, sold, shopProfit });
          authorSummary[author].totalQty += sold;
          authorSummary[author].totalProfit += shopProfit;
        }
      });
    return authorSummary;
  };

  const authorProfitData = getFreelanceProfitSummary();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-8">
      <div className="max-w-9xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              ระบบเช็กสต็อกหนังสือ
            </h1>
            <p className="text-slate-500 mt-1">
              คลังสินค้าแบบเรียลไทม์ - คอลัมน์แยกประเภทและราคาต้นทุนชัดเจน
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                setViewMode(viewMode === "stock" ? "summary" : "stock")
              }
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm font-medium transition cursor-pointer text-sm"
            >
              {viewMode === "stock"
                ? "📊 ดูสรุปกำไรนักเขียน"
                : "📋 ดูคลังสินค้า"}
            </button>
            {viewMode === "stock" && (
              <button
                onClick={() => setIsAdding(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm font-medium transition cursor-pointer text-sm"
              >
                ➕ เพิ่มหนังสือใหม่
              </button>
            )}
            <button
              onClick={fetchBooks}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm font-medium transition cursor-pointer text-sm disabled:opacity-50"
            >
              {loading ? "กำลังโหลด..." : "🔄 รีเฟรช"}
            </button>
          </div>
        </header>

        {/* ─── โหมด 1: ตารางคลังสินค้าปกติ ─── */}
        {viewMode === "stock" && (
          <>
            <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <input
                type="text"
                placeholder="🔍 ค้นหาชื่อหนังสือ หรือ ชื่อนักเขียน..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md px-4 py-2.5 rounded-lg border border-slate-200 bg-white shadow-sm text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <div className="flex bg-slate-200/60 p-1 rounded-lg text-xs font-semibold text-slate-600">
                {["ทั้งหมด", "นักเขียนอิสระ", "หนังสือทั่วไป"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${typeFilter === type ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* ตารางเวอร์ชันขยายกรอบใหญ่เต็มพื้นที่ คง 4 คอลัมน์ราคาแยกกันชัดเจน */}
            <div className="w-full bg-white rounded-2xl shadow-md border border-slate-200/60 overflow-x-auto">
              {loading && books.length === 0 ? (
                <div className="p-20 text-center text-slate-400 font-medium text-base">
                  กำลังโหลดคลังสินค้า...
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-xs sm:text-sm whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[12px] tracking-wider text-center">
                      <th className="px-4 py-4 text-center w-5">ลำดับ</th>
                      <th className="px-6 py-4 text-center w-32">
                        ประเภทสินค้า
                      </th>
                      <th className="px-7 py-5 text-center min-w-[200px]">
                        รายละเอียดหนังสือ / นักเขียน
                      </th>

                      {/* 4 คอลัมน์ราคาแยกกันชัดเจนตามต้องการ */}
                      <th className="px-6 py-4 text-center bg-purple-50/50 text-purple-950 font-bold border-l border-slate-100">
                        ราคาปก (ฝากขาย)
                      </th>
                      <th className="px-6 py-4 text-center bg-purple-50/50 text-purple-950 font-bold border-r border-slate-100">
                        GP (%)
                      </th>
                      <th className="px-6 py-4 text-center bg-amber-50/50 text-amber-950 font-bold">
                        ราคาที่ซื้อ
                      </th>
                      <th className="px-6 py-4 text-center bg-amber-50/50 text-amber-950 font-bold border-r border-slate-100">
                        ราคาขาย
                      </th>

                      <th className="px-6 py-4 text-center w-24">
                        สต็อกตั้งต้น
                      </th>
                      <th className="px-6 py-4 text-center text-rose-600 w-24">
                        ขายออกแล้ว
                      </th>
                      <th className="px-6 py-4 text-center bg-indigo-50/60 text-indigo-950 font-extrabold w-24 border-x border-slate-100">
                        คงเหลือในคลัง
                      </th>
                      <th className="px-6 py-4 text-center font-bold text-emerald-900 bg-emerald-50/60 w-36">
                        กำไรสุทธิของร้าน
                      </th>
                      <th className="px-6 py-4 text-center">
                        หมายเหตุเพิ่มเติม
                      </th>
                      <th className="px-6 py-4 text-center w-28">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70">
                    {filteredBooks.map((book, index) => {
                      const isGeneral = book["ประเภท"] === "หนังสือทั่วไป";
                      return (
                        <tr
                          key={index}
                          className="hover:bg-slate-50/60 transition-colors align-middle text-center group"
                        >
                          {/* ลำดับ */}
                          <td className="px-6 py-4 text-slate-400 font-semibold">
                            {book["ลำดับ"]}
                          </td>

                          {/* ประเภทสินค้า */}
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-md text-[12px] font-bold tracking-wider w-28 text-center shadow-xxs ${isGeneral ? "bg-amber-100 text-amber-800 border border-amber-200/40" : "bg-purple-100 text-purple-800 border border-purple-200/40"}`}
                            >
                              {book["ประเภท"] || "นักเขียนอิสระ"}
                            </span>
                          </td>

                          {/* ชื่อหนังสือ / นักเขียน */}
                          <td className="px-6 py-4 text-left whitespace-normal max-w-[340px]">
                            <div className="font-bold text-slate-900 text-sm leading-snug group-hover:text-indigo-600 transition-colors">
                              {book["ชื่อหนังสือ"]}
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-1">
                              {book["ชื่อนักเขียน"]}
                            </div>
                          </td>

                          {/* 1. ราคาปก */}
                          <td className="px-6 py-4 text-center font-semibold text-slate-700 bg-purple-50/5 border-l border-slate-100/50">
                            {!isGeneral ? (
                              `฿${Number(book["ราคาปก"] || 0).toLocaleString()}`
                            ) : (
                              <span className="text-slate-300 font-normal">
                                -
                              </span>
                            )}
                          </td>

                          {/* 2. GP (%) */}
                          <td className="px-6 py-4 text-center font-bold text-purple-700 bg-purple-50/5 border-r border-slate-100/50">
                            {!isGeneral ? (
                              `${(Number(book["GP"] || 0) * 100).toFixed(0)}%`
                            ) : (
                              <span className="text-slate-300 font-normal">
                                -
                              </span>
                            )}
                          </td>

                          {/* 3. ราคาทุน */}
                          <td className="px-6 py-4 text-center font-semibold text-rose-600 bg-amber-50/5">
                            {isGeneral ? (
                              `฿${Number(book["ราคาทุน"] || 0).toLocaleString()}`
                            ) : (
                              <span className="text-slate-300 font-normal">
                                -
                              </span>
                            )}
                          </td>

                          {/* 4. ราคาขายจริง */}
                          <td className="px-6 py-4 text-center font-semibold text-emerald-600 bg-amber-50/5 border-r border-slate-100/50">
                            {isGeneral ? (
                              `฿${Number(book["ราคาขาย"] || 0).toLocaleString()}`
                            ) : (
                              <span className="text-slate-300 font-normal">
                                -
                              </span>
                            )}
                          </td>

                          {/* สต็อก */}
                          <td className="px-6 py-4 font-semibold text-slate-600">
                            {book["สต็อก"]}
                          </td>

                          {/* ขายออก */}
                          <td className="px-6 py-4 font-bold text-rose-600 bg-rose-50/5">
                            {book["ขายออก"]}
                          </td>

                          {/* คงเหลือ */}
                          <td className="px-6 py-4 font-extrabold bg-indigo-50/10 text-indigo-700 border-x border-slate-100/50 text-sm">
                            {book["คงเหลือ"]}
                          </td>

                          {/* กำไรสุทธิ */}
                          <td className="px-6 py-4 text-right font-extrabold bg-emerald-50/10 text-emerald-700 text-sm">
                            ฿{Number(book["ยอดรวม"] || 0).toLocaleString()}
                          </td>

                          {/* หมายเหตุ */}
                          <td className="px-6 py-4 text-slate-500 text-center whitespace-normal max-w-[260px] break-words text-xs font-medium">
                            {book["หมายเหตุ"] || (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>

                          {/* ปุ่มจัดการ */}
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleEditClick(book)}
                              className="px-3 py-1.5 bg-white hover:bg-indigo-600 text-slate-700 hover:text-white rounded-lg font-bold text-xs transition-all border border-slate-200 shadow-xxs cursor-pointer flex items-center justify-center mx-auto"
                            >
                              ✏️ นับสต็อก
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ─── โหมด 2: ตารางสรุปกำไรสะสมของร้านแยกตามนักเขียนอิสระ ─── */}
        {viewMode === "summary" && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-950">
                📊 สรุปผลกำไรที่ร้านได้รับจากกลุ่มนักเขียนอิสระ (ฝากขาย)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                รวมประวัติคำนวณจากยอดขายคูณด้วยส่วนแบ่ง GP ของแต่ละบุคคล
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {freelanceAuthors.map((authorName, index) => {
                const authorData = authorProfitData[authorName] || {
                  books: [],
                  totalQty: 0,
                  totalProfit: 0,
                };
                return (
                  <div
                    key={index}
                    className="border border-slate-100 bg-slate-50/50 rounded-xl p-5 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-200/60 pb-3 mb-4">
                        <h3 className="text-base font-bold text-indigo-950">
                          ✍️ {authorName}
                        </h3>
                        <span className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full font-bold">
                          ขายได้ {authorData.totalQty} เล่ม
                        </span>
                      </div>

                      <div className="space-y-2.5 mb-6">
                        {authorData.books.map((b, bIdx) => (
                          <div
                            key={bIdx}
                            className="flex justify-between text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100"
                          >
                            <span className="font-medium text-slate-800 max-w-[200px] truncate">
                              {b.title}
                            </span>
                            <div className="text-right">
                              <span className="text-slate-400 font-medium mr-2">
                                ({b.sold} เล่ม)
                              </span>
                              <span className="font-bold text-slate-900">
                                ฿
                                {b.shopProfit.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-indigo-600 text-white rounded-lg p-3 flex justify-between items-center mt-auto shadow-sm">
                      <span className="text-xs font-semibold">
                        📈 กำไรที่ร้านได้รับรวม (จาก GP):
                      </span>
                      <span className="text-base font-black">
                        ฿
                        {authorData.totalProfit.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {freelanceAuthors.length === 0 && (
                <div className="col-span-2 text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-100 font-medium">
                  ยังไม่มีข้อมูลหนังสือฝากขายของนักเขียนอิสระในคลัง
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── POPUP 1: เพิ่มหนังสือใหม่ ─── */}
        {isAdding && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-900">
                  ➕ เพิ่มหนังสือเล่มใหม่
                </h3>
                <select
                  value={newBook.type}
                  onChange={(e) =>
                    setNewBook({ ...newBook, type: e.target.value })
                  }
                  className="px-2 py-1 border border-slate-200 bg-white rounded text-xs font-bold text-indigo-700 focus:outline-none"
                >
                  <option value="นักเขียนอิสระ">
                    ✍️ ฝากขาย (นักเขียนอิสระ)
                  </option>
                  <option value="หนังสือทั่วไป">📚 ซื้อมาขาย (ทั่วไป)</option>
                </select>
              </div>

              <form
                onSubmit={handleAddBookSubmit}
                className="p-5 space-y-3 text-left"
              >
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
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    {newBook.type === "นักเขียนอิสระ"
                      ? "ชื่อนักเขียนอิสระ"
                      : "ชื่อสำนักพิมพ์ / ผู้ผลิต"}
                  </label>
                  <input
                    type="text"
                    required
                    value={newBook.author}
                    onChange={(e) =>
                      setNewBook({ ...newBook, author: e.target.value })
                    }
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                  />
                </div>

                {newBook.type === "นักเขียนอิสระ" ? (
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
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-indigo-600 mb-1">
                        GP ร้าน (%)
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="เช่น 30"
                        value={newBook.gp}
                        onChange={(e) =>
                          setNewBook({ ...newBook, gp: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-indigo-200 rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        สต็อกแรกเริ่ม
                      </label>
                      <input
                        type="number"
                        required
                        value={newBook.stock}
                        onChange={(e) =>
                          setNewBook({ ...newBook, stock: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-rose-600 mb-1">
                        ราคาทุน (฿)
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="ต้นทุน"
                        value={newBook.cost}
                        onChange={(e) =>
                          setNewBook({ ...newBook, cost: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-rose-200 rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-emerald-600 mb-1">
                        ราคาขาย (฿)
                      </label>
                      <input
                        type="number"
                        required
                        placeholder="ราคาขาย"
                        value={newBook.salePrice}
                        onChange={(e) =>
                          setNewBook({ ...newBook, salePrice: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-emerald-200 rounded-lg text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        สต็อกที่มี
                      </label>
                      <input
                        type="number"
                        required
                        value={newBook.stock}
                        onChange={(e) =>
                          setNewBook({ ...newBook, stock: e.target.value })
                        }
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                      />
                    </div>
                  </div>
                )}

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
                    placeholder="ใส่ข้อมูลบันทึกความจำเพิ่มเติม..."
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                  ></textarea>
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold cursor-pointer"
                  >
                    {loading ? "กำลังบันทึก..." : "💾 บันทึกเข้าระบบ"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── POPUP 2: แก้ไข/นับสต็อกขายออก ─── */}
        {editingBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50 text-left">
                <h3 className="text-lg font-bold text-slate-900">
                  ✏️ เช็กและบันทึกยอดขายสต็อก
                </h3>
                <p className="text-sm text-slate-500 mt-1 truncate">
                  {editingBook["ชื่อหนังสือ"]}
                </p>
              </div>

              <form onSubmit={handleUpdate} className="p-6 space-y-4 text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">
                    จำนวนสต็อกตั้งต้น (รวมทั้งหมด)
                  </label>
                  <input
                    type="number"
                    value={stockInput}
                    onChange={(e) => setStockInput(Number(e.target.value))}
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">
                    จำนวนรวมที่ขายออกไปแล้ว
                  </label>
                  <input
                    type="number"
                    value={soldInput}
                    onChange={(e) => setSoldInput(Number(e.target.value))}
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-2">
                    หมายเหตุ
                  </label>
                  <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    rows="2"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                  ></textarea>
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingBook(null)}
                    className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-semibold cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold cursor-pointer"
                  >
                    {loading ? "กำลังบันทึก..." : "💾 บันทึกความเปลี่ยนแปลง"}
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
