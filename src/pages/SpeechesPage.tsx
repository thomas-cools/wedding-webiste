import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Badge,
  Container,
  HStack,
  Heading,
  Skeleton,
  Text,
  VStack,
} from '@chakra-ui/react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import PasswordGate from '../components/PasswordGate'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'
import { authenticateWithToken, isAuthenticated } from '../utils/auth'
import SiteHeader from '../components/SiteHeader'
import textureSvg from '../assets/texture.svg'
import {
  getSpeechSpeakers,
  type SpeechSpeakerKey,
} from '../config/speeches'

interface PublicSpeechDocument {
  id: string
  fileName: string
  speakerKey?: SpeechSpeakerKey
  sourceText?: string
  translatedText?: string
  detectedLanguage?: 'en' | 'es'
  translatedLanguage?: 'en' | 'es'
  translationStatus?: 'success' | 'failed' | 'skipped'
  createdAt: string
}

interface PublicSpeechView {
  key: SpeechSpeakerKey
  label: string
  fileName: string
  translatedText: string
  sourceText?: string
  detectedLanguage?: 'en' | 'es'
  translatedLanguage?: 'en' | 'es'
}

interface PublicSpeechesResponse {
  ok: boolean
  documents?: PublicSpeechDocument[]
  error?: string
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
}

