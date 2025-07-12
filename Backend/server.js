




// require("dotenv").config();
// const express = require("express");
// const multer = require("multer");
// const mammoth = require("mammoth");
// const axios = require("axios");
// const cors = require("cors");
// const fs = require("fs");

// const app = express();
// const upload = multer({ dest: "uploads/" });

// app.use(cors());
// app.use(express.json());

// const PORT = 5000;

// // 🔷 Route: Extract text from uploaded DOCX
// app.post("/extract-text", upload.single("file"), async (req, res) => {
//   try {
//     const result = await mammoth.extractRawText({ path: req.file.path });
//     const text = result.value;

//     fs.unlink(req.file.path, () => {}); // cleanup

//     res.json({ text });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error extracting text" });
//   }
// });

// // 🔷 Route: Summarize into questions & answers
// app.post("/summarize", async (req, res) => {
//   const { text } = req.body;

//   if (!text) {
//     return res.status(400).json({ message: "No text provided" });
//   }

//   try {
//     const alleRes = await axios.post(
//       "https://api.alle-ai.com/api/v1/chat/completions",
//       {
//         models: ["gpt-4o"],
//         messages: [
//           {
//             user: [
//               {
//                 type: "text",
//                 text: `If you are provided with a document convert it into multiple choice questions and answers. If you are provided with questions in the document provide answers too in a Markdown format, using bold for section titles, bullets, italics where appropriate: ${text}`
//               }
//             ]
//           }
//         ],
//         response_format: {
//           type: "text",
//           model_specific: {
//             "gpt-4o": "text"
//           }
//         },
//         temperature: 0.7,
//         max_tokens: 1000,
//         stream: false
//       },
//       {
//         headers: {
//           "X-API-Key": process.env.ALLE_API_KEY,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     const summary =
//       alleRes.data?.responses?.responses?.["gpt-4o"]?.message?.content ||
//       "No summary found in response.";

//     res.json({ summary });
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(500).json({ message: "Error summarizing text" });
//   }
// });

// // 🔷 Route: Text-to-Speech (main audio)
// app.post("/tts", async (req, res) => {
//   const { text } = req.body;

//   if (!text) {
//     return res.status(400).json({ message: "No text provided" });
//   }

//   try {
//     const ttsRes = await axios.post(
//       "https://api.alle-ai.com/api/v1/audio/tts",
//       {
//         models: ["gpt-4o-mini-tts"],
//         prompt: text,
//         voice: "nova",
//         model_specific_params: {}
//       },
//       {
//         headers: {
//           "X-API-Key": process.env.ALLE_API_KEY,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     const audioUrl =
//       ttsRes.data?.responses?.responses?.["gpt-4o-mini-tts"] || null;

//     if (!audioUrl) {
//       return res.status(500).json({ message: "Failed to generate audio" });
//     }

//     res.json({ audioUrl });
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(500).json({ message: "Error generating audio" });
//   }
// });

// // 🔷 Route: Ask secondary AI + TTS
// app.post("/ask", async (req, res) => {
//   const { text } = req.body;

//   if (!text) {
//     return res.status(400).json({ message: "No text provided" });
//   }

//   // ✅ Only proceed if text explicitly mentions ChatGPT
//   if (!/chatgpt/i.test(text)) {
//     return res.json({
//       text: "No explicit request for ChatGPT detected. Please mention 'ChatGPT' in your question.",
//       audioUrl: null
//     });
//   }

//   try {
//     const alleRes = await axios.post(
//       "https://api.alle-ai.com/api/v1/chat/completions",
//       {
//         models: ["deepseek-r1"],
//         messages: [
//           {
//             user: [
//               {
//                 type: "text",
//                 text
//               }
//             ]
//           }
//         ],
//         temperature: 0.7,
//         max_tokens: 1000,
//         stream: false
//       },
//       {
//         headers: {
//           "X-API-Key": process.env.ALLE_API_KEY,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     const aiText =
//       alleRes.data?.responses?.responses?.["deepseek-r1"]?.message?.content ||
//       "No response found in AI output.";

//     // 👇 now generate TTS for AI response
//     const ttsRes = await axios.post(
//       "https://api.alle-ai.com/api/v1/audio/tts",
//       {
//         models: ["gpt-4o-mini-tts"],
//         prompt: aiText,
//         voice: "nova",
//         model_specific_params: {}
//       },
//       {
//         headers: {
//           "X-API-Key": process.env.ALLE_API_KEY,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     const audioUrl =
//       ttsRes.data?.responses?.responses?.["gpt-4o-mini-tts"] || null;

