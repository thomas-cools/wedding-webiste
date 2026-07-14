import React from 'react'
import { render, screen, waitFor } from '../test-utils'
import userEvent from '@testing-library/user-event'
import FinalRsvpForm from '../components/FinalRsvp/FinalRsvpForm'
import * as finalRsvpApi from '../components/FinalRsvp/finalRsvpApi'

// Mock @zag-js/focus-visible to prevent TypeError in tests
jest.mock('@zag-js/focus-visible', () => ({
  trackFocusVisible: jest.fn(() => () => {}),
  setupGlobalFocusEvents: jest.fn(),
}))

// Mock toast
const mockToast = jest.fn()
jest.mock('@chakra-ui/react', () => {
  const actual = jest.requireActual('@chakra-ui/react')
  return {
    ...actual,
    useToast: () => mockToast,
  }
})

// Mock the finalRsvpApi module (network calls)
jest.mock('../components/FinalRsvp/finalRsvpApi', () => ({
  submitToNetlifyForms: jest.fn(() => Promise.resolve()),
  sendConfirmationEmail: jest.fn(() => Promise.resolve()),
  fetchAddressSuggestions: jest.fn(() => Promise.resolve({ suggestions: [], rateLimited: false })),
}))

const mockedFinalRsvpApi = finalRsvpApi as jest.Mocked<typeof finalRsvpApi>

const guestData = {
  primaryName: 'Alice',
  email: 'alice@example.com',
  partyMembers: ['Alice', 'Bob'],
}

