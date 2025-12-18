/**
 * Feature flags for the wedding website.
 * Toggle sections on/off before they're ready for visitors.
 */
export const features = {
  /** Show the photo gallery section */
  showGallery: false,
  
  /** Show the timeline/love story section */
  showTimeline: false,
  
  /** Show the countdown timer */
  showCountdown: false,
  
  /** Enable password protection for the site */
  requirePassword: false,
}

/**
 * Wedding details configuration.
 * Central place to update names, dates, and venue info.
 */
export const weddingConfig = {
  couple: {
    person1: 'Sofia',
    person2: 'Lucas',
    initials: 'S & L',
  },
  date: {
    full: new Date('2026-10-18T16:00:00'),
    display: 'October 18, 2026',
  },
  venue: {
    name: 'Château de Varennes',
    location: 'Burgundy, France',
    address: '21320 Pouilly-en-Auxois, Burgundy, France',
  },
  rsvpDeadline: 'August 1, 2026',
}
