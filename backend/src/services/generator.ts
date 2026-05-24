import { GoogleGenerativeAI } from '@google/generative-ai';
import { IAssignment, IQuestionPaper, ISection, IQuestion, IAnswerKeyItem } from '../models/types';

export class AIGeneratorService {
  private static getGenModel() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[Gemini AI] GEMINI_API_KEY is not defined. Using mock generation mode.');
      return null;
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-3.5-flash which is fast and supports JSON schema responses perfectly
    return genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash',
      systemInstruction: `You are an expert exam creator for schools. Your goal is to create high-quality, professional, CBSE or NCERT school-standard examination question papers in pure JSON format.
      You must follow the question distributions (number of questions and marks per question) requested by the user.
      Ensure the difficulty is realistically distributed as [Easy], [Moderate], and [Hard] (also referred to as Challenging).
      Generate questions and a detailed answer key containing full solutions for each question.
      
      The output must match this exact JSON schema:
      {
        "schoolName": "string",
        "subject": "string",
        "gradeClass": "string (e.g. Class 8 Section A)",
        "timeAllowed": "string (e.g. 45 minutes, 2 hours)",
        "maxMarks": number (sum of all questions * marks per question),
        "sections": [
          {
            "title": "string (e.g. Section A, Section B)",
            "instruction": "string (e.g. Attempt all questions. Each question carries 2 marks)",
            "questions": [
              {
                "id": "string (e.g. q1, q2)",
                "text": "string (the clear question statement)",
                "options": ["string"] (optional, provide 4 options ONLY if the question is Multiple Choice),
                "difficulty": "Easy" | "Moderate" | "Hard",
                "marks": number,
                "answer": "string (detailed step-by-step solution)"
              }
            ]
          }
        ],
        "answerKey": [
          {
            "questionId": "string",
            "questionText": "string",
            "answer": "string (detailed step-by-step answer)"
          }
        ]
      }

      CRITICAL: You must return ONLY the raw JSON object. Do not wrap it in markdown code blocks like \`\`\`json. Ensure all keys and string values are properly escaped and the JSON is fully parseable.`
    });
  }

  public static async generateQuestionPaper(
    assignment: IAssignment, 
    sourceText?: string,
    onProgress?: (progress: number, statusText: string) => void,
    uploadedFiles?: Array<{ path: string; mimetype: string }>
  ): Promise<IQuestionPaper> {
    const reportProgress = (p: number, text: string) => {
      if (onProgress) onProgress(p, text);
    };

    reportProgress(10, 'Initializing AI engine...');
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Fall back to highly structured Mock Generation
      return this.generateMockPaper(assignment, reportProgress);
    }

    // Dynamic model stack with whitelisted Gemini models supported by the API key
    const modelsToTry = [
      { name: 'gemini-3.5-flash', supportsJsonConfig: true },
      { name: 'gemini-2.5-flash', supportsJsonConfig: true },
      { name: 'gemini-2.5-flash-lite', supportsJsonConfig: true },
      { name: 'gemini-2.5-pro', supportsJsonConfig: true },
      { name: 'gemini-2.0-flash', supportsJsonConfig: true },
      { name: 'gemini-1.5-flash', supportsJsonConfig: true },
      { name: 'gemini-1.5-pro', supportsJsonConfig: true },
      { name: 'gemini-pro', supportsJsonConfig: false }
    ];

    let lastError: any = null;

    for (const modelConfig of modelsToTry) {
      try {
        reportProgress(30, `Selecting AI model: ${modelConfig.name}...`);
        console.log(`[Gemini AI] Attempting generation using model: ${modelConfig.name}`);
        
        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Define unified CBSE instructions
        const systemInstruction = `You are an expert exam creator for schools. Your goal is to create high-quality, professional, CBSE or NCERT school-standard examination question papers in pure JSON format.
        You must follow the question distributions (number of questions and marks per question) requested by the user.
        Ensure the difficulty is realistically distributed as [Easy], [Moderate], and [Hard] (also referred to as Challenging).
        Generate questions and a detailed answer key containing full solutions for each question.
        
        The output must match this exact JSON schema:
        {
          "schoolName": "string",
          "subject": "string",
          "gradeClass": "string (e.g. Class 8 Section A)",
          "timeAllowed": "string (e.g. 45 minutes, 2 hours)",
          "maxMarks": number (sum of all questions * marks per question),
          "sections": [
            {
              "title": "string (e.g. Section A, Section B)",
              "instruction": "string (e.g. Attempt all questions. Each question carries 2 marks)",
              "questions": [
                {
                  "id": "string (e.g. q1, q2)",
                  "text": "string (the clear question statement)",
                  "options": ["string"] (optional, provide 4 options ONLY if the question is Multiple Choice),
                  "difficulty": "Easy" | "Moderate" | "Hard",
                  "marks": number,
                  "answer": "string (detailed step-by-step solution)"
                }
              ]
            }
          ],
          "answerKey": [
            {
              "questionId": "string",
              "questionText": "string",
              "answer": "string (detailed step-by-step answer)"
            }
          ]
        }

        CRITICAL: You must return ONLY the raw JSON object. Do not wrap it in markdown code blocks like \`\`\`json. Ensure all keys and string values are properly escaped and the JSON is fully parseable.`;

        // Retrieve model model context
        const model = genAI.getGenerativeModel({
          model: modelConfig.name,
          // Only pass systemInstruction if the model supports it (Gemini 1.5 models do)
          systemInstruction: modelConfig.supportsJsonConfig ? systemInstruction : undefined
        });

        reportProgress(40, 'Structuring prompts & CBSE syllabus...');

        // Build structured prompt
        const questionTypesSummary = assignment.questionTypes
          .map(q => `- ${q.count} ${q.type} (carrying ${q.marksPerQuestion} marks each)`)
          .join('\n');

        let prompt = `Create a question paper with the following settings:
- Title / Focus: "${assignment.title}"
- Class/Grade: ${assignment.examClass || 'Not specified'}
- Section: ${assignment.examSection || 'Not specified'}
- Subject: ${assignment.examSubject || 'Not specified'}
- School Name: ${assignment.schoolName || 'Not specified'}
- Total Questions: ${assignment.totalQuestions}
- Total Marks: ${assignment.totalMarks}
- Target Date: ${assignment.dueDate}

Question Types Breakdown (CRITICAL: EACH type MUST be a completely SEPARATE section in the "sections" array):
${questionTypesSummary}

Important:
- Provide the output such that "Multiple Choice Questions" are in "Section A", "Short Questions" in "Section B", etc.
- Do NOT prepend numbers like "1." or "2." to the question text directly. Just output the clear text.
`;

        if (assignment.additionalInstructions) {
          prompt += `\nAdditional Instructions from Teacher:\n"${assignment.additionalInstructions}"`;
        }

        if (sourceText) {
          prompt += `\n\nReference Material to use for creating questions (base your questions ONLY on this content and make sure the context precisely relates to the supplied details):\n${sourceText.substring(0, 10000)}`;
        } else {
          prompt += `\n\nSince no reference material is provided, create general school curriculum questions on the topic: "${assignment.title}". Make them educationally sound and robust.`;
        }

        // For legacy gemini-pro (which has no systemInstruction support in early SDKs), append instruction directly to prompt
        let finalPrompt = prompt;
        if (!modelConfig.supportsJsonConfig) {
          finalPrompt = `SYSTEM INSTRUCTION:\n${systemInstruction}\n\nUSER PROMPT:\n${prompt}`;
        }

        // Build parts array for multimodal input
        const parts: any[] = [{ text: finalPrompt }];

        // Read and append multimodal files as inlineData parts
        if (uploadedFiles && uploadedFiles.length > 0) {
          reportProgress(45, 'Loading reference files and images into AI...');
          const fs = require('fs/promises');
          for (const file of uploadedFiles) {
            // Only attach supported multimodal files (images and PDFs)
            const isImage = file.mimetype.startsWith('image/');
            const isPdf = file.mimetype === 'application/pdf' || file.path.endsWith('.pdf');
            
            if (isImage || isPdf) {
              try {
                console.log(`[Gemini AI] Loading multimodal attachment: ${file.path} (${file.mimetype})`);
                const dataBuffer = await fs.readFile(file.path);
                parts.push({
                  inlineData: {
                    data: dataBuffer.toString('base64'),
                    mimeType: isPdf ? 'application/pdf' : file.mimetype
                  }
                });
              } catch (readErr) {
                console.error(`[Gemini AI] Failed to read multimodal file ${file.path}:`, readErr);
              }
            }
          }
        }

        reportProgress(50, `Invoking ${modelConfig.name} (Generating questions)...`);

        const generationConfig: any = {
          temperature: 0.7
        };

        if (modelConfig.supportsJsonConfig) {
          generationConfig.responseMimeType = 'application/json';
        }

        const response = await model.generateContent({
          contents: [{ role: 'user', parts: parts }],
          generationConfig
        });

        reportProgress(80, 'Parsing generated paper structure...');
        const responseText = response.response.text();
        
        let cleanText = responseText.trim();
        
        // Strip markdown code enclosures if present
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.substring(3);
        }
        
        if (cleanText.endsWith('```')) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        
        cleanText = cleanText.trim();
        
        const parsedPaper = JSON.parse(cleanText) as IQuestionPaper;
        
        // Ensure assignmentId is set
        parsedPaper.assignmentId = assignment.id;

        reportProgress(95, 'Refining answer keys and schema details...');
        
        // Post-process to ensure all required fields are perfect
        if (!parsedPaper.sections || parsedPaper.sections.length === 0) {
          throw new Error('LLM did not generate any sections.');
        }

        reportProgress(100, `Paper generation complete via ${modelConfig.name}!`);
        return parsedPaper;

      } catch (err: any) {
        console.warn(`[Gemini AI] Model ${modelConfig.name} failed:`, err.message || err);
        lastError = err;
        // Proceed to next model in list
      }
    }

    // If we reached here, all available Gemini models failed
    console.error('[Gemini AI] All enqueued models failed.');
    
    // Propagate the real final error to the HUD so it can be diagnosed!
    reportProgress(90, `All models failed: ${lastError?.message || lastError}`);
    throw lastError || new Error('All Gemini model invocations failed.');
  }

  // Generate highly realistic school curriculum papers dynamically
  private static async generateMockPaper(
    assignment: IAssignment,
    reportProgress: (progress: number, text: string) => void
  ): Promise<IQuestionPaper> {
    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

    reportProgress(20, 'Structuring CBSE syllabus sections...');
    await sleep(800);
    
    reportProgress(50, 'Drafting questions & difficulty weights...');
    await sleep(1000);
    
    reportProgress(80, 'Compiling answer keys and solutions...');
    await sleep(800);

    const sections: ISection[] = [];
    const answerKey: IAnswerKeyItem[] = [];
    
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let globalQIndex = 1;

    assignment.questionTypes.forEach((qt, idx) => {
      const sectionLetter = alphabet[idx];
      const questions: IQuestion[] = [];

      for (let i = 0; i < qt.count; i++) {
        const qId = `q_${sectionLetter}_${i + 1}`;
        const difficulty: 'Easy' | 'Moderate' | 'Hard' = 
          i % 3 === 0 ? 'Easy' : i % 3 === 1 ? 'Moderate' : 'Hard';
        
        let qText = '';
        let qAns = '';

        // Dynamic educational topics based on title
        const isScience = /science|physics|chem|bio|electricity|light|acid|water/i.test(assignment.title);
        const titleTopic = assignment.title || 'General Knowledge';
        let options: string[] | undefined = undefined;

        if (qt.type.includes('Choice') || qt.type.includes('MCQ')) {
          qText = `Which of the following represents a primary characteristic of ${titleTopic}?`;
          options = ['Option Alpha', 'Option Beta', 'Option Gamma', 'Option Delta'];
          qAns = 'B) Option Beta. This is because Option Beta satisfies the core physical properties described under curriculum guidelines.';
        } else if (qt.type.includes('Short')) {
          qText = `Describe the primary function and significance of ${titleTopic} in elementary studies.`;
          qAns = `In elementary studies, ${titleTopic} plays a vital role. It establishes the base foundation for logical modeling and helps researchers validate chemical/grammatical structures.`;
        } else if (qt.type.includes('Diagram') || qt.type.includes('Graph')) {
          qText = `Draw a well-labeled schematic representing ${titleTopic} and highlight its main operational zones.`;
          qAns = `The diagram should display: 1) Input channel, 2) Central core processor for ${titleTopic}, and 3) Exhaust chamber. Refer to textbook Figure 4.2 for correct labels.`;
        } else if (qt.type.includes('Numerical')) {
          qText = `A system experiences a shift under ${titleTopic}. Calculate the total output given an initial index of 15 units and a variance coefficient of 2.5.`;
          qAns = `Formula: Total = Initial * Coefficient = 15 * 2.5 = 37.5 units. Therefore, the net value is 37.5.`;
        } else {
          qText = `Explain the following concept in detail: "${titleTopic} (sub-part ${i + 1})".`;
          qAns = `This concept refers to the standard academic breakdown of ${titleTopic}. It encompasses core formulas, historical definitions, and experimental proof.`;
        }

        const question: IQuestion = {
          id: qId,
          text: `[${difficulty}] ${globalQIndex}. ${qText}`,
          options,
          difficulty,
          marks: qt.marksPerQuestion,
          answer: qAns
        };

        questions.push(question);
        answerKey.push({
          questionId: qId,
          questionText: qText,
          answer: qAns
        });

        globalQIndex++;
      }

      sections.push({
        title: `Section ${sectionLetter}`,
        instruction: `${qt.type} - Attempt all questions. Each question carries ${qt.marksPerQuestion} mark(s).`,
        questions
      });
    });

    reportProgress(100, 'Mock paper finalized successfully!');
    await sleep(200);

    return {
      assignmentId: assignment.id,
      schoolName: assignment.schoolName || 'Delhi Public School, Sector-4, Bokaro',
      subject: assignment.examSubject || (/science|phy|chem|bio/i.test(assignment.title) ? 'Science' : /math/i.test(assignment.title) ? 'Mathematics' : 'English'),
      gradeClass: assignment.examClass ? `Class ${assignment.examClass}${assignment.examSection ? ` Section ${assignment.examSection}` : ''}` : 'Class 5th',
      timeAllowed: '45 minutes',
      maxMarks: assignment.totalMarks,
      sections,
      answerKey
    };
  }

  public static async regenerateSingleQuestion(
    assignment: IAssignment,
    questionText: string,
    difficulty: string,
    marks: number,
    isMcq: boolean
  ): Promise<{ text: string; options?: string[]; answer: string }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        text: `Explain a newly refined key mechanism related to ${assignment.title} (Re-rolled standard question).`,
        options: isMcq ? ['Option Alpha New', 'Option Beta New', 'Option Gamma New', 'Option Delta New'] : undefined,
        answer: 'Detailed step-by-step re-rolled answer demonstrating core syllabus mastery.'
      };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash',
        systemInstruction: 'You are an expert exam creator. Your task is to generate a single, professional replacement question for a test. Return ONLY a raw JSON object.'
      });

      const prompt = `Generate a replacement question for:
Question: "${questionText}"
Difficulty: ${difficulty}
Marks: ${marks}
Subject: ${assignment.examSubject || 'Syllabus Standard'}
Topic: ${assignment.title}

Ensure the replacement carries exactly ${marks} marks and is of ${difficulty} difficulty.
If isMcq is true, you MUST provide exactly 4 options in the options array. Otherwise, do not provide the options key.

The output must match this exact JSON schema:
{
  "text": "string (new question text, do not prepend numbers)",
  "options": ["string"] (provide exactly 4 options only if isMcq is true),
  "answer": "string (detailed solution key for examiners)"
}
Return ONLY the raw JSON object. Do not enclose in markdown block wrappers.`;

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.8 }
      });

      let cleanText = response.response.text().trim();
      if (cleanText.startsWith('```json')) cleanText = cleanText.substring(7);
      else if (cleanText.startsWith('```')) cleanText = cleanText.substring(3);
      if (cleanText.endsWith('```')) cleanText = cleanText.substring(0, cleanText.length - 3);
      
      return JSON.parse(cleanText.trim());
    } catch (err) {
      console.error('[Gemini AI] Single question regeneration failed, falling back to mock:', err);
      return {
        text: `Explain a newly refined key mechanism related to ${assignment.title} (Re-rolled standard question fallback).`,
        options: isMcq ? ['Option Alpha New', 'Option Beta New', 'Option Gamma New', 'Option Delta New'] : undefined,
        answer: 'Detailed step-by-step re-rolled answer demonstrating core syllabus mastery.'
      };
    }
  }
}
