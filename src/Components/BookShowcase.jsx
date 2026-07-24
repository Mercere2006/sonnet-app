import React, { useState } from 'react';

export default function BookShowcase({ books, loading }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("ทั้งหมด");
  const [selectedBook, setSelectedBook] = useState(null);

  // 💡 ฟังก์ชันแปลงลิงก์ Google Drive ให้แสดงผลบนเว็บได้ชัวร์ 100%
  const getDisplayImageUrl = (url) => {
    if (!url || url.includes("Error") || String(url).trim() === "") {
      return "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop&q=60";
    }
    // หากเป็นลิงก์ Google Drive ให้ดึงเฉพาะ ID ของรูปภาพมาแปลงเป็นรูปแบบที่เว็บแสดงได้
    if (String(url).includes("google.com") || String(url).includes("googleusercontent.com")) {
      const match = String(url).match(/\/d\/([a-zA-Z0-9_-]+)/) || String(url).match(/id=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
    }
    return url;
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

  return (
    <div className="bg-[#fcfaf7] min-h-screen text-[#3e2723] p-4 sm:p-8 max-w-7xl mx-auto">
      
      {/* ส่วนหัวเว็บหน้าร้าน */}
      <header className="text-center mb-12 max-w-2xl mx-auto space-y-3 pt-6">
        <div className="text-[#800020] font-serif tracking-widest text-xs font-bold uppercase">— Welcome to —</div>
        <h1 className="text-4xl sm:text-5xl font-serif font-black text-[#4a0414] tracking-tight">Sonnet & co.</h1>
        <div className="w-16 h-0.5 bg-[#c9a77c] mx-auto my-2"></div>
        <p className="text-[#6d4c41] text-xs sm:text-sm leading-relaxed">
          พื้นที่จัดแสดงผลงานวรรณกรรม นิยาย และหนังสือแฮนด์เมดชิ้นพิเศษ <br />
          คลิกที่รูปภาพหรือชื่อหนังสือเพื่อเปิดดูรายละเอียดและเช็กสต็อกสินค้าเรียลไทม์ได้ทันทีค่ะ
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
          {filteredBooks.map((book, idx) => {
            const isGeneral = book["ประเภท"] === "หนังสือทั่วไป";
            const displayPrice = isGeneral ? (Number(book["ราคาขาย"]) || 0) : (Number(book["ราคาปก"]) || 0);
            
            // 💡 เรียกใช้ฟังก์ชันแปลงรูปภาพ (รองรับทั้งภาษาไทยและอังกฤษ)
            const coverImage = getDisplayImageUrl(
              book["ลิงก์รูปภาพ"] || book["imageUrl"] || book["image"] || book["imgUrl"] || book["รูปภาพ"]
            );

            return (
              <div 
                key={idx} 
                onClick={() => setSelectedBook(book)}
                className="bg-white rounded-xl shadow-xs border border-[#d7ccc8]/50 overflow-hidden flex flex-col justify-between group hover:shadow-md hover:border-[#bcaaa4] transition-all duration-300 cursor-pointer text-left"
              >
                <div>
                  <div className="w-full aspect-[3/4] bg-[#f5f2eb] overflow-hidden border-b border-[#efebe9]">
                    <img src={coverImage} alt={book["ชื่อหนังสือ"]} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" loading="lazy" />
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h2 className="font-serif font-bold text-[#4a0414] text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-[#800020] transition-colors">{book["ชื่อหนังสือ"]}</h2>
                    <p className="text-xs text-[#8d6e63] font-medium truncate">{book["ชื่อนักเขียน"] || "-"}</p>
                  </div>
                </div>
                <div className="p-3.5 pt-0 mt-auto flex justify-between items-center">
                  <span className="text-sm font-black text-[#800020]">฿{displayPrice.toLocaleString()}</span>
                  <span className="text-[10px] text-[#c9a77c] font-bold tracking-wide uppercase group-hover:text-[#4a0414]">Detail →</span>
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
        
        // 💡 เรียกใช้ฟังก์ชันแปลงรูปภาพตรงนี้ด้วย (รองรับทั้งภาษาไทยและอังกฤษ)
        const coverImage = getDisplayImageUrl(
          selectedBook["ลิงก์รูปภาพ"] || selectedBook["imageUrl"] || selectedBook["image"] || selectedBook["imgUrl"] || selectedBook["รูปภาพ"]
        );
        
        const twitterLink = selectedBook["ลิงก์ Twitter"] || selectedBook["twitterUrl"] || selectedBook["twitter"] || selectedBook["ลิงก์ X"] || selectedBook["twitterLink"];
        const instagramLink = selectedBook["ลิงก์ Instagram"] || selectedBook["instagramUrl"] || selectedBook["instagram"] || selectedBook["instagramLink"];

        return (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fadeIn backdrop-blur-xxs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative border border-[#d7ccc8] max-h-[95vh] overflow-y-auto animate-scaleUp">
              
              <button onClick={() => setSelectedBook(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#efebe9] hover:bg-[#800020] text-[#5d4037] hover:text-white transition cursor-pointer font-bold text-sm z-10">✕</button>

              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start mt-4">
                
                {/* 📸 ฝั่งซ้าย: รูปภาพหน้าปก */}
                <div className="w-48 sm:w-52 flex-shrink-0 bg-[#f5f2eb] rounded-xl overflow-hidden border border-[#efebe9] aspect-[3/4] shadow-sm mx-auto sm:mx-0">
                  <img src={coverImage} alt={selectedBook["ชื่อหนังสือ"]} className="w-full h-full object-cover" />
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
                    <div className="text-xs sm:text-sm text-[#4e342e] leading-relaxed bg-[#fbf9f6] p-3.5 rounded-xl border border-[#efebe9] min-h-[90px] whitespace-normal">
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

    </div>
  );
}