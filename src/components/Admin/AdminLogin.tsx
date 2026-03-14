import { useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  Alert,
  AlertIcon,
  HStack,
  PinInput,
  PinInputField,
  Flex,
} from '@chakra-ui/react'
import { adminLogin, adminVerifyMfa } from '../../utils/adminAuth'
import { MfaEnrollment } from './MfaEnrollment'

type Step = 'password' | 'mfa' | 'enroll'

interface AdminLoginProps {
  onAuthenticated: () => void
}

export function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const [step, setStep] = useState<Step>('password')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [pendingToken, setPendingToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await adminLogin(password)
      if (!result.ok) {
        setError(result.error || 'Login failed')
        return
      }

      setPendingToken(result.pendingToken)

      if (result.mfaConfigured) {
        setStep('mfa')
      } else {
        setStep('enroll')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMfaSubmit = async (code: string) => {
    setError('')
    setLoading(true)

    try {
      const result = await adminVerifyMfa(pendingToken, code)
      if (!result.ok) {
        setError(result.error || 'Invalid code')
        setMfaCode('')
        return
      }
      onAuthenticated()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEnrollmentComplete = () => {
    // After enrollment, go to MFA step to verify
    setStep('mfa')
  }

  if (step === 'enroll') {
    return (
      <MfaEnrollment
        pendingToken={pendingToken}
        onComplete={handleEnrollmentComplete}
      />
    )
  }

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="neutral.light"
      px={4}
    >
      <Box
        maxW="400px"
        w="full"
        bg="white"
        rounded="xl"
        shadow="xl"
        p={8}
        border="1px solid"
        borderColor="primary.soft"
      >
        <VStack spacing={6} align="stretch">
          <Box textAlign="center">
            <Heading
              size="lg"
              fontFamily="heading"
              color="secondary.navy"
              mb={2}
            >
              Admin Panel
            </Heading>
            <Text fontSize="sm" color="neutral.muted">
              {step === 'password'
                ? 'Enter your admin password'
                : 'Enter the 6-digit code from your authenticator'}
            </Text>
          </Box>

          {error && (
            <Alert status="error" rounded="md" fontSize="sm">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm" color="neutral.dark">
                    Password
                  </FormLabel>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter admin password"
                    size="lg"
                    focusBorderColor="primary.deep"
                    autoFocus
                  />
                </FormControl>
                <Button
                  type="submit"
                  w="full"
                  size="lg"
                  bg="secondary.navy"
                  color="neutral.cream"
                  _hover={{ bg: 'secondary.maroon' }}
                  isLoading={loading}
                  isDisabled={!password}
                >
                  Continue
                </Button>
              </VStack>
            </form>
          )}

          {step === 'mfa' && (
            <VStack spacing={4}>
              <HStack justify="center">
                <PinInput
                  size="lg"
                  otp
                  value={mfaCode}
                  onChange={setMfaCode}
                  onComplete={handleMfaSubmit}
                  isDisabled={loading}
                  autoFocus
                >
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                  <PinInputField />
                </PinInput>
              </HStack>
              <Button
                w="full"
                size="lg"
                bg="secondary.navy"
                color="neutral.cream"
                _hover={{ bg: 'secondary.maroon' }}
                isLoading={loading}
                isDisabled={mfaCode.length !== 6}
                onClick={() => handleMfaSubmit(mfaCode)}
              >
                Verify
              </Button>
              <Button
                variant="ghost"
                size="sm"
                color="neutral.muted"
                onClick={() => {
                  setStep('password')
                  setPassword('')
                  setMfaCode('')
                  setError('')
                }}
              >
                Back to login
              </Button>
            </VStack>
          )}
        </VStack>
      </Box>
    </Flex>
  )
}
