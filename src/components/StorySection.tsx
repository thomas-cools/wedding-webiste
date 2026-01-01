import { Box, Container, VStack, Text, Heading, Flex, Image } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ScrollReveal, fadeInLeft, fadeInRight } from './animations';
import { Divider } from '@chakra-ui/react';

// Import responsive background images
import bgMobile from '../assets/simple_smooth_background-mobile.webp';
import bgTablet from '../assets/simple_smooth_background-tablet.webp';
import bgDesktop from '../assets/simple_smooth_background-desktop.webp';

export default function StorySection() {
  const { t } = useTranslation();
  return (
    <Box 
      id="story" 
      py={[20, 28]} 
      scrollMarginTop={["100px", "130px", "150px"]}
      position="relative"
      overflow="hidden"
    >
      {/* Background with responsive images using picture element pattern */}
      <Box
        position="absolute"
        inset={0}
        zIndex={0}
      >
        <picture>
          <source media="(min-width: 1024px)" srcSet={bgDesktop} />
          <source media="(min-width: 640px)" srcSet={bgTablet} />
          <Image
            src={bgMobile}
            alt=""
            position="absolute"
            inset={0}
            width="100%"
            height="100%"
            objectFit="cover"
            objectPosition="center"
          />
        </picture>
        {/* Subtle overlay for better text readability */}
        <Box
          position="absolute"
          inset={0}
          bg="whiteAlpha.400"
        />
      </Box>

      <Container maxW="container.lg" position="relative" zIndex={1}>
        <VStack spacing={16}>
          {/* Section Header */}
          <ScrollReveal>
            <VStack spacing={4} textAlign="center" maxW="600px">
              <Text 
                fontSize="xs" 
                textTransform="uppercase" 
                letterSpacing="0.35em" 
                color="primary.soft"
                fontWeight="500"
              >
                {t('story.label')}
              </Text>
              <Heading 
                as="h2" 
                fontFamily="heading" 
                fontSize={["3xl", "4xl"]} 
                fontWeight="400"
                color="neutral.dark"
              >
                {t('story.title')}
              </Heading>
              <Divider borderColor="primary.soft" w="120px" mx="auto" my={2} />
            </VStack>
          </ScrollReveal>
          {/* Story Content - Elegant Layout */}
          <Flex 
            direction={["column", "column", "row"]} 
            gap={[10, 10, 16]} 
            align="center"
            maxW="1000px"
          >
            <ScrollReveal variants={fadeInLeft} flex={1} maxW={["100%", "100%", "450px"]}>
              <Box
                borderRadius="lg"
                overflow="hidden"
                boxShadow="xl"
              >
                <Image 
                  src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2070&auto=format&fit=crop" 
                  alt="Sofia and Lucas" 
                  w="100%"
                  h={["300px", "400px", "500px"]}
                  objectFit="cover"
                />
              </Box>
            </ScrollReveal>
            <ScrollReveal variants={fadeInRight} flex={1}>
              <VStack align={["center", "center", "flex-start"]} spacing={6} textAlign={["center", "center", "left"]}>
                <Text fontSize="lg" lineHeight="1.9" color="neutral.dark">
                  {t('story.paragraph1')}
                </Text>
                <Text fontSize="lg" lineHeight="1.9" color="neutral.dark">
                  {t('story.paragraph2')}
                </Text>
                <Text 
                  fontFamily="heading" 
                  fontStyle="italic" 
                  fontSize="xl"
                  color="primary.deep" 
                  mt={4}
                >
                  "{t('story.quote')}"
                </Text>
              </VStack>
            </ScrollReveal>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
}
