import { render, screen, fireEvent, waitFor } from '../test-utils'
import { AddPartyModal } from '../components/Admin/AddPartyModal'
import type { AdminRsvp } from '../components/Admin/useAdminRsvps'

// Local override: the global @chakra-ui/icons mock (setupTests.ts) doesn't
// include CloseIcon, which the guest-row remove buttons use.
jest.mock('@chakra-ui/icons', () => {
  const React = require('react')
  return {
    CloseIcon: (props: Record<string, unknown>) => React.createElement('svg', { 'data-testid': 'close-icon', ...props }),
  }
})

function makeParty(overrides: Partial<AdminRsvp> = {}): AdminRsvp {
  return {
    id: 'manual:1',
    firstName: 'Dana',
    email: 'dana@example.com',
    mailingAddress: '',
    likelihood: 'definitely',
    events: { welcome: '', ceremony: '', brunch: '' },
    accommodation: '',
    travelPlan: '',
    guests: [],
    dietary: '',
    franceTips: false,
    additionalNotes: '',
    submittedAt: '2026-01-01T00:00:00.000Z',
    locale: 'en',
    isManuallyAdded: true,
    ...overrides,
  }
}

describe('AddPartyModal', () => {
  it('renders empty fields in add mode', () => {
    render(
      <AddPartyModal isOpen onClose={jest.fn()} editingParty={null} onAdd={jest.fn()} onUpdate={jest.fn()} />
    )

    expect(screen.getByPlaceholderText('Jane')).toHaveValue('')
    expect(screen.getByPlaceholderText('jane@example.com')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Add Party' })).toBeInTheDocument()
  })

  it('prefills fields in edit mode', () => {
    const party = makeParty({ guests: [{ name: 'Extra Guest' }] })
    render(
      <AddPartyModal isOpen onClose={jest.fn()} editingParty={party} onAdd={jest.fn()} onUpdate={jest.fn()} />
    )

    expect(screen.getByDisplayValue('Dana')).toBeInTheDocument()
    expect(screen.getByDisplayValue('dana@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Extra Guest')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
  })

  it('rejects an empty first name', () => {
    const onAdd = jest.fn().mockResolvedValue(true)
    render(<AddPartyModal isOpen onClose={jest.fn()} editingParty={null} onAdd={onAdd} onUpdate={jest.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'dana@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Party' }))

    expect(onAdd).not.toHaveBeenCalled()
  })

  it('rejects an invalid email', () => {
    const onAdd = jest.fn().mockResolvedValue(true)
    render(<AddPartyModal isOpen onClose={jest.fn()} editingParty={null} onAdd={onAdd} onUpdate={jest.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Jane'), { target: { value: 'Dana' } })
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: 'not-an-email' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Party' }))

    expect(onAdd).not.toHaveBeenCalled()
  })

  it('calls onAdd with trimmed values and sanitized guest names, then closes', async () => {
    const onAdd = jest.fn().mockResolvedValue(true)
    const onClose = jest.fn()
    render(<AddPartyModal isOpen onClose={onClose} editingParty={null} onAdd={onAdd} onUpdate={jest.fn()} />)

    fireEvent.change(screen.getByPlaceholderText('Jane'), { target: { value: '  Dana  ' } })
    fireEvent.change(screen.getByPlaceholderText('jane@example.com'), { target: { value: '  Dana@Example.com  ' } })
    fireEvent.click(screen.getByRole('button', { name: '+ Add Guest' }))
    fireEvent.change(screen.getByPlaceholderText('Guest name'), { target: { value: '  Extra Guest  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Party' }))

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith('Dana', 'dana@example.com', ['Extra Guest'])
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('calls onUpdate with the party id in edit mode', async () => {
    const onUpdate = jest.fn().mockResolvedValue(true)
    const party = makeParty()
    render(
      <AddPartyModal isOpen onClose={jest.fn()} editingParty={party} onAdd={jest.fn()} onUpdate={onUpdate} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('manual:1', 'Dana', 'dana@example.com', [])
    })
  })

  it('removes a guest row when its remove button is clicked', () => {
    const party = makeParty({ guests: [{ name: 'Bob' }, { name: 'Carol' }] })
    render(
      <AddPartyModal isOpen onClose={jest.fn()} editingParty={party} onAdd={jest.fn()} onUpdate={jest.fn()} />
    )

    fireEvent.click(screen.getAllByRole('button', { name: 'Remove guest' })[0]!)

    expect(screen.queryByDisplayValue('Bob')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('Carol')).toBeInTheDocument()
  })
})
