import { useState } from 'react'
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Input,
  PinInput,
  PinInputField,
  Text,
  VStack,
  Alert,
  AlertIcon,
  Code,
  useClipboard,
  IconButton,
} from '@chakra-ui/react'
import { QRCodeSVG } from 'qrcode.react'
import { adminEnrollMfa } from '../../utils/adminAuth'

interface MfaEnrollmentProps {
  pendingToken: string
  onComplete: () => void
}

type EnrollStep = 'loading' | 'scan' | 'verify'

export function MfaEnrollment({ pendingToken, onComplete }: MfaEnrollmentProps) {
  const [step, setStep] = useState<EnrollStep>('loading')
  const [secret, setSecret] = useState('')
  const [totpUri, setTotpUri] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { onCopy, hasCopied } = useClipboard(secret)

  // Generate a new TOTP secret on mount
  const initEnrollment = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await adminEnrollMfa(pendingToken)
      if (!result.ok) {
        setError(result.error || 'Failed to start enrollment')
        return
      }
      setSecret(result.secret || '')
      setTotpUri(result.totpUri || '')
      setStep('scan')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Auto-init on first render
  if (step === 'loading' && !loading && !error) {
    initEnrollment()
  }

  const handleVerify = async (verifyCode: string) => {
    setError('')
    setLoading(true)
    try {
      const result = await adminEnrollMfa(pendingToken, verifyCode, secret)
      if (!result.ok) {
        setError(result.error || 'Invalid code. Try again.')
        setCode('')
        return
      }
      onComplete()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
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
        maxW="480px"
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
              Set Up MFA
            </Heading>
            <Text fontSize="sm" color="neutral.muted">
              Scan the QR code with your authenticator app
            </Text>
          </Box>

          {error && (
            <Alert status="error" rounded="md" fontSize="sm">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {step === 'loading' && (
            <Box textAlign="center" py={8}>
              <Text color="neutral.muted">Generating secret...</Text>
            </Box>
          )}

          {step === 'scan' && (
            <VStack spacing={5}>
              <Box
                bg="white"
                p={4}
                rounded="lg"
                border="1px solid"
                borderColor="gray.200"
                mx="auto"
              >
                {totpUri && (
                  <QRCodeSVG
                    value={totpUri}
                    size={200}
                    level="M"
                    bgColor="#FFFFFF"
                    fgColor="#0B1937"
                  />
                )}
              </Box>

              <Box w="full">
                <Text fontSize="xs" color="neutral.muted" mb={1}>
                  Or enter this secret manually:
                </Text>
                <HStack>
                  <Input
                    value={secret}
                    isReadOnly
                    fontFamily="mono"
                    fontSize="sm"
                    size="sm"
                  />
                  <IconButton
                    aria-label="Copy secret"
                    icon={
                      <Text fontSize="xs">
                        {hasCopied ? '✓' : 'Copy'}
                      </Text>
                    }
                    size="sm"
                    onClick={onCopy}
                    variant="outline"
                  />
                </HStack>
              </Box>

              <Alert status="warning" rounded="md" fontSize="xs">
                <AlertIcon />
                <Box>
                  <Text fontWeight="bold">Save this secret!</Text>
                  <Text>
                    After verifying, set it as the{' '}
                    <Code fontSize="xs">ADMIN_TOTP_SECRET</Code> environment
                    variable in Netlify.
                  </Text>
                </Box>
              </Alert>

              <Button
                w="full"
                bg="secondary.navy"
                color="neutral.cream"
                _hover={{ bg: 'secondary.maroon' }}
                onClick={() => setStep('verify')}
              >
                I've scanned the code
              </Button>
            </VStack>
          )}

          {step === 'verify' && (
            <VStack spacing={4}>
              <Text fontSize="sm" color="neutral.dark">
                Enter the 6-digit code from your authenticator to confirm:
              </Text>
              <HStack justify="center">
                <PinInput
                  size="lg"
                  otp
                  value={code}
                  onChange={setCode}
                  onComplete={handleVerify}
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
                isDisabled={code.length !== 6}
                onClick={() => handleVerify(code)}
              >
                Verify & Complete Setup
              </Button>
              <Button
                variant="ghost"
                size="sm"
                color="neutral.muted"
                onClick={() => {
                  setStep('scan')
                  setCode('')
                  setError('')
                }}
              >
                Back to QR code
              </Button>
            </VStack>
          )}
        </VStack>
      </Box>
    </Flex>
  )
}
