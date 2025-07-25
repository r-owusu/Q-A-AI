



import ReactMarkdown from "react-markdown";

import React, { useState } from "react";
import axios from "axios";

const Summary: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<string>("");  
  const [loading, setLoading] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string>("");

  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [answerAudioUrl, setAnswerAudioUrl] = useState<string>("");
  const [recording, setRecording] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSaveAsPdf = async () => {
  const res = await fetch('http://localhost:5000/save-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markdown: summary })  // send the markdown
  });
  const data = await res.json();
  if (data.pdfUrl) {
    window.open(`http://localhost:5000${data.pdfUrl}`, '_blank');
  }
};


  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setSummary("");  
      setAudioUrl("");

      // 📝 extract text
      const extractRes = await axios.post("http://localhost:5000/extract-text", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const extractedText = extractRes.data.text;

      // 📝 summarize
      const summaryRes = await axios.post("http://localhost:5000/summarize", {
        text: extractedText
      });

      const summarizedText = summaryRes.data.summary;
      setSummary(summarizedText);

      // 🔊 generate TTS
      const ttsRes = await axios.post("http://localhost:5000/tts", {
        text: summarizedText
      });

      setAudioUrl(ttsRes.data.audioUrl || "");

    } catch (err) {
      console.error(err);
      setSummary("Error: could not process the document.");
    } finally {
      setLoading(false);
    }
  };

  const handleAskAI = async () => {
    if (!question.trim()) return;

    setAnswer("");
    setAnswerAudioUrl("");

    try {
      const res = await axios.post("http://localhost:5000/ask", { text: question });
      setAnswer(res.data.text);
      setAnswerAudioUrl(res.data.audioUrl || "");
    } catch (err) {
      console.error(err);
      setAnswer("Error: could not get response.");
    }
  };

  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;

    recognition.onstart = () => setRecording(true);
    recognition.onend = () => setRecording(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
    };

    recognition.start();
  };

  return (
    <div className="app">
      <h1>STUDENT COMPANION</h1>

      <input type="file" accept=".pdf,.docx,.pptx,.txt" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || loading}>
        {loading ? "Processing..." : "Upload & Summarize"}
      </button>

      {summary && (
        <div className="summary">
          <h2>QUESTIONS AND ANSWERS:</h2>
          <div style={{ border: "solid", padding: "1opx" }}>
          <button
      onClick={handleSaveAsPdf}
      style={{
        marginTop: "10px",
        padding: "8px 16px",
        backgroundColor: "#4CAF50",
        color: "white",
        border: "none",
        cursor: "pointer"
      }}
    >
      📄 Save as PDF
    </button>
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </div>
      )}

      {audioUrl && (
  <div className="audio">
    <h3>Audio Summary:</h3>

    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <audio controls src={audioUrl} style={{ width: "100%" }} />

      <a
        href={audioUrl}
        download
        style={{
          display: "inline-block",
          padding: "6px 12px",
          background: "#28a745",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "4px"
        }}
      >
        ⬇️ Download Summary Audio
      </a>
    </div>
  </div>
)}


      <hr />

      <div className="ai-helper">
        <h2>Ask Secondary AI</h2>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder='e.g. "ChatGPT explain question 2…"'
          style={{ width: "80%", marginRight: "10px" }}
        />
        <button onClick={handleVoiceInput}>
          {recording ? "🎙️ Listening…" : "🎤 Speak"}
        </button>
        <button onClick={handleAskAI} disabled={!question.trim()}>
          Ask
        </button>

        {answer && (
          <div className="answer">
            <h3>Answer:</h3>
            <div style={{ border: "solid", padding: "10px" }}>
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
          </div>
        )}

        {/* {answerAudioUrl && (
          <div className="answer-audio">
            <h3>Answer Audio:</h3>
            <button
              onClick={() => new Audio(answerAudioUrl).play()}
              style={{
                fontSize: "2rem",
                background: "none",
                border: "none",
                cursor: "pointer"
              }}
              title="Play Answer"
            >
              🗣️
            </button>
          </div>

        )} */}

{answerAudioUrl && (
  <div className="answer-audio">
    <h3>Answer Audio:</h3>

    <audio controls src={answerAudioUrl} style={{ width: "100%" }} />

    <a
      href={answerAudioUrl}
      download
      style={{
        display: "inline-block",
        marginTop: "10px",
        padding: "6px 12px",
        background: "#28a745",
        color: "#fff",
        textDecoration: "none",
        borderRadius: "4px"
      }}
    >
      ⬇️ Download Answer Audio
    </a>
  </div>
)}


      </div>
    </div>
  );
};

export default Summary;



