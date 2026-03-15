import type { DrinkPreferencesData } from './types'

const STORAGE_KEY = 'drink-preferences'

export function loadDrinkPreferences(): DrinkPreferencesData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveDrinkPreferences(list: DrinkPreferencesData[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export async function submitDrinkPreferencesToNetlify(
  data: Omit<DrinkPreferencesData, 'id' | 'timestamp'>
): Promise<boolean> {
  try {
    const body = new URLSearchParams()
    body.append('form-name', 'drink-preferences')
    body.append('firstName', data.firstName)
    body.append('guestName', data.guestName)
    if (data.submissionId) body.append('submissionId', data.submissionId)
    body.append('email', data.email)
    body.append('wine', JSON.stringify(data.wine))
    body.append('beer', JSON.stringify(data.beer))
    body.append('cocktail', JSON.stringify(data.cocktail))
    body.append('favoriteCocktail', data.favoriteCocktail)
    body.append('nonAlcoholic', JSON.stringify(data.nonAlcoholic))
    body.append('comments', data.comments)

    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    return response.ok
  } catch {
    return false
  }
}

export async function sendDrinkNotificationEmail(
  data: Omit<DrinkPreferencesData, 'id' | 'timestamp'> & { locale: string }
): Promise<void> {
  try {
    const response = await fetch('/.netlify/functions/send-drink-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      console.error('Failed to send drink notification email:', await response.text())
    }
  } catch (error) {
    console.error('Error sending drink notification email:', error)
  }
}
