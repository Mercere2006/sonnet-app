/**
 * ==============================================================================
 * 📚 Sonnet & co. - Google Apps Script (Code.gs) [เวอร์ชันแก้ปรับคอลัมน์อัตโนมัติ 100%]
 * ==============================================================================
 * คำแนะนำการใช้งาน:
 * 1. คัดลอกโค้ดทั้งหมดนี้ไปวางใน Google Apps Script (Extensions -> Apps Script ใน Google Sheets)
 * 2. กด บันทึก (Save)
 * 3. กด Deploy -> Manage deployments -> กดรูปดินสอ (Edit) -> เลือก Version: New version
 * 4. ตั้งค่า Execute as: Me และ Who has access: Anyone
 * 5. กด Deploy
 * ==============================================================================
 */

const SHEET_NAME = "Sheet Name"; // เปลี่ยนชื่อชีตให้ตรงกับใน Google Sheets ของคุณ หากใช้ชื่ออื่น
const FOLDER_NAME = "Sonnet Book Covers";

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const headers = data[0].map(h => String(h).trim());
    const books = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.every(cell => String(cell).trim() === "")) continue;

      const book = {};
      headers.forEach((header, index) => {
        book[header] = row[index] !== undefined ? row[index] : "";
      });
      books.push(book);
    }

    return ContentService.createTextOutput(JSON.stringify(books))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: true,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const action = requestData.action;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.getSheets()[0];
    }

    if (action === "addBookWithCover") {
      return handleAddBook(sheet, requestData);
    } else if (action === "updateStock") {
      return handleUpdateStock(sheet, requestData);
    } else {
      return responseJSON({ success: false, message: "Action ไม่ถูกต้อง" });
    }

  } catch (error) {
    return responseJSON({ success: false, message: "เกิดข้อผิดพลาด: " + error.toString() });
  }
}

