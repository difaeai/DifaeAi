'use server';
/**
 * @fileOverview An AI flow for recognizing faces and finding social media profiles.
 *
 * - facialRecognition - A function that performs facial recognition.
 * - FacialRecognitionInput - The input type for the facialRecognition function.
 * - FacialRecognitionOutput - The return type for the facialRecognition function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const FacialRecognitionInputSchema = z.object({
  faceImageDataUri: z
    .string()
    .describe(
      "A clear photo of a person's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type FacialRecognitionInput = z.infer<typeof FacialRecognitionInputSchema>;

export const FacialRecognitionOutputSchema = z.object({
  name: z.string().describe("The full name of the identified person. If the person cannot be identified, return 'Unknown'."),
  socials: z.object({
    facebook: z.string().optional().describe("A URL to the person's Facebook profile, if found."),
    linkedin: z.string().optional().describe("A URL to the person's LinkedIn profile, if found."),
    twitter: z.string().optional().describe("A URL to the person's Twitter (X) profile, if found."),
    instagram: z.string().optional().describe("A URL to the person's Instagram profile, if found."),
    reddit: z.string().optional().describe("A URL to the person's Reddit profile, if found."),
    pinterest: z.string().optional().describe("A URL to the person's Pinterest profile, if found."),
  }).describe("A list of public social media profiles found for the person."),
});
export type FacialRecognitionOutput = z.infer<typeof FacialRecognitionOutputSchema>;

export async function facialRecognition(input: FacialRecognitionInput): Promise<FacialRecognitionOutput> {
  return facialRecognitionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'facialRecognitionPrompt',
  input: {schema: FacialRecognitionInputSchema},
  output: {schema: FacialRecognitionOutputSchema},
  prompt: `You are an AI agent specializing in facial recognition and open-source intelligence.
  Your task is to analyze the provided image of a person's face.
  Based on the image, identify the person. Then, search for them across the web to find links to their public social media profiles.

  Focus your search on the following websites:
  - Facebook
  - Instagram
  - Google Images
  - Google
  - X (formerly Twitter)
  - Reddit
  - Pinterest
  - LinkedIn

  If you can identify the person, return their full name and any social media URLs you find for the specified platforms.
  If the person is unidentifiable or no public profiles are found, return the name as "Unknown" and leave the social media fields empty.

  Analyze this image: {{media url=faceImageDataUri}}`,
});

const facialRecognitionFlow = ai.defineFlow(
  {
    name: 'facialRecognitionFlow',
    inputSchema: FacialRecognitionInputSchema,
    outputSchema: FacialRecognitionOutputSchema,
  },
  async (input: FacialRecognitionInput) => {
    const {output} = await prompt(input);
    return output!;
  }
);
