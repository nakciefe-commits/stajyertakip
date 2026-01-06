import { GoogleGenAI } from "@google/genai";
import { AttendanceRecord, PlanRecord, RecordType, UserProfile } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAttendanceInsight = async (
  user: UserProfile,
  records: AttendanceRecord[],
  plans: PlanRecord[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Anahtarı bulunamadı.";
  }

  try {
    const workRecords = records.filter(r => r.type === RecordType.WORK);
    const totalHours = workRecords.reduce((acc, curr) => acc + curr.hours, 0);

    // Prompt updated to address the intern directly (You/Sen) instead of HR (He/O)
    const prompt = `
      Sen BİLTİR OTEST firmasının yapay zeka stajyer mentörüsün.
      Karşındaki kişi: ${user.firstName} ${user.lastName} (${user.role})
      
      Kullanıcının Verileri:
      - Toplam Gelinen Gün: ${workRecords.length}
      - Toplam Çalışma Saati: ${totalHours}
      - Gelecek Planı: ${plans.length} adet planlanmış gün

      Lütfen doğrudan bu kişiye hitap ederek ("Sen" diliyle), performansını değerlendir, motivasyon ver ve gelişim tavsiyelerinde bulun. 
      Kurumsal ama samimi bir dil kullan.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Analiz oluşturulamadı.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Analiz yapılamadı.";
  }
};

export const generatePythonAnalysisCode = async (
  user: UserProfile,
  records: AttendanceRecord[]
): Promise<string> => {
  if (!process.env.API_KEY) return "# API Key eksik.";

  try {
    const data = records.map(r => ({
      date: r.date,
      hours: r.hours,
      type: r.type,
      description: r.description
    }));

    const prompt = `
      Aşağıdaki JSON verisini kullanarak benim kendi staj verilerimi analiz eden bir Python kodu yaz.
      
      Veri (JSON):
      ${JSON.stringify(data)}

      İsterler:
      1. Veriyi pandas DataFrame'e yükle.
      2. Günlük çalışma saatlerimi görselleştir (matplotlib).
      3. Kodun çıktısı sadece Python kodu olsun, markdown kullanma.
      4. Grafik Başlığı: "${user.firstName} ${user.lastName} - Staj Performans Grafiği"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a Python coding assistant. Output only raw Python code without markdown backticks."
      }
    });

    let code = response.text || "";
    code = code.replace(/```python/g, "").replace(/```/g, "");
    return code;

  } catch (error) {
    return "# Python kodu oluşturulurken hata oluştu.";
  }
};