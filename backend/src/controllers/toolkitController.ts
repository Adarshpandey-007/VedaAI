import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DBStore } from '../services/dbStore';

export class ToolkitController {
  public static async generateResource(req: Request, res: Response) {
    try {
      const { type, topic, grade, instructions } = req.body;
      
      if (!type || !topic || !grade) {
        return res.status(400).json({ error: 'Type, topic, and grade are required.' });
      }

      console.log(`[Toolkit API] Generating ${type} for topic: "${topic}" (Grade: ${grade})`);

      // Retrieve Gemini API Key (check custom override header first, then fallback to env variable)
      const apiKey = (req.headers['x-gemini-key'] as string) || process.env.GEMINI_API_KEY;

      if (!apiKey) {
        // Fall back to Mock Generation if no API key is loaded
        const mockResult = ToolkitController.generateMockResource(type, topic, grade, instructions);
        return res.status(200).json({ content: mockResult });
      }

      const modelsToTry = [
        'gemini-3.5-flash',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-pro',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro'
      ];

      let lastError: any = null;
      let finalContent = '';

      // Create unified system instructions
      const getSystemInstruction = (toolType: string) => {
        if (toolType === 'lesson') {
          return 'You are an expert NCERT/CBSE school curriculum advisor. Create a highly detailed, professional Lesson Plan in clean markdown. Structure it with clear headers: Objectives, Duration, warm-up Activity, Core Explanation, Hands-on classroom Activities, Assessment Questions, and Homework Assignment.';
        } else if (toolType === 'rubric') {
          return 'You are an expert academic examiner. Create a comprehensive grading rubric matrix in beautiful, structured markdown. Map out grading criteria (e.g. Content Mastery, Presentation, Analytical Reasoning) against Mastery Levels (Excellent, Good, Needs Improvement) in a clean, legible table format.';
        } else {
          return 'You are an engaging experiential learning coordinator. Create a fun, hands-on, syllabus-aligned Classroom Activity in clean markdown. Detail the materials required, step-by-step experiment instructions, safety guidelines, and discussion prompt questions.';
        }
      };

      for (const modelName of modelsToTry) {
        try {
          console.log(`[Toolkit API] Attempting LLM execution using: ${modelName}`);
          const genAI = new GoogleGenerativeAI(apiKey);
          const isLegacy = modelName === 'gemini-pro';

          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: isLegacy ? undefined : getSystemInstruction(type)
          });

          // Build prompt
          let prompt = `Generate a comprehensive ${type === 'lesson' ? 'Lesson Plan' : type === 'rubric' ? 'Grading Rubric Matrix Table' : 'Hands-on Classroom Activity'} for the following parameters:
- Topic / Focus: "${topic}"
- Target Grade: "${grade}"
`;

          if (instructions) {
            prompt += `- Additional Teacher Instructions: "${instructions}"\n`;
          }

          if (isLegacy) {
            prompt = `SYSTEM INSTRUCTION:\n${getSystemInstruction(type)}\n\nUSER PROMPT:\n${prompt}`;
          }

          const response = await model.generateContent(prompt);
          const text = response.response.text();
          
          if (text && text.trim().length > 0) {
            finalContent = text.trim();
            break; // Successfully got response
          }
        } catch (err: any) {
          console.warn(`[Toolkit API] Model ${modelName} failed:`, err.message || err);
          lastError = err;
        }
      }

      if (!finalContent) {
        throw lastError || new Error('All model attempts failed to return content.');
      }

      // Persist the generated toolkit asset to the database
      const savedItem = await DBStore.saveToolkitItem({
        type,
        title: type === 'lesson' ? 'Lesson Plan' : type === 'rubric' ? 'Rubric Matrix' : 'Classroom Activity',
        topic,
        grade,
        instructions,
        content: finalContent
      });

