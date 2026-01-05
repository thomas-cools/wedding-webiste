import { useTranslation, Trans } from 'react-i18next'
import { useLocation } from 'react-router-dom'
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
    },
    {
      title: t('faq.dressCode.wedding.title', 'The Wedding'),
      day: t('faq.dressCode.wedding.day', 'Wednesday'),
      code: t('faq.dressCode.wedding.code', 'Formal Attire'),
      description: t('faq.dressCode.wedding.description', 'This is our most elegant celebration. For women, floor-length gowns, formal midi dresses, or elegant cocktail dresses are perfect. For men, a dark suit or tuxedo. Think black-tie optional.'),
    },
    {
      title: t('faq.dressCode.brunch.title', 'Farewell Brunch'),
      day: t('faq.dressCode.brunch.day', 'Thursday Morning'),
      code: t('faq.dressCode.brunch.code', 'Smart Casual'),
      description: t('faq.dressCode.brunch.description', 'Relaxed but polished. Sundresses, linen separates, chinos with a nice shirt, or a casual blazer all work well. Comfortable and chic!'),
    },
  ]

  return (
    <VStack spacing={6} align="stretch">
      <SimpleGrid columns={1} spacing={4}>
        {events.map((event, index) => (
          <Box
            key={index}
            bg="neutral.light"
            borderRadius="lg"
            p={5}
            position="relative"
            borderTop="3px solid"
            borderColor="primary.soft"
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

export function FaqSection() {
  const { t } = useTranslation()
  const { hash } = useLocation()

  // Get FAQ items from translations
  const faqItems: FaqItem[] = t('faq.items', { returnObjects: true }) as FaqItem[]

  const dressCodeIndex = faqItems.findIndex(item => isDressCodeQuestion(item.question))
  const defaultIndices = hash === '#dress-code' && dressCodeIndex !== -1 ? [dressCodeIndex] : []

  useEffect(() => {
    if (hash === '#dress-code') {
      // Small timeout to allow rendering
      setTimeout(() => {
        const element = document.getElementById('dress-code')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 500)
    }
  }, [hash])

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
                      ) : (
                        <Text 
                          whiteSpace="pre-line" 
                          fontFamily="elegant"
                          lineHeight="1.9"
                        >
                          {item.answer}
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