describe('FinalRsvpForm — per-guest per-day attendance', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders one attendance card (3 day selects) per guest', () => {
    render(<FinalRsvpForm guestData={guestData} />)

    // 2 guests × 3 days (welcome/ceremony/brunch) = 6 comboboxes
    expect(screen.getAllByRole('combobox')).toHaveLength(6)
    expect(screen.getAllByText('Alice').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Bob').length).toBeGreaterThanOrEqual(1)
  })

  it('allows each guest to have a different attendance answer for the same day', async () => {
    const user = userEvent.setup()
    render(<FinalRsvpForm guestData={guestData} />)

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    // Alice's ceremony select is index 1, Bob's is index 4 (welcome, ceremony, brunch per guest)
    await user.selectOptions(selects[1]!, 'yes')
    await user.selectOptions(selects[4]!, 'no')

    expect(selects[1]!.value).toBe('yes')
    expect(selects[4]!.value).toBe('no')
  })

  it('blocks submission and shows a per-guest error when a guest has not answered every day', async () => {
    const user = userEvent.setup()
    render(<FinalRsvpForm guestData={guestData} />)

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    // Fully answer Alice (index 0-2), leave Bob (index 3-5) incomplete
    await user.selectOptions(selects[0]!, 'yes')
    await user.selectOptions(selects[1]!, 'yes')
    await user.selectOptions(selects[2]!, 'yes')

    const submitButton = screen.getByRole('button', { name: 'finalRsvp.form.submit' })
    await user.click(submitButton)

    expect(await screen.findAllByText('finalRsvp.validation.guestEventsRequired')).toHaveLength(1)
    expect(mockedFinalRsvpApi.submitToNetlifyForms).not.toHaveBeenCalled()
  })

  it('submits distinct per-guest attendance once every guest has answered every day', async () => {
    const user = userEvent.setup()
    render(<FinalRsvpForm guestData={guestData} />)

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    await user.selectOptions(selects[0]!, 'yes')
    await user.selectOptions(selects[1]!, 'yes')
    await user.selectOptions(selects[2]!, 'yes')
    await user.selectOptions(selects[3]!, 'no')
    await user.selectOptions(selects[4]!, 'no')
    await user.selectOptions(selects[5]!, 'no')

    // Accommodation: pick "chateau" so no address/hotel/transportation is required
    await user.click(screen.getByText('finalRsvp.form.accommodationChateau'))

    // Menu choices for both adult guests (one radio per guest for each option)
    for (const radio of screen.getAllByRole('radio', { name: 'finalRsvp.menu.appetizer.ceviche' })) {
      await user.click(radio)
    }
    for (const radio of screen.getAllByRole('radio', { name: 'finalRsvp.menu.main.bar' })) {
      await user.click(radio)
    }

    const submitButton = screen.getByRole('button', { name: 'finalRsvp.form.submit' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockedFinalRsvpApi.submitToNetlifyForms).toHaveBeenCalledTimes(1)
    })
    const submittedEntry = mockedFinalRsvpApi.submitToNetlifyForms.mock.calls[0]![0]
    expect(submittedEntry.guests[0]!.events).toEqual({ welcome: 'yes', ceremony: 'yes', brunch: 'yes' })
    expect(submittedEntry.guests[1]!.events).toEqual({ welcome: 'no', ceremony: 'no', brunch: 'no' })
  })

  it('does not render arrival/departure date fields', () => {
    render(<FinalRsvpForm guestData={guestData} />)

    expect(screen.queryByText('finalRsvp.form.travelTitle')).not.toBeInTheDocument()
    expect(screen.queryByText('finalRsvp.form.arrivalDate')).not.toBeInTheDocument()
    expect(screen.queryByText('finalRsvp.form.departureDate')).not.toBeInTheDocument()
  })

  it('renders a selectable vegan main course option alongside the existing choices, per guest', () => {
    render(<FinalRsvpForm guestData={guestData} />)

    // 2 adult guests × 3 main course options (bar/tournedos/vegan)
    expect(screen.getAllByRole('radio', { name: /finalRsvp\.menu\.main\.vegan/ })).toHaveLength(2)
  })

  it('allows each guest to enter independent allergy information', async () => {
    const user = userEvent.setup()
    render(<FinalRsvpForm guestData={guestData} />)

    const allergyFields = screen.getAllByPlaceholderText('finalRsvp.form.allergiesPlaceholder') as HTMLTextAreaElement[]
    expect(allergyFields).toHaveLength(2)

    await user.type(allergyFields[0]!, 'Peanut allergy')
    await user.type(allergyFields[1]!, 'Latex sensitivity')

    expect(allergyFields[0]!.value).toBe('Peanut allergy')
    expect(allergyFields[1]!.value).toBe('Latex sensitivity')
  })

  it('submits per-guest vegan main course choice and allergy notes', async () => {
    const user = userEvent.setup()
    render(<FinalRsvpForm guestData={guestData} />)

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[]
    for (const select of selects) {
      await user.selectOptions(select, 'yes')
    }

    await user.click(screen.getByText('finalRsvp.form.accommodationChateau'))

    for (const radio of screen.getAllByRole('radio', { name: /finalRsvp\.menu\.appetizer\.gaspacho/ })) {
      await user.click(radio)
    }
    const veganRadios = screen.getAllByRole('radio', { name: /finalRsvp\.menu\.main\.vegan/ })
    await user.click(veganRadios[0]!)
    const barRadios = screen.getAllByRole('radio', { name: 'finalRsvp.menu.main.bar' })
    await user.click(barRadios[1]!)

    const allergyFields = screen.getAllByPlaceholderText('finalRsvp.form.allergiesPlaceholder') as HTMLTextAreaElement[]
    await user.type(allergyFields[0]!, 'Peanut allergy')

    const submitButton = screen.getByRole('button', { name: 'finalRsvp.form.submit' })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockedFinalRsvpApi.submitToNetlifyForms).toHaveBeenCalledTimes(1)
    })
    const submittedEntry = mockedFinalRsvpApi.submitToNetlifyForms.mock.calls[0]![0]
    expect(submittedEntry.guests[0]!.main).toBe('vegan')
    expect(submittedEntry.guests[0]!.allergies).toBe('Peanut allergy')
    expect(submittedEntry.guests[1]!.main).toBe('bar')
    expect(submittedEntry).not.toHaveProperty('arrivalDate')
    expect(submittedEntry).not.toHaveProperty('departureDate')
  })
})
