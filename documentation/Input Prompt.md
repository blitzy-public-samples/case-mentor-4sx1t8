## Platform Purpose

A consumer platform enabling aspiring consultants to practice for case interviews for top consulting firms (McKinsey, Bain, BCG, etc.). Designed as "LeetCode for consultants," the platform gamifies case interview preparation and provides AI-powered feedback. Primary users are motivated college students and MBA candidates.

The platform will largely be dependent on 

# Platform Architecture

## Core Workflows

### User Journey

1. **Landing & Sign Up**
    - Quick-access links to case drills
    - Required signup before drill completion
    - School logos display for where our users are (MIT, Wharton, Princeton, Harvard, Columbia…)
    - Links to free practice starter drills
2. **User Onboarding**
    - Target employer selection (Bain, McKinsey, BCG, Deloitte, PwC, Oliver Wyman, Accenture, KPMG, EY, Other)
    - Set interview date
    - Background context collection (useful for personalized AI feedback)
        - High level academic and work experience
        - Prep experience for case interviews
3. **Subscription Management**
    - Free tier: 2 drill set per type. After that, users must pay to use drills
    - Paid tiers:
        - Monthly: $9.99
        - Annual: $49.99
    - Stripe integration for payments
    - Upgrade prompt after free drill completion
4. **Progress Tracking**
    - Interview countdown
    - Drill completion metrics:
        - Total completed
        - Performance by type
        - Correct/incorrect ratio
        - Strengths/weaknesses analysis

## Technical Stack

### Core Technologies

- Language: TypeScript (.ts/.tsx)
- Framework: NextJS + React (app router)
- Backend: Serverless & edge functions through NextJS
- Styling: TailwindCSS
- UI Components & theming: Shadcn (buttons, sidebar, inputs, modals, dialogs, etc.)
- Iconography: lucide-react
- Form management: react-hook-form with yup for validation

### Backend Services

- Hosting: Vercel
- Database: Supabase (Postgres SQL)
- ORM: PrismaDB
- Authentication: Supabase
- File Storage: Supabase
- Payments: Stripe
- Email: Resend
- AI: OpenAI GPT-4o mini API, OpenAI Whisper, OpenAI vision

### Architecture Notes

- Single NextJS application
- NextJS routes for all API endpoints
- No external cloud services (AWS/GCP)
- Web platform only

## User Interface

### Required Pages

1. **Landing Page**
    - Drill type explanations
    - School logos
    - Free practice links
2. **Pricing Page**
    - Tier comparison
    - Free: Limited access
    - Paid: Unlimited access + AI feedback
    - Annual: discount
    - First access to future drills at this price
3. **Dashboard**
    - Progress overview
    - Interview countdown
    - Drill type navigation
    - Performance metrics
4. **Drill Pages**
    - Practice interface
    - Real-time feedback
    - Session summaries
5. **Profile Management**
    - Personal info
    - Profile picture
    - Target companies
    - Interview scheduling
    - Background context
6. **Billing**
    - Subscription management
    - Payment history
    - Plan details

## Business Rules

### Access Control

- Email signup required for drill access
- Free tier limits:
    - 2 drills per type
    - McKinsey simulation: demo version only
- Paid features:
    - Unlimited drills
    - Custom AI feedback
    - Full simulation access

## Implementation Priority

1. Core drill functionality
2. User authentication
3. Payment integration
4. Progress tracking
5. AI feedback system

## Drill Structure

### Core Case Interview Drill Types

Six fundamental drill types targeting essential case interview skills:

1. Case Prompt Drills - Structured problem-solving through business scenarios
2. Calculations Drills - Speed and accuracy in mathematical operations
3. Case Math Drills - Business-specific quantitative analysis
4. Brainstorming Drills - Creative idea generation for strategic solutions
5. Market Sizing Drills - Market estimation and segmentation
6. Synthesizing Drills - Summarizing insights and writing key points

All drill responses flow through our AI evaluation pipeline: 

1. User inputs their answer via the UI  
2. Backend routes response to AI model 
3. Model evaluates according to drill-specific scoring criteria 
4. System returns feedback. The AI model specified in 'Backend Services' handles all scoring and feedback generation, ensuring consistent evaluation across all drill types.

