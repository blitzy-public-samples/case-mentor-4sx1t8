/**
 * AI Prompt Templates Module
 * 
 * Human Tasks Required:
 * 1. Review and validate evaluation criteria weights in prompt templates
 * 2. Verify prompt examples match current best practices
 * 3. Update system prompts if AI model capabilities change
 */

import { DrillType, DrillTemplate } from '../../types/drills';
import { ModelConfig } from '../../config/ai';

/**
 * Requirement: AI evaluation - Structured prompt template interface
 * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
 */
export interface PromptTemplate {
  systemPrompt: string;
  userPromptTemplate: string;
  requiredVariables: string[];
  examples: Record<string, string>;
}

/**
 * Requirement: Practice Drills - Drill-specific prompt configuration
 * Location: 3. SCOPE/Core Features/Practice Drills
 */
interface DrillPromptConfig {
  drillType: DrillType;
  evaluationTemplate: PromptTemplate;
  feedbackTemplate: PromptTemplate;
  modelConfig: ModelConfig;
}

/**
 * Requirement: AI evaluation - Case prompt evaluation template
 * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
 */
const CASE_PROMPT_TEMPLATE: PromptTemplate = {
  systemPrompt: `You are an expert case interview evaluator assessing candidate responses to case prompts. 
Evaluate responses based on: 
- Problem structuring and framework development
- Key insights and analysis
- Communication clarity and professionalism
- Recommendations and next steps`,
  userPromptTemplate: `Case Prompt: {{caseSituation}}

Candidate Response: {{candidateResponse}}

Evaluation Criteria:
{{evaluationCriteria}}

Provide a detailed evaluation of the candidate's response following the given criteria.`,
  requiredVariables: ['caseSituation', 'candidateResponse', 'evaluationCriteria'],
  examples: {
    caseSituation: 'Your client is a luxury car manufacturer considering entering the electric vehicle market...',
    candidateResponse: 'I would structure this problem by examining three key areas: market opportunity, competitive landscape, and internal capabilities...',
    evaluationCriteria: '1. Problem Structuring (30%)\n2. Analysis Quality (30%)\n3. Communication (20%)\n4. Recommendations (20%)'
  }
};

/**
 * Requirement: Practice Drills - Market sizing evaluation
 * Location: 3. SCOPE/Core Features/Practice Drills
 */
const MARKET_SIZING_TEMPLATE: PromptTemplate = {
  systemPrompt: `You are an expert evaluator assessing market sizing responses in case interviews.
Focus on:
- Methodology and approach
- Key assumptions and calculations
- Logic and reasoning
- Final estimate accuracy`,
  userPromptTemplate: `Market Sizing Question: {{marketQuestion}}

Candidate's Approach: {{candidateApproach}}

Calculations: {{calculations}}

Evaluate the candidate's market sizing methodology and result.`,
  requiredVariables: ['marketQuestion', 'candidateApproach', 'calculations'],
  examples: {
    marketQuestion: 'What is the annual market size for coffee cups in New York City?',
    candidateApproach: 'I'll start by estimating NYC's population and then break down coffee consumption patterns...',
    calculations: 'Population: 8M * 60% coffee drinkers * 2 cups/day * 365 days * $0.25/cup = $876M'
  }
};

/**
 * Requirement: Practice Drills - Calculation drill evaluation
 * Location: 3. SCOPE/Core Features/Practice Drills
 */
const CALCULATION_TEMPLATE: PromptTemplate = {
  systemPrompt: `You are an expert evaluator assessing calculation accuracy and methodology in case interviews.
Evaluate:
- Mathematical accuracy
- Problem-solving approach
- Calculation efficiency
- Result interpretation`,
  userPromptTemplate: `Calculation Problem: {{problem}}

Candidate's Solution:
Steps: {{solutionSteps}}
Final Answer: {{finalAnswer}}

Evaluate the calculation approach and accuracy.`,
  requiredVariables: ['problem', 'solutionSteps', 'finalAnswer'],
  examples: {
    problem: 'Calculate the break-even point for a new product line with fixed costs of $100,000...',
    solutionSteps: '1. Identified unit price ($50) and variable cost ($30)\n2. Calculated contribution margin...',
    finalAnswer: 'Break-even point = 5,000 units'
  }
};