//     res.json({ text: aiText, audioUrl });
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(500).json({ message: "Error handling ChatGPT question" });
//   }
// });


// app.listen(PORT, () => {
//   console.log(`✅ Backend server running on http://localhost:${PORT}`);
// });




require("dotenv").config();
const express = require("express");
const multer = require("multer");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

const PORT = 5000;

// Utility: clean up temp file
function cleanup(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) console.error(`Failed to delete temp file: ${filePath}`, err);
  });
}

// 🔷 Route: Extract text from uploaded DOCX or PDF
app.post("/extract-text", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = req.file.path;
  const ext = path.extname(req.file.originalname).toLowerCase();

  try {
    let text = "";

    if (ext === ".docx") {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value?.trim();

    } else if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text?.trim();

    } else {
      cleanup(filePath);
      return res.status(400).json({ message: "Unsupported file type. Please upload .docx or .pdf" });
    }

    cleanup(filePath);

    if (!text) {
      return res.status(500).json({ message: "No text found in the document." });
    }

    res.json({ text });
  } catch (err) {
    console.error("❌ Error extracting document:", err);
    cleanup(filePath);
    res.status(500).json({ message: "Error extracting text", error: err.message });
  }
});

// 🔷 Route: Summarize into questions & answers
app.post("/summarize", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: "No text provided" });
  }

  try {
    const alleRes = await axios.post(
      "https://api.alle-ai.com/api/v1/chat/completions",
      {
        models: ["gpt-4o"],
        messages: [
          {
            user: [
              {
                type: "text",
                text: `If you are provided with a document convert it into multiple choice questions and answers. If you are provided with questions in the document provide answers too in a Markdown format, using bold for section titles, bullets, italics where appropriate: ${text}`
              }
            ]
          }
        ],
        response_format: {
          type: "text",
          model_specific: {
            "gpt-4o": "text"
          }
        },
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      },
      {
        headers: {
          "X-API-Key": process.env.ALLE_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    const summary =
      alleRes.data?.responses?.responses?.["gpt-4o"]?.message?.content ||
      "No summary found in response.";

    res.json({ summary });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Error summarizing text" });
  }
});

// 🔷 Route: Text-to-Speech
app.post("/tts", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: "No text provided" });
  }

  try {
    const ttsRes = await axios.post(
      "https://api.alle-ai.com/api/v1/audio/tts",
      {
        models: ["gpt-4o-mini-tts"],
        prompt: text,
        voice: "nova",
        model_specific_params: {}
      },
      {
        headers: {
          "X-API-Key": process.env.ALLE_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    const audioUrl =
      ttsRes.data?.responses?.responses?.["gpt-4o-mini-tts"] || null;

    if (!audioUrl) {
      return res.status(500).json({ message: "Failed to generate audio" });
    }

    res.json({ audioUrl });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Error generating audio" });
  }
});

// 🔷 Route: Ask secondary AI + TTS
app.post("/ask", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ message: "No text provided" });
  }

  if (!/chatgpt/i.test(text)) {
    return res.json({
      text: "No explicit request for ChatGPT detected. Please mention 'ChatGPT' in your question.",
      audioUrl: null
    });
  }

  try {
    const alleRes = await axios.post(
      "https://api.alle-ai.com/api/v1/chat/completions",
      {
        models: ["deepseek-r1"],
        messages: [
          {
        system: [
          {
            type: "text",
            text: "Respond directly to the question. Do NOT include internal thoughts, reasoning, or any <think> tags. Only output the final answer."
          }
        ]
      },
            {
            user: [
              {
                type: "text",
                text
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      },
      {
        headers: {
          "X-API-Key": process.env.ALLE_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    let aiText =
      alleRes.data?.responses?.responses?.["deepseek-r1"]?.message?.content ||
      "No response found in AI output.";
    aiText = aiText.replace(/<think>[\s\S]*?<\/think>\s*/gi, '').trim();


    const ttsRes = await axios.post(
      "https://api.alle-ai.com/api/v1/audio/tts",
      {
        models: ["gpt-4o-mini-tts"],
        prompt: aiText,
        voice: "nova",
        model_specific_params: {}
      },
      {
        headers: {
          "X-API-Key": process.env.ALLE_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    const audioUrl =
      ttsRes.data?.responses?.responses?.["gpt-4o-mini-tts"] || null;

    res.json({ text: aiText, audioUrl });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Error handling ChatGPT question" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
});