### Specialized Simulation Module

McKinsey Eco-System Game Simulator - A separate, specialized module replicating McKinsey's digital assessment:

- Distinct from core drills in structure and complexity
- Focuses on time management, data analysis, and strategic decision-making
- Features unique gameplay mechanics and scoring system

## Implementation Details for Each Drill Type

### Case Prompt Drills

**Overview**

Interactive business scenario exercises simulating consulting interviews. Users analyze problems spanning market entry, profitability, strategy, operations etc., provide clarifying questions, and develop structured solutions.

**Configuration**

- Difficulty: Beginner/Intermediate/Advanced/All (Default: Beginner)
- Number of consecutive drills: 1-10 (Default: 1)
- Category: M&A, Marketing/Sales, Investment, Market Entry, Operations, Organizational Behavior, Pricing, Strategy, Revenue Growth, Product Launch, Digital Transformation, Profitability, Competitive Response, Industry Analysis, Data/Analytics, All (Default: All)
- Industry: Airline, Automotive, CPG, Energy, Entertainment/Media, Financial Services, Hospitality, Pharmaceuticals, Retail, Telecom, All
- Optional timer: 1-5 minutes

**Exercise Flow**

1. Present scenario based on selected category/industry
    - Text display
    - Audio playback option
2. Question phase
    - Optional text input for clarifying questions
    - AI provides brief responses, preserving problem-solving scope
    - Only answer relevant, well-formed questions
3. Solution phase
    - Timer starts if configured
    - Accept response via text, voice, or image upload
    - Submit button proceeds to feedback

**Scoring System (1-5 total)**

Clarifying Questions (0-1 points)

Evaluation criteria:

- Relevance to case outcome
- Specificity of inquiry
- Industry knowledge demonstration
- Logical progression
- Depth of analysis

Strong example: "Is the goal primarily revenue growth or market share in specific regions?"
Weak example: "Can you tell me more about the company?"

Key question categories:

- Business model/revenue
- Geographic scope
- Primary objectives
- Timeline constraints

**Framework (0-4 points)**

Evaluation criteria:

- MECE (Mutually Exclusive, Collectively Exhaustive) structure
- Relevance to scenario
- Customization to prompt/context
- Integration of provided information
- Unique approach per case

**Feedback Delivery**

- Two sample high-scoring solutions
- Max three clarifying questions per sample
- Framework feedback limited to five sentences
- "Continue" button for multi-drill sessions

**Example Case**

Prompt: "A US automotive firm seeks Brazil market entry strategy, acknowledging significant market differences. They need help identifying key execution areas."

Sample Framework:

1. Market Landscape
    - Customer segmentation (urban vs rural Brazil)
    - Competitor analysis
    - Growth segments
2. Regulatory Environment
    - Tariffs/taxation
    - Tech transfer policies
    - Safety standards
    - Government regulations
3. Marketing Strategy
    - Pricing approach
    - Promotion planning
    - Brand positioning
4. Distribution
    - Dealer strategy
    - After-sales support
    - Financing options
5. Operations
    - Production location
    - Supply chain
    - Labor sourcing

### Calculations Drills

**Overview**

Practice module for developing speed and accuracy in fundamental mathematical operations common in case interviews.

**Configuration**

- Question Types: Mix or selection from:
    - Big Multiplication
    - Small Multiplication
    - Small Division
    - Big Division
    - Percentages
    - Percentage × Percentage
    - Fraction Simplification
    - Addition
    - Subtraction
- Format: Choose either:
    - Number of drills (user specifies quantity)
    - Duration-based (1-10 minutes)
- Difficulty: Standard/Advanced

**Exercise Flow**

1. Question Display
    - Single question shown at a time
    - Number input field for answer
    - Next button (for multiple drills)
    - "Submit Final Drill" button (on last question)
2. Timer Implementation
    - Number-based: Count-up timer per question until Next/Submit
    - Duration-based: Countdown timer with pause option
    - Exit button returns to configuration

**Scoring System**

Binary evaluation: Correct/Incorrect
±5% tolerance for complex calculations

**Feedback Delivery**