function SpeechesPageContent() {
  const { t } = useTranslation()
  const [documents, setDocuments] = useState<PublicSpeechDocument[]>([])
  const [loadingSpeeches, setLoadingSpeeches] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeSpeechKey, setActiveSpeechKey] = useState<SpeechSpeakerKey | ''>('')

  useEffect(() => {
    let isActive = true

    const loadSpeeches = async () => {
      setLoadingSpeeches(true)
      setLoadError('')

      try {
        const response = await fetch('/api/speeches-documents', {
          method: 'GET',
        })
        const data: PublicSpeechesResponse = await response.json()

        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Failed to load speeches')
        }

        if (!isActive) return
        setDocuments(Array.isArray(data.documents) ? data.documents : [])
      } catch {
        if (!isActive) return
        setDocuments([])
        setLoadError('Translated speeches are not available right now.')
      } finally {
        if (isActive) {
          setLoadingSpeeches(false)
        }
      }
    }

    void loadSpeeches()

    return () => {
      isActive = false
    }
  }, [])

  const availableSpeeches = useMemo(() => {
    const latestBySpeaker = new Map<SpeechSpeakerKey, PublicSpeechDocument>()

    for (const document of documents) {
      if (!document.speakerKey || !document.translatedText) {
        continue
      }

      const current = latestBySpeaker.get(document.speakerKey)
      if (!current || new Date(document.createdAt).getTime() >= new Date(current.createdAt).getTime()) {
        latestBySpeaker.set(document.speakerKey, document)
      }
    }

    return getSpeechSpeakers()
      .map((speaker) => ({
        speaker,
        document: latestBySpeaker.get(speaker.key),
      }))
      .filter((entry): entry is { speaker: { key: SpeechSpeakerKey; label: string; order: number }; document: PublicSpeechDocument } => Boolean(entry.document))
      .map((entry) => ({
        key: entry.speaker.key,
        label: entry.speaker.label,
        fileName: entry.document.fileName,
        translatedText: entry.document.translatedText || '',
        sourceText: entry.document.sourceText,
        detectedLanguage: entry.document.detectedLanguage,
        translatedLanguage: entry.document.translatedLanguage,
      }))
  }, [documents])

  useEffect(() => {
    if (availableSpeeches.length === 0) {
      setActiveSpeechKey('')
      return
    }

    setActiveSpeechKey((current) =>
      availableSpeeches.some((speech) => speech.key === current) ? current : availableSpeeches[0]!.key
    )
  }, [availableSpeeches])

  const activeSpeech =
    availableSpeeches.find((speech) => speech.key === activeSpeechKey) ?? availableSpeeches[0] ?? null

  return (
    <Box
      id="page-top"
      minH="100vh"
      bg="#E3DFCE"
      color="#300F0C"
      display="flex"
      flexDirection="column"
      position="relative"
      overflow="hidden"
    >
      <SiteHeader />

      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(180deg, rgba(227,223,206,0.98) 0%, rgba(227,223,206,0.96) 100%)"
      />

      <Box
        position="fixed"
        right={0}
        top={0}
        bottom={0}
        w={["96px", "120px", "160px", "200px"]}
        backgroundImage={`url(${textureSvg})`}
        backgroundRepeat="no-repeat"
        backgroundPosition="right center"
        backgroundSize="cover"
        pointerEvents="none"
        zIndex={11}
        transform="scaleX(-1)"
        sx={{
          opacity: 0.28,
          mixBlendMode: 'overlay',
          filter: 'drop-shadow(1px 1px 0px rgba(255,255,255,0.5)) drop-shadow(-1px -1px 0px rgba(0,0,0,0.2))',
        }}
      >
      </Box>

      <Box as="header" role="banner" position="relative" zIndex={1} pt={[20, 24, 28]} pb={[4, 6]}>
        <Container maxW="container.lg" px={[4, 6, 8]}>
          <VStack spacing={5} textAlign="center">
            <Heading
              as="h1"
              fontFamily="elegant"
              fontWeight="400"
              color="#4C050C"
              fontSize={['3xl', '4xl', '5xl']}
              letterSpacing="0.01em"
              lineHeight="1"
            >
              Speeches
            </Heading>

            <Text
              maxW="42rem"
              mx="auto"
              color="rgba(11,25,55,0.9)"
              fontSize={['md', 'lg']}
              lineHeight="1.9"
              fontWeight="400"
            >
              We don&apos;t want you too miss anything. Select the speaker to read the translated version.
            </Text>
          </VStack>
        </Container>
      </Box>

      <Box as="main" flex="1" position="relative" zIndex={1} pt={[6, 8, 10]} pb={[10, 12, 16]}>
        <Container maxW="container.lg" px={[4, 6, 8]}>
          <VStack spacing={[6, 7, 8]}>
            {loadingSpeeches ? (
              <Box
                w="100%"
                maxW="920px"
                mx="auto"
                bg="#F6F1EB"
                border="1px solid"
                borderColor="rgba(132,169,210,0.55)"
                rounded="md"
                boxShadow="0 16px 40px rgba(11,25,55,0.06)"
                px={[6, 8, 14]}
                py={[8, 10, 14]}
              >
                <Skeleton h="24px" w="220px" mb={4} />
                <Skeleton h="16px" w="140px" mb={10} />
                <Skeleton h="18px" w="100%" mb={4} />
                <Skeleton h="18px" w="92%" mb={4} />
                <Skeleton h="18px" w="96%" mb={4} />
              </Box>
            ) : availableSpeeches.length > 0 && activeSpeech ? (
              <>
                <Box
                  w="100%"
                  maxW="920px"
                  mx="auto"
                  border="1px solid"
                  borderColor="rgba(132,169,210,0.7)"
                  bg="rgba(246,241,235,0.72)"
                  backdropFilter="blur(2px)"
                  rounded="full"
                  px={[3, 4]}
                  py={[2, 3]}
                  boxShadow="0 10px 24px rgba(11,25,55,0.05)"
                  overflowX="auto"
                >
                  <HStack spacing={2} justify="space-between" minW={["640px", "auto"]}>
                    {availableSpeeches.map((speech) => {
                      const isActive = speech.key === activeSpeech.key
                      return (
                        <Button
                          key={speech.key}
                          onClick={() => setActiveSpeechKey(speech.key)}
                          variant="ghost"
                          rounded="full"
                          minH="40px"
                          px={[3, 5]}
                          py={2}
                          fontSize={["xs", "sm"]}
                          fontWeight={isActive ? '600' : '500'}
                          letterSpacing="0.005em"
                          textTransform="none"
                          color={isActive ? '#F6F1EB' : 'rgba(11,25,55,0.72)'}
                          bg={isActive ? '#0B1937' : 'transparent'}
                          _hover={{
                            bg: isActive ? '#0B1937' : 'rgba(11,25,55,0.05)',
                          }}
                          _active={{ transform: 'none' }}
                          flexShrink={0}
                        >
                          {speech.label}
                        </Button>
                      )
                    })}
                  </HStack>
                </Box>

                <Box
                  w="100%"
                  maxW="920px"
                  mx="auto"
                  bg="#F6F1EB"
                  border="1px solid"
                  borderColor="rgba(132,169,210,0.55)"
                  rounded="md"
                  boxShadow="0 16px 40px rgba(11,25,55,0.06)"
                  px={[6, 8, 14]}
                  py={[8, 10, 14]}
                  minH={['420px', '500px']}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <VStack spacing={0} maxW="620px" textAlign="center" width="100%">
                    <Box width="100%">
                      <Text fontFamily="elegant" fontSize={['2xl', '3xl']} color="#4C050C" mb={2}>
                        {activeSpeech.label}
                      </Text>
                      <Text fontSize="sm" color="rgba(11,25,55,0.68)" mb={6}>
                        {activeSpeech.fileName}
                      </Text>
                      <Box mb={6}>
                        {splitParagraphs(activeSpeech.translatedText).map((paragraph) => (
                          <Text
                            key={paragraph}
                            fontSize={['sm', 'md']}
                            lineHeight="2.1"
                            color="rgba(48,23,9,0.82)"
                            mb={5}
                          >
                            {paragraph}
                          </Text>
                        ))}
                      </Box>
                      <HStack justify="center" spacing={2} flexWrap="wrap">
                        <Badge colorScheme="green" variant="subtle">
                          {activeSpeech.detectedLanguage?.toUpperCase() || 'EN/ES'}
                          {' -> '}
                          {activeSpeech.translatedLanguage?.toUpperCase() || 'ES/EN'}
                        </Badge>
                        <Badge colorScheme="gray" variant="subtle">
                          Speaker matched
                        </Badge>
                      </HStack>
                    </Box>
                  </VStack>
                </Box>
              </>
            ) : (
              <Box
                w="100%"
                maxW="920px"
                mx="auto"
                bg="#F6F1EB"
                border="1px solid"
                borderColor="rgba(132,169,210,0.55)"
                rounded="md"
                boxShadow="0 16px 40px rgba(11,25,55,0.06)"
                px={[6, 8, 14]}
                py={[8, 10, 14]}
              >
                {loadError ? (
                  <Alert status="warning" rounded="md">
                    <AlertIcon />
                    {loadError}
                  </Alert>
                ) : (
                  <VStack spacing={3} textAlign="center">
                    <Text fontFamily="elegant" fontSize={['2xl', '3xl']} color="#4C050C">
                      No speeches yet
                    </Text>
                    <Text color="rgba(48,23,9,0.74)" maxW="32rem">
                      Translated speeches will appear here once an admin assigns a speaker and saves the document.
                    </Text>
                  </VStack>
                )}
              </Box>
            )}
          </VStack>
        </Container>
      </Box>

      <Footer variant="dark" sectionAboveBg="#E3DFCE" />
    </Box>
  )
}

function SpeechesPageRoute() {
  const { features } = useFeatureFlags()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('t')
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(token))

  useEffect(() => {
    let isActive = true

    if (!token) {
      setIsBootstrapping(false)
      return () => {
        isActive = false
      }
    }

    if (isAuthenticated()) {
      navigate('/speeches', { replace: true })
      setIsBootstrapping(false)
      return () => {
        isActive = false
      }
    }

    void (async () => {
      const result = await authenticateWithToken(token)
      if (!isActive) return

      if (result.ok) {
        navigate('/speeches', { replace: true })
      }
      setIsBootstrapping(false)
    })()

    return () => {
      isActive = false
    }
  }, [navigate, token])

  if (isBootstrapping) {
    return (
      <Box minH="100vh" bg="#300F0C" display="flex" alignItems="center" justifyContent="center">
        <Skeleton h="120px" w="min(90vw, 420px)" borderRadius="2xl" />
      </Box>
    )
  }

  const content = <SpeechesPageContent />

  if (features.requirePassword) {
    return <PasswordGate bg="#300F0C" scheme="dark">{content}</PasswordGate>
  }

  return content
}

export default SpeechesPageRoute