

// require("dotenv").config();
// const express = require("express");
// const multer = require("multer");
// const mammoth = require("mammoth");
// const pdfParse = require("pdf-parse");
// const cors = require("cors");
// const fs = require("fs");
// const path = require("path");
// const axios = require("axios");

// const app = express();
// const upload = multer({ dest: "uploads/" });

// app.use(cors());
// app.use(express.json());

// const PORT = 5000;

// // Utility: clean up temp file
// function cleanup(filePath) {
//   fs.unlink(filePath, (err) => {
//     if (err) console.error(`Failed to delete temp file: ${filePath}`, err);
//   });
// }

// // 🔷 Route: Extract text from uploaded DOCX or PDF
// app.post("/extract-text", upload.single("file"), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: "No file uploaded" });
//   }

//   const filePath = req.file.path;
//   const ext = path.extname(req.file.originalname).toLowerCase();

//   try {
//     let text = "";

//     if (ext === ".docx") {
//       const result = await mammoth.extractRawText({ path: filePath });
//       text = result.value?.trim();

//     } else if (ext === ".pdf") {
//       const dataBuffer = fs.readFileSync(filePath);
//       const data = await pdfParse(dataBuffer);
//       text = data.text?.trim();

//     } else {
//       cleanup(filePath);
//       return res.status(400).json({ message: "Unsupported file type. Please upload .docx or .pdf" });
//     }

//     cleanup(filePath);

//     if (!text) {
//       return res.status(500).json({ message: "No text found in the document." });
//     }

//     res.json({ text });
//   } catch (err) {
//     console.error("❌ Error extracting document:", err);
//     cleanup(filePath);
//     res.status(500).json({ message: "Error extracting text", error: err.message });
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

// // 🔷 Route: Text-to-Speech
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
//         model_specific_params: {rate: 0.35, pitch: 0.0}
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
//         system: [
//           {
//             type: "text",
//             text: "Respond directly to the question. Do NOT include internal thoughts, reasoning, or any <think> tags. Only output the final answer."
//           }
//         ]
//       },
//             {
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

//     let aiText =
//       alleRes.data?.responses?.responses?.["deepseek-r1"]?.message?.content ||
//       "No response found in AI output.";
//     aiText = aiText.replace(/<think>[\s\S]*?<\/think>\s*/gi, '').trim();


//     const ttsRes = await axios.post(
//       "https://api.alle-ai.com/api/v1/audio/tts",
//       {
//         models: ["gpt-4o-mini-tts"],
//         prompt: aiText,
//         voice: "nova",
//         model_specific_params: {rate: 0.35, pitch: 0.0}
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

// // Start the server
// app.listen(PORT, () => {
//   console.log(`✅ Backend server running on http://localhost:${PORT}`);
// });









// require("dotenv").config();
// const express = require("express");
// const multer = require("multer");
// const mammoth = require("mammoth");
// const pdfParse = require("pdf-parse");
// const cors = require("cors");
// const fs = require("fs");
// const path = require("path");
// const axios = require("axios");

// const app = express();
// const upload = multer({ dest: "uploads/" });

// app.use(cors());
// app.use(express.json());
// app.use('/pdfs', express.static(path.join(__dirname, 'outputs')));

// const PORT = 5000;
// const officeParser = require('officeparser');
// const markdownpdf = require("markdown-pdf");


// // Utility: clean up temp file
// function cleanup(filePath) {
//   fs.unlink(filePath, (err) => {
//     if (err) console.error(`Failed to delete temp file: ${filePath}`, err);
//   });
// }
// // markdow to pdf
// app.post("/save-pdf", async (req, res) => {
//   const { markdown } = req.body;

//   if (!markdown) {
//     return res.status(400).json({ message: "No markdown provided" });
//   }

//   try {
//     const pdfPath = `outputs/summary-${Date.now()}.pdf`;

//     markdownpdf()
//       .from.string(markdown)
//       .to(pdfPath, () => {
//         console.log(`✅ PDF saved: ${pdfPath}`);
//         res.json({ pdfUrl: `/pdfs/${path.basename(pdfPath)}` });
//       });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error saving PDF" });
//   }
// });

// // 🔷 Route: Extract text from uploaded DOCX or PDF
// app.post("/extract-text", upload.single("file"), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: "No file uploaded" });
//   }

//   const filePath = req.file.path;
//   const ext = path.extname(req.file.originalname).toLowerCase();

//   try {
//     let text = "";

