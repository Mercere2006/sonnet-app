const JSON_CONTENT_TYPE = "text/plain;charset=utf-8";

export async function postToAppsScript(apiUrl, payload) {
  let response;

  try {
    response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": JSON_CONTENT_TYPE },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "ติดต่อ Google Apps Script ไม่สำเร็จ กรุณาตรวจว่า Deploy Code.gs เวอร์ชันล่าสุดแล้วและตั้งสิทธิ์ Web app เป็น Anyone",
    );
  }

  const responseText = await response.text();
  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      "Google Apps Script ยังไม่ใช่เวอร์ชันที่รองรับการอัปโหลดรูป กรุณาอัปเดตและ Deploy Code.gs ใหม่",
    );
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Google Apps Script บันทึกข้อมูลไม่สำเร็จ");
  }

  return result;
}