/**
 * Requirement: Practice Drills - Brainstorming evaluation
 * Location: 3. SCOPE/Core Features/Practice Drills
 */
const BRAINSTORMING_TEMPLATE: PromptTemplate = {
  systemPrompt: `You are an expert evaluator assessing brainstorming exercises in case interviews.
Focus on:
- Creativity and innovation
- Structured thinking
- Comprehensiveness
- Practicality of ideas`,
  userPromptTemplate: `Brainstorming Topic: {{topic}}

Context: {{context}}

Candidate's Ideas: {{ideas}}

Evaluate the brainstorming approach and quality of ideas.`,
  requiredVariables: ['topic', 'context', 'ideas'],
  examples: {
    topic: 'How can a traditional bookstore compete with online retailers?',
    context: 'Local bookstore with 20-year history in a college town...',
    ideas: '1. Create a unique in-store experience\n2. Develop a loyalty program...'
  }
};

/**
 * Requirement: Practice Drills - Synthesis evaluation
 * Location: 3. SCOPE/Core Features/Practice Drills
 */
const SYNTHESIZING_TEMPLATE: PromptTemplate = {
  systemPrompt: `You are an expert evaluator assessing candidates' ability to synthesize information in case interviews.
Evaluate:
- Key insight identification
- Information prioritization
- Clarity of communication
- Strategic thinking`,
  userPromptTemplate: `Case Information: {{caseData}}

Candidate's Synthesis: {{synthesis}}

Evaluate the effectiveness of the synthesis and communication.`,
  requiredVariables: ['caseData', 'synthesis'],
  examples: {
    caseData: 'Market research shows declining customer satisfaction...',
    synthesis: 'Based on the data, there are three key insights we should focus on...'
  }
};

/**
 * Requirement: AI evaluation - Template retrieval
 * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
 */
export function getPromptTemplate(drillType: DrillType): PromptTemplate {
  switch (drillType) {
    case 'CASE_PROMPT':
      return CASE_PROMPT_TEMPLATE;
    case 'MARKET_SIZING':
      return MARKET_SIZING_TEMPLATE;
    case 'CALCULATIONS':
    case 'CASE_MATH':
      return CALCULATION_TEMPLATE;
    case 'BRAINSTORMING':
      return BRAINSTORMING_TEMPLATE;
    case 'SYNTHESIZING':
      return SYNTHESIZING_TEMPLATE;
    default:
      throw new Error(`Unsupported drill type: ${drillType}`);
  }
}

/**
 * Requirement: AI evaluation - Dynamic prompt generation
 * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
 */
export function generatePrompt(template: PromptTemplate, variables: Record<string, string>): string {
  // Validate all required variables are provided
  const missingVariables = template.requiredVariables.filter(v => !(v in variables));
  if (missingVariables.length > 0) {
    throw new Error(`Missing required variables: ${missingVariables.join(', ')}`);
  }

  // Generate the complete prompt by replacing variables
  let prompt = template.systemPrompt + '\n\n' + template.userPromptTemplate;
  
  // Replace all variables using type-safe substitution
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    prompt = prompt.replace(regex, value);
  });

  return prompt;
}

/**
 * Requirement: AI evaluation - Template validation
 * Location: 5. SYSTEM ARCHITECTURE/5.1 High-Level Architecture
 */
export function validateTemplate(template: PromptTemplate): boolean {
  // Check required fields exist
  if (!template.systemPrompt || !template.userPromptTemplate || 
      !template.requiredVariables || !template.examples) {
    return false;
  }

  // Validate system prompt
  if (typeof template.systemPrompt !== 'string' || template.systemPrompt.length < 10) {
    return false;
  }

  // Validate user prompt template
  if (typeof template.userPromptTemplate !== 'string' || template.userPromptTemplate.length < 10) {
    return false;
  }

  // Validate required variables
  if (!Array.isArray(template.requiredVariables) || template.requiredVariables.length === 0) {
    return false;
  }

  // Check all required variables are used in template
  const templateText = template.userPromptTemplate;
  const missingVariables = template.requiredVariables.filter(v => 
    !templateText.includes(`{{${v}}}`));
  
  if (missingVariables.length > 0) {
    return false;
  }

  // Validate examples
  if (typeof template.examples !== 'object' || Object.keys(template.examples).length === 0) {
    return false;
  }

  return true;
}