import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  InputGroup,
  InputRightElement,
  IconButton,
  Divider,
} from '@chakra-ui/react'
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { motion } from 'framer-motion'
import LanguageSwitcher from './LanguageSwitcher'
import { verifyPassword } from '../utils/crypto'

const MotionBox = motion(Box)

/**
 * Get the expected password hash.
 * 
 * The password is stored as a SHA-256 hash to prevent exposure in the client bundle.
 * To set a custom password:
 * 1. Generate hash: echo -n "yourpassword" | shasum -a 256
 * 2. Set VITE_SITE_PASSWORD_HASH in your environment
 * 
 * Default hash is for 'carolina&thomas2026'
 */
const getPasswordHash = (): string => {
  // Check for Vite environment variable (works in browser)
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    if (win.__VITE_SITE_PASSWORD_HASH__) {
      return win.__VITE_SITE_PASSWORD_HASH__ as string
    }
  }
  // Default password hash (SHA-256 of 'carolina&thomas2026')
  // This obscures the actual password from the client bundle
  return '2a3938a72e797aa7e55f16da649805749b74e4670cbd802758a457502f952277'
}

const SITE_PASSWORD_HASH = getPasswordHash()
const AUTH_KEY = 'wedding_authenticated'

const ATTEMPTS_KEY = 'wedding_password_attempts'
const LOCKOUT_UNTIL_KEY = 'wedding_password_lockout_until'

const MAX_ATTEMPTS_PER_MINUTE = 5
const ATTEMPT_WINDOW_MS = 60 * 1000
const COOLDOWN_MS = 5 * 60 * 1000

function safeParseNumberArray(raw: string | null): number[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(v => (typeof v === 'number' ? v : Number.NaN))
      .filter(n => Number.isFinite(n))
  } catch {
    return []
  }
}

function formatCooldown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