- Results summary page:
    - All questions listed
    - User answers displayed
    - Time per question shown
    - Correct answers in green, incorrect in red
- Solution popup per question:
    - Two alternative solving methods
    - Emphasis on simplicity
- Performance metrics:
    - Round accuracy percentage
    - Average speed per problem type
- AI feedback
    - Summary of what went well and what you need to focus on

**Example Questions**

1. Big Multiplication: 70,000 × 30,000
2. Small Multiplication: 800 × 20
3. Big Division: 100,000,000 ÷ 20,000
4. Small Division: 150 ÷ 20
5. Percentages: 65% of 30,000
6. Percentage × Percentage: 25% of 40%
7. Fraction Simplification: 49/294 = 1/?
8. Addition: 7,650 + 4,024
9. Subtraction: 7,650 - 4,024

### Case Math Drills

**Overview**

Advanced mathematical problem-solving focused on business-specific calculations and analysis.

**Configuration**

- Question Types: Mix or selection from:
    - Market Math
    - Break Evens
    - Growth Estimations
    - Time Series Conversion
- Format: Choose either:
    - Number of drills (user specifies quantity)
    - Duration-based (1-10 minutes)
- Difficulty: Standard/Advanced

**Exercise Flow**

1. Question Display
    - Single question shown at a time
    - Text input field for answer
    - Next button (for multiple drills)
    - "Submit Final Drill" button (on last question)
2. Timer Implementation
    - Number-based: Count-up timer per question until Next/Submit
    - Duration-based: Countdown timer with pause option
    - Exit button returns to configuration

**Scoring System**

Binary evaluation: Correct/Incorrect
±5% tolerance for complex calculations

**Feedback Delivery**

- Results summary page:
    - All questions listed
    - User answers displayed
    - Time per question shown
    - Correct answers in green, incorrect in red
- Solution popup per question:
    - Two alternative solving methods
    - Emphasis on simplicity
- Performance metrics:
    - Round accuracy percentage
    - Average speed per problem type

**Example Questions**

1. Market Math: "If 200,000 is 5% of the market, how big is the total market?"
2. Break Evens: "If initial investment is $10M, revenue per unit is $500 and cost is $300, what is break even?"
3. Growth Estimations: "If current revenues are 100M and growing 15% YoY, what will revenues be in 5 years?"
4. Time Series: "If you make $5000 a day, how much do you make in a year?"

### Brainstorm Drills

**Overview**

Exercises to develop structured creative thinking and comprehensive problem analysis capabilities.

**Configuration**

- Difficulty: Beginner/Intermediate/Advanced/All (Default: Beginner)
- Number of consecutive drills: 1-10 (Default: 1)
- Category: Brainstorming, Marketing, Revenue Growth, Pros/Cons, Opportunity Identification, Strategy, Risk Identification, Use Cases, Competitive Response, Information Needs, All (Default: All)
- Industry: Airline, Automotive, CPG, Energy, Entertainment/Media, Financial Services, Hospitality, Pharmaceuticals, Retail, Telecom, All
- Optional timer: 1-10 minutes

**Exercise Flow**

1. Present prompt based on category/industry
    - Text display
    - Audio playback option
2. Response phase
    - Timer starts if configured
    - Input via text, voice, or image upload
    - Submit button proceeds to feedback

**Scoring System (1-5)**

Evaluation criteria:

- MECE structure
- Creativity
- Applicability/Relevance

**Feedback Delivery**

- Two sample high-scoring solutions
- Three-sentence maximum feedback
- "Continue" button for multi-drill sessions

**Example Prompts**

1. Brainstorming: "Generate internet-based revenue growth ideas for The North Face based on McKinsey's latest report"
2. Marketing: "Evaluate Superbowl ad opportunity for Oath (AOL/Yahoo merger)"
3. Revenue Growth: "List revenue increase opportunities for Kohler's kitchen/bath fixtures"
4. Pros/Cons: "Analyze strategy to leak pilot compensation data for European airline"
5. Opportunity ID: "Identify potential acquirers for DTC electric toothbrush subscription business"
6. Strategy: "List advertising mediums for orthopedic shoe manufacturer"
7. Risk ID: "Outline risks for genetic data marketplace platform"
8. Use Cases: "Framework for automotive manufacturer's in-car data collection"
9. Competitive Response: "Develop response to negative press on P&G price increases"
10. Information Needs: "Identify transportation considerations for Tokyo casino development"

