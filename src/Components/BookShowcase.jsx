import React, { useState, useEffect } from 'react';

export default function BookShowcase({ books, loading }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ทั้งหมด");
  const [selectedBook, setSelectedBook] = useState(null);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // 🔍 สเตตัสระบบซูมภาพด้วยเมาส์สกรอลล์และการลากย้ายมุมมอง (Zoom & Pan)
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomOffset, setZoomOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 💡 ฟังก์ชันแปลงลิงก์ Google Drive ให้แสดงผลคมชัดสูงระดับ Ultra-HD 100%
  const getDisplayImageUrl = (url) => {
    if (!url || url.includes("Error") || String(url).trim() === "") {
      return "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&auto=format&fit=crop&q=80";
    }
    // หากเป็นลิงก์ Google Drive ให้ดึงเฉพาะ ID ของรูปภาพมาแปลงเป็นรูปแบบที่เว็บแสดงได้ด้วยความละเอียดสูง 2048px (Ultra HD)
    if (String(url).includes("google.com") || String(url).includes("googleusercontent.com")) {
      const match = String(url).match(/\/d\/([a-zA-Z0-9_-]+)/) || String(url).match(/id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        // เพิ่ม =s2048 เพื่อดึงรูปภาพความคมชัดสูงระดับ 2K/HD จาก Google Drive
        return `https://lh3.googleusercontent.com/d/${match[1]}=s2048`;
      }
    }
    return url;
  };

  // 💡 ฟังก์ชันแยกลิงก์รูปภาพหลายรูป (คั่นด้วย comma หรือขึ้นบรรทัดใหม่)
  const getDisplayImageUrls = (rawUrl) => {
    if (!rawUrl || rawUrl.includes("Error") || String(rawUrl).trim() === "") {
      return ["https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60"];
    }
    const splitUrls = String(rawUrl)
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    if (splitUrls.length === 0) {
      return ["https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60"];
    }

    return splitUrls.map((u) => getDisplayImageUrl(u));
  };

  const filteredBooks = books.filter(book => {
    const searchLower = searchTerm.toLowerCase();
    return (
      String(book["ชื่อหนังสือ"] || "").toLowerCase().includes(searchLower) ||
      String(book["ชื่อนักเขียน"] || "").toLowerCase().includes(searchLower) ||
      String(book["สำนักพิมพ์"] || "").toLowerCase().includes(searchLower) ||
      String(book["รายละเอียด"] || "").toLowerCase().includes(searchLower)
    ) && (activeTab === "ทั้งหมด" || String(book["ประเภท"] || "") === activeTab);
  });

  // รีเซ็ตการซูมเมื่อเปลี่ยนรูปภาพหรือปิด/เปิดหน้าต่าง
  useEffect(() => {
    setZoomScale(1);
    setZoomOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, [activeImgIndex, selectedBook, isLightboxOpen]);

  // จัดการปุ่มกดบนคีย์บอร์ดเมื่อเปิด Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedBook) return;
      const displayImages = getDisplayImageUrls(
        selectedBook["ลิงก์รูปภาพ"] || selectedBook["imageUrl"] || selectedBook["image"] || selectedBook["imgUrl"] || selectedBook["รูปภาพ"]
      );

      if (e.key === "Escape") {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else {
          setSelectedBook(null);
        }
      } else if (e.key === "ArrowLeft") {
        setActiveImgIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setActiveImgIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBook, isLightboxOpen]);

  // 🔍 จัดการการหมุนสกรอลล์เมาส์เพื่อซูมเข้า/ออก (Mouse Wheel Zoom)
  const handleWheelZoom = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const zoomDelta = e.deltaY < 0 ? 0.3 : -0.3;
    setZoomScale((prev) => {
      const nextScale = Math.min(Math.max(1, prev + zoomDelta), 5);
      if (nextScale === 1) setZoomOffset({ x: 0, y: 0 });
      return nextScale;
    });
  };

  // 🖱️ จัดการการคลิกลากเพื่อย้ายมุมมองเมื่อซูม (Drag & Pan)
  const handleMouseDown = (e) => {
    if (zoomScale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - zoomOffset.x, y: e.clientY - zoomOffset.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoomScale > 1) {
      e.preventDefault();
      setZoomOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="bg-[#fcfaf7] min-h-screen text-[#3e2723] p-4 sm:p-8 max-w-7xl mx-auto">
      
      {/* ส่วนหัวเว็บหน้าร้าน */}
      <header className="text-center mb-12 max-w-2xl mx-auto space-y-3 pt-6">
        <div className="text-[#800020] font-serif tracking-widest text-xs font-bold uppercase">— Welcome to —</div>
        <h1 className="text-4xl sm:text-5xl font-serif font-black text-[#4a0414] tracking-tight">Sonnet & co.</h1>
        <div className="w-16 h-0.5 bg-[#c9a77c] mx-auto my-2"></div>
        <p className="text-[#6d4c41] text-xs sm:text-sm leading-relaxed">
          พื้นที่จัดแสดงผลงานวรรณกรรม นิยาย และหนังสือแฮนด์เมดชิ้นพิเศษ <br />
          คลิกที่รูปภาพหรือชื่อหนังสือเพื่อเปิดดูรายละเอียด ส่องรูปหลายมุม และเช็กสต็อกสินค้าเรียลไทม์ได้ทันทีค่ะ
        </p>
      </header>

      {/* แผงค้นหาและตัวกรอง */}
      <div className="mb-10 flex flex-col md:flex-row gap-4 justify-between items-center max-w-5xl mx-auto">
        <input
          type="text"
          placeholder="🔍 ค้นหาชื่อหนังสือ, นักเขียน, สำนักพิมพ์..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full md:max-w-md px-4 py-2.5 rounded-xl border border-[#d7ccc8] bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#800020] text-[#3e2723]"
        />
        <div className="flex bg-[#efebe9] p-1 rounded-xl text-xs font-bold text-[#6d4c41] w-full md:w-auto justify-center border border-[#d7ccc8]/40">
          {["ทั้งหมด", "นักเขียนอิสระ", "หนังสือทั่วไป"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${activeTab === tab ? "bg-[#4a0414] text-[#f1e6d2] shadow-sm font-extrabold" : "hover:text-[#4a0414]"}`}
            >
              {tab === "นักเขียนอิสระ" ? "✍️ นักเขียนอิสระ" : tab === "หนังสือทั่วไป" ? "📚 หนังสือทั่วไป" : "✨ ทั้งหมด"}
            </button>
          ))}
        </div>
      </div>

      {/* โหมดหน้าร้าน: การ์ดตารางช่อง ๆ (Grid) */}
      {loading && books.length === 0 ? (
        <div className="p-20 text-center text-[#a1887f] font-serif italic text-lg">กำลังจัดเรียงตู้หนังสือสินค้า...</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-7 max-w-7xl mx-auto">
          {filteredBooks.map((book, idx) => {
            const isGeneral = book["ประเภท"] === "หนังสือทั่วไป";
            const displayPrice = isGeneral ? (Number(book["ราคาขาย"]) || 0) : (Number(book["ราคาปก"]) || 0);
            
            // 💡 เรียกใช้ฟังก์ชันดึงรูปภาพ (รูปแรกเป็นรูปปกหลัก)
            const displayImages = getDisplayImageUrls(
              book["ลิงก์รูปภาพ"] || book["imageUrl"] || book["image"] || book["imgUrl"] || book["รูปภาพ"]
            );
            const coverImage = displayImages[0];

            return (
              <div 
                key={idx} 
                onClick={() => {
                  setSelectedBook(book);
                  setActiveImgIndex(0);
                }}
                className="bg-white rounded-2xl shadow-xs border border-[#d7ccc8]/50 overflow-hidden flex flex-col justify-between group hover:shadow-lg hover:border-[#bcaaa4] transition-all duration-300 cursor-pointer text-left"
              >
                <div>
                  <div className="w-full aspect-[3/4] bg-[#f5f2eb] overflow-hidden border-b border-[#efebe9] relative">
                    <img src={coverImage} alt={book["ชื่อหนังสือ"]} className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300" loading="lazy" />
                  </div>
                  <div className="p-4 space-y-1.5">
                    <h2 className="font-serif font-bold text-[#4a0414] text-base sm:text-lg leading-snug group-hover:text-[#800020] transition-colors">{book["ชื่อหนังสือ"]}</h2>
                    <p className="text-xs sm:text-sm text-[#8d6e63] font-medium truncate">{book["ชื่อนักเขียน"] || "-"}</p>
                  </div>
                </div>
                <div className="p-4 pt-0 mt-auto flex justify-between items-center">
                  <span className="text-base font-black text-[#800020]">฿{displayPrice.toLocaleString()}</span>
                  <span className="text-xs text-[#c9a77c] font-bold tracking-wide uppercase group-hover:text-[#4a0414]">Detail →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* หน้าต่าง POPUP รายละเอียดหนังสือ */}
      {selectedBook && (() => {
        const stockLeft = Number(selectedBook["คงเหลือ"]) || 0;
        const isGeneral = selectedBook["ประเภท"] === "หนังสือทั่วไป";
        const displayPrice = isGeneral ? (Number(selectedBook["ราคาขาย"]) || 0) : (Number(selectedBook["ราคาปก"]) || 0);
        
        // 💡 ดึงรูปภาพทั้งหมดของหนังสือเล่มนี้
        const displayImages = getDisplayImageUrls(
          selectedBook["ลิงก์รูปภาพ"] || selectedBook["imageUrl"] || selectedBook["image"] || selectedBook["imgUrl"] || selectedBook["รูปภาพ"]
        );
        const currentImage = displayImages[activeImgIndex] || displayImages[0];
        
        const twitterLink = selectedBook["ลิงก์ Twitter"] || selectedBook["twitterUrl"] || selectedBook["twitter"] || selectedBook["ลิงก์ X"] || selectedBook["twitterLink"];
        const instagramLink = selectedBook["ลิงก์ Instagram"] || selectedBook["instagramUrl"] || selectedBook["instagram"] || selectedBook["instagramLink"];

        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-xxs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl sm:max-w-4xl w-full p-6 sm:p-9 relative border border-[#d7ccc8] max-h-[95vh] overflow-y-auto animate-scaleUp">
              
              <button onClick={() => setSelectedBook(null)} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[#efebe9] hover:bg-[#800020] text-[#5d4037] hover:text-white transition cursor-pointer font-bold text-sm z-10">✕</button>

              <div className="flex flex-col sm:flex-row gap-7 sm:gap-10 items-start mt-2">
                
                {/* 📸 ฝั่งซ้าย: รูปภาพหน้าปก + แกลเลอรีรูปย่อ */}
                <div className="w-full sm:w-64 flex-shrink-0 flex flex-col items-center gap-3.5 mx-auto sm:mx-0">
                  <div 
                    onClick={() => setIsLightboxOpen(true)}
                    className="relative w-56 sm:w-64 aspect-[3/4] bg-[#f5f2eb] rounded-2xl overflow-hidden border border-[#efebe9] shadow-sm group cursor-zoom-in"
                    title="คลิกเพื่อดูภาพขยายใหญ่เต็มหน้าจอ"
                  >
                    <img src={currentImage} alt={selectedBook["ชื่อหนังสือ"]} className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105" />
                    
                    <div className="absolute top-2 right-2 bg-black/60 hover:bg-black text-white text-[10px] font-bold px-2.5 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      🔍 ขยายรูป
                    </div>

                    {/* ปุ่มเลื่อนรูปภาพ (กรณีมีมากกว่า 1 รูป) */}
                    {displayImages.length > 1 && (
                      <>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImgIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xs font-bold transition shadow-md cursor-pointer"
                          title="รูปก่อนหน้า"
                        >
                          ❮
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveImgIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center text-xs font-bold transition shadow-md cursor-pointer"
                          title="รูปถัดไป"
                        >
                          ❯
                        </button>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold backdrop-blur-xs">
                          {activeImgIndex + 1} / {displayImages.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* รูปภาพย่อ (Thumbnails แกลเลอรีใต้รูปปกหลัก) */}
                  {displayImages.length > 1 && (
                    <div className="w-full">
                      <div className="flex gap-2 max-w-full overflow-x-auto p-1 scrollbar-thin justify-center sm:justify-start">
                        {displayImages.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImgIndex(idx)}
                            className={`w-13 h-17 sm:w-14 sm:h-18 rounded-xl overflow-hidden border-2 transition-all cursor-pointer flex-shrink-0 ${
                              activeImgIndex === idx 
                                ? "border-[#800020] ring-2 ring-[#800020]/40 scale-105 shadow-md" 
                                : "border-transparent opacity-60 hover:opacity-100"
                            }`}
                          >
                            <img src={imgUrl} alt={`รูปที่ ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 📝 ฝั่งขวา: รายละเอียดหนังสือ */}
                <div className="flex-1 w-full space-y-4 text-left">
                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider mb-1 ${isGeneral ? "bg-[#d7ccc8] text-[#5d4037]" : "bg-[#f8bbd0] text-[#880e4f]"}`}>
                      {isGeneral ? "หนังสือทั่วไป" : "นักเขียนอิสระ"}
                    </span>
                    <h2 className="font-serif font-black text-[#4a0414] text-xl sm:text-2xl leading-tight">{selectedBook["ชื่อหนังสือ"]}</h2>
                  </div>

                  {/* ข้อมูลหนังสือ */}
                  <div className="text-sm space-y-2 text-[#5d4037] border-y border-[#efebe9] py-3">
                    <p><span className="text-[#8d6e63] font-medium inline-block w-24">นักเขียน :</span> <span className="font-bold text-[#4a0414]">{selectedBook["ชื่อนักเขียน"] || "-"}</span></p>
                    <p><span className="text-[#8d6e63] font-medium inline-block w-24">สำนักพิมพ์ :</span> <span className="font-bold text-[#4a0414]">{selectedBook["สำนักพิมพ์"] || "-"}</span></p>
                    <p><span className="text-[#8d6e63] font-medium inline-block w-24">ราคา :</span> <span className="font-black text-[#800020]">฿{displayPrice.toLocaleString()}</span></p>
                    <p>
                      <span className="text-[#8d6e63] font-medium inline-block w-24">สถานะคลัง :</span> 
                      {stockLeft > 0 ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-xs">พร้อมส่ง ({stockLeft} เล่ม)</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-xs">สินค้าหมดชั่วคราว</span>
                      )}
                    </p>
                  </div>

                  {/* ดึงค่ารายละเอียด */}
                  <div>
                    <span className="text-xs font-bold text-[#8d6e63] block mb-1">รายละเอียดหนังสือ :</span>
                    <div className="text-xs sm:text-sm text-[#4e342e] leading-relaxed bg-[#fbf9f6] p-3.5 rounded-xl border border-[#efebe9] min-h-[90px] whitespace-pre-line">
                      {selectedBook["รายละเอียด"] || selectedBook["synopsis"] || selectedBook["เรื่องย่อ"] || "ร่วมสัมผัสเรื่องราวและสุนทรียภาพแห่งความอ่านไปพร้อมกับเรา"}
                    </div>
                  </div>

                  {/* ลิงก์ช่องทางสั่งซื้อ */}
                  <div className="pt-2 flex items-center gap-3">
                    <span className="text-xs font-bold text-[#8d6e63]">ช่องทางติดต่อสั่งซื้อ:</span>
                    <div className="flex items-center gap-2.5">
                      {stockLeft > 0 ? (
                        <>
                          {twitterLink && <a href={twitterLink} target="_blank" rel="noopener noreferrer" title="สั่งซื้อผ่าน Twitter (X)" className="w-8 h-8 rounded-full bg-slate-900 hover:bg-black text-white flex items-center justify-center text-sm font-bold shadow-xs hover:scale-105 transition cursor-pointer">𝕏</a>}
                          {instagramLink && (
                            <a href={instagramLink} target="_blank" rel="noopener noreferrer" title="สั่งซื้อผ่าน Instagram" className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 hover:opacity-90 text-white flex items-center justify-center shadow-xs hover:scale-105 transition cursor-pointer">
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28-.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            </a>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-[#c62828] font-bold">งดสั่งซื้อเนื่องจากสินค้าหมด</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* 🔍 FULLSCREEN LIGHTBOX POPUP */}
      {selectedBook && isLightboxOpen && (() => {
        const displayImages = getDisplayImageUrls(
          selectedBook["ลิงก์รูปภาพ"] || selectedBook["imageUrl"] || selectedBook["image"] || selectedBook["imgUrl"] || selectedBook["รูปภาพ"]
        );
        const currentLightboxImg = displayImages[activeImgIndex] || displayImages[0];

        return (
          <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-between p-4 z-50 backdrop-blur-md animate-fadeIn text-white select-none">
            
            {/* Header Lightbox */}
            <div className="w-full max-w-5xl flex flex-wrap justify-between items-center py-2 px-4 z-10 gap-2">
              <div className="flex items-center gap-3">
                <span className="font-serif font-bold text-amber-200 text-sm sm:text-base truncate max-w-xs sm:max-w-md">
                  {selectedBook["ชื่อหนังสือ"]}
                </span>
                <span className="bg-white/20 text-xs px-2.5 py-0.5 rounded-full font-mono">
                  {activeImgIndex + 1} / {displayImages.length}
                </span>
              </div>

              {/* 🔍 Zoom Controls Bar */}
              <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/20 shadow-md">
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.max(1, prev - 0.4))}
                  className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center font-bold text-sm cursor-pointer"
                  title="ซูมออก (-)"
                >
                  -
                </button>
                <span className="min-w-[42px] text-center font-mono text-xs font-bold text-amber-300">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale((prev) => Math.min(5, prev + 0.4))}
                  className="w-6 h-6 rounded-full hover:bg-white/20 flex items-center justify-center font-bold text-sm cursor-pointer"
                  title="ซูมเข้า (+)"
                >
                  +
                </button>
                {zoomScale > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setZoomScale(1);
                      setZoomOffset({ x: 0, y: 0 });
                    }}
                    className="ml-1 text-[10px] px-2 py-0.5 rounded bg-amber-500/80 hover:bg-amber-500 text-white font-sans cursor-pointer font-bold"
                  >
                    ↺ รีเซ็ต
                  </button>
                )}
              </div>

              <button 
                onClick={() => setIsLightboxOpen(false)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center font-bold text-base cursor-pointer transition"
                title="ปิดหน้าต่างรูปขยาย (Esc)"
              >
                ✕
              </button>
            </div>

            {/* Main Lightbox Display with Mouse Wheel Zoom & Drag */}
            <div 
              onWheel={handleWheelZoom}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden my-2 cursor-grab active:cursor-grabbing select-none"
            >
              <img 
                src={currentLightboxImg} 
                alt={`${selectedBook["ชื่อหนังสือ"]} - มุมที่ ${activeImgIndex + 1}`} 
                style={{
                  transform: `scale(${zoomScale}) translate(${zoomOffset.x / zoomScale}px, ${zoomOffset.y / zoomScale}px)`,
                  transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)',
                }}
                className="max-h-[78vh] max-w-full object-contain rounded-lg shadow-2xl pointer-events-none"
                draggable={false}
              />

              {/* Notice badge helper */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white/80 text-[10px] px-3 py-1 rounded-full backdrop-blur-xs font-medium pointer-events-none">
                🖱️ หมุนลูกกลิ้งเมาส์เพื่อซูม • คลิกลากเพื่อเลื่อนดู
              </div>

              {displayImages.length > 1 && (
                <>
                  <button 
                    type="button"
                    onClick={() => setActiveImgIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center text-xl font-bold transition shadow-lg border border-white/20 cursor-pointer z-20"
                    title="รูปก่อนหน้า (ปุ่มลูกศรซ้าย)"
                  >
                    ❮
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveImgIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center text-xl font-bold transition shadow-lg border border-white/20 cursor-pointer z-20"
                    title="รูปถัดไป (ปุ่มลูกศรขวา)"
                  >
                    ❯
                  </button>
                </>
              )}
            </div>

            {/* Footer Lightbox Thumbnails */}
            {displayImages.length > 1 && (
              <div className="flex gap-2 max-w-full overflow-x-auto py-2 px-4 scrollbar-thin z-10 bg-black/40 rounded-xl border border-white/10">
                {displayImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImgIndex(idx)}
                    className={`w-12 h-16 rounded-md overflow-hidden border-2 transition cursor-pointer flex-shrink-0 ${
                      activeImgIndex === idx ? "border-amber-400 ring-2 ring-amber-400/50 scale-105" : "border-transparent opacity-50 hover:opacity-100"
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

          </div>
        );
      })()}

    </div>
  );
}