//     if (ext === ".docx") {
//       const result = await mammoth.extractRawText({ path: filePath });
//       text = result.value?.trim();

//     } else if (ext === ".pptx") {
//   const fixedPath = `${filePath}${ext}`; // e.g., uploads/69d49d1.pptx
//   fs.renameSync(filePath, fixedPath);

//   text = await officeParser.parseOfficeAsync(fixedPath);

//   cleanup(fixedPath);
//   return res.json({ text });
// }

    
    
//     else if (ext === ".pdf") {
//       const buffer = fs.readFileSync(filePath);
//       const data = await pdfParse(buffer);
//       text = data.text?.trim();

//     } else {
//       cleanup(filePath);
//       return res.status(400).json({ message: "Unsupported file type. Please upload .docx or .pdf or .pptx" });
//     }

//     cleanup(filePath);

//     if (!text) {
//       return res.status(500).json({ message: "No text found in the document." });
//     }

//     res.json({ text });
//   } catch (err) {
//     console.error("❌ Error extracting document:", err);
//     cleanup(filePath);
//     res.status(500).json({ message: "Error extracting text", error: err.message });
//   }
// });

// // 🔷 Route: Summarize into questions & answers
// let lastSummary = "";  // 🆕 store the summary

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
//                 text: `If you are provided with a document convert it into multiple choice questions and answers a minimum of 20 questions , the answers should be highlighted. If you are provided with questions in the document provide their corresponding answers whith the answer highlighted mean while if is a multiple choice question show all the possible choices before the main answer in a Markdown format,number them too,  using bold for section titles, bullets, italics where appropriate: ${text}`
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
//     lastSummary = summary;  // 🆕 save for context

//     res.json({ summary });
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(500).json({ message: "Error summarizing text" });
//   }
// });

// // 🔷 Route: Text-to-Speech
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
//         model_specific_params: { rate: 0.35, pitch: 0.0 }
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

//   if (!/chatgpt/i.test(text)) {
//     return res.json({
//       text: "No explicit request for ChatGPT detected. Please mention 'ChatGPT' in your question.",
//       audioUrl: null
//     });
//   }

//   try {
//     const fullPrompt = `
// Here is a set of questions and answers:

// ${lastSummary}

// Now the user asks: ${text}

// Please explain or elaborate as requested.
//     `.trim();

//     const alleRes = await axios.post(
//       "https://api.alle-ai.com/api/v1/chat/completions",
//       {
//         models: ["deepseek-r1"],
//         messages: [
//           {
//             system: [
//               {
//                 type: "text",
//                 text: "Respond directly to the question. Do NOT include internal thoughts, reasoning, or any <think> tags. Only output the final answer."
//               }
//             ]
//           },
//           {
//             user: [
//               {
//                 type: "text",
//                 text: fullPrompt
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

//     let aiText =
//       alleRes.data?.responses?.responses?.["deepseek-r1"]?.message?.content ||
//       "No response found in AI output.";
//     aiText = aiText.replace(/<think>[\s\S]*?<\/think>\s*/gi, '').trim();

//     const ttsRes = await axios.post(
//       "https://api.alle-ai.com/api/v1/audio/tts",
//       {
//         models: ["gpt-4o-mini-tts"],
//         prompt: aiText,
//         voice: "nova",
//         model_specific_params: { rate: 0.35, pitch: 0.0 }
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

// // Start the server
// app.listen(PORT, () => {
//   console.log(`✅ Backend server running on http://localhost:${PORT}`);
// });










// require("dotenv").config();
// const express = require("express");
// const multer = require("multer");
// const mammoth = require("mammoth");
// const pdfParse = require("pdf-parse");
// const cors = require("cors");
// const fs = require("fs");
// const path = require("path");
// const axios = require("axios");

// const app = express();
// const upload = multer({ dest: "uploads/" });

// app.use(cors());
// app.use(express.json());
// app.use('/pdfs', express.static(path.join(__dirname, 'outputs')));
// app.use('/audio', express.static(path.join(__dirname, 'outputs')));

// const PORT = 5000;
// const officeParser = require('officeparser');
// const markdownpdf = require("markdown-pdf");


// // Utility: clean up temp file
// function cleanup(filePath) {
//   fs.unlink(filePath, (err) => {
//     if (err) console.error(`Failed to delete temp file: ${filePath}`, err);
//   });
// }
// // markdow to pdf
// app.post("/save-pdf", async (req, res) => {
//   const { markdown } = req.body;

//   if (!markdown) {
//     return res.status(400).json({ message: "No markdown provided" });
//   }

