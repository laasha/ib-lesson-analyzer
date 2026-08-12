import React, { useState, useEffect, useRef } from "react";
import { 
  BookOpen, 
  FileText, 
  Sparkles, 
  Upload, 
  Copy, 
  Check, 
  Printer, 
  RotateCcw, 
  AlertCircle, 
  GraduationCap, 
  TrendingUp, 
  Layers, 
  Lightbulb, 
  ArrowRight,
  ClipboardList,
  Compass,
  UserCheck,
  CheckCircle2,
  Mic,
  MicOff,
  Play,
  Pause,
  Clock,
  Plus,
  Trash2,
  Globe,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Settings,
  Archive,
  Download,
  Mail
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { PRESET_TRANSCRIPTS } from "./presets";
import { AnalysisRequest, AnalysisResponse } from "./types";

interface ParsedReport {
  success: boolean;
  strengths: string[];
  growth: string[];
  recommendation: string;
  planSteps: { number: number; title: string; description: string }[];
  emailText?: string;
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/_/g, "")
    .replace(/`/g, "")
    .replace(/^[-–:•\s\.\*]+/, "") // remove leading bullet points/dashes/dots
    .trim();
}

function parseReport(markdown: string | null, language: "ka" | "en" = "ka"): ParsedReport {
  if (!markdown) {
    return { success: false, strengths: [], growth: [], recommendation: "", planSteps: [], emailText: "" };
  }

  try {
    const strengths: string[] = [];
    const growth: string[] = [];
    let recommendation = "";
    let emailText = "";
    const planSteps: { number: number; title: string; description: string }[] = [];

    const lines = markdown.split("\n");
    let currentSection = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const lowerLine = line.toLowerCase();
      // Identify section transitions (Georgian and English variants)
      if (line.includes("ძლიერი მხარეები") || line.includes("🌟") || lowerLine.includes("strengths")) {
        currentSection = "strengths";
        continue;
      } else if (line.includes("განვითარების არეალი") || line.includes("📈") || lowerLine.includes("growth") || lowerLine.includes("areas for growth") || lowerLine.includes("areas for development")) {
        currentSection = "growth";
        continue;
      } else if (line.includes("მთავარი რეკომენდაცია") || line.includes("💡") || lowerLine.includes("recommendation")) {
        currentSection = "recommendation";
        continue;
      } else if (line.includes("სამოქმედო გეგმა") || line.includes("🚀") || lowerLine.includes("action plan")) {
        currentSection = "plan";
        continue;
      } else if (line.includes("მეილის ვერსია") || line.includes("✉️") || lowerLine.includes("email version")) {
        currentSection = "email";
        continue;
      } else if (line.startsWith("##") || line.startsWith("---")) {
        continue;
      }

      if (currentSection === "strengths") {
        if (line.startsWith("*") || line.startsWith("-")) {
          const cleaned = cleanMarkdown(line.substring(1));
          if (cleaned) strengths.push(cleaned);
        } else if (line.match(/^\d+\./)) {
          const cleaned = cleanMarkdown(line.replace(/^\d+\.\s*/, ""));
          if (cleaned) strengths.push(cleaned);
        }
      } else if (currentSection === "growth") {
        if (line.startsWith("*") || line.startsWith("-")) {
          const cleaned = cleanMarkdown(line.substring(1));
          if (cleaned) growth.push(cleaned);
        } else if (line.match(/^\d+\./)) {
          const cleaned = cleanMarkdown(line.replace(/^\d+\.\s*/, ""));
          if (cleaned) growth.push(cleaned);
        }
      } else if (currentSection === "recommendation") {
        const cleanLine = cleanMarkdown(line);
        if (cleanLine) {
          recommendation += (recommendation ? " " : "") + cleanLine;
        }
      } else if (currentSection === "plan") {
        // Matches numbered list "1. **Step Name** - Description" or similar
        const match = line.match(/^(\d+)\.\s*(?:\*\*(.*?)\*\*|\*(.*?)\*|(.*?))\s*[-–:]\s*(.*)$/);
        if (match) {
          const stepNum = parseInt(match[1]);
          const stepTitle = match[2] || match[3] || match[4] || "";
          const stepDesc = match[5] || "";
          planSteps.push({
            number: stepNum,
            title: cleanMarkdown(stepTitle),
            description: cleanMarkdown(stepDesc)
          });
        } else {
          // Alternative matches
          const altMatch = line.match(/^(\d+)\.\s*(.*)$/);
          if (altMatch) {
            const stepNum = parseInt(altMatch[1]);
            const rest = altMatch[2].trim();
            const boldMatch = rest.match(/^\*\*(.*?)\*\*(.*)$/);
            if (boldMatch) {
              planSteps.push({
                number: stepNum,
                title: cleanMarkdown(boldMatch[1]),
                description: cleanMarkdown(boldMatch[2])
              });
            } else {
              planSteps.push({
                number: stepNum,
                title: language === "ka" ? `ნაბიჯი ${stepNum}` : `Step ${stepNum}`,
                description: cleanMarkdown(rest)
              });
            }
          }
        }
      } else if (currentSection === "email") {
        emailText += (emailText ? "\n" : "") + line;
      }
    }

    if (strengths.length > 0 || growth.length > 0 || planSteps.length > 0 || emailText) {
      return { success: true, strengths, growth, recommendation: cleanMarkdown(recommendation), planSteps, emailText };
    }
  } catch (e) {
    console.error("Error parsing markdown report:", e);
  }
  return { success: false, strengths: [], growth: [], recommendation: "", planSteps: [], emailText: "" };
}

function serializeReport(parsed: ParsedReport, language: "ka" | "en" = "ka"): string {
  let md = "";
  if (language === "ka") {
    md += `## 📊 გაკვეთილის კომპლექსური ანალიზი\n\n`;
    if (parsed.strengths.length > 0) {
      md += `### 🌟 ძლიერი მხარეები\n`;
      parsed.strengths.forEach(s => {
        md += `* ${s}\n`;
      });
      md += `\n`;
    }
    if (parsed.growth.length > 0) {
      md += `### 📈 განვითარების არეალი\n`;
      parsed.growth.forEach(g => {
        md += `* ${g}\n`;
      });
      md += `\n`;
    }
    if (parsed.recommendation) {
      md += `### 💡 მთავარი რეკომენდაცია\n* ${parsed.recommendation}\n\n`;
    }
    if (parsed.planSteps.length > 0) {
      md += `---\n\n## 🚀 სამოქმედო გეგმა\n`;
      parsed.planSteps.forEach(step => {
        md += `${step.number}. **${step.title}** - ${step.description}\n`;
      });
    }
  } else {
    md += `## 📊 Integrated Lesson Analysis\n\n`;
    if (parsed.strengths.length > 0) {
      md += `### 🌟 Strengths\n`;
      parsed.strengths.forEach(s => {
        md += `* ${s}\n`;
      });
      md += `\n`;
    }
    if (parsed.growth.length > 0) {
      md += `### 📈 Areas for Growth\n`;
      parsed.growth.forEach(g => {
        md += `* ${g}\n`;
      });
      md += `\n`;
    }
    if (parsed.recommendation) {
      md += `### 💡 Core Recommendation\n* ${parsed.recommendation}\n\n`;
    }
    if (parsed.planSteps.length > 0) {
      md += `---\n\n## 🚀 Action Plan\n`;
      parsed.planSteps.forEach(step => {
        md += `${step.number}. **${step.title}** - ${step.description}\n`;
      });
    }
  }
  return md;
}

