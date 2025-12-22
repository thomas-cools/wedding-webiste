/**
 * Feature flags for the wedding website.
 * Toggle sections on/off before they're ready for visitors.
 */
export const features = {
  /** Show the photo gallery section */
  showGallery: false,

  /** Show the story section */
  showStory: false,

  /** Show the timeline/love story section */
  showTimeline: false,

  /** Show the countdown timer */
  showCountdown: false,

  /** Enable password protection for the site */
  requirePassword: true,

  /** Send confirmation emails to users after RSVP */
  sendRsvpConfirmationEmail: true,

  /** Show the accommodation section */
  showAccommodation: false,
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
  rsvpDeadline: 'June 1, 2026',
  /** Contact email for wedding inquiries (also used in confirmation emails) */
  contactEmail: 'wedding@example.com',
}
