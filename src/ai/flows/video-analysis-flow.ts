
'use server';
/**
 * @fileOverview An AI flow for analyzing video content from a URL.
 *
 * - analyzeVideo - A function that analyzes video content.
 * - VideoAnalysisInput - The input type for the analyzeVideo function.
 * - VideoAnalysisOutput - The return type for the analyzeVideo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VideoAnalysisInputSchema = z.object({
  videoUrl: z.string().url().describe('A publicly accessible URL to a video file (e.g., from YouTube, Google Drive).'),
  prompt: z.string().describe('The user\'s prompt describing what to do with the video (e.g., summarize, learn a behavior).'),
});
export type VideoAnalysisInput = z.infer<typeof VideoAnalysisInputSchema>;

const VideoAnalysisOutputSchema = z.object({
  isLearnedBehavior: z.boolean().describe('Whether the analysis resulted in a new behavior to be learned.'),
  analysis: z.string().describe('If a behavior was learned, this is the concise prompt for it. Otherwise, it is the summary of the video.'),
});
export type VideoAnalysisOutput = z.infer<typeof VideoAnalysisOutputSchema>;


export async function analyzeVideo(input: VideoAnalysisInput): Promise<VideoAnalysisOutput> {
  return videoAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'videoAnalysisPrompt',
  input: {schema: VideoAnalysisInputSchema},
  output: {schema: VideoAnalysisOutputSchema},
  prompt: `You are an expert AI video analyst. Your task is to carefully analyze the provided video based on the user's prompt.

Video to analyze: The user has provided a video at the url {{{videoUrl}}}.
User's instruction: "{{prompt}}"

Follow these instructions precisely:
1.  **If the user asks you to learn a behavior**, your primary goal is to derive a concise, actionable prompt from the video. 
    - Set 'isLearnedBehavior' to **true**.
    - The 'analysis' field MUST be the new, learned prompt. For example, if the video shows a person climbing a fence, the analysis should be "a person climbing a fence".
2.  **If the user asks for a summary or description**, provide a detailed, step-by-step explanation of the events in the video.
    - Set 'isLearnedBehavior' to **false**.
    - The 'analysis' field will contain this detailed summary.
3.  Be thorough, precise, and clear in your response.

Generate the analysis.`,
});

const videoAnalysisFlow = ai.defineFlow(
  {
    name: 'videoAnalysisFlow',
    inputSchema: VideoAnalysisInputSchema,
    outputSchema: VideoAnalysisOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
