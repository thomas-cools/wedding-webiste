import { render, screen } from '../test-utils'
import userEvent from '@testing-library/user-event'
import { AdminLayout } from '../components/Admin/AdminLayout'

jest.mock('../components/Admin/useAdminRsvps', () => ({
  useAdminRsvps: () => ({})
}))

jest.mock('../components/Admin/RsvpDashboard', () => ({
  RsvpDashboard: () => <div>Rsvp Dashboard</div>,
}))

jest.mock('../components/Admin/EmailComposer', () => ({
  EmailComposer: () => <div>Email Composer</div>,
}))

jest.mock('../components/Admin/DrinkInvitationsPanel', () => ({
  DrinkInvitationsPanel: () => <div>Drink Invitations</div>,
}))

jest.mock('../components/Admin/RemindersPanel', () => ({
  RemindersPanel: () => <div>Reminders</div>,
}))

jest.mock('../components/Admin/DrinkPreferencesDashboard', () => ({
  DrinkPreferencesDashboard: () => <div>Drink Preferences Dashboard</div>,
}))

jest.mock('../components/Admin/FinalRsvpDashboard', () => ({
  FinalRsvpDashboard: () => <div>Final RSVP Dashboard</div>,
}))

jest.mock('../components/Admin/FinalRsvpInvitationsPanel', () => ({
  FinalRsvpInvitationsPanel: () => <div>Final RSVP Invitations</div>,
}))

jest.mock('../components/Admin/SpeechesLinkPanel', () => ({
  SpeechesLinkPanel: () => <div>Speeches Link Panel</div>,
}))

jest.mock('../components/Admin/SpeechesDocumentsPanel', () => ({
  SpeechesDocumentsPanel: () => <div>Speeches Documents Panel</div>,
}))

jest.mock('../components/Admin/GmailSpeechSyncPanel', () => ({
  GmailSpeechSyncPanel: () => <div>Gmail Speech Sync Panel</div>,
}))

describe('AdminLayout', () => {
  it('shows a prominent button to open the speeches link generator', async () => {
    const user = userEvent.setup()
    render(<AdminLayout onLogout={jest.fn()} />)

    const button = screen.getByRole('button', { name: /generate speeches link/i })
    expect(button).toBeInTheDocument()

    await user.click(button)

    expect(screen.getByText('Speeches Link Panel')).toBeInTheDocument()
  })

  it('opens the Gmail sync diagnostics tab', async () => {
    const user = userEvent.setup()
    render(<AdminLayout onLogout={jest.fn()} />)

    await user.click(screen.getByRole('tab', { name: 'Gmail Sync' }))

    expect(screen.getByText('Gmail Speech Sync Panel')).toBeInTheDocument()
  })
})
