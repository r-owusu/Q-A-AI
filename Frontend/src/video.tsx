// import React, { useState, useRef } from "react";
// import axios from "axios";

// // Extend the Window interface to include SpeechRecognition types
// interface Window {
//   SpeechRecognition: any;
//   webkitSpeechRecognition: any;
// }

// // Add SpeechRecognition type for TypeScript
// type SpeechRecognition = {
//   new (): SpeechRecognitionInstance;
// };
// interface SpeechRecognitionInstance {
//   lang: string;
//   interimResults: boolean;
//   maxAlternatives: number;
//   onresult: (event: SpeechRecognitionEvent) => void;
//   onend: () => void;
//   start: () => void;
//   stop: () => void;
// }
// type SpeechRecognitionEvent = any;

// const STTAndSubmit: React.FC = () => {
//   const [text, setText] = useState("");
//   const [listening, setListening] = useState(false);
//   const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

//   const handleStartListening = () => {
//     const SpeechRecognition =
//       (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

//     if (!SpeechRecognition) {
//       alert("Speech Recognition not supported in this browser.");
//       return;
//     }

//     const recognition = new SpeechRecognition();
//     recognition.lang = "en-US";
//     recognition.interimResults = false;
//     recognition.maxAlternatives = 1;

//     recognition.onresult = (event: SpeechRecognitionEvent) => {
//       const transcript = event.results[0][0].transcript;
//       setText(prev => prev + " " + transcript);
//     };

//     recognition.onend = () => {
//       setListening(false);
//     };

//     recognition.start();
//     setListening(true);
//     recognitionRef.current = recognition;
//   };

//   const handleStopListening = () => {
//     recognitionRef.current?.stop();
//     setListening(false);
//   };

//   const handleSubmit = async () => {
//     try {
//       const res = await axios.post("http://localhost:5000/summarize", { text });
//       alert("Summary:\n" + res.data.summary);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to send text.");
//     }
//   };

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Speak or Type</h2>
//       <textarea
//         rows={10}
//         cols={50}
//         value={text}
//         onChange={(e) => setText(e.target.value)}
//         placeholder="Type or speak here..."
//       />
//       <br />
//       <button onClick={listening ? handleStopListening : handleStartListening}>
//         {listening ? "🛑 Stop Listening" : "🎙️ Start Listening"}
//       </button>
//       <button onClick={handleSubmit} style={{ marginLeft: 10 }}>
//         Submit
//       </button>
//     </div>
//   );
// };

// export default STTAndSubmit;


import React, { useState, useRef } from "react";
import axios from "axios";

type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: (event: any) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
};

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [listening, setListening] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [role, setRole] = useState("teacher");
  const [loading, setLoading] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const handleStartListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setPrompt(prev => prev + " " + transcript);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
    setListening(true);
    recognitionRef.current = recognition;
  };

  const handleStopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleGenerateVideo = async () => {
    setLoading(true);
    setVideoUrl("");

    try {
      const res = await axios.post("http://localhost:5000/video", {
        prompt,
        role
      });

      if (res.data.videoUrl) {
        setVideoUrl(res.data.videoUrl);
      } else {
        alert("No video URL returned.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate video.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>🎬 Generate Video</h2>

      <textarea
        rows={5}
        cols={60}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Type or speak your video prompt here..."
      />
      <br />

      <button onClick={listening ? handleStopListening : handleStartListening}>
        {listening ? "🛑 Stop Listening" : "🎙️ Start Listening"}
      </button>

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        style={{ marginLeft: 10 }}
      >
        <option value="teacher">👨‍🏫 Teacher</option>
        <option value="">🤖 None</option>
      </select>

      <button
        onClick={handleGenerateVideo}
        disabled={!prompt || loading}
        style={{ marginLeft: 10 }}
      >
        {loading ? "Generating..." : "🎥 Generate Video"}
      </button>

      {videoUrl && (
        <div style={{ marginTop: 20 }}>
          <h3>Generated Video:</h3>
          <video src={videoUrl} controls style={{ maxWidth: "100%" }} />
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