interface PasswordGateProps {
  children: React.ReactNode
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const { t } = useTranslation()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null)
  const [nowMs, setNowMs] = useState(() => Date.now())

  // Check if user is already authenticated on mount
  useEffect(() => {
    const authStatus = sessionStorage.getItem(AUTH_KEY)
    if (authStatus === 'true') {
      setIsAuthenticated(true)
    }

    const storedLockoutUntil = Number.parseInt(localStorage.getItem(LOCKOUT_UNTIL_KEY) || '', 10)
    if (Number.isFinite(storedLockoutUntil) && storedLockoutUntil > Date.now()) {
      setLockoutUntil(storedLockoutUntil)
    } else {
      localStorage.removeItem(LOCKOUT_UNTIL_KEY)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!lockoutUntil) return

    const tick = () => {
      const now = Date.now()
      setNowMs(now)
      if (now >= lockoutUntil) {
        setLockoutUntil(null)
        localStorage.removeItem(LOCKOUT_UNTIL_KEY)
        localStorage.removeItem(ATTEMPTS_KEY)
      }
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [lockoutUntil])

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setError(false)

    const now = Date.now()
    setNowMs(now)

    if (lockoutUntil && now < lockoutUntil) {
      return
    }

    const existingAttempts = safeParseNumberArray(localStorage.getItem(ATTEMPTS_KEY))
    const recentAttempts = existingAttempts.filter(ts => now - ts < ATTEMPT_WINDOW_MS)
    recentAttempts.push(now)
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(recentAttempts))

    if (recentAttempts.length > MAX_ATTEMPTS_PER_MINUTE) {
      const until = now + COOLDOWN_MS
      localStorage.setItem(LOCKOUT_UNTIL_KEY, String(until))
      setLockoutUntil(until)
      setPassword('')
      return
    }

    // Use async password verification with SHA-256 hashing
    setIsVerifying(true)
    try {
      const isValid = await verifyPassword(password, SITE_PASSWORD_HASH)
      if (isValid) {
        sessionStorage.setItem(AUTH_KEY, 'true')
        localStorage.removeItem(ATTEMPTS_KEY)
        localStorage.removeItem(LOCKOUT_UNTIL_KEY)
        setIsAuthenticated(true)
      } else {
        setError(true)
        setPassword('')
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handleSubmit(e)
    }
  }

  const isLockedOut = lockoutUntil !== null && nowMs < lockoutUntil
  const isDisabled = isLockedOut || isVerifying
  const lockoutRemainingMs = isLockedOut ? lockoutUntil - nowMs : 0

  // Show nothing while checking auth status
  if (isLoading) {
    return (
      <Box minH="100vh" bg="neutral.light" />
    )
  }

  // If authenticated, show the main content
  if (isAuthenticated) {
    return <>{children}</>
  }

  // Show password gate
  return (
    <Box 
      minH="100vh" 
      bg="neutral.light"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
    >
      {/* Language Switcher in corner */}
      <Box position="absolute" top={4} right={4}>
        <LanguageSwitcher />
      </Box>

      {/* Decorative elements */}
      <Box
        position="absolute"
        top="10%"
        left="50%"
        transform="translateX(-50%)"
        w="1px"
        h="60px"
        bg="primary.soft"
        opacity={0.5}
      />

      <Container maxW="container.sm" px={6}>
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <VStack spacing={8} textAlign="center">
            {/* Pre-heading */}
            <Text
              fontFamily="body"
              fontSize="xs"
              fontWeight="500"
              letterSpacing="0.3em"
              textTransform="uppercase"
              color="primary.muted"
            >
              {t('password.label')}
            </Text>

            {/* Main heading */}
            <VStack spacing={2}>
              <Heading
                as="h1"
                fontFamily="heading"
                fontSize={['3xl', '4xl', '5xl']}
                fontWeight="300"
                letterSpacing="0.08em"
                color="neutral.dark"
              >
                {t('password.title')}
              </Heading>
              <Divider borderColor="primary.soft" w="80px" />
            </VStack>

            {/* Description */}
            <Text
              fontFamily="body"
              fontSize={['sm', 'md']}
              color="neutral.dark"
              opacity={0.8}
              maxW="400px"
              lineHeight="1.8"
            >
              {t('password.description')}
            </Text>

            {/* Password Form */}
            <Box as="form" onSubmit={handleSubmit} w="100%" maxW="320px">
              <VStack spacing={4}>
                <FormControl isInvalid={error}>
                  <FormLabel
                    fontFamily="body"
                    fontSize="xs"
                    fontWeight="500"
                    letterSpacing="0.15em"
                    textTransform="uppercase"
                    color="neutral.dark"
                    textAlign="center"
                  >
                    {t('password.inputLabel')}
                  </FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setError(false)
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder={t('password.placeholder')}
                      textAlign="center"
                      fontFamily="body"
                      fontSize="md"
                      letterSpacing="0.05em"
                      borderColor="primary.soft"
                      _hover={{ borderColor: 'primary.deep' }}
                      _focusVisible={{
                        borderColor: 'primary.deep',
                        boxShadow: 'none',
                      }}
                      h="50px"
                      isDisabled={isDisabled}
                      data-testid="password-input"
                    />
                    <InputRightElement h="50px">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        color="neutral.dark"
                        opacity={0.6}
                        _hover={{ opacity: 1 }}
                      />
                    </InputRightElement>
                  </InputGroup>
                  {!isLockedOut && error && (
                    <FormErrorMessage justifyContent="center" data-testid="password-error">
                      {t('password.error')}
                    </FormErrorMessage>
                  )}
                </FormControl>

                {isLockedOut && (
                  <Text
                    fontFamily="body"
                    fontSize="sm"
                    color="neutral.dark"
                    opacity={0.8}
                    textAlign="center"
                    data-testid="password-cooldown"
                  >
                    {t('password.cooldown', { time: formatCooldown(lockoutRemainingMs) })}
                  </Text>
                )}

                <Button
                  type="submit"
                  variant="outline"
                  size="lg"
                  w="100%"
                  fontFamily="body"
                  fontSize="xs"
                  fontWeight="500"
                  letterSpacing="0.2em"
                  textTransform="uppercase"
                  borderColor="neutral.dark"
                  color="neutral.dark"
                  _hover={{
                    bg: 'neutral.dark',
                    color: 'neutral.light',
                  }}
                  h="50px"
                  isDisabled={isDisabled}
                  isLoading={isVerifying}
                  data-testid="password-submit"
                >
                  {t('password.enter')}
                </Button>
              </VStack>
            </Box>

            {/* Hint text */}
            <Text
              fontFamily="body"
              fontSize="xs"
              color="neutral.dark"
              opacity={0.5}
              fontStyle="italic"
            >
              {t('password.hint')}
            </Text>
          </VStack>
        </MotionBox>
      </Container>

      {/* Bottom decorative element */}
      <Box
        position="absolute"
        bottom="10%"
        left="50%"
        transform="translateX(-50%)"
        w="1px"
        h="60px"
        bg="primary.soft"
        opacity={0.5}
      />
    </Box>
  )
}

// Export for testing
export { AUTH_KEY }