### Market Sizing Drills

**Overview**

Quantitative exercises focusing on market analysis and structured estimation approaches.

**Configuration**

- Difficulty: Beginner/Intermediate/Advanced/All (Default: Beginner)
- Number of consecutive drills: 1-10 (Default: 1)
- Industry: Airline, Automotive, CPG, Energy, Entertainment/Media, Financial Services, Hospitality, Pharmaceuticals, Retail, Telecom, All
- Optional timer: 1-10 minutes

**Exercise Flow**

1. Present problem based on industry selection
    - Text display
    - Audio playback option
2. Response phase
    - Timer starts if configured
    - Input via text or voice
    - Submit button proceeds to feedback

**Scoring System (1-5)**

Evaluation criteria:

- Assumption quality and reasonability
- Segmentation logic
- Calculation accuracy

**Feedback Delivery**

- One or two solution approaches shown:
    - Bottom-up method (if applicable)
    - Top-down method (if applicable)
- Three-sentence maximum feedback
- "Continue" button for multi-drill sessions

**Example Problems**

1. "Calculate total annual passenger flights in Europe, considering increasing low-cost competition and regulatory changes"
2. "Estimate Chinese movie theater revenue given 40K movie screens nationwide"

Sample Solution Structure:

1. Key assumptions
2. Market segmentation
3. Stepwise calculations
4. Alternative approaches

### Synthesizing Drills

**Overview**

Exercises to enhance skills in summarizing insights, identifying key takeaways, and catching all quantitative aspects.

**Configuration**

- **Difficulty**: Beginner/Intermediate/Advanced/All (Default: Beginner)
- **Number of consecutive drills**: 1-10 (Default: 1)
- **Industry**: Airline, Automotive, CPG, Energy, Entertainment/Media, Financial Services, Hospitality, Pharmaceuticals, Retail, Telecom, All

**Exercise Flow**

1. **Present prompt** based on difficulty/industry
    - Text display
    - Audio playback option, with option to speed up playback to 1.0x, 1.25x, 1.5x, 1.75x, and 2.0x
2. **Response phase**
    - Input via text, voice
    - Submit button proceeds to feedback

**Scoring System (1-5)**

**Evaluation criteria**:

- **Conciseness**: Uses a minimal, effective number of words to convey insights without unnecessary detail.
- **Memorable Keywords**: Includes key terms or phrases that make each insight easy to recall and recognize at a glance.
- **Comprehensiveness**: Covers all essential components of the prompt, ensuring no critical insight, numbers, or building block is overlooked.

**Feedback Delivery**

- Two sample high-scoring solutions
- Three-sentence maximum feedback
- "Continue" button for multi-drill sessions

**Example Prompts**

1. **Intermediate level**: "Your client, a European discount grocery chain with 1,500 stores in Western Europe and annual revenues of €10 billion, is considering expanding into the U.S. market. They aim to enter the market with a low-price, high-volume model similar to competitors like Aldi and Lidl, but are uncertain about regional demand, regulatory differences, and potential supply chain complexities. Based on initial research, the chain sees opportunities but is unsure where to focus initial resources. How would you approach this market entry strategy, and what key factors should guide the company’s decision?"
2. **Intermediate level**:"A pharmaceutical company with annual revenue of $5 billion is seeking ways to reduce production costs for its latest diabetes drug, which has an extensive supply chain across North America and Asia. Currently, manufacturing costs are rising by 8% annually due to regulatory demands and increased raw material prices, and they’ve asked for help in identifying potential areas for cost savings without impacting product quality or timelines. How would you structure an analysis to identify key cost drivers and areas for sustainable cost reduction?”
3. **Advanced level**: "Your client, a regional retail bank with $20 billion in assets, $15 billion in deposits, and a customer base averaging 52 years old, is exploring a digital transformation to attract younger clients and improve service efficiency. Currently, only 22% of their customers use online banking, compared to the industry average of 45%, and their mobile app rating is 2.8 stars out of 5 on app stores. The bank operates 220 branches across 12 states and has annual operating expenses of $1.2 billion, with IT comprising 6% of that budget. They’re unsure how to prioritize their digital investments while maintaining their reputation for in-person service. How would you structure an approach to address the digital transformation needs, and what factors should be prioritized in designing a roadmap?”
4. **Advanced level**: "A consumer electronics company with $3 billion in annual revenue, known for its high-end audio equipment, is experiencing a 2% annual decline in growth in its primary markets. The company has 6 product lines, employs 7,500 people globally, and allocates 15% of revenue to R&D. Their flagship speakers, which represent 40% of sales, have a market share of 12%, but recent competitor products offering voice assistant integration have captured an additional 8% of market share in the past two years. They also face increased shipping costs, currently at 10% of total product costs, due to supply chain disruptions. The company seeks ways to regain growth but is uncertain where to direct R&D and marketing budgets most effectively. How would you approach identifying the best opportunities for revenue growth?”

