/**
 * Vercel deploy hook utilities for runreachyrun.com
 *
 * To set up:
 * 1. Go to Vercel Dashboard > Project Settings > Git > Deploy Hooks
 * 2. Create a hook named "content-update"
 * 3. Add the URL to environment: VERCEL_DEPLOY_HOOK_URL
 */

const DEPLOY_HOOK_URL = process.env.VERCEL_DEPLOY_HOOK_URL;

interface DeployResult {
  success: boolean;
  message: string;
  jobId?: string;
}

/**
 * Trigger a Vercel deployment via webhook
 */
export async function triggerDeploy(): Promise<DeployResult> {
  if (!DEPLOY_HOOK_URL) {
    return {
      success: false,
      message: "VERCEL_DEPLOY_HOOK_URL not configured",
    };
  }

  try {
    const response = await fetch(DEPLOY_HOOK_URL, {
      method: "POST",
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: "Deployment triggered",
        jobId: data.job?.id,
      };
    } else {
      return {
        success: false,
        message: `Deploy hook returned ${response.status}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Failed to trigger deploy: ${error}`,
    };
  }
}

/**
 * Check if significant content was added (for skill to decide if deploy needed)
 */
export function isSignificantContent(type: string): boolean {
  // These content types warrant a deploy
  const significantTypes = ["milestone", "breakthrough", "blog", "app"];
  return significantTypes.includes(type.toLowerCase());
}
