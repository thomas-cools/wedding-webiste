/**
 * Feature flags for the wedding website.
 * 
 * @deprecated Use useFeatureFlags() hook from contexts/FeatureFlagsContext instead.
 * These are build-time defaults. For runtime flags, set environment variables
 * in the Netlify dashboard:
 * 
 * - FEATURE_SHOW_GALLERY: "true" | "false"
 * - FEATURE_SHOW_STORY: "true" | "false"
 * - FEATURE_SHOW_TIMELINE: "true" | "false"
 * - FEATURE_SHOW_COUNTDOWN: "true" | "false"
 * - FEATURE_REQUIRE_PASSWORD: "true" | "false"
 * - FEATURE_SEND_RSVP_EMAIL: "true" | "false"
 * - FEATURE_SHOW_ACCOMMODATION: "true" | "false"
 */
export const features = {
  /** Show the photo gallery section */
  showGallery: true,

  /** Show the story section */
  showStory: true,

  /** Show the timeline/love story section */
  showTimeline: true,

  /** Show the countdown timer */
  showCountdown: true,

  /** Enable password protection for the site */
  requirePassword: true,

  /** Send confirmation emails to users after RSVP */
  sendRsvpConfirmationEmail: true,

  /** Show the accommodation section */
  showAccommodation: true,
}

/**
 * Wedding details configuration.
 * Central place to update names, dates, and venue info.
 */
export const weddingConfig = {
  couple: {
    person1: 'Carolina',
    person2: 'Thomas',
    initials: 'C & T',
  },
  date: {
    full: new Date('2026-08-26T16:00:00'),
    display: 'August 26, 2026',
  },
  venue: {
    name: 'Vallesvilles',
    location: 'Haute-Garonne, France',
    address: 'Vallesvilles, France',
    website: 'https://maps.google.com/?q=Vallesvilles,+France',
    googleMapsUrl: 'https://maps.google.com/?q=Vallesvilles,+France',
  },
  rsvpDeadline: 'February 1, 2026',
  /** Contact email for wedding inquiries (also used in confirmation emails) */
  contactEmail: 'carolinaandthomaswedding@gmail.com',
}
