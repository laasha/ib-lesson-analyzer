import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API routes FIRST
  app.post("/api/analyze", async (req, res) => {
    try {
      const {
        transcript,
        generalText,
        positiveNotes,
        negativeNotes,
        language = "ka",
        program,
        subject,
        observerName,
        selectedRubrics
      } = req.body;

      const hasContent = 
        (transcript && typeof transcript === "string" && transcript.trim()) ||
        (generalText && typeof generalText === "string" && generalText.trim()) ||
        (positiveNotes && Array.isArray(positiveNotes) && positiveNotes.some(n => n.trim())) ||
        (negativeNotes && Array.isArray(negativeNotes) && negativeNotes.some(n => n.trim()));

      if (!hasContent) {
        return res.status(400).json({ error: "გთხოვთ შეაყვანოთ გაკვეთილის ტრანსკრიპტი, ზოგადი დაკვირვება ან შენიშვნები." });
      }

      const { apiKey: clientApiKey } = req.body;
      const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: language === "ka" ? "Gemini API გასაღები ვერ მოიძებნა. გთხოვთ დაამატოთ ის პარამეტრების პანელში." : "Gemini API key not found. Please add it in the Settings panel." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Build composite input text
      let compositeInput = "";
      if (generalText && generalText.trim()) {
        compositeInput += `=== General Observation / Process Description ===\n${generalText}\n\n`;
      }
      if (positiveNotes && Array.isArray(positiveNotes) && positiveNotes.length > 0) {
        const filteredPos = positiveNotes.filter(n => n.trim());
        if (filteredPos.length > 0) {
          compositeInput += `=== Positive Observations ===\n${filteredPos.map(note => `- ${note}`).join("\n")}\n\n`;
        }
      }
      if (negativeNotes && Array.isArray(negativeNotes) && negativeNotes.length > 0) {
        const filteredNeg = negativeNotes.filter(n => n.trim());
        if (filteredNeg.length > 0) {
          compositeInput += `=== Areas for Improvement / Negative Observations ===\n${filteredNeg.map(note => `- ${note}`).join("\n")}\n\n`;
        }
      }
      if (selectedRubrics && Array.isArray(selectedRubrics) && selectedRubrics.length > 0) {
        compositeInput += `=== Evaluated Rubric Focus Areas ===\n${selectedRubrics.map(rubric => `- ${rubric}`).join("\n")}\n\n`;
      }
      if (!compositeInput.trim() && transcript) {
        compositeInput = transcript;
      }

      let prompt = "";
      const outputLanguage = language === "en" ? "English" : "Georgian";
      const isGeneral = program === "ზოგადი" || program === "General" || program === "general";

      if (language === "en") {
        prompt = `
You are the Lead Academic Coordinator and Teacher Professional Development Expert at Newton Free School${isGeneral ? "" : ", specializing in the IB (International Baccalaureate) programs"}.
Your task is to review the provided classroom observation notes or transcript and produce a structured, professional lesson feedback report and action plan.

Context:
- Program / Stage: ${program || "General Stage"}
- Subject / Topic: ${subject || "General Subject"}
${observerName ? `- Observer: ${observerName}` : ""}
${selectedRubrics && selectedRubrics.length > 0 ? `- Selected Evaluation Rubric Focus Areas: ${selectedRubrics.join(", ")}` : ""}

Your evaluation must cover the following pedagogical standards:
${isGeneral ? `
- Classroom Management & Time efficiency (Use of classroom time and routines)
- Active Student Engagement (Student participation, questioning and talk time)
- Clarity of Learning Goals & Formative feedback
` : `
- Inquiry-based learning (How inquiry and questioning are structured)
- Student Agency / Engagement (Student talk time, ownership)
- Conceptual understanding (Depth of conceptual focus vs memorization)
`}
${selectedRubrics && selectedRubrics.length > 0 ? `- Additional rubric alignments: ${selectedRubrics.join(", ")}` : ""}

You must produce your final report strictly in Markdown, with no introduction, conversational preamble, or conclusion. Use the following exact headings:

## 📊 Integrated Lesson Analysis

### 🌟 Strengths
* [Observation with timestamp or description]
* [Observation with timestamp or description]

### 📈 Areas for Growth
* [What was lacking or could be improved under teaching standards]
* [Moment or practice where alternative approaches would be better]

### 💡 Core Recommendation
* [1-2 highly actionable advice or Socratic Coaching questions for the next lesson]

---

## 🚀 Action Plan
1. **[Step Title]** - [How to implement in practice]
2. **[Step Title]** - [Resources, thinking routines, or specific strategies to use]
3. **[Step Title]** - [How to measure progress in the next observation]

Tone: Collegial, constructive, supportive, and professional.
Output Language: MUST be completely in ${outputLanguage}.

Here is the observation data to analyze:
"""
${compositeInput}
"""
`;
      } else {
        prompt = `
შენ ხარ ნიუტონის თავისუფალი სკოლის წამყვანი აკადემიური კოორდინატორი და მასწავლებელთა პროფესიული განვითარების ექსპერტი${isGeneral ? "" : " (IB პროგრამის სპეციალიზაციით)"}.
შენი ამოცანაა, მიიღო გაკვეთილზე დაკვირვების ჩანაწერები ან ტრანსკრიპტი და ერთიანად, სტრუქტურირებულად დააბრუნო პროფესიონალური შეფასება და სამოქმედო გეგმა.

კონტექსტი:
- პროგრამა/საფეხური: ${program || "ზოგადი საფეხური"}
- საგანი/თემა: ${subject || "ზოგადი საგანი"}
${observerName ? `- დამკვირვებელი: ${observerName}` : ""}
${selectedRubrics && selectedRubrics.length > 0 ? `- შეფასების რუბრიკის ფოკუს-არეები: ${selectedRubrics.join(", ")}` : ""}

შენი შეფასება უნდა მოიცავდეს შემდეგ პედაგოგიურ სტანდარტებს:
${isGeneral ? `
- საკლასო მენეჯმენტი და დროის ეფექტური მართვა (დროის განაწილება და რუტინები)
- მოსწავლეთა აქტიური ჩართულობა (მოსწავლის მონაწილეობის დონე და კითხვა-პასუხის ხარისხი)
- სასწავლო მიზნების შესაბამისობა და განმავითარებელი უკუკავშირი
` : `
- კვლევაზე დაფუძნებული სწავლება (Inquiry-based learning)
- მოსწავლეთა ჩართულობა (Student Agency)
- კონცეპტუალური გაგება (სიღრმისეული წვდომა)
`}
${selectedRubrics && selectedRubrics.length > 0 ? `- დამატებითი რუბრიკის კრიტერიუმები: ${selectedRubrics.join(", ")}` : ""}

გამომავალი ფორმატი უნდა იყოს მკაცრად შემდეგი სტრუქტურის მქონე Markdown-ში და არ შეიცავდეს სხვა ტექსტს (პრეამბულის ან დასკვნის გარეშე), მხოლოდ ამას:

## 📊 გაკვეთილის კომპლექსური ანალიზი

### 🌟 ძლიერი მხარეები
* [კონკრეტული მაგალითი თაიმსტემპით ან აღწერით]
* [კონკრეტული მაგალითი თაიმსტემპით ან აღწერით]

### 📈 განვითარების არეალი
* [რა დააკლდა გაკვეთილს ${isGeneral ? "პედაგოგიური" : "IB"} სტანდარტების მიხედვით]
* [კონკრეტული მომენტი, სადაც მიდგომის შეცვლა აჯობებდა]

### 💡 მთავარი რეკომენდაცია
* [პრაქტიკული და განხორციელებადი რჩევა ან ქოუჩინგის კითხვა შემდეგი გაკვეთილისთვის]

---

## 🚀 სამოქმედო გეგმა
1. **[ნაბიჯის დასახელება]** - [როგორ უნდა განახორციელოს პრაქტიკაში]
2. **[ნაბიჯის დასახელება]** - [რა სასწავლო რესურსი, აზროვნების რუტინა ან მიდგომა გამოიყენოს]
3. **[ნაბიჯის დასახელება]** - [როგორ გავზომოთ პროგრესი მომდევნო დაკვირვებისას]

ტონი: კოლეგიალური, მხარდამჭერი, ობიექტური და გასაგები.
პასუხის ენა: MUST be completely in ${outputLanguage}.

აი, გასაანალიზებელი მონაცემები:
"""
${compositeInput}
"""
`;
      }

      let response;
      let errorDetails = "";
      const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
      
      for (const model of modelsToTry) {
        let attempts = 0;
        const maxAttempts = 2;
        while (attempts < maxAttempts) {
          try {
            console.log(`Attempting analysis with model: ${model} (attempt ${attempts + 1})`);
            response = await ai.models.generateContent({
              model: model,
              contents: prompt,
            });
            break; // Success! Break inner loop
          } catch (e: any) {
            attempts++;
            errorDetails = e.message || String(e);
            console.warn(`Error on model ${model} (attempt ${attempts}/${maxAttempts}):`, errorDetails);
            if (attempts < maxAttempts) {
              // Wait 1.5 seconds before retrying the same model
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
          }
        }
        if (response) {
          break; // Success! Break outer loop
        }
      }

      if (!response) {
        throw new Error(`ყველა ხელმისაწვდომმა AI მოდელმა დააბრუნა შეცდომა: ${errorDetails}`);
      }

      const resultText = response.text || "";
      res.json({ result: resultText });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "სერვერის შეცდომა ანალიზისას" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
