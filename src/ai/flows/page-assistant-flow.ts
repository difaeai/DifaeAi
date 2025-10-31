'use server';
/**
 * @fileOverview A helpful AI assistant for the BERRETO website.
 *
 * - pageAssistant - A function that provides helpful information about the current page.
 * - PageAssistantInput - The input type for the pageAssistant function.
 * - PageAssistantOutput - The return type for the pageAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PageAssistantInputSchema = z.object({
  pageContext: z.string().describe('A summary of the content and purpose of the current webpage.'),
  userQuery: z.string().optional().describe('A specific question from the user.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe('The conversation history.'),
});
export type PageAssistantInput = z.infer<typeof PageAssistantInputSchema>;

const PageAssistantOutputSchema = z.object({
  response: z.string().describe('The AI-generated helpful response.'),
});
export type PageAssistantOutput = z.infer<typeof PageAssistantOutputSchema>;

export async function pageAssistant(input: PageAssistantInput): Promise<PageAssistantOutput> {
  return pageAssistantFlow(input);
}

// This schema is for internal use by the prompt to support Handlebars logic.
const PromptInternalInputSchema = z.object({
    pageContext: z.string(),
    userQuery: z.string().optional(),
    history: z.array(z.object({
        role: z.enum(['user', 'model']),
        content: z.string(),
        // Add boolean flag for easy checking in Handlebars
        isUser: z.boolean(),
    })).optional(),
});


const prompt = ai.definePrompt({
  name: 'pageAssistantPrompt',
  input: {schema: PromptInternalInputSchema},
  output: {schema: PageAssistantOutputSchema},
  prompt: `You are a friendly and professional website assistant for BERRETO, an advanced AI security company. Your name is Difa.
Your goal is to help users understand the current page and answer their questions.

The user is on a page with the following context:
"{{{pageContext}}}"

{{#if history}}
Conversation History:
{{#each history}}
  {{#if isUser}}User: {{content}}{{else}}Difa: {{content}}{{/if}}
{{/each}}
{{/if}}

{{#if userQuery}}
The user has asked: "{{userQuery}}"
Answer the user's question based on the page context and conversation history. Be concise and helpful.
{{else}}
Provide a short, welcoming message (1-2 sentences) to the user. Briefly introduce the page's purpose based on the context and offer to answer any questions they might have. For example: "Welcome to our Products page! Here you can explore our AI-powered security solutions. Let me know if you'd like help choosing the right one for you."
{{/if}}

Keep your responses friendly, professional, and focused on helping the user.
`,
});

const pageAssistantFlow = ai.defineFlow(
  {
    name: 'pageAssistantFlow',
    inputSchema: PageAssistantInputSchema,
    outputSchema: PageAssistantOutputSchema,
  },
  async (input) => {
    // Transform history for the prompt to add a boolean flag for Handlebars.
    const transformedHistory = input.history?.map(message => ({
        ...message,
        isUser: message.role === 'user',
    }));

    const promptInput = {
        ...input,
        history: transformedHistory,
    };
      
    const {output} = await prompt(promptInput);
    return output!;
  }
);
