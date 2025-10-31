// 'use server';

/**
 * @fileOverview Implements the Smart Theft Alerts feature, which uses AI object tracking to notify users if a vehicle is moved during a specified period.
 *
 * - smartTheftAlert - A function that handles the smart theft alert process.
 * - SmartTheftAlertInput - The input type for the smartTheftAlert function.
 * - SmartTheftAlertOutput - The return type for the smartTheftAlert function.
 */

'use server';
import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartTheftAlertInputSchema = z.object({
  cameraFeedDataUri: z
    .string()
    .describe(
      "A camera feed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  zoneCoordinates: z
    .string()
    .describe(
      'The coordinates of the zone to monitor, represented as a JSON string.'
    ),
  timePeriodStart: z
    .string()
    .describe('The start time of the monitoring period, in ISO format.'),
  timePeriodEnd: z
    .string()
    .describe('The end time of the monitoring period, in ISO format.'),
  objectDescription: z.string().describe('The description of the object.'),
});
export type SmartTheftAlertInput = z.infer<typeof SmartTheftAlertInputSchema>;

const SmartTheftAlertOutputSchema = z.object({
  alert: z.boolean().describe('Whether or not a theft is detected.'),
  description: z.string().describe('Description of the event, if any.'),
});
export type SmartTheftAlertOutput = z.infer<typeof SmartTheftAlertOutputSchema>;

export async function smartTheftAlert(input: SmartTheftAlertInput): Promise<SmartTheftAlertOutput> {
  return smartTheftAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartTheftAlertPrompt',
  input: {schema: SmartTheftAlertInputSchema},
  output: {schema: SmartTheftAlertOutputSchema},
  prompt: `You are an AI security expert. Analyze the provided camera feed within the specified zone and time period to detect potential theft of the described object.

  Zone Coordinates: {{{zoneCoordinates}}}
  Time Period Start: {{{timePeriodStart}}}
  Time Period End: {{{timePeriodEnd}}}
  Object Description: {{{objectDescription}}}
  Camera Feed: {{media url=cameraFeedDataUri}}

  Determine if the object has been moved from the zone during the specified time period. If the object has been moved, set alert to true and provide a description of the event. Otherwise, set alert to false.
  `,
});

const smartTheftAlertFlow = ai.defineFlow(
  {
    name: 'smartTheftAlertFlow',
    inputSchema: SmartTheftAlertInputSchema,
    outputSchema: SmartTheftAlertOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
