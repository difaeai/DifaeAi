
'use server';

/**
 * @fileOverview Analyzes camera feeds in real-time to detect threats.
 *
 * - realTimeThreatDetection - Detects suspicious activities from camera feeds.
 * - RealTimeThreatDetectionInput - Input type for the function.
 * - RealTimeThreatDetectionOutput - Output type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RealTimeThreatDetectionInputSchema = z.object({
  cameraFeedDataUri: z
    .string()
    .describe(
      "A single frame from a camera feed, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
    prohibitedObjects: z.array(z.string()).optional().describe('A list of specific objects to detect as threats.'),
    customBehaviorPrompt: z.string().optional().describe('A natural language prompt describing specific behaviors or objects to detect. This can be a list of behaviors.'),
});
export type RealTimeThreatDetectionInput = z.infer<typeof RealTimeThreatDetectionInputSchema>;

const RealTimeThreatDetectionOutputSchema = z.object({
  threatDetected: z.boolean().describe('Whether a threat has been detected in the frame.'),
  isPersonDetected: z.boolean().describe('Whether a person has been detected in the frame, regardless of threat level.'),
  threatType: z.string().describe('The type of threat detected (e.g., "Suspicious Movement", "Fire Hazard", "Weapon", "Theft", "Prohibited Object", "Person", "Custom Behavior"). If no threat, return "None".'),
  detectedObjectName: z.string().optional().describe('The specific name of the prohibited object that was detected, if any.'),
  alertMessage: z
    .string()
    .describe('A message describing the detected threat or object. If no threat, return "All clear."'),
});
export type RealTimeThreatDetectionOutput = z.infer<typeof RealTimeThreatDetectionOutputSchema>;

export async function realTimeThreatDetection(input: RealTimeThreatDetectionInput): Promise<RealTimeThreatDetectionOutput> {
  return realTimeThreatDetectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'realTimeThreatDetectionPrompt',
  input: {schema: RealTimeThreatDetectionInputSchema},
  output: {schema: RealTimeThreatDetectionOutputSchema},
  prompt: `You are an advanced AI security agent with a high-accuracy object detection model. Your primary goal is to analyze the image and report ONLY on the specific items or behaviors requested.

Analyze this image:
{{media url=cameraFeedDataUri}}

Your analysis MUST follow these steps in order:

{{#if customBehaviorPrompt}}
// A custom behavior prompt is provided. This is your ONLY objective.
// The prompt may contain a numbered list of behaviors to check.
// Ignore all other threat types.

1.  **Primary Goal: Detect Custom Behavior(s).**
    - Your only task is to determine if any of the specific scenarios are happening in the image: **"{{customBehaviorPrompt}}"**.
    - If you detect any of these exact behaviors with high confidence:
        - Set 'threatDetected' to **true**.
        - Set 'threatType' to **"Custom Behavior"**.
        - Set 'alertMessage' to a direct confirmation, like "Alert: The behavior '{{customBehaviorPrompt}}' was detected."
        - Set 'isPersonDetected' to true if a person is involved.
        - **Stop analysis and return this result immediately.**
    - If you DO NOT detect any of the specific behaviors, the analysis is over. Return the "All Clear" response.

2.  **Fallback (If Custom Behavior is NOT detected):**
    - Set 'threatDetected' to **false**.
    - Set 'isPersonDetected' to **false**.
    - Set 'threatType' to **"None"**.
    - Set 'alertMessage' to **"All clear."**.
    - Return this result.

{{else if prohibitedObjects}}
// A list of prohibited objects is provided. This is your ONLY objective.
// Ignore all other threat types like weapons, fire, etc., unless they are on the list.

1.  **Primary Goal: Detect Prohibited Objects.**
    - Carefully examine the image. Your only task is to check if any of the following objects are present: {{#each prohibitedObjects}}'{{{this}}}'{{#unless @last}}, {{/unless}}{{/each}}.
    - If you detect one of these specific objects with high confidence:
        1. Set 'threatDetected' to **true**.
        2. Set 'threatType' to **"Prohibited Object"**.
        3. Set 'detectedObjectName' to the exact name of the object found from the list.
        4. Set 'alertMessage' to "Prohibited object detected: [Object Name]."
        5. Set 'isPersonDetected' to true if a person is in the frame with the object.
        6. **Stop and return this result immediately.**
    - If none of the objects from the list are found, the analysis is over.

2.  **Fallback (If No Prohibited Objects are Detected):**
    - Set 'threatDetected' to **false**.
    - Check if a person is present in the scene, even without a threat. If so, set 'isPersonDetected' to true, otherwise false.
    - Set 'threatType' to **"None"**.
    - Set 'alertMessage' to **"All clear."**.
    - Return this result.

{{else}}
// No custom behavior or prohibited objects were given. Perform standard threat analysis.

1.  **Check for Inherent Threats:**
    - Analyze the image for general, high-risk threats: a fire/smoke hazard, a visible weapon (gun/knife), or a clear act of theft (breaking a lock/window).
    - If one is found with high confidence:
      1. Set 'threatDetected' to **true**.
      2. Set 'threatType' to "Fire Hazard", "Weapon", or "Theft".
      3. Set 'alertMessage' to a concise description of the threat.
      4. Set 'isPersonDetected' if a person is in the frame.
      5. **Stop and return this result immediately.**

2.  **Check for any Person:**
    - If no threats are found, check if a person is visible.
    - If a person is present with high confidence:
      1. Set 'isPersonDetected' to **true**.
      2. Set 'threatDetected' to **false**.
      3. Set 'threatType' to **"Person"**.
      4. Set 'alertMessage' to **"Person identified in the scene."**.
      5. Return this result.

3.  **Final Fallback (All Clear):**
    - If none of the above conditions are met:
        - Set 'threatDetected' to **false**.
        - Set 'isPersonDetected' to **false**.
        - Set 'threatType' to **"None"**.
        - Set 'alertMessage' to **"All clear."**.
{{/if}}
`,
});

const realTimeThreatDetectionFlow = ai.defineFlow(
  {
    name: 'realTimeThreatDetectionFlow',
    inputSchema: RealTimeThreatDetectionInputSchema,
    outputSchema: RealTimeThreatDetectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    