## McKinsey Eco-System Simulation

**Overview**

Digital simulation of McKinsey's ecosystem assessment tool, testing candidates' ability to manage time pressure, analyze data sets, and demonstrate strategic decision-making.

**Core Game Rules**

- Time Limit: 35 minutes
- Species Selection: Choose 8 species (3 producers, 5 animals) from pool of 9 producers and 30 animals
- Success Criteria: All selected species must survive in chosen habitat

**Habitat Requirements**

Species survival depends on:

- Water temperature range
- Depth range
- Salt content range
- Water current range

**Food Chain Mechanics**

1. Calorie Requirements
    - Each species needs minimum calories to survive
    - Total calories from food sources must meet/exceed requirements
2. Eating Priority
    - Highest "Calories Provided" species eat first
    - Equal "Calories Provided" species eat simultaneously
    - Species move to next food source if needed
3. Food Consumption Rules
    - Highest calorie sources consumed first
    - Equal calorie sources split consumption equally
    - Calories decrease permanently after consumption
    - Species moves to new source if current depleted
4. Survival Condition
    - Must meet calorie needs
    - Must maintain >0 "Calories Provided"

### Data Structure

**Locations (Create 7)**

Generate locations with varied but viable combinations of:

- Depth: 0-150m
- Temperature: 0-30°C
- Salt Content: 30-40cm/s
- Water Current: 5-10cm/s

**Producers (Create 9)**

Generate producers with:

- Calories Needed: Always 0
- Calories Provided: Range 2000-4000
- Depth Range: Split across three zones (0-50m, 51-100m, 101-150m)
- Temperature Range: Split across three zones (0-10°C, 11-20°C, 24-30°C)
- Food Sources: Always "Sunlight"
- Salt Content Range: 33-37cm/s
- Water Current Range: 5-7cm/s
- Assign reasonable "Eaten By" relationships

**Animals (Create 30)**

Generate animals with:

- Calories Needed: Range 1000-5000
- Calories Provided: Range 1500-6000
- Depth Range: Match to producer zones
- Temperature Range: Match to producer zones
- Assign logical predator-prey relationships for "Eaten By" and "Food Sources"
- Salt Content Range: 33-37cm/s
- Water Current Range: 5-7cm/s

Ensure data creates multiple viable food chains within each temperature/depth zone.

### Implementation Versions

**Full Version (Subscribed Users)**

- Access to all 7 locations
- Full species pool (9 producers, 30 animals)
- Complete 35-minute simulation
- Comprehensive feedback

**Demo Version (Free Users)**

Restricted to:

- Single location (Location #4)
- 2 producers, 6 animals
- Select 2 producers, 3 animals
- Basic feedback

### UI Requirements (McKinsey Simulation-Specific)

- Collapsible data panels for locations and species
- Multiple panels viewable simultaneously
- Alphabetical species ordering
- Submit button + result indicator (checkmark/X)
- Return to start option

### Solution Validation

System must validate against predefined valid combinations:

- Full version: 5 valid combinations provided
- Demo version: 2 valid combinations provided
- Instant feedback on submission

Note: Full species data tables (producers and animals) should be maintained in database, referenced by ID. Above format demonstrates structure only.