//   try {
//     const pdfPath = `outputs/summary-${Date.now()}.pdf`;

//     markdownpdf({ cssPath: path.join(__dirname, 'pdf-style.css') })
//       .from.string(markdown)
//       .to(pdfPath, () => {
//         console.log(`✅ PDF saved: ${pdfPath}`);
//         res.json({ pdfUrl: `/pdfs/${path.basename(pdfPath)}` });
//       });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Error saving PDF" });
//   }
// });

// // 🔷 Route: Extract text from uploaded DOCX or PDF
// app.post("/extract-text", upload.single("file"), async (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({ message: "No file uploaded" });
//   }

//   const filePath = req.file.path;
//   const ext = path.extname(req.file.originalname).toLowerCase();

//   try {
//     let text = "";

//     if (ext === ".docx") {
//       const result = await mammoth.extractRawText({ path: filePath });
//       text = result.value?.trim();

//     } else if (ext === ".pptx") {
//   const fixedPath = `${filePath}${ext}`; // e.g., uploads/69d49d1.pptx
//   fs.renameSync(filePath, fixedPath);

//   text = await officeParser.parseOfficeAsync(fixedPath);

//   cleanup(fixedPath);
//   return res.json({ text });
// }

    
    
//     else if (ext === ".pdf") {
//       const buffer = fs.readFileSync(filePath);
//       const data = await pdfParse(buffer);
//       text = data.text?.trim();

//     } else {
//       cleanup(filePath);
//       return res.status(400).json({ message: "Unsupported file type. Please upload .docx or .pdf or .pptx" });
//     }

//     cleanup(filePath);

//     if (!text) {
//       return res.status(500).json({ message: "No text found in the document." });
//     }

//     res.json({ text });
//   } catch (err) {
//     console.error("❌ Error extracting document:", err);
//     cleanup(filePath);
//     res.status(500).json({ message: "Error extracting text", error: err.message });
//   }
// });

// // 🔷 Route: Summarize into questions & answers
// let lastSummary = "";  // 🆕 store the summary

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
//                 text: `If you are provided with a document convert it into multiple choice questions and answers a minimum of 20 questions , the answers should be highlighted. If you are provided with questions in the document provide their corresponding answers whith the answer highlighted mean while if is a multiple choice question show all the possible choices before the main answer in a Markdown format,number them too,  using bold for section titles, bullets, italics where appropriate: ${text}`
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
//     lastSummary = summary;  // 🆕 save for context

//     res.json({ summary });
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(500).json({ message: "Error summarizing text" });
//   }
// });

// // 🔷 Route: Text-to-Speech
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
//         model_specific_params: { rate: 0.35, pitch: 0.0 }
//       },
//       {
//         headers: {
//           "X-API-Key": process.env.ALLE_API_KEY,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     const audioUrl =
//   ttsRes.data?.responses?.responses?.["gpt-4o-mini-tts"] || null;

// if (!audioUrl) {
//   return res.status(500).json({ message: "Failed to generate audio" });
// }

// // Download audio file and save locally
// const audioFileName = `audio-${Date.now()}.mp3`;
// const audioPath = path.join(__dirname, 'outputs', audioFileName);

// const writer = fs.createWriteStream(audioPath);

// const response = await axios.get(audioUrl, { responseType: 'stream' });
// response.data.pipe(writer);

// writer.on('finish', () => {
//   console.log(`✅ Audio saved: outputs/${audioFileName}`);
//   res.json({ audioUrl: `/audio/${audioFileName}` });
// });

// writer.on('error', err => {
//   console.error(err);
//   res.status(500).json({ message: "Error saving audio" });
// });
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

//   if (!/Gerry/i.test(text)) {
//     return res.json({
//       text: "No explicit request for ChatGPT detected. Please mention 'ChatGPT' in your question.",
//       audioUrl: null
//     });
//   }

//   try {
//     const fullPrompt = `
// Here is a set of questions and answers:

// ${lastSummary}

// Now the user asks: ${text}

// Please explain or elaborate as requested.
//     `.trim();

//     const alleRes = await axios.post(
//       "https://api.alle-ai.com/api/v1/chat/completions",
//       {
//         models: ["deepseek-r1"],
//         messages: [
//           {
//             system: [
//               {
//                 type: "text",
//                 text: "Respond directly to the question. Do NOT include internal thoughts, reasoning, or any <think> tags. Only output the final answer."
//               }
//             ]
//           },
//           {
//             user: [
//               {
//                 type: "text",
//                 text: fullPrompt
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

