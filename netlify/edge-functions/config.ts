/**
 * Edge Function: Runtime Feature Flags Configuration
 * 
 * This edge function returns feature flags from environment variables,
 * allowing configuration changes without rebuilding the application.
 * 
 * Environment Variables (set in Netlify dashboard):
 * - FEATURE_SHOW_GALLERY: "true" | "false"
 * - FEATURE_SHOW_STORY: "true" | "false"
 * - FEATURE_SHOW_TIMELINE: "true" | "false"
 * - FEATURE_SHOW_COUNTDOWN: "true" | "false"
 * - FEATURE_REQUIRE_PASSWORD: "true" | "false"
 * - FEATURE_SEND_RSVP_EMAIL: "true" | "false"
 * - FEATURE_SHOW_ACCOMMODATION: "true" | "false"
 */

import type { Context } from "@netlify/edge-functions";

export interface FeatureFlags {
  showGallery: boolean;
  showStory: boolean;
  showTimeline: boolean;
  showCountdown: boolean;
  requirePassword: boolean;
  sendRsvpConfirmationEmail: boolean;
  showAccommodation: boolean;
}

// Default values (used when env vars are not set)
const defaults: FeatureFlags = {
  showGallery: true,
  showStory: true,
  showTimeline: true,
  showCountdown: true,
  requirePassword: true,
  sendRsvpConfirmationEmail: true,
  showAccommodation: true,
};

/**
 * Parse a boolean environment variable
 */
function parseBoolEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
}

export default async function handler(
  request: Request,
  context: Context
): Promise<Response> {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Read feature flags from environment variables
  const features: FeatureFlags = {
    showGallery: parseBoolEnv(Deno.env.get('FEATURE_SHOW_GALLERY'), defaults.showGallery),
    showStory: parseBoolEnv(Deno.env.get('FEATURE_SHOW_STORY'), defaults.showStory),
    showTimeline: parseBoolEnv(Deno.env.get('FEATURE_SHOW_TIMELINE'), defaults.showTimeline),
    showCountdown: parseBoolEnv(Deno.env.get('FEATURE_SHOW_COUNTDOWN'), defaults.showCountdown),
    requirePassword: parseBoolEnv(Deno.env.get('FEATURE_REQUIRE_PASSWORD'), defaults.requirePassword),
    sendRsvpConfirmationEmail: parseBoolEnv(Deno.env.get('FEATURE_SEND_RSVP_EMAIL'), defaults.sendRsvpConfirmationEmail),
    showAccommodation: parseBoolEnv(Deno.env.get('FEATURE_SHOW_ACCOMMODATION'), defaults.showAccommodation),
  };

  // Return config with caching headers
  // Cache for 60 seconds at edge, allow stale for 5 minutes while revalidating
  return new Response(JSON.stringify({ features }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  });
}

export const config = {
  path: '/api/config',
};
