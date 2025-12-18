import React, { useEffect, useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  HStack,
} from '@chakra-ui/react'

const STORAGE_KEY = 'rsvps'

type Guest = { name: string; dietary?: string }

type Likelihood = 'definitely' | 'highly_likely' | 'maybe' | 'no'

type EventAnswer = 'yes' | 'no' | 'arriving_late' | ''

type Events = {
  welcome: EventAnswer
  ceremony: EventAnswer
  brunch: EventAnswer
}

type Rsvp = {
  id: string
  firstName: string
  email: string
  likelihood: Likelihood
  events?: Events
  guests: Guest[]
  dietary?: string
  songRequest?: string
  franceTips?: boolean
  additionalNotes?: string
  timestamp: number
}

function loadRsvps(): Rsvp[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function AdminPanel() {
  const [rsvps, setRsvps] = useState<Rsvp[]>([])

  useEffect(() => {
    setRsvps(loadRsvps())

    const handler = () => setRsvps(loadRsvps())
    window.addEventListener('rsvp:submitted', handler)
    return () => window.removeEventListener('rsvp:submitted', handler)
  }, [])

  function clearAll() {
    if (!confirm('Clear all RSVPs?')) return
    localStorage.removeItem(STORAGE_KEY)
    setRsvps([])
  }

  const LIKELIHOOD_LABELS: Record<Likelihood, string> = {
    definitely: '✅ Definitely',
    highly_likely: '👍 Highly Likely',
    maybe: '🤔 Maybe',
    no: '😢 Cannot attend'
  }

  const EVENT_LABELS: Record<string, string> = {
    welcome: 'Welcome Dinner',
    ceremony: 'Wedding Day',
    brunch: 'Recovery Brunch'
  }

  function formatEvents(events?: Events): string {
    if (!events) return '–'
    const attending = Object.entries(events)
      .filter(([_, v]) => v === 'yes' || v === 'arriving_late')
      .map(([k]) => EVENT_LABELS[k])
    return attending.length > 0 ? attending.join(', ') : '–'
  }

  function exportCsv() {
    const headers = ['Name', 'Email', 'Likelihood', 'Events', 'Guests', 'Dietary', 'Song Request', 'Notes', 'Submitted']
    const rows = rsvps.map(r => [
      r.firstName,
      r.email,
      LIKELIHOOD_LABELS[r.likelihood] || r.likelihood,
      formatEvents(r.events),
      r.guests.map(g => `${g.name}${g.dietary ? ` (${g.dietary})` : ''}`).join('; '),
      r.dietary || '',
      r.songRequest || '',
      (r.additionalNotes || '').replace(/\n/g, ' '),
      new Date(r.timestamp).toLocaleString(),
    ])

    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'rsvps.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Box as="section" id="admin" py={12} bg="neutral.light">
      <Container maxW="container.xl">
        <Box textAlign="center" mb={8}>
          <Text fontSize="sm" textTransform="uppercase" letterSpacing="0.18em" color="primary.soft">Admin</Text>
          <Heading as="h2" size="lg" fontFamily="heading" mt={2}>RSVP Responses</Heading>
        </Box>

        <HStack spacing={4} mb={6} justify="center">
          <Button variant="primary" onClick={exportCsv}>Export CSV</Button>
          <Button variant="outline" colorScheme="red" onClick={clearAll}>Clear All</Button>
        </HStack>

        {rsvps.length === 0 ? (
          <Text textAlign="center" color="neutral.dark">No RSVPs yet.</Text>
        ) : (
          <TableContainer bg="whiteAlpha.800" borderRadius="lg" borderWidth="1px" borderColor="primary.soft">
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Likelihood</Th>
                  <Th>Events</Th>
                  <Th>Guests</Th>
                  <Th>Submitted</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rsvps.map(r => (
                  <Tr key={r.id}>
                    <Td fontWeight="medium">{r.firstName}</Td>
                    <Td>{r.email}</Td>
                    <Td>
                      <Badge colorScheme={r.likelihood === 'definitely' ? 'green' : r.likelihood === 'highly_likely' ? 'blue' : r.likelihood === 'maybe' ? 'yellow' : 'red'}>
                        {LIKELIHOOD_LABELS[r.likelihood]}
                      </Badge>
                    </Td>
                    <Td>{formatEvents(r.events)}</Td>
                    <Td>{r.guests.map(g => g.name).join(', ') || '–'}</Td>
                    <Td>{new Date(r.timestamp).toLocaleDateString()}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Box>
  )
}
