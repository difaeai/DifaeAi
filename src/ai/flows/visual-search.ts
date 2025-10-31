// VisualSearch flow implementation
'use server';

/**
 * @fileOverview Implements the visual search functionality to locate lost items using connected cameras.
 *
 * - visualSearch - A function that initiates the visual search process.
 * - VisualSearchInput - The input type for the visualSearch function.
 * - VisualSearchOutput - The return type for the visualSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VisualSearchInputSchema = z.object({
  itemPhotoDataUri: z
    .string()
    .describe(
      "A photo of the lost item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  cameraIds: z.array(z.string()).describe('An array of camera IDs to scan for the item.'),
});
export type VisualSearchInput = z.infer<typeof VisualSearchInputSchema>;

const VisualSearchOutputSchema = z.object({
  found: z.boolean().describe('Whether the item was found in any of the cameras.'),
  lastKnownLocation: z
    .string()
    .optional()
    .describe('The last known location of the item, if found.'),
  visualConfirmationDataUri: z
    .string()
    .optional()
    .describe(
      'A photo from the camera confirming the item location, as a data URI that must include a MIME type and use Base64 encoding.'
    ),
});
export type VisualSearchOutput = z.infer<typeof VisualSearchOutputSchema>;

export async function visualSearch(input: VisualSearchInput): Promise<VisualSearchOutput> {
  return visualSearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'visualSearchPrompt',
  input: {schema: VisualSearchInputSchema},
  output: {schema: VisualSearchOutputSchema},
  prompt: `You are an AI agent specializing in locating lost items using camera feeds.

You will be given a photo of the item and a list of camera IDs to scan.

For each camera, analyze the feed and determine if the item is visible.

If the item is found, provide the last known location and a visual confirmation from the camera feed.

Item Photo: {{media url=itemPhotoDataUri}}

Camera IDs: {{{cameraIds}}}
`,
});

const visualSearchFlow = ai.defineFlow(
  {
    name: 'visualSearchFlow',
    inputSchema: VisualSearchInputSchema,
    outputSchema: VisualSearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