//     let aiText =
//       alleRes.data?.responses?.responses?.["deepseek-r1"]?.message?.content ||
//       "No response found in AI output.";
//     aiText = aiText.replace(/<think>[\s\S]*?<\/think>\s*/gi, '').trim();

//     const ttsRes = await axios.post(
//       "https://api.alle-ai.com/api/v1/audio/tts",
//       {
//         models: ["gpt-4o-mini-tts"],
//         prompt: aiText,
//         voice: "nova",
//         model_specific_params: { rate: 0.35, pitch: 0.0 }
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

// // Start the server
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
app.use('/pdfs', express.static(path.join(__dirname, 'outputs')));
app.use('/audio', express.static(path.join(__dirname, 'outputs')));

const PORT = 5000;
const officeParser = require('officeparser');
const markdownpdf = require("markdown-pdf");


// Utility: clean up temp file
function cleanup(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) console.error(`Failed to delete temp file: ${filePath}`, err);
  });
}
// markdow to pdf
app.post("/save-pdf", async (req, res) => {
  const { markdown } = req.body;

  if (!markdown) {
    return res.status(400).json({ message: "No markdown provided" });
  }

  try {
    const pdfPath = `outputs/summary-${Date.now()}.pdf`;

    markdownpdf({ cssPath: path.join(__dirname, 'pdf-style.css') })
      .from.string(markdown)
      .to(pdfPath, () => {
        console.log(`✅ PDF saved: ${pdfPath}`);
        res.json({ pdfUrl: `/pdfs/${path.basename(pdfPath)}` });
      });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving PDF" });
  }
});

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

    } else if (ext === ".pptx") {
  const fixedPath = `${filePath}${ext}`; // e.g., uploads/69d49d1.pptx
  fs.renameSync(filePath, fixedPath);

  text = await officeParser.parseOfficeAsync(fixedPath);

  cleanup(fixedPath);
  return res.json({ text });
}

    
    
    else if (ext === ".pdf") {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      text = data.text?.trim();

    } else {
      cleanup(filePath);
      return res.status(400).json({ message: "Unsupported file type. Please upload .docx or .pdf or .pptx" });
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
let lastSummary = "";  // 🆕 store the summary

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
                text: `If you are provided with a document convert it into multiple choice questions and answers a minimum of 20 questions , the answers should be highlighted. If you are provided with questions in the document provide their corresponding answers whith the answer highlighted mean while if is a multiple choice question show all the possible choices before the main answer in a Markdown format,number them too,  using bold for section titles, bullets, italics where appropriate: ${text}`
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
    lastSummary = summary;  // 🆕 save for context

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
        model_specific_params: { rate: 0.35, pitch: 0.0 }
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

    res.json({ audioUrl }); // send the remote Alle AI audio URL directly

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

  if (!/Jerry/i.test(text)) {
    return res.json({
      text: "No explicit request for ChatGPT detected. Please mention 'ChatGPT' in your question.Do NOT include internal thoughts, reasoning, or any <think> tags. Only output the final answer.",
      audioUrl: null
    });
  }

  try {
    const fullPrompt = `
Here is a set of questions and answers:

${lastSummary}

Now the user asks: ${text}

You are Jerry, an AI assistant tasked with evaluating and responding to the answers provided earlier by another AI named Tom.

Whenever the user asks you a question, you must assume that Tom has already answered that question earlier, and you (Jerry) have read and understood Tom’s answer.  

Your job is to explicitly make reference to Tom’s answer in your response — as someone who has reviewed and analyzed what Tom wrote. You must make it clear to the user that you are commenting on what Tom already provided, not producing an independent answer.

Specifically:
- Start your response by explicitly mentioning Tom, for example: “I have read Tom’s answer to this question. He said…” or “According to Tom’s response…”
- Then either confirm (agree with and affirm), or critique (disagree with and explain shortcomings) Tom’s answer, based on the information provided.
- Always provide your reasoning in a clear, polite, and professional tone.
- Always refer to yourself in first person as Jerry, and to the earlier AI as Tom.
- If the question cannot reasonably be answered based on Tom’s summary, acknowledge this politely and explain why.

Your response must *always* make it clear that it is based on reading and analyzing Tom’s earlier answer.
Do not include any internal reasoning notes or thoughts — only output the final answer you would give to the user.

    `.trim();

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
                text: fullPrompt
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
        model_specific_params: { rate: 0.35, pitch: 0.0 }
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





