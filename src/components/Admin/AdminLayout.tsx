import { useState, useCallback } from 'react'
import {
  Box,
  Button,
  Flex,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react'
import { adminLogout } from '../../utils/adminAuth'
import { RsvpDashboard } from './RsvpDashboard'
import { EmailComposer } from './EmailComposer'
import { DrinkInvitationsPanel } from './DrinkInvitationsPanel'
import { RemindersPanel } from './RemindersPanel'

interface AdminLayoutProps {
  onLogout: () => void
}

export function AdminLayout({ onLogout }: AdminLayoutProps) {
  const [tabIndex, setTabIndex] = useState(0)

  const handleLogout = useCallback(() => {
    adminLogout()
    onLogout()
  }, [onLogout])

  return (
    <Box minH="100vh" bg="neutral.light">
      {/* Header */}
      <Flex
        bg="secondary.navy"
        color="neutral.cream"
        px={6}
        py={4}
        align="center"
        justify="space-between"
        shadow="md"
      >
        <Heading size="md" fontFamily="heading" letterSpacing="wide">
          Admin Panel
        </Heading>
        <Flex align="center" gap={4}>
          <Text fontSize="xs" opacity={0.7}>
            Authenticated
          </Text>
          <Button
            size="sm"
            variant="outline"
            color="neutral.cream"
            borderColor="primary.soft"
            _hover={{ bg: 'whiteAlpha.100' }}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Flex>
      </Flex>

      {/* Main Content */}
      <Box maxW="1400px" mx="auto" p={6}>
        <Tabs
          index={tabIndex}
          onChange={setTabIndex}
          variant="soft-rounded"
          colorScheme="blue"
          isLazy
        >
          <TabList
            bg="white"
            rounded="xl"
            p={2}
            shadow="sm"
            border="1px solid"
            borderColor="gray.100"
            mb={6}
            overflowX="auto"
            flexWrap={{ base: 'wrap', md: 'nowrap' }}
            gap={1}
          >
            <Tab
              fontSize="sm"
              fontWeight="medium"
              _selected={{ bg: 'secondary.navy', color: 'white' }}
            >
              Dashboard
            </Tab>
            <Tab
              fontSize="sm"
              fontWeight="medium"
              _selected={{ bg: 'secondary.navy', color: 'white' }}
            >
              Compose Email
            </Tab>
            <Tab
              fontSize="sm"
              fontWeight="medium"
              _selected={{ bg: 'secondary.navy', color: 'white' }}
            >
              Drink Invitations
            </Tab>
            <Tab
              fontSize="sm"
              fontWeight="medium"
              _selected={{ bg: 'secondary.navy', color: 'white' }}
            >
              Reminders
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel p={0}>
              <RsvpDashboard />
            </TabPanel>
            <TabPanel p={0}>
              <EmailComposer />
            </TabPanel>
            <TabPanel p={0}>
              <DrinkInvitationsPanel />
            </TabPanel>
            <TabPanel p={0}>
              <RemindersPanel />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Box>
  )
}