      return res.status(200).json({ content: finalContent, item: savedItem });

    } catch (err: any) {
      console.error('[Toolkit API] Critical generation error:', err);
      return res.status(500).json({ error: err.message || 'Failed to generate AI resource.' });
    }
  }

  // Fallback high-fidelity mock generators to guarantee zero-dependency out-of-the-box operation
  private static generateMockResource(type: string, topic: string, grade: string, instructions?: string): string {
    const timeText = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    if (type === 'lesson') {
      return `# NCERT Curriculum Lesson Plan: ${topic}
**Grade Level**: ${grade} | **Subject Focus**: General Syllabus | **Drafted**: ${timeText}

---

## 🎯 1. Educational Objectives
By the end of this lesson, students will be able to:
- Define the foundational principles of **${topic}** with precise academic terminology.
- Identify the key constituents and structural mechanics involved in typical workflows.
- Apply theoretical parameters to solve real-world problems and practical scenarios.

## ⏱️ 2. Proposed Timeline & Duration
*Total Duration: 45 Minutes*
- **00:00 - 00:05 (5 mins)**: Warm-up discussion & review of prior academic knowledge.
- **00:05 - 00:20 (15 mins)**: Core theoretical instructions, teacher explanation, and diagrams.
- **00:20 - 00:35 (15 mins)**: Active student group investigations & cooperative worksheets.
- **00:35 - 00:45 (10 mins)**: Recap summary, pop quiz check, and assignment distribution.

## 🏫 3. Interactive warm-up Activity
*Concept Activation*: Introduce a simple, relatable classroom hook. Ask students to brainstorm how **${topic}** manifests in their daily home life or natural environment. Record student inputs on the board.

## 📝 4. Detailed Classroom Explanation
- **Theoretical Foundations**: Provide students with notes covering structural components and scientific properties.
- **Key Equation/Concept**: Highlight standard definitions: *"The interaction coefficient is directly proportional to structural density."*
${instructions ? `\n## 💡 Custom Instructor Guidelines\n- Incorporate the following focus area: *"${instructions}"*\n` : ''}
## 🧪 5. Hands-on Cooperative Exercise
Divide students into pairs. Provide each pair with a structured worksheet containing 3 case studies relating to **${topic}**. Students must collaborate to solve the questions, detailing their logical steps.

## ❓ 6. Formative Assessment Questions
1. *Concept Identification*: What is the primary operational definition of ${topic}?
2. *Analysis Question*: How does changing the initial variables affect the net outcome?
3. *Critical Thinking*: Predict the environmental impact if these parameters are left unchecked.

## 🏠 7. Homework Assignment
- Complete CBSE Exercise questions 1 through 5 on Page 42 of the Textbook.
- **Project Task**: Write a 150-word summary detailing one real-world application of ${topic} in modern industries.
`;
    } else if (type === 'rubric') {
      return `# Standardized Assessment Rubric: ${topic}
**Class Level**: ${grade} | **Grading Framework**: CBSE/NCERT Standards | **Compiled**: ${timeText}

| Assessment Criteria | 🏆 Excellent (4 Marks) | 🥈 Good (3 Marks) | 🥉 Needs Improvement (1-2 Marks) |
| :--- | :--- | :--- | :--- |
| **Content Mastery & Accuracy** | Demonstrates complete understanding of **${topic}**. Explains all scientific principles with absolute precision and no factual errors. | Demonstrates general understanding of **${topic}**. Most principles are explained accurately, with 1-2 minor factual discrepancies. | Shows limited knowledge. Core concepts are misunderstood or explained inaccurately. |
| **Logical Analysis & Methodology** | Detailed logical progression. Clearly outlines all steps, math formulas, or logical deductions without any gaps. | Outlines logical steps cleanly, with minor calculation errors or subtle narrative gaps. | Calculations or explanations lack logical structure and coherent methodology. |
| **Presentation & Structure** | Outstanding formatting. Text or drawings are highly organized, using appropriate headers and clean formatting. | Organized and legible, with minor layout inconsistencies. | Lacks readable structure; layout is disorganized, confusing, and messy. |
${instructions ? `\n> **Teacher Note on Rubric Focus**: ${instructions}\n` : ''}
`;
    } else {
      return `# Experiential Classroom Activity Plan: Exploring ${topic}
**Target Group**: ${grade} | **Category**: Hands-on Activity / Laboratory Experiment | **Drafted**: ${timeText}

---

## 🛠️ 1. Materials & Apparatus Required
For a class of 30 students (organized in 6 groups of 5):
- 6 x Demonstration templates or worksheets.
- 6 x Stopwatches or measurement timers.
- 6 x Reference metric guides.
- Standard classroom chart paper, markers, and drafting utensils.

## 🧪 2. Step-by-Step Activity Instructions
1. **Setup (5 minutes)**: Organize student desks into collaboration clusters. Distribute materials to each group's leader.
2. **Investigation (15 minutes)**: Students perform the physical test cycles, recording variance metrics at 3-minute intervals.
3. **Data Analysis (10 minutes)**: Instruct students to plot their recorded numbers on standard chart papers, highlighting the highest and lowest variance values.
4. **Presentation (10 minutes)**: Each group sends one representative to present their chart to the class in a 90-second pitch.

## ⚠️ 3. Classroom Safety & Operational Guidelines
- Ensure students maintain respectful workspace boundaries and share equipment equitably.
- Monitor timer triggers to prevent excessive classroom noise.
- Clean up all workspaces and return equipment to the teacher's desk before dismissal.

## 💬 4. Dynamic Discussion Prompts
- *Question 1*: What surprised you most about the metric trends you recorded for **${topic}**?
- *Question 2*: If you had access to more advanced equipment, how would you refine your data accuracy?
- *Question 3*: How does this hands-on test validate the scientific laws we read in our textbook?
`;
    }
  }

  // GET /api/toolkit - List all generated toolkit items
  public static async listResources(req: Request, res: Response) {
    try {
      const items = await DBStore.getToolkitItems();
      return res.status(200).json(items);
    } catch (error: any) {
      console.error('[Toolkit API] Error listing toolkit items:', error);
      return res.status(500).json({ error: 'Failed to retrieve toolkit items.' });
    }
  }

  // PUT /api/toolkit/:id - Update toolkit item content
  public static async updateResource(req: Request, res: Response) {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Missing required parameter: content' });
    }

    try {
      const updatedItem = await DBStore.updateToolkitItem(id, { content });
      if (!updatedItem) {
        return res.status(404).json({ error: 'Toolkit item not found.' });
      }
      return res.status(200).json(updatedItem);
    } catch (error: any) {
      console.error('[Toolkit API] Error updating toolkit item:', error);
      return res.status(500).json({ error: 'Failed to update toolkit item.' });
    }
  }
}