function handleAddBook(sheet, data) {
  const uploadedUrls = [];

  // 1. จัดการอัปโหลดรูปภาพหลายรูปขึ้น Google Drive
  const imagesDataList = data.imagesData || (data.imageData ? [data.imageData] : []);
  const imageNamesList = data.imageNames || (data.imageName ? [data.imageName] : []);

  if (imagesDataList.length > 0) {
    const folder = getOrCreateFolder(FOLDER_NAME);

    for (let i = 0; i < imagesDataList.length; i++) {
      const base64Str = imagesDataList[i];
      const fileName = imageNamesList[i] || ("cover_" + Date.now() + "_" + i + ".jpg");

      if (base64Str && base64Str.includes("base64,")) {
        try {
          const contentType = base64Str.substring(5, base64Str.indexOf(";"));
          const base64Data = base64Str.substring(base64Str.indexOf("base64,") + 7);
          const bytes = Utilities.base64Decode(base64Data);
          const blob = Utilities.newBlob(bytes, contentType, fileName);
          
          const file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          
          const directUrl = "https://lh3.googleusercontent.com/d/" + file.getId();
          uploadedUrls.push(directUrl);
        } catch (err) {
          Logger.log("Error uploading image " + i + ": " + err.toString());
        }
      }
    }
  }

  // รวมลิงก์รูปภาพทั้งหมด คั่นด้วยเครื่องหมายจุลภาค , ในคอลัมน์เดียว
  const combinedImageUrls = uploadedUrls.join(", ");

  // 2. อ่านหัวคอลัมน์ (Header Row) จากบรรทัดแรกของ Sheet
  const sheetData = sheet.getDataRange().getValues();
  if (sheetData.length === 0) {
    return responseJSON({ success: false, message: "ไม่พบหัวข้อคอลัมน์ใน Google Sheet" });
  }

  const headers = sheetData[0].map(h => String(h).trim());

  // หา ID ล่าสุด
  let maxId = 0;
  for (let r = 1; r < sheetData.length; r++) {
    const idVal = Number(sheetData[r][0]);
    if (!isNaN(idVal) && idVal > maxId) {
      maxId = idVal;
    }
  }
  const nextId = maxId + 1;
  const targetRowNum = sheetData.length + 1;

  const type = data.type || "นักเขียนอิสระ";
  const title = data.title || "";
  const author = data.author || "";
  const publisher = data.publisher || "";
  const price = data.price !== undefined && data.price !== "" ? Number(data.price) : "";
  const gp = data.gp !== undefined && data.gp !== "" ? (Number(data.gp) / 100) : "";
  const cost = data.cost !== undefined && data.cost !== "" ? Number(data.cost) : "";
  const salePrice = data.salePrice !== undefined && data.salePrice !== "" ? Number(data.salePrice) : "";
  const stock = Number(data.stock) || 0;
  const sold = 0;
  const synopsis = data.synopsis || "";
  const note = data.note || "";
  const twitterUrl = data.twitterUrl || "";
  const instagramUrl = data.instagramUrl || "";

  // คำนวณสูตรตามตำแหน่งคอลัมน์จริง
  const stockColIndex = headers.findIndex(h => h.includes("สต็อก") || h.toLowerCase() === "stock");
  const soldColIndex = headers.findIndex(h => h.includes("ขายออก") || h.toLowerCase() === "sold");
  const costColIndex = headers.findIndex(h => h.includes("ราคาทุน") || h.toLowerCase() === "cost");
  const salePriceColIndex = headers.findIndex(h => h.includes("ราคาขาย") || h.toLowerCase() === "saleprice");
  const coverPriceColIndex = headers.findIndex(h => h.includes("ราคาปก") || h.toLowerCase() === "price");
  const gpColIndex = headers.findIndex(h => h.toUpperCase() === "GP");

  const getColLetter = (idx) => {
    if (idx < 0) return "A";
    let temp = "";
    let letter = "";
    while (idx >= 0) {
      temp = String.fromCharCode((idx % 26) + 65);
      letter = temp + letter;
      idx = Math.floor(idx / 26) - 1;
    }
    return letter;
  };

  const stockColLetter = getColLetter(stockColIndex >= 0 ? stockColIndex : 9);
  const soldColLetter = getColLetter(soldColIndex >= 0 ? soldColIndex : 10);
  const remainingFormula = `=${stockColLetter}${targetRowNum}-${soldColLetter}${targetRowNum}`;

  let totalProfitFormula = "";
  if (type === "หนังสือทั่วไป") {
    const saleColL = getColLetter(salePriceColIndex >= 0 ? salePriceColIndex : 8);
    const costColL = getColLetter(costColIndex >= 0 ? costColIndex : 7);
    totalProfitFormula = `=(${saleColL}${targetRowNum}-${costColL}${targetRowNum})*${soldColLetter}${targetRowNum}`;
  } else {
    const coverColL = getColLetter(coverPriceColIndex >= 0 ? coverPriceColIndex : 5);
    const gpColL = getColLetter(gpColIndex >= 0 ? gpColIndex : 6);
    totalProfitFormula = `=${coverColL}${targetRowNum}*${gpColL}${targetRowNum}*${soldColLetter}${targetRowNum}`;
  }

  // 3. แมปค่าข้อมูลลงตามชื่อคอลัมน์จริงของ Sheet อัตโนมัติ (แก้ปัญหาข้อมูลสลับคอลัมน์ 100%)
  const newRow = headers.map(h => {
    const headerLower = h.toLowerCase().trim();

    if (headerLower === "ลำดับ" || headerLower === "id") return nextId;
    if (headerLower === "ประเภท" || headerLower === "type") return type;
    if (headerLower === "ชื่อหนังสือ" || headerLower === "title") return title;
    if (headerLower === "ชื่อนักเขียน" || headerLower === "author") return author;
    if (headerLower === "สำนักพิมพ์" || headerLower === "publisher") return publisher;
    if (headerLower === "ราคาปก" || headerLower === "ราคา" || headerLower === "price") return price;
    if (headerLower === "gp") return gp;
    if (headerLower === "ราคาทุน" || headerLower === "cost") return cost;
    if (headerLower.includes("ราคาขาย") || headerLower === "saleprice") return salePrice;
    if (headerLower === "สต็อก" || headerLower === "stock") return stock;
    if (headerLower === "ขายออก" || headerLower === "sold") return sold;
    if (headerLower === "คงเหลือ" || headerLower === "remaining") return remainingFormula;
    if (headerLower.includes("ยอดรวม") || headerLower.includes("กำไร") || headerLower === "total") return totalProfitFormula;
    if (headerLower.includes("รายละเอียด") || headerLower.includes("เรื่องย่อ") || headerLower === "synopsis") return synopsis;
    if (headerLower === "หมายเหตุ" || headerLower === "note") return note;
    if (headerLower.includes("twitter") || headerLower.includes("ลิงก์ x") || headerLower === "x") return twitterUrl;
    if (headerLower.includes("instagram") || headerLower === "ig") return instagramUrl;
    if (headerLower.includes("รูปภาพ") || headerLower.includes("image") || headerLower.includes("img")) return combinedImageUrls;

    return "";
  });

  sheet.appendRow(newRow);

  return responseJSON({
    success: true,
    message: "บันทึกข้อมูลหนังสือสำเร็จ",
    id: nextId,
    imageUrls: combinedImageUrls
  });
}

function handleUpdateStock(sheet, data) {
  const targetId = Number(data.id);
  const stockData = sheet.getDataRange().getValues();
  if (stockData.length <= 1) return responseJSON({ success: false, message: "ไม่มีข้อมูลในชีต" });

  const headers = stockData[0].map(h => String(h).trim());
  const stockColIdx = headers.findIndex(h => h.includes("สต็อก") || h.toLowerCase() === "stock");
  const soldColIdx = headers.findIndex(h => h.includes("ขายออก") || h.toLowerCase() === "sold");
  const noteColIdx = headers.findIndex(h => h.includes("หมายเหตุ") || h.toLowerCase() === "note");

  const finalStockCol = stockColIdx >= 0 ? stockColIdx + 1 : 10;
  const finalSoldCol = soldColIdx >= 0 ? soldColIdx + 1 : 11;
  const finalNoteCol = noteColIdx >= 0 ? noteColIdx + 1 : 15;

  for (let i = 1; i < stockData.length; i++) {
    if (Number(stockData[i][0]) === targetId) {
      const rowNum = i + 1;
      sheet.getRange(rowNum, finalStockCol).setValue(Number(data.stock) || 0);
      sheet.getRange(rowNum, finalSoldCol).setValue(Number(data.sold) || 0);
      if (data.note !== undefined) {
        sheet.getRange(rowNum, finalNoteCol).setValue(data.note);
      }
      return responseJSON({ success: true, message: "อัปเดตสต็อกเรียบร้อยแล้ว" });
    }
  }
  return responseJSON({ success: false, message: "ไม่พบรายการหนังสือตาม ID ที่ระบุ" });
}

function getOrCreateFolder(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

function responseJSON(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
