import { useTranslation, Trans } from 'react-i18next'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Heading,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  SimpleGrid,
  Link,
} from '@chakra-ui/react'
import { ScrollReveal, StaggerContainer, StaggerItem } from './animations'
import { useEffect } from 'react'

interface FaqItem {
  question: string
  answer: string
}

interface DressCodeEvent {
  title: string
  day: string
  code: string
  description: string
  id: string
}

// Custom component for rendering dress code with elegant styling
function DressCodeAnswer() {
  const { t } = useTranslation()
  
  const events: DressCodeEvent[] = [
    {
      title: t('faq.dressCode.welcomeDinner.title', 'Welcome Dinner'),
      day: t('faq.dressCode.welcomeDinner.day', 'Tuesday Evening'),
      code: t('faq.dressCode.welcomeDinner.code', 'Cocktail Attire'),
      description: t('faq.dressCode.welcomeDinner.description', 'Think elegant but not overly formal. For women, a cocktail dress, jumpsuit, or dressy separates work beautifully. For men, a suit or blazer paired with dress pants. Feel free to add a pop of color!'),
      id: 'dress-code-welcome',
    },
    {
      title: t('faq.dressCode.wedding.title', 'The Wedding'),
      day: t('faq.dressCode.wedding.day', 'Wednesday'),
      code: t('faq.dressCode.wedding.code', 'Formal Attire'),
      description: t('faq.dressCode.wedding.description', 'This is our most elegant celebration. For women, floor-length gowns, formal midi dresses, or elegant cocktail dresses are perfect. For men, a dark suit or tuxedo. Think black-tie optional.'),
      id: 'dress-code-wedding',
    },
    {
      title: t('faq.dressCode.brunch.title', 'Farewell Brunch'),
      day: t('faq.dressCode.brunch.day', 'Thursday Morning'),
      code: t('faq.dressCode.brunch.code', 'Smart Casual'),
      description: t('faq.dressCode.brunch.description', 'Relaxed but polished. Sundresses, linen separates, chinos with a nice shirt, or a casual blazer all work well. Comfortable and chic!'),
      id: 'dress-code-brunch',
    },
  ]

  return (
    <VStack spacing={6} align="stretch">
      <SimpleGrid columns={1} spacing={4}>
        {events.map((event, index) => (
          <Box
            key={index}
            id={event.id}
            bg="neutral.light"
            borderRadius="lg"
            p={5}
            position="relative"
            borderTop="3px solid"
            borderColor="primary.soft"
            scrollMarginTop="120px"
          >
            <VStack align="start" spacing={3}>
              <Box>
                <Text
                  fontFamily="elegant"
                  fontSize="xl"
                  fontWeight="600"
                  color="secondary.navy"
                  lineHeight="1.3"
                  letterSpacing="0.01em"
                >
                  {event.title}
                </Text>
                <Text
                  fontFamily="elegant"
                  fontSize="sm"
                  color="primary.soft"
                  textTransform="uppercase"
                  letterSpacing="0.15em"
                  fontWeight="500"
                >
                  {event.day}
                </Text>
              </Box>
              <Box
                bg="secondary.navy"
                color="white"
                px={4}
                py={1.5}
                borderRadius="full"
                fontFamily="elegant"
                fontSize="sm"
                fontWeight="bold"
                letterSpacing="0.05em"
              >
                {event.code}
              </Box>
              <Text
                fontFamily="elegant"
                fontSize="md"
                color="neutral.muted"
                lineHeight="1.8"
              >
                {event.description}
              </Text>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </VStack>
  )
}

// Check if this is the dress code question
function isDressCodeQuestion(question: string): boolean {
  const dressCodeKeywords = ['dress code', 'dresscode', 'código de vestimenta', 'code vestimentaire', 'dresscode', 'kleding']
  return dressCodeKeywords.some(keyword => 
    question.toLowerCase().includes(keyword.toLowerCase())
  )
}

function isTransportationQuestion(question: string): boolean {
  const keywords = ['transportation', 'transporte', 'vervoersopties']
  return keywords.some((keyword) => question.toLowerCase().includes(keyword))
}

function isParkingQuestion(question: string): boolean {
  const keywords = ['parking', 'estacionamiento', 'parkeerruimte']
  return keywords.some((keyword) => question.toLowerCase().includes(keyword))
}

function isArrivalQuestion(question: string): boolean {
  const keywords = ['what time should i arrive', 'a qué hora debo llegar', 'hoe laat moet ik aankomen']
  return keywords.some((keyword) => question.toLowerCase().includes(keyword))
}

function isWhenAndWhereQuestion(question: string): boolean {
  const keywords = ['when and where is the wedding', 'cuándo y dónde es la boda', 'wanneer en waar is de bruiloft']
  return keywords.some((keyword) => question.toLowerCase().includes(keyword))
}

function WeddingWhenWhereAnswer({ answer }: { answer: string }) {
  const { t } = useTranslation()

  return (
    <VStack align="stretch" spacing={5}>
      <Text whiteSpace="pre-line" fontFamily="elegant" lineHeight="1.9">
        {answer}
      </Text>

      <Text fontFamily="elegant" lineHeight="1.9">
        <Link as={RouterLink} to="/#timeline" color="primary.deep" textDecoration="underline" _hover={{ color: 'primary.main' }}>
          {t('faq.timelineLinkLabel', 'See the detailed timeline')}
        </Link>
      </Text>

      <VStack align="flex-start" spacing={1}>
        <Text fontWeight="700" fontSize="md" color="neutral.dark">
          {t('parking.addressLabel', 'Address:')}
        </Text>
        <Text fontSize="sm" lineHeight="1.9" color="neutral.dark">
          962 Rte du Pujolet, 31570
          <br />
          Vallesvilles, France
        </Text>
      </VStack>

      <Box
        as="a"
        href="https://maps.google.com/?q=Chateau+du+Pujolet+Vallesvilles+France"
        target="_blank"
        rel="noopener noreferrer"
        w="100%"
        maxW="420px"
        h={["220px", "260px"]}
        borderRadius="lg"
        overflow="hidden"
        border="2px solid"
        borderColor="primary.soft"
        display="block"
      >
        <Box
          as="iframe"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2829.1030073649417!2d1.6686848261739966!3d43.60036382110467!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12ae91b47b91454d%3A0xc512c55b21a49017!2sCh%C3%A2teau%20du%20Pujolet!5e1!3m2!1sen!2snl!4v1785588318612!5m2!1sen!2snl"
          w="100%"
          h="100%"
          frameBorder="0"
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          title={t('parking.mapTitle', 'Venue map')}
          style={{ pointerEvents: 'none' }}
        />
      </Box>
    </VStack>
  )
}

export function FaqSection() {
  const { t } = useTranslation()
  const { hash } = useLocation()

  // Get FAQ items from translations
  const faqItems: FaqItem[] = t('faq.items', { returnObjects: true }) as FaqItem[]

  const dressCodeIndex = faqItems.findIndex(item => isDressCodeQuestion(item.question))
  
  // Check if hash matches any dress code related ID
  const isDressCodeHash = hash === '#dress-code' || 
                         hash === '#dress-code-welcome' || 
                         hash === '#dress-code-wedding' || 
                         hash === '#dress-code-brunch'

  const defaultIndices = isDressCodeHash && dressCodeIndex !== -1 ? [dressCodeIndex] : []

  useEffect(() => {
    if (isDressCodeHash) {
      // Small timeout to allow rendering
      setTimeout(() => {
        // If specific event hash, scroll to that event card
        // Otherwise scroll to the main accordion item
        const targetId = hash === '#dress-code' ? 'dress-code' : hash.substring(1)
        const element = document.getElementById(targetId)
        
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 500)
    }
  }, [hash, isDressCodeHash])

  return (
    <Box py={[16, 20, 24]} bg="neutral.light">
      <Container maxW="container.md">
        <VStack spacing={12}>
          {/* Section Header */}
          <ScrollReveal>
            <VStack spacing={4} textAlign="center">
              <Text
                fontFamily="elegant"
                fontSize="sm"
                textTransform="uppercase"
                letterSpacing="0.35em"
                color="primary.soft"
                fontWeight="500"
              >
                {t('faq.label')}
              </Text>
              <Heading
                as="h1"
                fontFamily="elegant"
                fontSize={['3xl', '4xl', '5xl']}
                fontWeight="400"
                color="secondary.navy"
                letterSpacing="0.02em"
              >
                {t('faq.title')}
              </Heading>
              <Divider borderColor="primary.soft" w="120px" mx="auto" my={2} />
              <Text
                fontFamily="elegant"
                fontSize={['md', 'lg']}
                color="neutral.dark"
                maxW="500px"
                lineHeight="1.9"
                fontStyle="italic"
              >
                {t('faq.description')}
              </Text>
            </VStack>
          </ScrollReveal>

          {/* FAQ Accordion */}
          <StaggerContainer>
            <Accordion allowMultiple width="100%" defaultIndex={defaultIndices}>
              {Array.isArray(faqItems) && faqItems.map((item, index) => (
                <StaggerItem key={index}>
                  <AccordionItem
                    border="none"
                    mb={4}
                    bg="white"
                    borderRadius="lg"
                    boxShadow="sm"
                    overflow="hidden"
                    id={isDressCodeQuestion(item.question) ? "dress-code" : undefined}
                  >
                    <AccordionButton
                      py={5}
                      px={6}
                      _hover={{ bg: 'gray.50' }}
                      _expanded={{ bg: 'neutral.dark', color: 'white' }}
                    >
                      <Box
                        flex="1"
                        textAlign="left"
                        fontFamily="elegant"
                        fontSize={['lg', 'xl']}
                        fontWeight="500"
                        letterSpacing="0.01em"
                      >
                        {item.question}
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel
                      py={5}
                      px={6}
                      fontFamily="elegant"
                      fontSize={['md', 'lg']}
                      color="neutral.dark"
                      lineHeight="1.9"
                    >
                      {isDressCodeQuestion(item.question) ? (
                        <DressCodeAnswer />
                      ) : isWhenAndWhereQuestion(item.question) ? (
                        <WeddingWhenWhereAnswer answer={item.answer} />
                      ) : (
                        <Text 
                          whiteSpace="pre-line" 
                          fontFamily="elegant"
                          lineHeight="1.9"
                        >
                          {isTransportationQuestion(item.question) ? (
                            <>
                              {item.answer}{' '}
                              <Link as={RouterLink} to="/taxi" color="primary.deep" textDecoration="underline" _hover={{ color: 'primary.main' }}>
                                {t('faq.transportationLinkLabel', 'See our taxi page')}
                              </Link>
                            </>
                          ) : isParkingQuestion(item.question) ? (
                            <>
                              {item.answer}{' '}
                              <Link as={RouterLink} to="/parking" color="primary.deep" textDecoration="underline" _hover={{ color: 'primary.main' }}>
                                {t('faq.parkingLinkLabel', 'See our parking page')}
                              </Link>
                            </>
                          ) : isArrivalQuestion(item.question) ? (
                            <>
                              {item.answer}{' '}
                              <Link as={RouterLink} to="/#timeline" color="primary.deep" textDecoration="underline" _hover={{ color: 'primary.main' }}>
                                {t('faq.timelineLinkLabel', 'See the detailed timeline')}
                              </Link>
                            </>
                          ) : (
                            item.answer
                          )}
                        </Text>
                      )}
                    </AccordionPanel>
                  </AccordionItem>
                </StaggerItem>
              ))}
            </Accordion>
          </StaggerContainer>

          {/* Contact Note */}
          <ScrollReveal>
            <Box
              textAlign="center"
              p={6}
              bg="white"
              borderRadius="lg"
              boxShadow="sm"
            >
              <Text
                fontFamily="elegant"
                fontSize={['md', 'lg']}
                color="neutral.dark"
                fontStyle="italic"
                lineHeight="1.8"
              >
                <Trans
                  i18nKey="faq.contactNote"
                  components={{
                    emailLink: (
                      <Link
                        href="mailto:carolinaandthomaswedding@gmail.com"
                        color="primary.deep"
                        textDecoration="underline"
                        _hover={{ color: 'primary.main' }}
                      />
                    )
                  }}
                />
              </Text>
            </Box>
          </ScrollReveal>
        </VStack>
      </Container>
    </Box>
  )
}

export default FaqSection
