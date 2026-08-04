import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
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

interface SpeechEntry {
  id: string
  label: string
  title: string
  body: string[]
}

const SPEECHES: SpeechEntry[] = [
  {
    id: 'guy-karin',
    label: 'Guy & Karin',
    title: 'Translated version',
    body: [
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean malesuada quam sed ornare tristique. Etiam ipsum arcu, vulputate non libero vitae, sollicitudin consectetur mauris.',
      'Maecenas ultrices magna eget lectus fermentum eleifend. Praesent sed blandit tortor, a vehicula velit. Vestibulum suscipit odio vel dui fermentum consectetur. Suspendisse a magna aliquet purus consequat porttitor.',
      'Vestibulum sagittis felis sem, nec vestibulum orci convallis non. Suspendisse elementum felis sed purus dictum, auctor pharetra ipsum faucibus. In cursus enim vitae arcu placerat, ac sollicitudin libero fermentum.',
      'In tempor dignissim sagittis. Vestibulum non metus eget arcu rhoncus luctus. Etiam lacus tellus, pharetra ut placerat in, bibendum in magna. Duis eleifend turpis ut tempor tristique.',
    ],
  },
  {
    id: 'carlos-edith',
    label: 'Carlos & Edith',
    title: 'Speech notes',
    body: [
      'A warm toast about shared adventures, family, and the people gathered here today.',
      'A second paragraph can hold the translated version or the original speech text, depending on what the operator wants to show.',
      'Use this panel for a clean, centered presentation that stays calm and readable on desktop and mobile.',
    ],
  },
  {
    id: 'ellen',
    label: 'Ellen',
    title: 'Speech notes',
    body: [
      'Short, affectionate remarks about the couple and a small anecdote from the wedding weekend.',
      'This section can be replaced with the final speech copy once it is ready.',
    ],
  },
  {
    id: 'jimena',
    label: 'Jimena',
    title: 'Speech notes',
    body: [
      'A celebratory speech with a soft, lyrical tone and a final toast to the newlyweds.',
      'Keep the layout centered and spacious so the reading rhythm feels deliberate.',
    ],
  },
  {
    id: 'miguel',
    label: 'Miguel',
    title: 'Speech notes',
    body: [
      'A few lines about friendship, travel, and the moments that brought everyone to this table.',
      'A second paragraph can be used for the translated version if needed.',
    ],
  },
  {
    id: 'jackie-gino',
    label: 'Jackie',
    title: 'Speech notes',
    body: [
      'A concise speech card for a final toast or closing remarks.',
      'The page is designed so the content block stays centered and holds up as the number of speeches changes.',
    ],
  },
  {
    id: 'gino',
    label: 'Gino',
    title: 'Speech notes',
    body: [
      'Additional speaker content can be added here without changing the page structure.',
      'This layout intentionally leaves room for different lengths of speeches while preserving the visual rhythm.',
    ],
  },
]

function SpeechesPageContent() {
  const { t } = useTranslation()
  const [activeSpeechId, setActiveSpeechId] = useState(SPEECHES[0]?.id ?? '')

  const activeSpeech = SPEECHES.find((speech) => speech.id === activeSpeechId) ?? SPEECHES[0]!

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
      <SiteHeader withTimelineAnchor={false} />

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
              We don&apos;t want you too miss anything. Select the person giving the speech for the translated version.
            </Text>
          </VStack>
        </Container>
      </Box>

      <Box as="main" flex="1" position="relative" zIndex={1} pt={[6, 8, 10]} pb={[10, 12, 16]}>
        <Container maxW="container.lg" px={[4, 6, 8]}>
          <VStack spacing={[6, 7, 8]}>
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
                {SPEECHES.map((speech) => {
                  const isActive = speech.id === activeSpeechId
                  return (
                    <Button
                      key={speech.id}
                      onClick={() => setActiveSpeechId(speech.id)}
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
              <VStack spacing={0} maxW="620px" textAlign="center">
                <Box>
                  {activeSpeech.body.map((paragraph) => (
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
              </VStack>
            </Box>
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