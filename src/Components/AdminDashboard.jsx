import React, { useState, useRef, useEffect } from "react";
import { postToAppsScript } from "../lib/appsScriptApi";

// แก้ไขบรรทัดแรกสุด
export default function AdminDashboard({ books, fetchBooks, API_URL }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const ADMIN_PASSWORD = "admin1234";

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
    publisher: "",
    price: "",
    gp: "",
    stock: "",
    cost: "",
    salePrice: "",
    note: "",
    twitterUrl: "",
    instagramUrl: "",
    synopsis: "",
  });

  // 📸 สเตตัสอัปโหลดรูปภาพหลายช่องทาง
  const [coverImgs, setCoverImgs] = useState([]); // [{ file, preview }]
  const [uploading, setUploading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // 🎥 สเตตัสเปิดกล้องถ่ายภาพสด
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // บีบอัดรูปก่อนส่งไป Google Apps Script เพื่อให้ได้ความคมชัดสูงระดับ HD และขนาดกะทัดรัด
  const compressImage = (file, maxWidth = 1600, maxHeight = 1600, quality = 0.88) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("รหัสผ่านไม่ถูกต้อง!");
      setPasswordInput("");
    }
  };

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSubmitError("");
      const newImgs = [];
      for (const file of files) {
        try {
          const compressedBase64 = await compressImage(file);
          newImgs.push({ file, preview: compressedBase64 });
        } catch (err) {
          console.error("Compression error:", err);
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
          newImgs.push({ file, preview: base64 });
        }
      }
      setCoverImgs((prev) => [...prev, ...newImgs]);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setCoverImgs((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetCover = (indexToSet) => {
    setCoverImgs((prev) => {
      const copy = [...prev];
      const [selected] = copy.splice(indexToSet, 1);
      return [selected, ...copy];
    });
  };

  // 📷 ฟังก์ชันเปิดกล้องถ่ายภาพสดระดับ HD
  const startLiveCamera = async () => {
    try {
      setSubmitError("");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
      });
      setCameraStream(stream);
      setIsCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      } else {
        alert("ไม่สามารถเปิดกล้องถ่ายภาพสดได้ กรุณาเลือกรูปจากแกลเลอรีอุปกรณ์");
      }
    }
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraActive, cameraStream]);

  const stopLiveCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.90);

    setCoverImgs((prev) => [
      ...prev,
      { file: null, preview: dataUrl },
    ]);
  };

  const handleAddBookSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setUploading(true);
    try {
      if (coverImgs.length === 0) {
        throw new Error("กรุณาเลือกหรือถ่ายรูปภาพอย่างน้อย 1 รูป");
      }

      const imagesData = coverImgs.map((img) => img.preview);
      const imageNames = coverImgs.map((img) => (img.file ? img.file.name : "image.jpg"));

      await postToAppsScript(API_URL, {
        action: "addBookWithCover",
        type: newBook.type,
        title: newBook.title,
        author: newBook.author,
        publisher: newBook.publisher,
        price: newBook.price,
        gp: newBook.gp,
        stock: newBook.stock,
        cost: newBook.cost,
        salePrice: newBook.salePrice,
        synopsis: newBook.synopsis,
        note: newBook.note,
        twitterUrl: newBook.twitterUrl,
        instagramUrl: newBook.instagramUrl,
        imageData: imagesData[0] || "",
        imageName: imageNames[0] || "",
        imagesData: imagesData,
        imageNames: imageNames,
      });

      await fetchBooks();
      setIsAdding(false);
      setNewBook({
        type: "นักเขียนอิสระ", title: "", author: "", publisher: "", price: "",
        gp: "", stock: "", cost: "", salePrice: "", note: "", twitterUrl: "",
        instagramUrl: "", synopsis: ""
      });
      setCoverImgs([]);
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await postToAppsScript(API_URL, {
        action: "updateStock",
        id: editingBook["ลำดับ"],
        stock: stockInput,
        sold: soldInput,
        note: noteInput,
      });
      setEditingBook(null);
      await fetchBooks();
    } catch (error) {
      alert(error.message || "เกิดข้อผิดพลาด");
    }
  };

  const handleEditClick = (book) => {
    setEditingBook(book);
    setStockInput(Number(book["สต็อก"]) || 0);
    setSoldInput(Number(book["ขายออก"]) || 0);
    setNoteInput(book["หมายเหตุ"] || "");
  };

  const filteredBooks = books.filter((book) => {
    const sLower = searchTerm.toLowerCase();
    return (
      (String(book["ชื่อหนังสือ"] || "")
        .toLowerCase()
        .includes(sLower) ||
        String(book["ชื่อนักเขียน"] || "")
          .toLowerCase()
          .includes(sLower)) &&
      (typeFilter === "ทั้งหมด" || String(book["ประเภท"] || "") === typeFilter)
    );
  });

  const freelanceAuthors = Array.from(
    new Set(
      books
        .filter((b) => b["ประเภท"] === "นักเขียนอิสระ" && b["ชื่อนักเขียน"])
        .map((b) => b["ชื่อนักเขียน"]),
    ),
  );
  const authorProfitData = {};
  books
    .filter((b) => b["ประเภท"] === "นักเขียนอิสระ")
    .forEach((book) => {
      const author = book["ชื่อนักเขียน"] || "ไม่ระบุชื่อนักเขียน";
      const title = book["ชื่อหนังสือ"] || "ไม่ระบุชื่อหนังสือ";
      const sold = Number(book["ขายออก"]) || 0;
      const price = Number(book["ราคาปก"]) || 0;
      const gp = Number(book["GP"]) || 0;
      const shopProfit = sold * (price * gp);
      if (!authorProfitData[author])
        authorProfitData[author] = { books: [], totalQty: 0, totalProfit: 0 };
      if (sold > 0) {
        authorProfitData[author].books.push({ title, sold, shopProfit });
        authorProfitData[author].totalQty += sold;
        authorProfitData[author].totalProfit += shopProfit;
      }
    });

  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 bg-[#fcfaf7]">
        <div className="bg-white p-8 rounded-2xl border border-[#d7ccc8] shadow-lg max-w-sm w-full text-center space-y-4 border-t-4 border-t-[#800020]">
          <div className="text-4xl text-[#800020]">🔒</div>
          <h2 className="text-xl font-serif font-bold text-[#4a0414]">
            Sonnet & co.
          </h2>
          <form onSubmit={handleLoginSubmit} className="space-y-3">
            <input
              type="password"
              required
              placeholder="รหัสผ่านผู้ดูแลระบบ..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="w-full px-3 py-2 border border-[#d7ccc8] rounded-xl text-sm text-center"
            />
            <button
              type="submit"
              className="w-full py-2 bg-[#800020] text-[#f1e6d2] font-bold text-sm rounded-xl"
            >
              🔓 ตรวจสอบรหัสผ่าน
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-8xl mx-auto text-[#3e2723]">
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-[#efebe9] pb-5">
        <div className="text-left">
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#4a0414]">
            Sonnet & co. Dashboard
          </h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() =>
              setViewMode(viewMode === "stock" ? "summary" : "stock")
            }
            className="px-4 py-2 bg-[#8d6e63] text-white rounded-lg font-bold text-xs"
          >
            📊 บัญชีกำไรฝากขาย
          </button>
          {viewMode === "stock" && (
            <button
              onClick={() => {
                setSubmitError("");
                setIsAdding(true);
              }}
              className="px-4 py-2 bg-[#800020] text-[#f1e6d2] rounded-lg font-bold text-xs"
            >
              ➕ เพิ่มหนังสือใหม่
            </button>
          )}
        </div>
      </header>

      {viewMode === "stock" ? (
        <>
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
            <input 
              type="text" 
              placeholder="🔍 ค้นหาสินค้าเพื่อจัดการ..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full max-w-md px-4 py-2 rounded-lg border border-[#d7ccc8] bg-white shadow-sm text-sm" 
            />
            <div className="flex bg-[#efebe9] p-1 rounded-lg text-xs font-bold text-[#6d4c41]">
              {["ทั้งหมด", "นักเขียนอิสระ", "หนังสือทั่วไป"].map(t => (
                <button 
                  key={t} 
                  type="button"
                  onClick={() => setTypeFilter(t)} 
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${typeFilter === t ? "bg-[#4a0414] text-[#f1e6d2] shadow-sm" : ""}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full bg-white rounded-2xl shadow-md border border-[#d7ccc8]/70 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-[#fbf9f6] border-b border-[#efebe9] text-[#6d4c41] font-bold uppercase text-[11px] text-center tracking-wider">
                  <th className="px-5 py-4 w-16">ลำดับ</th>
                  <th className="px-5 py-4 w-32">ประเภท</th>
                  <th className="px-6 py-4 text-left min-w-[280px]">
                    ข้อมูลรายชื่อหนังสือ
                  </th>
                  <th className="px-5 py-4 text-right bg-purple-50/50 text-[#4a148c]">
                    ราคาปก
                  </th>
                  <th className="px-4 py-4 text-center bg-purple-50/50 text-[#4a148c]">
                    GP
                  </th>
                  <th className="px-5 py-4 text-right bg-amber-50/50 text-[#5d4037]">
                    ราคาทุน
                  </th>
                  <th className="px-5 py-4 text-right bg-amber-50/50 text-[#5d4037]">
                    ขาย
                  </th>
                  <th className="px-4 py-4 w-20">สต็อก</th>
                  <th className="px-4 py-4 text-[#800020] w-20">ขายออก</th>
                  <th className="px-5 py-4 bg-[#f3e5f5]/40 text-[#4a0414] font-black w-24">
                    คงเหลือ
                  </th>
                  <th className="px-6 py-4 text-right font-extrabold bg-emerald-50/10 text-[#1b5e20] text-sm">
                    กำไรสุทธิ
                  </th>
                  <th className="px-4 py-4 w-28">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#efebe9] text-center text-sm">
                {filteredBooks.map((book, index) => {
                  const isGeneral = book["ประเภท"] === "หนังสือทั่วไป";
                  return (
                    <tr key={index} className="hover:bg-[#faf8f5] align-middle">
                      <td className="px-5 py-4 text-slate-400 font-semibold">
                        {book["ลำดับ"]}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold w-24 border ${isGeneral ? "bg-amber-100 text-amber-900 border-amber-200" : "bg-purple-100 text-purple-900 border-purple-200"}`}
                        >
                          {isGeneral ? "ทั่วไป" : "นักเขียนอิสระ"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        <div className="font-bold text-[#4a0414] text-base">
                          {book["ชื่อหนังสือ"]}
                        </div>
                        <div className="text-xs text-[#8d6e63]">
                          {book["ชื่อนักเขียน"]}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {!isGeneral
                          ? `฿${Number(book["ราคาปก"] || 0).toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="px-4 py-4 text-center font-bold text-purple-800">
                        {!isGeneral
                          ? `${(Number(book["GP"] || 0) * 100).toFixed(0)}%`
                          : "-"}
                      </td>
                      <td className="px-5 py-4 text-right text-[#b71c1c]">
                        {isGeneral
                          ? `฿${Number(book["ราคาทุน"] || 0).toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="px-5 py-4 text-right text-[#1b5e20]">
                        {isGeneral
                          ? `฿${Number(book["ราคาขายจริง"] || 0).toLocaleString()}`
                          : "-"}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {book["สต็อก"]}
                      </td>
                      <td className="px-4 py-4 text-[#b71c1c]">
                        {book["ขายออก"]}
                      </td>
                      <td className="px-5 py-4 font-extrabold text-[#800020]">
                        {book["คงเหลือ"]}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-[#1b5e20]">
                        ฿{Number(book["ยอดรวม"] || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleEditClick(book)}
                          className="px-2.5 py-1.5 bg-white text-slate-700 rounded-lg font-bold text-xs border border-[#d7ccc8]"
                        >
                          ✏️ สต็อก
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-[#efebe9] shadow-md">
          <h2 className="text-xl font-serif font-bold text-[#4a0414] mb-6">
            📊 ผลบัญชีกำไรร้าน แยกตามกลุ่มนักเขียนอิสระ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {freelanceAuthors.map((auth, idx) => {
              const aData = authorProfitData[auth] || {
                books: [],
                totalQty: 0,
                totalProfit: 0,
              };
              return (
                <div
                  key={idx}
                  className="border border-[#d7ccc8]/60 bg-[#faf8f5] rounded-xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center border-b border-[#d7ccc8]/40 pb-2 mb-3 font-serif font-bold text-[#4a0414]">
                      <h3>✍️ {auth}</h3>
                      <span className="text-[11px] px-2.5 py-0.5 bg-[#800020] text-[#f1e6d2] rounded-full">
                        รวมยอดขาย {aData.totalQty} เล่ม
                      </span>
                    </div>
                    <div className="space-y-2 mb-5">
                      {aData.books.map((b, bIdx) => (
                        <div
                          key={bIdx}
                          className="flex justify-between text-xs bg-white p-2.5 rounded-lg border border-[#efebe9]"
                        >
                          <span className="font-medium text-[#5d4037]">
                            {b.title} ({b.sold} เล่ม)
                          </span>
                          <span className="font-bold text-[#800020]">
                            ฿{b.shopProfit.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#4a0414] text-[#f1e6d2] rounded-xl p-3 flex justify-between items-center font-bold text-sm shadow-xs">
                    <span>📈 กำไรสุทธิของร้าน (GP):</span>
                    <span className="text-base font-black text-[#c9a77c]">
                      ฿{aData.totalProfit.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* POPUP เพิ่มเล่มใหม่ */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[85vh] overflow-y-auto border border-[#d7ccc8]">
            <h3 className="font-serif font-bold text-[#4a0414] text-lg border-b pb-2 mb-3">
              ➕ เพิ่มหนังสือเข้าตู้ Sonnet
            </h3>
            <form
              onSubmit={handleAddBookSubmit}
              className="space-y-3.5 text-left text-xs sm:text-sm"
            >
              <select
                value={newBook.type}
                onChange={(e) =>
                  setNewBook({ ...newBook, type: e.target.value })
                }
                className="border border-[#d7ccc8] p-1 rounded-lg font-bold text-[#800020] bg-white"
              >
                <option value="นักเขียนอิสระ">✍️ นักเขียนอิสระ</option>
                <option value="หนังสือทั่วไป">📚 หนังสือทั่วไป</option>
              </select>

              <div>
                <label className="font-bold text-[#6d4c41]">ชื่อหนังสือ</label>
                <input
                  type="text"
                  required
                  value={newBook.title}
                  onChange={(e) =>
                    setNewBook({ ...newBook, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#d7ccc8] rounded-xl bg-white"
                />
              </div>
              
              {/* 💡 ปรับเงื่อนไขการ required ตามประเภทของหนังสือ */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-[#6d4c41]">นักเขียน</label>
                  <input
                    type="text"
                    required={newBook.type === "นักเขียนอิสระ"} // บังคับกรอกเฉพาะกลุ่มนักเขียนอิสระ
                    value={newBook.author}
                    onChange={(e) =>
                      setNewBook({ ...newBook, author: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#d7ccc8] rounded-xl bg-white"
                    placeholder={newBook.type === "หนังสือทั่วไป" ? "ระบุนักเขียน (ถ้ามี)" : ""}
                  />
                </div>
                <div>
                  <label className="font-bold text-[#6d4c41]">สำนักพิมพ์</label>
                  <input
                    type="text"
                    value={newBook.publisher}
                    onChange={(e) =>
                      setNewBook({ ...newBook, publisher: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#d7ccc8] rounded-xl bg-white"
                    placeholder="ระบุสำนักพิมพ์ (ถ้ามี)"
                  />
                </div>
              </div>

              {newBook.type === "นักเขียนอิสระ" ? (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#6d4c41]">
                      ราคาปก (฿)
                    </label>
                    <input
                      type="number"
                      required
                      value={newBook.price}
                      onChange={(e) =>
                        setNewBook({ ...newBook, price: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-[#d7ccc8] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#800020]">
                      GP ร้าน (%)
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="30"
                      value={newBook.gp}
                      onChange={(e) =>
                        setNewBook({ ...newBook, gp: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-[#d7ccc8] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#6d4c41]">
                      สต็อกแรก
                    </label>
                    <input
                      type="number"
                      required
                      value={newBook.stock}
                      onChange={(e) =>
                        setNewBook({ ...newBook, stock: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-[#d7ccc8] rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#b71c1c]">
                      ราคาต้นทุน (฿)
                    </label>
                    <input
                      type="number"
                      required
                      value={newBook.cost}
                      onChange={(e) =>
                        setNewBook({ ...newBook, cost: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-[#d7ccc8] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#1b5e20]">
                      ราคาขาย (฿)
                    </label>
                    <input
                      type="number"
                      required
                      value={newBook.salePrice}
                      onChange={(e) =>
                        setNewBook({ ...newBook, salePrice: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-[#d7ccc8] rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#6d4c41]">
                      สต็อกของ
                    </label>
                    <input
                      type="number"
                      required
                      value={newBook.stock}
                      onChange={(e) =>
                        setNewBook({ ...newBook, stock: e.target.value })
                      }
                      className="w-full px-3 py-1.5 border border-[#d7ccc8] rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="bg-[#fbf9f6] p-3.5 rounded-xl border border-dashed border-[#d7ccc8] space-y-3 text-left">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[#4a0414]">
                    📸 รูปภาพหนังสือ (เลือกได้หลายรูป / ถ่ายรูปหลายมุม)
                  </label>
                  <span className="text-[10px] text-[#8d6e63] font-medium">
                    รูปแรกจะเป็นรูปปกหลัก
                  </span>
                </div>

                {/* ปุ่มเลือกรูปภาพแบบแยกช่องทาง */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="py-2 px-3 bg-[#efebe9] hover:bg-[#d7ccc8] text-[#4a0414] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer border border-[#d7ccc8]"
                  >
                    📁 เลือกรูปจากแกลเลอรี
                  </button>
                  <button
                    type="button"
                    onClick={startLiveCamera}
                    className="py-2 px-3 bg-[#800020] hover:bg-[#4a0414] text-[#f1e6d2] font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    📷 ถ่ายรูปด้วยกล้อง
                  </button>
                </div>

                {/* Hidden Input Elements */}
                <input
                  type="file"
                  ref={galleryInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {/* รายการพรีวิวรูปภาพที่เลือก / ถ่ายไว้ */}
                {coverImgs.length > 0 ? (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-[#6d4c41] flex justify-between">
                      <span>รายการรูปภาพ ({coverImgs.length} รูป):</span>
                      <span className="text-[10px] text-[#8d6e63]">กด ⭐ เพื่อตั้งเป็นปกหลัก</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto py-2 px-1 scrollbar-thin">
                      {coverImgs.map((img, idx) => (
                        <div key={idx} className="relative w-20 h-24 rounded-lg overflow-hidden border-2 border-[#d7ccc8] flex-shrink-0 group shadow-xs bg-white">
                          <img src={img.preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                          
                          {/* ปุ่มตั้งเป็นปกหลัก & ปุ่มลบ */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1">
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="self-end w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] font-bold cursor-pointer hover:bg-red-700 shadow"
                              title="ลบรูปนี้"
                            >
                              ✕
                            </button>
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetCover(idx)}
                                className="w-full py-0.5 bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-bold rounded cursor-pointer text-center"
                              >
                                ⭐ ตั้งเป็นปกหลัก
                              </button>
                            )}
                          </div>

                          {idx === 0 ? (
                            <span className="absolute bottom-0 left-0 right-0 bg-[#800020] text-white text-[9px] text-center font-bold py-0.5">
                              ⭐ ปกหลัก
                            </span>
                          ) : (
                            <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] text-center font-medium py-0.5">
                              มุมที่ {idx + 1}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-[#8d6e63] italic text-center py-2 border border-dashed border-[#d7ccc8]/70 rounded-lg">
                    ยังไม่มีรูปภาพ ให้กดเลือกรูปจากแกลเลอรี หรือเปิดกล้องเพื่อถ่ายรูป
                  </p>
                )}

              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-[#4a0414]">
                    ลิงก์ Twitter (X)
                  </label>
                  <input
                    type="url"
                    placeholder="https://x.com/..."
                    value={newBook.twitterUrl}
                    onChange={(e) =>
                      setNewBook({ ...newBook, twitterUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#d7ccc8] rounded-xl bg-[#faf8f5]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#800020]">
                    ลิงก์ Instagram
                  </label>
                  <input
                    type="url"
                    placeholder="https://instagram.com/..."
                    value={newBook.instagramUrl}
                    onChange={(e) =>
                      setNewBook({ ...newBook, instagramUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-[#d7ccc8] rounded-xl bg-[#faf8f5]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#6d4c41]">
                  รายละเอียดหนังสือ
                </label>
                <textarea
                  value={newBook.synopsis}
                  onChange={(e) =>
                    setNewBook({ ...newBook, synopsis: e.target.value })
                  }
                  rows="3"
                  placeholder="พิมพ์ข้อมูลรายละเอียดของหนังสือหรือเรื่องย่อเบื้องต้น..."
                  className="w-full px-3 py-1.5 border border-[#d7ccc8] rounded-xl bg-white"
                ></textarea>
              </div>
              <div>
                <label className="font-bold text-[#6d4c41]">
                  หมายเหตุ
                </label>
                <textarea
                  value={newBook.note}
                  onChange={(e) =>
                    setNewBook({ ...newBook, note: e.target.value })
                  }
                  rows="1"
                  placeholder="เช่น Blindbook"
                  className="w-full px-3 py-1.5 border border-[#d7ccc8] rounded-xl bg-white"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2 bg-[#efebe9] text-[#5d4037] rounded-xl font-bold"
                  disabled={uploading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#800020] text-[#f1e6d2] hover:bg-[#4a0414] rounded-xl font-bold"
                  disabled={uploading}
                >
                  {uploading ? "กำลังบันทึกและอัปโหลดรูป..." : "บันทึกระบบ"}
                </button>
              </div>
              {submitError && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                >
                  บันทึกไม่สำเร็จ: {submitError}
                </p>
              )}
            </form>
          </div>
        </div>
      )}

      {/* POPUP แก้ไขสต็อก */}
      {editingBook && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-left border border-[#d7ccc8]">
            <h3 className="text-lg font-serif font-bold text-[#4a0414]">
              ✏️ บันทึกยอดขายนับสต็อก
            </h3>
            <p className="text-xs text-[#8d6e63] mt-1 truncate font-medium">
              เรื่อง: {editingBook["ชื่อหนังสือ"]}
            </p>
            <form onSubmit={handleUpdate} className="space-y-4 mt-4 text-sm">
              <div>
                <label className="text-xs font-bold text-[#5d4037]">
                  จำนวนสต็อก (รวมทั้งหมด)
                </label>
                <input
                  type="number"
                  value={stockInput}
                  onChange={(e) => setStockInput(Number(e.target.value))}
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-[#d7ccc8] rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#800020]">
                  จำนวนสะสมที่ขายออกไปแล้ว
                </label>
                <input
                  type="number"
                  value={soldInput}
                  onChange={(e) => setSoldInput(Number(e.target.value))}
                  min="0"
                  required
                  className="w-full px-3 py-2 border border-[#d7ccc8] rounded-xl bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#5d4037]">
                  หมายเหตุบันทึกเพิ่มเติม
                </label>
                <textarea
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  rows="2"
                  className="w-full px-3 py-2 border border-[#d7ccc8] rounded-xl bg-white"
                ></textarea>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBook(null)}
                  className="flex-1 py-2 bg-[#efebe9] text-[#5d4037] rounded-xl text-sm font-bold cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#800020] text-[#f1e6d2] hover:bg-[#4a0414] rounded-xl text-sm font-bold cursor-pointer"
                >
                  อัปเดตข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📷 LIVE CAMERA CAPTURE MODAL */}
      {isCameraActive && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 text-center relative border border-[#d7ccc8]">
            <div className="flex justify-between items-center border-b pb-2 mb-3">
              <h3 className="font-serif font-bold text-[#4a0414] text-base flex items-center gap-2">
                📷 ถ่ายรูปหนังสือหลายมุมด้วยกล้อง
              </h3>
              <button
                onClick={stopLiveCamera}
                className="w-7 h-7 rounded-full bg-[#efebe9] hover:bg-[#800020] text-[#5d4037] hover:text-white flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="relative aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black/70 text-white text-[11px] px-2 py-0.5 rounded-md font-mono backdrop-blur-xs">
                ถ่ายแล้ว {coverImgs.length} รูป
              </div>
            </div>

            <div className="flex gap-2 justify-center items-center mt-4">
              <button
                type="button"
                onClick={captureCameraPhoto}
                className="flex-1 py-2.5 bg-[#800020] hover:bg-[#4a0414] text-[#f1e6d2] rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition transform active:scale-95 cursor-pointer"
              >
                📸 แชะ! ถ่ายรูปมุมนี้
              </button>
              <button
                type="button"
                onClick={stopLiveCamera}
                className="py-2.5 px-4 bg-[#efebe9] text-[#5d4037] hover:bg-[#d7ccc8] rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer"
              >
                เสร็จสิ้น ({coverImgs.length} รูป)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