function serializeToEmail(parsed: ParsedReport, language: "ka" | "en", teacherName: string, observerName: string, subject: string): string {
  if (language === "ka") {
    return `მოგესალმებით ${teacherName || "კოლეგავ"},

იმედია კარგად ხართ.

გაზიარებთ გაკვეთილზე დაკვირვების შედეგად მომზადებულ ანგარიშს და უკუკავშირს თემაზე: ${subject || "ზოგადი თემა"}.

🌟 ძლიერი მხარეები:
${parsed.strengths.map(s => `• ${s}`).join("\n")}

📈 განვითარების არეალი:
${parsed.growth.map(g => `• ${g}`).join("\n")}

💡 მთავარი რეკომენდაცია:
${parsed.recommendation}

🚀 სამოქმედო გეგმა:
${parsed.planSteps.map(step => `${step.number}. ${step.title} - ${step.description}`).join("\n")}

იმედი გვაქვს, ეს უკუკავშირი დაგეხმარებათ საგაკვეთილო პროცესის კიდევ უფრო მეტად განვითარებაში.

საუკეთესო სურვილებით,
${observerName || "აკადემიური კოორდინატორი"}`;
  } else {
    return `Dear ${teacherName || "colleague"},

I hope this email finds you well.

I would like to share the lesson observation evaluation and feedback for the topic: ${subject || "General Topic"}.

🌟 Strengths:
${parsed.strengths.map(s => `• ${s}`).join("\n")}

📈 Areas for Growth:
${parsed.growth.map(g => `• ${g}`).join("\n")}

💡 Core Recommendation:
${parsed.recommendation}

🚀 Action Plan:
${parsed.planSteps.map(step => `${step.number}. ${step.title} - ${step.description}`).join("\n")}

We hope this feedback helps you in developing your classroom practice further.

Best regards,
${observerName || "Academic Coordinator"}`;
  }
}

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [program, setProgram] = useState("ზოგადი");
  const [subject, setSubject] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [observerName, setObserverName] = useState(() => localStorage.getItem("observer_name") || "");
  const [showPresets, setShowPresets] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archiveItems, setArchiveItems] = useState<any[]>([]);
  
  // New Form/Structured mode states
  const [activeInputTab, setActiveInputTab] = useState<"form" | "transcript">("form");
  const [language, setLanguage] = useState<"ka" | "en">("ka");
  const [generalText, setGeneralText] = useState("");
  const [positiveNotes, setPositiveNotes] = useState<string[]>([""]);
  const [negativeNotes, setNegativeNotes] = useState<string[]>([""]);
  const [selectedRubrics, setSelectedRubrics] = useState<string[]>([]);
  const [editableReport, setEditableReport] = useState<ParsedReport | null>(null);
  const [rubricsExpanded, setRubricsExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  // Loading & stage state
  const [loading, setLoading] = useState(false);
  const [currentStage, setCurrentStage] = useState(1);
  const [stageProgress, setStageProgress] = useState(0);
  
  // Results
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [reportTab, setReportTab] = useState<"report" | "email">("report");
  const [activeArchiveId, setActiveArchiveId] = useState<string | null>(null);

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to report on completion
  const reportRef = useRef<HTMLDivElement>(null);

  // Voice Typing state
  const [isListening, setIsListening] = useState(false);
  const [listeningTarget, setListeningTarget] = useState<"transcript" | "observation" | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const listeningTargetRef = useRef<"transcript" | "observation" | null>(null);

  // Lesson observation timer state
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [observationComment, setObservationComment] = useState("");
  const [showTimerSuccess, setShowTimerSuccess] = useState(false);

  // API settings & rubric scores states
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});

  // Dynamically change browser tab title based on selected language
  // Load archive items when archive view is toggled
  useEffect(() => {
    if (showArchive) {
      const existing = localStorage.getItem("ib_archive");
      setArchiveItems(existing ? JSON.parse(existing) : []);
    }
  }, [showArchive]);

  // Set editable report state when new report comes in
  useEffect(() => {
    if (report) {
      setEditableReport(parseReport(report, language));
    } else {
      setEditableReport(null);
    }
  }, [report, language]);

  // Auto-sync edits to local storage archive
  useEffect(() => {
    if (editableReport && activeArchiveId) {
      const existing = localStorage.getItem("ib_archive");
      if (existing) {
        const archiveList = JSON.parse(existing);
        const index = archiveList.findIndex((item: any) => item.id === activeArchiveId);
        if (index !== -1) {
          const updatedReportText = serializeReport(editableReport, language);
          archiveList[index] = {
            ...archiveList[index],
            reportText: updatedReportText,
            teacherName,
            observerName,
            subject,
            program,
            rubricScores,
            selectedRubrics,
            inputs: {
              transcript,
              generalText,
              positiveNotes,
              negativeNotes,
              activeInputTab
            }
          };
          localStorage.setItem("ib_archive", JSON.stringify(archiveList));
        }
      }
    }
  }, [editableReport, activeArchiveId]);

  useEffect(() => {
    document.title = language === "ka"
      ? "ნიუტონის თავისუფალი სკოლა | IB აკადემიური მონიტორინგი"
      : "Newton Free School | IB Academic Monitoring";
  }, [language]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "ka-GE"; // Georgian Language Support

        rec.onresult = (event: any) => {
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " ";
            }
          }

          if (finalTranscript) {
            const currentTarget = listeningTargetRef.current;
            if (currentTarget === "transcript") {
              setTranscript((prev) => {
                const trimmed = prev.trim();
                return trimmed ? `${trimmed}\n${finalTranscript.trim()}` : finalTranscript.trim();
              });
            } else if (currentTarget === "observation") {
              setObservationComment((prev) => {
                const trimmed = prev.trim();
                return trimmed ? `${trimmed} ${finalTranscript.trim()}` : finalTranscript.trim();
              });
            }
          }
        };

        rec.onend = () => {
          setIsListening(false);
          setListeningTarget(null);
        };

        rec.onerror = (e: any) => {
          console.error("Speech recognition error:", e);
          if (e.error === "not-allowed") {
            setError(
              language === "ka"
                ? "მიკროფონზე წვდომა უარყოფილია. გთხოვთ ჩართოთ მიკროფონის გამოყენება."
                : "Microphone access denied. Please enable microphone usage."
            );
          } else if (e.error !== "no-speech") {
            setError(
              language === "ka"
                ? `ხმის ჩაწერის შეცდომა: ${e.error}`
                : `Voice recording error: ${e.error}`
            );
          }
          setIsListening(false);
          setListeningTarget(null);
        };

        setRecognition(rec);
      }
    }
  }, []);

  const toggleListening = (target: "transcript" | "observation") => {
    if (!recognition) {
      setError(
        language === "ka"
          ? "თქვენს ბრაუზერს არ აქვს ხმის ჩაწერის მხარდაჭერა (რეკომენდებულია Google Chrome ან Edge)."
          : "Your browser does not support voice typing (Google Chrome or Edge recommended)."
      );
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      setListeningTarget(null);
    } else {
      try {
        setError(null);
        listeningTargetRef.current = target;
        setListeningTarget(target);
        setIsListening(true);
        recognition.lang = language === "ka" ? "ka-GE" : "en-US";
        recognition.start();
      } catch (e: any) {
        console.error(e);
        setIsListening(false);
        setListeningTarget(null);
      }
    }
  };

  // Lesson observation timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAddObservation = (type: "positive" | "negative" | "transcript") => {
    if (!observationComment.trim()) return;

    const timestamp = formatTime(timerSeconds);
    const formattedObservation = `[${timestamp}] ${observationComment.trim()}`;

    if (type === "positive") {
      setPositiveNotes((prev) => {
        const last = prev[prev.length - 1];
        if (!last || !last.trim()) {
          const updated = [...prev];
          updated[updated.length - 1] = formattedObservation;
          return updated;
        }
        return [...prev, formattedObservation];
      });
    } else if (type === "negative") {
      setNegativeNotes((prev) => {
        const last = prev[prev.length - 1];
        if (!last || !last.trim()) {
          const updated = [...prev];
          updated[updated.length - 1] = formattedObservation;
          return updated;
        }
        return [...prev, formattedObservation];
      });
    } else {
      setTranscript((prev) => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed}\n${formattedObservation}` : formattedObservation;
      });
    }

    setObservationComment("");
    setShowTimerSuccess(true);
    setTimeout(() => setShowTimerSuccess(false), 2000);
  };

  // Progress animation simulation for the 3 hidden stages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setStageProgress((prev) => {
          if (prev >= 95) {
            // Swap stage
            setCurrentStage((stage) => {
              if (stage < 3) {
                setStageProgress(0);
                return stage + 1;
              }
              return stage; // hold at 3, wait for real API resolution
            });
            return 95;
          }
          return prev + (3 - currentStage + 1) * 3; // slower as it gets to later stages
        });
      }, 150);
    } else {
      setStageProgress(0);
      setCurrentStage(1);
    }
    return () => clearInterval(interval);
  }, [loading, currentStage]);

  useEffect(() => {
    if (report && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [report]);

  const handlePresetSelect = (presetId: string) => {
    const preset = PRESET_TRANSCRIPTS.find((p) => p.id === presetId);
    if (preset) {
      setTranscript(preset.content[language]);
      setProgram(preset.program);
      setSubject(preset.subject[language]);
      setActiveInputTab("transcript");
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".txt") && !file.name.endsWith(".md")) {
      setError(
        language === "ka"
          ? "გთხოვთ ატვირთოთ მხოლოდ ტექსტური ფაილი (.txt, .md)"
          : "Please upload only text files (.txt, .md)"
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === "string") {
        setTranscript(event.target.result);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError(
        language === "ka"
          ? "ფაილის წაკითხვისას დაფიქსირდა შეცდომა."
          : "An error occurred while reading the file."
      );
    };
    reader.readAsText(file);
  };

  const handleAnalyze = async () => {
    const isFormMode = activeInputTab === "form";
    
    // Check if we have content
    const hasFormContent = isFormMode && (
      generalText.trim() || 
      positiveNotes.some(n => n.trim()) || 
      negativeNotes.some(n => n.trim())
    );
    const hasTranscriptContent = !isFormMode && transcript.trim();

    if (!hasFormContent && !hasTranscriptContent) {
      setError(
        language === "ka"
          ? "გთხოვთ შეაყვანოთ ზოგადი დაკვირვება, ძლიერი/განვითარების შენიშვნები ან გაკვეთილის ტრანსკრიპტი."
          : "Please enter general observations, strengths/growth notes, or a lesson transcript."
      );
      return;
    }

    setLoading(true);
    setError(null);
    setReport(null);
    setCurrentStage(1);
    setStageProgress(0);

    try {
      // If we are in form mode, let's also sync a fallback composite text in transcript
      let compositeTranscript = "";
      if (teacherName.trim()) {
        compositeTranscript += `=== Teacher / Instructor ===\n${teacherName}\n\n`;
      }
      if (generalText.trim()) {
        compositeTranscript += `=== General Observation / Process Description ===\n${generalText}\n\n`;
      }
      const filteredPos = positiveNotes.filter(n => n.trim());
      if (filteredPos.length > 0) {
        compositeTranscript += `=== Positive Observations ===\n${filteredPos.map(note => `- ${note}`).join("\n")}\n\n`;
      }
      const filteredNeg = negativeNotes.filter(n => n.trim());
      if (filteredNeg.length > 0) {
        compositeTranscript += `=== Areas for Improvement / Negative Observations ===\n${filteredNeg.map(note => `- ${note}`).join("\n")}\n\n`;
      }
      const rubricIdMap: Record<string, string> = {
        "Lesson Goals": "Goals",
        "Time Management": "Time",
        "Constructivist Activities": "Constructivist",
        "Student Engagement": "Engagement",
        "Differentiation": "Differentiation",
        "Classroom Management": "Classroom",
        "Formative Assessment": "Assessment",
        "Positive Communication": "Communication"
      };

      const formattedRubrics = selectedRubrics.map(label => {
        const id = rubricIdMap[label];
        const score = id ? (rubricScores[id] || 8) : 8;
        return `${label} (Score: ${score}/10)`;
      });

      if (formattedRubrics.length > 0) {
        compositeTranscript += `=== Evaluated Rubric Focus Areas ===\n${formattedRubrics.map(r => `- ${r}`).join("\n")}\n\n`;
      }

      const payload = {
        transcript: isFormMode ? compositeTranscript : (teacherName.trim() ? `=== Teacher / Instructor ===\n${teacherName}\n\n${transcript}` : transcript),
        generalText: isFormMode ? generalText : "",
        positiveNotes: isFormMode ? positiveNotes.filter(n => n.trim()) : [],
        negativeNotes: isFormMode ? negativeNotes.filter(n => n.trim()) : [],
        language,
        program,
        subject,
        observerName,
        selectedRubrics: formattedRubrics,
        apiKey: apiKey.trim() || undefined,
      };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: AnalysisResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ანალიზისას დაფიქსირდა შეცდომა.");
      }

      setReport(data.result);
      setReportTab("report");

      const newId = Date.now().toString();
      setActiveArchiveId(newId);

      // Save to local archive automatically
      const newArchiveItem = {
        id: newId,
        timestamp: new Date().toLocaleString(language === "ka" ? "ka-GE" : "en-US"),
        teacherName,
        observerName,
        subject,
        program,
        reportText: data.result,
        rubricScores: { ...rubricScores },
        selectedRubrics: [...selectedRubrics],
        inputs: {
          transcript,
          generalText,
          positiveNotes: [...positiveNotes],
          negativeNotes: [...negativeNotes],
          activeInputTab
        }
      };
      const existing = localStorage.getItem("ib_archive");
      const archiveList = existing ? JSON.parse(existing) : [];
      archiveList.unshift(newArchiveItem);
      localStorage.setItem("ib_archive", JSON.stringify(archiveList));
    } catch (err: any) {
      setError(err.message || "სერვერთან კავშირი ვერ დამყარდა.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    let textToCopy = "";
    if (reportTab === "email") {
      if (editableReport && editableReport.success) {
        textToCopy = serializeToEmail(editableReport, language, teacherName, observerName, subject);
      } else {
        textToCopy = report || "";
      }
    } else {
      textToCopy = editableReport ? serializeReport(editableReport, language) : (report || "");
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    let textToDownload = "";
    let filename = "";
    if (reportTab === "email") {
      if (editableReport && editableReport.success) {
        textToDownload = serializeToEmail(editableReport, language, teacherName, observerName, subject);
      } else {
        textToDownload = report || "";
      }
      filename = `email_to_${teacherName || "teacher"}.txt`;
    } else {
      textToDownload = editableReport ? serializeReport(editableReport, language) : (report || "");
      filename = `report_${teacherName || "teacher"}.md`;
    }

    if (textToDownload) {
      const blob = new Blob([textToDownload], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleReset = () => {
    setTranscript("");
    setGeneralText("");
    setPositiveNotes([""]);
    setNegativeNotes([""]);
    setSelectedRubrics([]);
    setProgram("ზოგადი");
    setSubject("");
    setTeacherName("");
    setReport(null);
    setError(null);
  };

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const charCount = transcript.length;

  return (
    <div id="app-container" className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-amber-150 selection:text-slate-900 pb-16">
      
      {/* Main Header (Professional Polish Theme) */}
      <header id="main-header" className="no-print bg-slate-900 text-white px-8 py-6 flex flex-col md:flex-row justify-between items-center border-b-4 border-amber-500 sticky top-0 z-15 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded flex items-center justify-center font-bold text-2xl text-slate-900 shadow-inner">N</div>
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase font-display text-white">
              {language === "ka" ? "ნიუტონის თავისუფალი სკოლა" : "Newton Free School"}
            </h1>
            <p className="text-xs text-slate-400 font-medium tracking-widest uppercase">
              {language === "ka" ? "IB პროგრამის აკადემიური მონიტორინგი" : "IB Program Academic Monitoring"}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 md:mt-0">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">
              {language === "ka" ? "აკადემიური კოორდინატორი" : "Academic Coordinator"}
            </p>
            <p className="text-xs text-slate-400">
              {language === "ka" ? "ანგარიში #482-2024" : "Report #482-2024"}
            </p>
          </div>
          
          <button
            type="button"
            onClick={() => setShowApiSettings(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 transition-all text-xs font-semibold text-slate-200 cursor-pointer"
            title={language === "ka" ? "Gemini API გასაღების პარამეტრები" : "Gemini API Key Settings"}
          >
            <Settings className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === "ka" ? "API გასაღები" : "API Key"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowArchive(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-750 hover:border-slate-600 transition-all text-xs font-semibold text-slate-200 cursor-pointer"
            title={language === "ka" ? "ისტორია / არქივი" : "History / Archive"}
          >
            <Archive className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === "ka" ? "არქივი" : "Archive"}</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
            <span className="text-xs font-semibold px-2 text-slate-300">
              {language === "ka" ? "პროგრამა:" : "Program:"}
            </span>
            {["PYP", "MYP", "DP", "ზოგადი"].map((prog) => (
              <button
                key={prog}
                onClick={() => setProgram(prog)}
                className={`text-xs font-semibold px-3 py-1.5 rounded transition-all ${
                  program === prog 
                    ? "bg-amber-500 text-slate-900 shadow-sm font-bold" 
                    : "text-slate-400 hover:text-white hover:bg-slate-750"
                }`}
              >
                {prog === "ზოგადი" ? (language === "ka" ? "ზოგადი" : "General") : prog}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Printable Header - Visible ONLY in Print */}
      <div className="hidden print-only py-6 border-b-2 border-slate-900 mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold font-display text-slate-900 tracking-tight">
              {language === "ka" ? "გაკვეთილის შეფასებისა და ქოუჩინგის ანგარიში" : "Lesson Evaluation and Coaching Report"}
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              {language === "ka"
                ? "ნიუტონის თავისუფალი სკოლა – IB აკადემიური კოორდინატორის შეფასება"
                : "Newton Free School – IB Academic Coordinator Evaluation"}
            </p>
          </div>
          <div className="text-right text-xs text-slate-500 space-y-0.5">
            <p><strong>{language === "ka" ? "თარიღი:" : "Date:"}</strong> {new Date().toLocaleDateString(language === "ka" ? "ka-GE" : "en-US")}</p>
            <p><strong>{language === "ka" ? "პროგრამა:" : "Program:"}</strong> {program === "ზოგადი" ? (language === "ka" ? "ზოგადი" : "General") : program}</p>
            {teacherName && <p><strong>{language === "ka" ? "მასწავლებელი:" : "Teacher:"}</strong> {teacherName}</p>}
            {observerName && <p><strong>{language === "ka" ? "დამკვირვებელი:" : "Observer:"}</strong> {observerName}</p>}
            {subject && <p><strong>{language === "ka" ? "საგანი/თემა:" : "Subject/Topic:"}</strong> {subject}</p>}
          </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <main id="main-workspace" className="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        
        {/* Collapsible Presets Picker Banner */}
        <div className="no-print mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPresets(!showPresets)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/60 transition-all font-bold text-xs text-slate-700 tracking-wide uppercase cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-600 animate-spin [animation-duration:15s]" />
                <span className="font-display">
                  {language === "ka"
                    ? "💡 გსურთ სწრაფი ტესტირება? გამოიყენეთ მზა სავარჯიშო ნიმუშები"
                    : "💡 Want a quick test? Use ready-made exercise samples"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold lowercase">
                <span>{showPresets ? (language === "ka" ? "დახურვა" : "close") : (language === "ka" ? "ნახვა" : "view")}</span>
                {showPresets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>
            
            <AnimatePresence>
              {showPresets && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-slate-200"
                >
                  <div className="p-5 bg-slate-50/40 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PRESET_TRANSCRIPTS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          handlePresetSelect(preset.id);
                          setShowPresets(false);
                        }}
                        className="text-left p-4 rounded-xl border border-slate-200 bg-white hover:border-amber-450 hover:shadow-md hover:bg-amber-50/5 transition-all group flex flex-col justify-between gap-3 h-full cursor-pointer"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-50 text-blue-800 uppercase tracking-wider">
                              {preset.program === "ზოგადი" ? (language === "ka" ? "ზოგადი" : "General") : preset.program} {language === "ka" ? "საფეხური" : "Stage"}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 font-mono uppercase tracking-widest">
                              {preset.subject[language]}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-900 transition-colors line-clamp-1">
                            {preset.title[language]}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-3 mt-1 leading-relaxed">
                            {preset.description[language]}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-900 mt-2 self-end group-hover:text-blue-900 group-hover:translate-x-1 transition-all">
                          <span>{language === "ka" ? "ჩატვირთვა" : "Load"}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDE: Adaptive Inputs & File Upload (no-print) */}
          <section 
            id="input-section" 
            className={`no-print ${
              report || loading ? "lg:col-span-5" : "lg:col-span-12"
            } space-y-6 transition-all duration-300`}
          >
            
            {/* Custom Lesson Entry Card */}
            <div id="lesson-form-card" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
              
              {/* Header with Tab switcher and Language Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setActiveInputTab("form")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeInputTab === "form"
                        ? "bg-white text-slate-950 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {language === "ka" ? "✍️ სტრუქტურირებული ნოტები" : "✍️ Structured Notes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveInputTab("transcript")}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeInputTab === "transcript"
                        ? "bg-white text-slate-950 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {language === "ka" ? "📝 ტრანსკრიპტი / ჩანაწერი" : "📝 Transcript / Recording"}
                  </button>
                </div>

                {/* Language Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setLanguage("ka")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      language === "ka"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Globe className="w-3 h-3 text-slate-500" />
                    ქართული
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      language === "en"
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    <Globe className="w-3 h-3 text-slate-500" />
                    English
                  </button>
                </div>
              </div>

              {/* Consolidated Lesson Context block */}
              <div className="bg-slate-50/75 rounded-2xl p-5 border border-slate-150 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200/50 pb-2">
                  <GraduationCap className="w-4 h-4 text-slate-600" />
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                    {language === "ka" ? "საგაკვეთილო კონტექსტი" : "Lesson Context"}
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Teacher Input */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                      {language === "ka" ? "მასწავლებელი" : "Teacher Name"}
                    </label>
                    <input
                      type="text"
                      value={teacherName}
                      onChange={(e) => setTeacherName(e.target.value)}
                      placeholder={language === "ka" ? "მაგ: ნინო კალანდაძე" : "e.g., Nino Kalandadze"}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs outline-none transition-all font-medium text-slate-800"
                    />
                  </div>

                  {/* Observer Input */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                      {language === "ka" ? "დამკვირვებელი" : "Observer Name"}
                    </label>
                    <input
                      type="text"
                      value={observerName}
                      onChange={(e) => {
                        setObserverName(e.target.value);
                        localStorage.setItem("observer_name", e.target.value);
                      }}
                      placeholder={language === "ka" ? "მაგ: გიორგი მახარაძე" : "e.g., Giorgi Makharadze"}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs outline-none transition-all font-medium text-slate-800"
                    />
                  </div>

                  {/* Subject Input */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                      {language === "ka" ? "საგანი / თემა" : "Subject / Topic"}
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder={language === "ka" ? "მაგ: ალგებრა, ეკოლოგია, ლიტერატურა" : "e.g., Algebra, Ecology, Literature"}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs outline-none transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>

                {/* Program selection pills */}
                <div className="space-y-2 pt-1">
                  <label className="block text-[11px] font-bold text-slate-500 tracking-wide uppercase">
                    {language === "ka" ? "IB პროგრამის საფეხური" : "IB Program Stage"}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {["PYP", "MYP", "DP", "ზოგადი"].map((prog) => (
                      <button
                        type="button"
                        key={prog}
                        onClick={() => setProgram(prog)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          program === prog
                            ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }`}
                      >
                        {prog === "ზოგადი" ? (language === "ka" ? "ზოგადი" : "General") : prog} {language === "ka" ? "საფეხური" : "Stage"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* INTEGRATED OBSERVATION TIMER (Sleek amber control block) */}
              <div className="bg-amber-50/40 rounded-2xl border border-amber-200/40 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-amber-200/30 pb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider font-display">
                      {language === "ka" ? "დაკვირვების ცოცხალი ტაიმერი" : "Live Observation Timer"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isTimerRunning ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></span>
                    <span className="text-[10px] font-bold text-amber-800 tracking-wider uppercase">
                      {isTimerRunning 
                        ? (language === "ka" ? "მიმდინარეობს" : "Running") 
                        : (language === "ka" ? "შეჩერებული" : "Paused")}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/90 p-4 rounded-xl border border-amber-200/20 shadow-2xs">
                  <div className="font-mono text-3xl font-extrabold text-amber-950 tracking-tight flex items-center justify-center sm:justify-start">
                    ⏱️ {formatTime(timerSeconds)}
                  </div>
                  
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                        isTimerRunning 
                          ? "bg-amber-100 border-amber-250 text-amber-800 hover:bg-amber-200" 
                          : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                      }`}
                    >
                      {isTimerRunning ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>{language === "ka" ? "პაუზა" : "Pause"}</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>{language === "ka" ? "დაწყება" : "Start"}</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsTimerRunning(false);
                        setTimerSeconds(0);
                      }}
                      className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 active:bg-slate-100 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                      title={language === "ka" ? "გასუფთავება" : "Reset"}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Live Moment Logger comment box */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-amber-800 tracking-wide uppercase">
                    {language === "ka" ? "სწრაფი კომენტარის დამატება მიმდინარე წამზე:" : "Add quick comment to current second:"}
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={observationComment}
                        onChange={(e) => setObservationComment(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (activeInputTab === "form") {
                              handleAddObservation("positive");
                            } else {
                              handleAddObservation("transcript");
                            }
                          }
                        }}
                        placeholder={
                          activeInputTab === "form"
                            ? (language === "ka" ? "ჩაწერეთ შენიშვნა და დააჭირეთ შესაბამის ღილაკს..." : "Type a note and click corresponding button...")
                            : (language === "ka" ? "ჩაწერეთ ნოტი (ავტომატურად ჩაემატება ტრანსკრიპტში ტაიმერით)..." : "Type a note (automatically added to transcript with timer)...")
                        }
                        className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-amber-200 bg-white focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-xs outline-none transition-all text-slate-950 font-medium placeholder:text-slate-400"
                      />
                      {recognition && (
                        <button
                          type="button"
                          onClick={() => toggleListening("observation")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title={language === "ka" ? "ხმოვანი კომენტარი" : "Voice typing"}
                        >
                          {isListening && listeningTarget === "observation" ? (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                          ) : (
                            <Mic className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {activeInputTab === "form" ? (
                        <>
                          <button
                            type="button"
                            disabled={!observationComment.trim()}
                            onClick={() => handleAddObservation("positive")}
                            className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                          >
                            <span>{language === "ka" ? "👍 პოზიტიურში" : "👍 to Strengths"}</span>
                          </button>
                          <button
                            type="button"
                            disabled={!observationComment.trim()}
                            onClick={() => handleAddObservation("negative")}
                            className="flex-1 sm:flex-initial bg-rose-600 hover:bg-rose-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl px-3.5 py-2.5 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                          >
                            <span>{language === "ka" ? "🎯 განვითარებაში" : "🎯 to Growth"}</span>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={!observationComment.trim()}
                          onClick={() => handleAddObservation("transcript")}
                          className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl px-4 py-2.5 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                        >
                          <Plus className="w-4 h-4" />
                          <span>{language === "ka" ? "ჩანაწერში დამატება" : "Add to Transcript"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[10px] text-amber-700 leading-none">
                      {language === "ka" ? "დამატებისას დაფიქსირდება დრო: " : "Time recorded on add: "}<strong className="font-mono">[{formatTime(timerSeconds)}]</strong>
                    </p>
                    <AnimatePresence>
                      {showTimerSuccess && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"
                        >
                          {language === "ka" ? "✓ წარმატებით დაფიქსირდა!" : "✓ Successfully recorded!"}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* TAB 1: STRUCTURED FORM MODE */}
              {activeInputTab === "form" && (
                <div className="space-y-5">
                  {/* General Observation (Full-width Textarea) */}
                  <div className="space-y-1.5 col-span-full">
                    <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase flex items-center justify-between">
                      <span>{language === "ka" ? "ზოგადი დაკვირვება / პროცესის აღწერა" : "General Observation / Process Description"}</span>
                      <span className="text-[10px] text-slate-400 font-medium lowercase">
                        {language === "ka" ? "არასავალდებულო" : "optional"}
                      </span>
                    </label>
                    <textarea
                      value={generalText}
                      onChange={(e) => setGeneralText(e.target.value)}
                      placeholder={
                        language === "ka"
                          ? "აღწერეთ გაკვეთილის ზოგადი მიმდინარეობა, ატმოსფერო, კლასის მზაობა..."
                          : "Describe the general course of the lesson, atmosphere, class readiness..."
                      }
                      rows={4}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all resize-y font-sans leading-relaxed text-slate-900"
                    />
                  </div>

                  {/* Two-Column Side-by-Side Notes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                    
                    {/* Left Column: Positive Observations (Green Accent) */}
                    <div className="space-y-3 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-100 flex flex-col">
                      <div className="flex items-center justify-between border-b border-emerald-100/50 pb-2 mb-1">
                        <h4 className="text-xs font-bold text-emerald-800 tracking-wide uppercase flex items-center gap-1.5">
                          <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{language === "ka" ? "პოზიტიური დაკვირვებები" : "Positive Observations"}</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setPositiveNotes([...positiveNotes, ""])}
                          className="text-[10px] font-bold text-emerald-700 hover:text-emerald-950 flex items-center gap-1 bg-white hover:bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg shadow-2xs transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          {language === "ka" ? "დამატება" : "Add"}
                        </button>
                      </div>

                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {positiveNotes.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-xs font-medium">
                            {language === "ka"
                              ? "ჯერ არ არის დამატებული პოზიტიური დაკვირვება. გამოიყენეთ ტაიმერი ზემოთ ან დააჭირეთ დამატების ღილაკს."
                              : "No positive observations added yet. Use the timer above or click the Add button."}
                          </div>
                        ) : (
                          positiveNotes.map((note, idx) => (
                            <div key={idx} className="flex gap-1.5 items-center bg-white p-1 px-2.5 rounded-xl border border-emerald-100 shadow-3xs">
                              <span className="text-emerald-600 text-[10px] font-bold shrink-0">#{idx + 1}</span>
                              <input
                                type="text"
                                value={note}
                                onChange={(e) => {
                                  const updated = [...positiveNotes];
                                  updated[idx] = e.target.value;
                                  setPositiveNotes(updated);
                                }}
                                placeholder={
                                  language === "ka"
                                    ? "მაგ: [14:05] - მოსწავლეები აქტიურები არიან..."
                                    : "e.g., [14:05] - Students are active..."
                                }
                                className="flex-1 min-w-0 bg-transparent text-xs outline-none transition-all text-slate-900 font-medium py-1.5"
                              />
                              <button
                                type="button"
                                onClick={() => setPositiveNotes(positiveNotes.filter((_, i) => i !== idx))}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Right Column: Areas for Improvement (Red/Orange Accent) */}
                    <div className="space-y-3 bg-rose-50/40 p-4 rounded-2xl border border-rose-100 flex flex-col">
                      <div className="flex items-center justify-between border-b border-rose-100/50 pb-2 mb-1">
                        <h4 className="text-xs font-bold text-rose-800 tracking-wide uppercase flex items-center gap-1.5">
                          <ThumbsDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>{language === "ka" ? "განვითარების არეალი" : "Areas for Development"}</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setNegativeNotes([...negativeNotes, ""])}
                          className="text-[10px] font-bold text-rose-700 hover:text-rose-950 flex items-center gap-1 bg-white hover:bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg shadow-2xs transition-all cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          {language === "ka" ? "დამატება" : "Add"}
                        </button>
                      </div>

                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {negativeNotes.length === 0 ? (
                          <div className="text-center py-6 text-slate-400 text-xs font-medium">
                            {language === "ka"
                              ? "ჯერ არ არის დამატებული განვითარების შენიშვნა. გამოიყენეთ ტაიმერი ზემოთ ან დააჭირეთ დამატების ღილაკს."
                              : "No areas for development added yet. Use the timer above or click the Add button."}
                          </div>
                        ) : (
                          negativeNotes.map((note, idx) => (
                            <div key={idx} className="flex gap-1.5 items-center bg-white p-1 px-2.5 rounded-xl border border-rose-100 shadow-3xs">
                              <span className="text-rose-600 text-[10px] font-bold shrink-0">#{idx + 1}</span>
                              <input
                                type="text"
                                value={note}
                                onChange={(e) => {
                                  const updated = [...negativeNotes];
                                  updated[idx] = e.target.value;
                                  setNegativeNotes(updated);
                                }}
                                placeholder={
                                  language === "ka"
                                    ? "მაგ: [14:12] - დროის მენეჯმენტი დარღვეულია..."
                                    : "e.g., [14:12] - Time management is off..."
                                }
                                className="flex-1 min-w-0 bg-transparent text-xs outline-none transition-all text-slate-900 font-medium py-1.5"
                              />
                              <button
                                type="button"
                                onClick={() => setNegativeNotes(negativeNotes.filter((_, i) => i !== idx))}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: CLASSIC TRANSCRIPT MODE */}
              {activeInputTab === "transcript" && (
                <div className="space-y-4">
                  {/* Main Transcript Input Area */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 tracking-wide uppercase">
                        {language === "ka" ? "გაკვეთილის ტრანსკრიპტი ან დამკვირვებლის ნოუთები" : "Lesson Transcript or Observer Notes"}
                      </label>
                      <div className="flex items-center gap-3">
                        {recognition && (
                          <button
                            type="button"
                            onClick={() => toggleListening("transcript")}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all border ${
                              isListening && listeningTarget === "transcript"
                                ? "bg-rose-100 border-rose-200 text-rose-700 animate-pulse"
                                : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-amber-100 hover:text-amber-800 hover:border-amber-200"
                            }`}
                            title={isListening && listeningTarget === "transcript" ? (language === "ka" ? "ჩაწერის შეჩერება" : "Stop recording") : (language === "ka" ? "ხმოვანი შეყვანა ქართულად" : "Voice typing in Georgian")}
                          >
                            {isListening && listeningTarget === "transcript" ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                                <MicOff className="w-2.5 h-2.5 text-rose-700" />
                                <span>{language === "ka" ? "ჩაწერა..." : "Recording..."}</span>
                              </>
                            ) : (
                              <>
                                <Mic className="w-2.5 h-2.5" />
                                <span>{language === "ka" ? "ხმოვანი (KA)" : "Voice (KA)"}</span>
                              </>
                            )}
                          </button>
                        )}
                        <span className="text-[11px] font-mono text-slate-400">
                          {wordCount} {language === "ka" ? "სიტყვა" : "words"}
                        </span>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <textarea
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder={
                          language === "ka"
                            ? "ჩაწერეთ ან ჩააკოპირეთ გაკვეთილის დეტალური დიალოგი, ტრანსკრიპტი ან დამკვირვებლის მიერ გაკეთებული ჩანაწერები..."
                            : "Type or paste detailed lesson dialogue, transcript, or observer notes..."
                        }
                        rows={12}
                        className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm outline-none transition-all resize-y font-sans leading-relaxed"
                      />
                      
                      {/* Floating Drag and Drop Area inside Textarea as Overlay when Dragging */}
                      {isDragging && (
                        <div 
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className="absolute inset-0 bg-blue-50/95 border-2 border-dashed border-blue-400 rounded-xl flex flex-col items-center justify-center p-4 text-center z-20 backdrop-blur-xs transition-all"
                        >
                          <div className="p-4 bg-blue-100 rounded-full text-blue-600 mb-3 animate-bounce">
                            <Upload className="w-8 h-8" />
                          </div>
                          <h4 className="text-sm font-bold text-blue-900">
                            {language === "ka" ? "ჩააგდეთ ტექსტური ფაილი აქ" : "Drop text file here"}
                          </h4>
                          <p className="text-xs text-blue-600 mt-1">
                            {language === "ka" ? "მხარდაჭერილია .txt და .md ფორმატები" : "Supported formats: .txt and .md"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drag and Drop zone trigger button */}
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-slate-200 hover:border-blue-300 hover:bg-slate-50 rounded-xl p-4 text-center cursor-pointer transition-all flex items-center justify-center gap-3"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept=".txt,.md" 
                      className="hidden" 
                    />
                    <Upload className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors">
                      {language === "ka"
                        ? "ატვირთეთ ფაილი (.txt, .md) ან ჩააგდეთ აქ"
                        : "Upload a file (.txt, .md) or drop it here"}
                    </span>
                  </div>
                </div>
              )}

              {/* SECTION 2: RUBRIC INTEGRATION */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setRubricsExpanded(!rubricsExpanded)}
                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-all font-bold text-xs text-slate-700 tracking-wide uppercase cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-slate-500" />
                    <span>
                      {language === "ka"
                        ? "შეფასების რუბრიკის კრიტერიუმები"
                        : "Evaluation Rubric Criteria"}
                    </span>
                    {selectedRubrics.length > 0 && (
                      <span className="ml-2 bg-slate-900 text-white rounded-full px-2 py-0.5 text-[10px] font-bold">
                        {selectedRubrics.length} {language === "ka" ? "არჩეული" : "selected"}
                      </span>
                    )}
                  </div>
                  {rubricsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence initial={false}>
                  {rubricsExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-slate-200 animate-fade-in"
                    >
                      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
                        {[
                          { id: "Goals", label: { ka: "გაკვეთილის მიზნები", en: "Lesson Goals" }, desc: { ka: "გაკვეთილის მიზანი მკაფიოა და მოსწავლეებისთვის გასაგები", en: "Lesson goals are clear and understandable for students" } },
                          { id: "Time", label: { ka: "დროის მენეჯმენტი", en: "Time Management" }, desc: { ka: "თითოეული ფაზა შეესაბამება დაგეგმილ დროს", en: "Each phase corresponds to the planned time" } },
                          { id: "Constructivist", label: { ka: "კონსტრუქტივისტული აქტივობები", en: "Constructivist Activities" }, desc: { ka: "მოსწავლეები თავად აშენებენ ცოდნას კვლევით", en: "Students build knowledge themselves through inquiry" } },
                          { id: "Engagement", label: { ka: "მოსწავლეთა ჩართულობა", en: "Student Engagement" }, desc: { ka: "ყველა მოსწავლე აქტიურადაა ჩართული პროცესში", en: "All students are actively engaged in the process" } },
                          { id: "Differentiation", label: { ka: "დიფერენცირება", en: "Differentiation" }, desc: { ka: "სასწავლო პროცესი მორგებულია განსხვავებულ საჭიროებებს", en: "Learning process is tailored to different needs" } },
                          { id: "Classroom", label: { ka: "კლასის მენეჯმენტი", en: "Classroom Management" }, desc: { ka: "კლასში დაცულია წესრიგი და მეგობრული ატმოსფერო", en: "Classroom order and a friendly atmosphere are maintained" } },
                          { id: "Assessment", label: { ka: "განმავითარებელი შეფასება", en: "Formative Assessment" }, desc: { ka: "მასწავლებელი ამოწმებს გაგებას გაკვეთილის განმავლობაში", en: "Teacher checks understanding throughout the lesson" } },
                          { id: "Communication", label: { ka: "პოზიტიური კომუნიკაცია", en: "Positive Communication" }, desc: { ka: "მხარდამჭერი უკუკავშირი და პატივისცემა", en: "Supportive feedback and respect" } },
                        ].map((rubric) => {
                          const isChecked = selectedRubrics.includes(rubric.label.en);
                          return (
                            <div
                              key={rubric.id}
                              className={`p-3 rounded-xl border flex flex-col gap-2.5 transition-all ${
                                isChecked
                                  ? "bg-blue-50/50 border-blue-200 shadow-xs"
                                  : "bg-slate-50/50 border-slate-150 hover:bg-slate-100/50"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  id={`rubric-${rubric.id}`}
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setSelectedRubrics(selectedRubrics.filter((r) => r !== rubric.label.en));
                                    } else {
                                      setSelectedRubrics([...selectedRubrics, rubric.label.en]);
                                      if (rubricScores[rubric.id] === undefined) {
                                        setRubricScores(prev => ({ ...prev, [rubric.id]: 8 }));
                                      }
                                    }
                                  }}
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-900 focus:ring-blue-950 shrink-0 cursor-pointer"
                                />
                                <label htmlFor={`rubric-${rubric.id}`} className="flex-1 cursor-pointer select-none">
                                  <span className="block text-xs font-bold text-slate-800 leading-tight">
                                    {rubric.label[language]}
                                  </span>
                                  <span className="block text-[10px] text-slate-400 mt-1 leading-relaxed">
                                    {rubric.desc[language]}
                                  </span>
                                </label>
                              </div>
                              
                              {isChecked && (
                                <div className="pl-7 pr-1 py-1.5 border-t border-blue-100/50 mt-1 space-y-1">
                                  <div className="flex justify-between items-center text-[10px] font-bold text-blue-900">
                                    <span>{language === "ka" ? "შესრულების დონე:" : "Performance Level:"}</span>
                                    <span className="bg-blue-950 text-white px-2 py-0.5 rounded-md font-mono text-[9px] font-extrabold">
                                      {rubricScores[rubric.id] || 8} / 10
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-bold text-slate-400">1</span>
                                    <input
                                      type="range"
                                      min="1"
                                      max="10"
                                      value={rubricScores[rubric.id] || 8}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value, 10);
                                        setRubricScores(prev => ({ ...prev, [rubric.id]: val }));
                                      }}
                                      className="flex-1 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-950"
                                    />
                                    <span className="text-[9px] font-bold text-slate-400">10</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Error Box */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-start gap-2 text-xs leading-relaxed"
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleReset}
                  className="px-4 py-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 active:bg-slate-100 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  title={language === "ka" ? "გასუფთავება" : "Reset"}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="flex-1 bg-blue-950 hover:bg-blue-900 disabled:bg-slate-200 disabled:text-slate-400 active:bg-slate-950 text-white font-semibold py-3 px-6 rounded-xl text-sm transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>
                    {loading 
                      ? (language === "ka" ? "მიმდინარეობს ანალიზი..." : "Analyzing...") 
                      : (language === "ka" ? "გააკეთე გაკვეთილის ანალიზი" : "Analyze Lesson")}
                  </span>
                </button>
              </div>
              
            </div>

          </section>

          {/* RIGHT SIDE: Report Viewer & Animations (print-card) */}
          {(loading || report) && (
            <section id="output-section" className="lg:col-span-7 lg:sticky lg:top-28">
            
            <AnimatePresence mode="wait">
              
              {/* Loading State Animation */}
              {loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-md space-y-8 no-print"
                >
                  <div className="relative w-24 h-24 mx-auto">
                    {/* Concentric rotating glowing spinners */}
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-t-blue-950 border-r-blue-950/20 border-b-blue-950/20 border-l-blue-950/20 rounded-full animate-spin"></div>
                    <div className="absolute inset-3 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-3 border-4 border-b-amber-400 border-t-amber-400/20 border-r-amber-400/20 border-l-amber-400/20 rounded-full animate-spin [animation-duration:1.5s]"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-blue-950">
                      <GraduationCap className="w-8 h-8 animate-pulse text-blue-950" />
                    </div>
                  </div>

                  <div className="space-y-3 max-w-md mx-auto">
                    <h3 className="text-lg font-bold text-slate-900 font-display">
                      {language === "ka" ? "მიმდინარეობს კომპლექსური დამუშავება" : "Processing Complex Evaluation"}
                    </h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {language === "ka"
                        ? "აკადემიური პლატფორმა ახორციელებს გაკვეთილის ანალიზს 3 შიდა კოორდინაციულ ეტაპად..."
                        : "The academic platform is performing lesson analysis across 3 internal coordination stages..."}
                    </p>
                  </div>

                  {/* 3-Stage Process Display */}
                  <div className="max-w-md mx-auto space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                      <span>{language === "ka" ? "მიმდინარე ეტაპი:" : "Current Stage:"} {currentStage} / 3</span>
                      <span>{Math.round(stageProgress)}%</span>
                    </div>
                    
                    {/* Real-time looking progress bar */}
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-950 transition-all duration-300 rounded-full"
                        style={{ width: `${(currentStage - 1) * 33.33 + (stageProgress / 3)}%` }}
                      ></div>
                    </div>

                    <div className="space-y-2.5 text-left pt-2">
                      <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                        currentStage === 1 ? "bg-blue-50/80 border border-blue-100" : "opacity-50"
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          currentStage > 1 ? "bg-emerald-500 text-white" : "bg-blue-950 text-white"
                        }`}>
                          {currentStage > 1 ? <Check className="w-3.5 h-3.5" /> : "1"}
                        </div>
                        <div className="text-xs">
                          <p className="font-bold text-slate-800">
                            {language === "ka" ? "ტექსტის დამუშავება & გაწმენდა" : "Text Processing & Cleaning"}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {language === "ka"
                              ? "პარაზიტი სიტყვების ფილტრაცია და დიალოგის სტრუქტურირება"
                              : "Filtering filler words and structuring dialogue"}
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                        currentStage === 2 ? "bg-blue-50/80 border border-blue-100" : "opacity-50"
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          currentStage > 2 ? "bg-emerald-500 text-white" : currentStage === 2 ? "bg-blue-950 text-white" : "bg-slate-200 text-slate-600"
                        }`}>
                          {currentStage > 2 ? <Check className="w-3.5 h-3.5" /> : "2"}
                        </div>
                        <div className="text-xs">
                          <p className="font-bold text-slate-800">
                            {program === "ზოგადი"
                              ? (language === "ka" ? "ანალიზი პედაგოგიური სტანდარტებით" : "Analysis by Pedagogical Standards")
                              : (language === "ka" ? "ანალიზი IB სტანდარტებით" : "Analysis by IB Standards")}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {program === "ზოგადი"
                              ? (language === "ka"
                                  ? "საკლასო მენეჯმენტის, ჩართულობისა და მიზნების შეფასება"
                                  : "Evaluation of classroom management, engagement, and learning goals")
                              : (language === "ka"
                                  ? "Inquiry, Student Agency და კონცეპტუალური სწავლების შეფასება"
                                  : "Evaluation of Inquiry, Student Agency, and Conceptual Learning")}
                          </p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                        currentStage === 3 ? "bg-blue-50/80 border border-blue-100" : "opacity-50"
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          currentStage === 3 ? "bg-blue-950 text-white" : "bg-slate-200 text-slate-600"
                        }`}>
                          3
                        </div>
                        <div className="text-xs">
                          <p className="font-bold text-slate-800">
                            {language === "ka" ? "სამოქმედო ქოუჩინგ-გეგმა" : "Actionable Coaching Plan"}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {language === "ka"
                              ? "პრაქტიკული 3-ნაბიჯიანი პროფესიული განვითარების გეგმის შექმნა"
                              : "Creating a practical 3-step professional development plan"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}



              {/* Report Output State */}
              {!loading && report && (
                <motion.div
                  key="report"
                  ref={reportRef}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 25 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden print-card"
                >
                  
                  {/* Report Card Header (no-print) */}
                  <div className="no-print bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <div>
                          <h4 className="text-sm font-bold font-display tracking-wide uppercase text-slate-100">
                            {language === "ka" ? "ანგარიში მზად არის" : "Report is Ready"}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {language === "ka"
                              ? "პედაგოგიური ანალიზი დასრულებულია წარმატებით"
                              : "Pedagogical analysis completed successfully"}
                          </p>
                        </div>
                      </div>

                      {/* Tab Switcher */}
                      <div className="flex bg-slate-850 p-0.5 rounded-lg border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setReportTab("report")}
                          className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            reportTab === "report"
                              ? "bg-slate-950 text-white shadow-xs"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {language === "ka" ? "📊 ანგარიში" : "📊 Report"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportTab("email")}
                          className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                            reportTab === "email"
                              ? "bg-slate-950 text-white shadow-xs"
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          {language === "ka" ? "✉️ მეილის ვერსია" : "✉️ Email Version"}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 active:bg-slate-850 text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5"
                        title={language === "ka" ? "დააკოპირე" : "Copy"}
                      >
                        {copySuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">{language === "ka" ? "კოპირებულია!" : "Copied!"}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{language === "ka" ? "კოპირება" : "Copy"}</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={handleDownload}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 active:bg-slate-850 text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5"
                        title={language === "ka" ? "გადმოწერე ფაილი" : "Download file"}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>{language === "ka" ? "გადმოწერა" : "Download"}</span>
                      </button>

                      <button
                        onClick={handlePrint}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 active:bg-slate-850 text-xs font-semibold text-slate-200 transition-all flex items-center gap-1.5"
                        title={language === "ka" ? "ამობეჭდვა" : "Print"}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{language === "ka" ? "ამობეჭდვა / PDF" : "Print / PDF"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Report Content Body */}
                  <div className="p-6 sm:p-8 space-y-6 leading-relaxed">
                    
                    {/* IB Criteria Quick Rating Badges (no-print) */}
                    {reportTab === "report" && (
                      <div className="no-print grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                        <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                          <span className="block text-[10px] font-bold text-slate-400 tracking-wide uppercase">Inquiry</span>
                          <div className="flex justify-center mt-1 text-amber-500">
                            <Compass className="w-5 h-5 text-amber-600" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 mt-1 block">
                            {language === "ka" ? "კვლევის უნარი" : "Inquiry Skills"}
                          </span>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                          <span className="block text-[10px] font-bold text-slate-400 tracking-wide uppercase">Agency</span>
                          <div className="flex justify-center mt-1 text-blue-500">
                            <UserCheck className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 mt-1 block">
                            {language === "ka" ? "მოსწავლის ხმა" : "Student Voice"}
                          </span>
                        </div>
                        <div className="text-center p-2 bg-white rounded-lg border border-slate-100">
                          <span className="block text-[10px] font-bold text-slate-400 tracking-wide uppercase">Conceptual</span>
                          <div className="flex justify-center mt-1 text-emerald-500">
                            <Layers className="w-5 h-5 text-emerald-600" />
                          </div>
                          <span className="text-[10px] font-bold text-slate-500 mt-1 block">
                            {language === "ka" ? "გაგების სიღრმე" : "Depth of Understanding"}
                          </span>
                        </div>
                      </div>
                    )}

                    {(() => {
                      if (reportTab === "email" && editableReport && editableReport.success) {
                        const emailText = serializeToEmail(editableReport, language, teacherName, observerName, subject);
                        return (
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm font-sans max-w-3xl mx-auto">
                            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-2 no-print">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Mail className="w-4 h-4 text-blue-600" />
                                {language === "ka" ? "მეილის შაბლონი (მოსამზადებელი ტექსტი)" : "Email Draft"}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {language === "ka" ? "უკუკავშირი მზად არის გასაგზავნად" : "Feedback ready to send"}
                              </span>
                            </div>
                            <div className="text-slate-800 text-sm whitespace-pre-wrap leading-relaxed font-medium">
                              {emailText}
                            </div>
                          </div>
                        );
                      }

                      if (editableReport && editableReport.success) {
                        return (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            {/* LEFT COLUMN: Complex Analysis */}
                            <section className="md:col-span-7 flex flex-col gap-6">
                              <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                                <span className="text-2xl">📊</span>
                                <h2 className="text-xl font-bold text-slate-800 font-display">
                                  {language === "ka" ? "გაკვეთილის კომპლექსური ანალიზი" : "Integrated Lesson Analysis"}
                                </h2>
                              </div>

                              {/* Strengths Card */}
                              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                                <h3 className="flex items-center gap-2 text-emerald-700 font-bold font-display text-sm uppercase tracking-wider">
                                  <span className="text-base">🌟</span> {language === "ka" ? "ძლიერი მხარეები" : "Strengths"}
                                </h3>
                                <div className="space-y-3">
                                  {editableReport.strengths.map((strength, sIdx) => (
                                    <div key={sIdx} className="flex gap-2 items-start group">
                                      <span className="text-emerald-500 shrink-0 font-bold mt-1.5">•</span>
                                      <textarea
                                        value={strength}
                                        onChange={(e) => {
                                          const next = [...editableReport.strengths];
                                          next[sIdx] = e.target.value;
                                          setEditableReport({ ...editableReport, strengths: next });
                                        }}
                                        rows={1}
                                        className="print-input w-full px-2 py-1 text-sm text-slate-700 border border-slate-100 hover:border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-lg bg-transparent resize-none outline-none transition-all font-medium"
                                        style={{ height: 'auto' }}
                                        onInput={(e) => {
                                          const target = e.target as HTMLTextAreaElement;
                                          target.style.height = 'auto';
                                          target.style.height = target.scrollHeight + 'px';
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = editableReport.strengths.filter((_, i) => i !== sIdx);
                                          setEditableReport({ ...editableReport, strengths: next });
                                        }}
                                        className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs font-bold transition-all p-1 cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...editableReport.strengths, ""];
                                      setEditableReport({ ...editableReport, strengths: next });
                                    }}
                                    className="no-print inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer mt-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>{language === "ka" ? "ძლიერი მხარის დამატება" : "Add Strength"}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Growth Areas Card */}
                              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                                <h3 className="flex items-center gap-2 text-rose-700 font-bold font-display text-sm uppercase tracking-wider">
                                  <span className="text-base">📈</span> {language === "ka" ? "განვითარების არეალი" : "Areas for Growth"}
                                </h3>
                                <div className="space-y-3">
                                  {editableReport.growth.map((growthItem, gIdx) => (
                                    <div key={gIdx} className="flex gap-2 items-start group">
                                      <span className="text-rose-500 shrink-0 font-bold mt-1.5">•</span>
                                      <textarea
                                        value={growthItem}
                                        onChange={(e) => {
                                          const next = [...editableReport.growth];
                                          next[gIdx] = e.target.value;
                                          setEditableReport({ ...editableReport, growth: next });
                                        }}
                                        rows={1}
                                        className="print-input w-full px-2 py-1 text-sm text-slate-700 border border-slate-100 hover:border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-lg bg-transparent resize-none outline-none transition-all font-medium"
                                        style={{ height: 'auto' }}
                                        onInput={(e) => {
                                          const target = e.target as HTMLTextAreaElement;
                                          target.style.height = 'auto';
                                          target.style.height = target.scrollHeight + 'px';
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const next = editableReport.growth.filter((_, i) => i !== gIdx);
                                          setEditableReport({ ...editableReport, growth: next });
                                        }}
                                        className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs font-bold transition-all p-1 cursor-pointer"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = [...editableReport.growth, ""];
                                      setEditableReport({ ...editableReport, growth: next });
                                    }}
                                    className="no-print inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer mt-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>{language === "ka" ? "განვითარების მხარის დამატება" : "Add Growth Area"}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Recommendation Card */}
                              {editableReport.recommendation !== undefined && (
                                <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-xl shadow-sm space-y-2">
                                  <h3 className="flex items-center gap-2 text-amber-800 font-bold font-display text-sm uppercase tracking-wide">
                                    <span className="text-base">💡</span> {language === "ka" ? "მთავარი რეკომენდაცია" : "Core Recommendation"}
                                  </h3>
                                  <textarea
                                    value={editableReport.recommendation}
                                    onChange={(e) => {
                                      setEditableReport({ ...editableReport, recommendation: e.target.value });
                                    }}
                                    rows={2}
                                    className="print-input w-full px-2 py-1 text-sm text-amber-900 leading-relaxed italic border border-amber-200/40 hover:border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 rounded-lg bg-transparent resize-none outline-none transition-all font-medium"
                                    style={{ height: 'auto' }}
                                    onInput={(e) => {
                                      const target = e.target as HTMLTextAreaElement;
                                      target.style.height = 'auto';
                                      target.style.height = target.scrollHeight + 'px';
                                    }}
                                  />
                                </div>
                              )}
                            </section>

                            {/* RIGHT COLUMN: Action Plan & Visual Rubric Chart */}
                            <aside className="md:col-span-5 flex flex-col gap-6">
                              <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                                <span className="text-2xl">🚀</span>
                                <h2 className="text-xl font-bold text-slate-800 font-display">
                                  {language === "ka" ? "სამოქმედო გეგმა" : "Action Plan"}
                                </h2>
                              </div>

                              <div className="flex flex-col gap-4">
                                {editableReport.planSteps.map((step, idx) => (
                                  <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex gap-3 relative group">
                                    <div className="flex-shrink-0 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold font-display text-xs">
                                      {step.number}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                      <input
                                        type="text"
                                        value={step.title}
                                        onChange={(e) => {
                                          const next = [...editableReport.planSteps];
                                          next[idx] = { ...next[idx], title: e.target.value };
                                          setEditableReport({ ...editableReport, planSteps: next });
                                        }}
                                        className="print-input w-full px-2 py-1 text-sm font-bold text-slate-800 border border-slate-100 hover:border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-lg bg-transparent outline-none transition-all uppercase tracking-tight"
                                      />
                                      <textarea
                                        value={step.description}
                                        onChange={(e) => {
                                          const next = [...editableReport.planSteps];
                                          next[idx] = { ...next[idx], description: e.target.value };
                                          setEditableReport({ ...editableReport, planSteps: next });
                                        }}
                                        rows={2}
                                        className="print-input w-full px-2 py-1 text-xs text-slate-500 leading-relaxed border border-slate-100 hover:border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-lg bg-transparent resize-none outline-none transition-all font-medium"
                                        style={{ height: 'auto' }}
                                        onInput={(e) => {
                                          const target = e.target as HTMLTextAreaElement;
                                          target.style.height = 'auto';
                                          target.style.height = target.scrollHeight + 'px';
                                        }}
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = editableReport.planSteps
                                          .filter((_, i) => i !== idx)
                                          .map((x, newIdx) => ({ ...x, number: newIdx + 1 }));
                                        setEditableReport({ ...editableReport, planSteps: next });
                                      }}
                                      className="no-print opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-xs font-bold transition-all p-1 cursor-pointer absolute top-3 right-3"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newStepNum = editableReport.planSteps.length + 1;
                                    const next = [...editableReport.planSteps, {
                                      number: newStepNum,
                                      title: language === "ka" ? `ნაბიჯი ${newStepNum}` : `Step ${newStepNum}`,
                                      description: ""
                                    }];
                                    setEditableReport({ ...editableReport, planSteps: next });
                                  }}
                                  className="no-print inline-flex items-center gap-1 text-[11px] font-bold text-blue-900 hover:underline transition-colors cursor-pointer self-start"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>{language === "ka" ? "ნაბიჯის დამატება" : "Add Step"}</span>
                                </button>
                              </div>

                              {/* Interactive Rubric Scores Chart */}
                              {selectedRubrics.length > 0 && (
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                                  <h3 className="flex items-center gap-2 text-slate-800 font-bold font-display text-xs uppercase tracking-wide">
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                    {language === "ka" ? "რუბრიკების შეფასება" : "Rubric Scores"}
                                  </h3>
                                  <div className="space-y-3.5">
                                    {selectedRubrics.map((label) => {
                                      const rubricIdMap: Record<string, string> = {
                                        "Lesson Goals": "Goals",
                                        "Time Management": "Time",
                                        "Constructivist Activities": "Constructivist",
                                        "Student Engagement": "Engagement",
                                        "Differentiation": "Differentiation",
                                        "Classroom Management": "Classroom",
                                        "Formative Assessment": "Assessment",
                                        "Positive Communication": "Communication"
                                      };
                                      const id = rubricIdMap[label];
                                      const score = id ? (rubricScores[id] || 8) : 8;
                                      const pct = score * 10;
                                      
                                      // Color coding
                                      let barColor = "bg-emerald-500";
                                      let textColor = "text-emerald-700";
                                      let bgColor = "bg-emerald-50";
                                      if (score < 5) {
                                        barColor = "bg-rose-500";
                                        textColor = "text-rose-700";
                                      } else if (score < 8) {
                                        barColor = "bg-amber-500";
                                        textColor = "text-amber-700";
                                      }

                                      return (
                                        <div key={label} className="space-y-1">
                                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                                            <span className="truncate max-w-[200px]" title={label}>{label}</span>
                                            <span className={`font-mono font-bold ${textColor}`}>{score}/10</span>
                                          </div>
                                          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                                            <motion.div 
                                              initial={{ width: 0 }}
                                              animate={{ width: `${pct}%` }}
                                              transition={{ duration: 0.8, ease: "easeOut" }}
                                              className={`h-full rounded-full ${barColor}`}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </aside>
                          </div>
                        );
                      }

                      return (
                        /* Fallback Markdown View */
                        <div className="markdown-body prose max-w-none text-slate-800">
                          <ReactMarkdown
                            components={{
                              h2: ({ node, ...props }) => (
                                <h2 
                                  className="text-xl font-bold font-display text-blue-950 border-b border-slate-200 pb-2.5 mt-6 mb-4 flex items-center gap-2 tracking-tight"
                                  {...props}
                                />
                              ),
                              h3: ({ node, ...props }) => (
                                <h3 
                                  className="text-base font-bold font-display text-slate-900 mt-5 mb-2.5 flex items-center gap-2"
                                  {...props}
                                />
                              ),
                              ul: ({ node, ...props }) => (
                                <ul className="list-disc space-y-2.5 my-3 pl-6 text-slate-700 text-sm" {...props} />
                              ),
                              ol: ({ node, ...props }) => (
                                <ol className="list-decimal space-y-3.5 my-4 pl-6 text-slate-700 text-sm" {...props} />
                              ),
                              li: ({ node, ...props }) => (
                                <li className="text-slate-700 text-sm leading-relaxed" {...props} />
                              ),
                              p: ({ node, ...props }) => (
                                <p className="text-sm leading-relaxed text-slate-600 my-2" {...props} />
                              ),
                              strong: ({ node, ...props }) => (
                                <strong className="font-bold text-slate-900" {...props} />
                              ),
                              hr: ({ node, ...props }) => (
                                <hr className="my-6 border-slate-200" {...props} />
                              )
                            }}
                          >
                            {report}
                          </ReactMarkdown>
                        </div>
                      );
                    })()}

                  </div>

                  {/* Report Card Footer (no-print) */}
                  <div className="no-print bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
                    <span className="text-[11px] text-slate-400 italic">
                      {language === "ka"
                        ? "შემუშავებულია ნიუტონის თავისუფალი სკოლის IB კოორდინაციის მეთოდოლოგიით"
                        : "Developed with Newton Free School's IB coordination methodology"}
                    </span>
                    <button
                      onClick={handleReset}
                      className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 active:bg-slate-200 text-xs font-semibold text-slate-600 transition-all flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{language === "ka" ? "ახალი ანალიზი" : "New Analysis"}</span>
                    </button>
                  </div>

                </motion.div>
              )}

            </AnimatePresence>
            
          </section>
          )}

        </div>

      </main>

      {/* API Settings Modal */}
      <AnimatePresence>
        {showApiSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-amber-500 animate-spin-slow" />
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
                    {language === "ka" ? "API პარამეტრები" : "API Settings"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowApiSettings(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  {language === "ka"
                    ? "გაკვეთილის ანალიზის გასაკეთებლად საჭიროა Gemini API გასაღები. გასაღები შეინახება მხოლოდ თქვენს ბრაუზერში (localStorage) და არ გაიგზავნება მესამე მხარესთან."
                    : "A Gemini API Key is required to analyze lessons. Your key is stored securely in your browser's local storage and is only used to send analysis requests."}
                </p>
                
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {language === "ka" ? "Gemini API გასაღები" : "Gemini API Key"}
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      setApiKey(val);
                    }}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono text-slate-800"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem("gemini_api_key");
                    setApiKey("");
                    setShowApiSettings(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-semibold text-slate-600 transition-all cursor-pointer"
                >
                  {language === "ka" ? "წაშლა" : "Clear"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("gemini_api_key", apiKey.trim());
                    setShowApiSettings(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 text-xs font-semibold text-white shadow-md transition-all cursor-pointer"
                >
                  {language === "ka" ? "შენახვა" : "Save Settings"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Archive Modal */}
      <AnimatePresence>
        {showArchive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Archive className="w-5 h-5 text-amber-500" />
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
                    {language === "ka" ? "შეფასებების არქივი" : "Evaluations Archive"}
                  </h3>
                </div>
                <button
                  onClick={() => setShowArchive(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {archiveItems.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 space-y-2">
                    <Archive className="w-12 h-12 mx-auto stroke-1" />
                    <p className="text-sm font-semibold">
                      {language === "ka" ? "არქივი ცარიელია" : "Archive is empty"}
                    </p>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      {language === "ka" 
                        ? "თქვენ მიერ გენერირებული შეფასებები ავტომატურად შეინახება აქ." 
                        : "Evaluations you generate will automatically be saved here."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {archiveItems.map((item) => (
                      <div 
                        key={item.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">{item.timestamp}</span>
                            <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-blue-50 text-blue-800 uppercase tracking-wider">
                              {item.program === "ზოგადი" ? (language === "ka" ? "ზოგადი" : "General") : item.program}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 mt-2">
                            {item.teacherName || (language === "ka" ? "უცნობი მასწავლებელი" : "Unknown Teacher")}
                          </h4>
                          {item.observerName && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              <strong>{language === "ka" ? "დამკვირვებელი:" : "Observer:"}</strong> {item.observerName}
                            </p>
                          )}
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            <strong>{language === "ka" ? "საგანი:" : "Subject:"}</strong> {item.subject || (language === "ka" ? "ზოგადი" : "General")}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200/60 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              // Load into state
                              setReport(item.reportText);
                              setTeacherName(item.teacherName || "");
                              setObserverName(item.observerName || "");
                              setSubject(item.subject || "");
                              setProgram(item.program || "ზოგადი");
                              if (item.rubricScores) setRubricScores(item.rubricScores);
                              if (item.selectedRubrics) setSelectedRubrics(item.selectedRubrics);
                              
                              if (item.inputs) {
                                setTranscript(item.inputs.transcript || "");
                                setGeneralText(item.inputs.generalText || "");
                                setPositiveNotes(item.inputs.positiveNotes || [""]);
                                setNegativeNotes(item.inputs.negativeNotes || [""]);
                                setActiveInputTab(item.inputs.activeInputTab || "form");
                              } else {
                                // Fallback/reset inputs if older archive item doesn't have inputs stored
                                setTranscript("");
                                setGeneralText("");
                                setPositiveNotes([""]);
                                setNegativeNotes([""]);
                              }

                              setActiveArchiveId(item.id);
                              setReportTab("report");
                              setShowArchive(false);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>{language === "ka" ? "ჩატვირთვა" : "Load"}</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              const parsed = parseReport(item.reportText, language);
                              const emailText = serializeToEmail(parsed, language, item.teacherName || "", item.observerName || "", item.subject || "");
                              const blob = new Blob([emailText], { type: "text/plain;charset=utf-8;" });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement("a");
                              link.href = url;
                              link.setAttribute("download", `email_to_${item.teacherName || "teacher"}.txt`);
                              link.click();
                              URL.revokeObjectURL(url);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-200/60 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>{language === "ka" ? "გადმოწერა" : "Download"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              // Delete from archive
                              const updated = archiveItems.filter(x => x.id !== item.id);
                              setArchiveItems(updated);
                              localStorage.setItem("ib_archive", JSON.stringify(updated));
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{language === "ka" ? "წაშლა" : "Delete"}</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                {archiveItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(language === "ka" ? "დარწმუნებული ხართ, რომ გსურთ მთელი არქივის წაშლა?" : "Are you sure you want to clear the entire archive?")) {
                        localStorage.removeItem("ib_archive");
                        setArchiveItems([]);
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === "ka" ? "არქივის გასუფთავება" : "Clear Archive"}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowArchive(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white shadow-md transition-all cursor-pointer ml-auto"
                >
                  {language === "ka" ? "დახურვა" : "Close"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
