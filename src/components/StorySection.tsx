import { Box, Container, VStack, Text, Heading, Flex, Image } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ScrollReveal, fadeInLeft, fadeInRight } from './animations';

// Import responsive background images
import bgMobile from '../assets/simple_smooth_background-mobile.webp';
import bgTablet from '../assets/simple_smooth_background-tablet.webp';
import bgDesktop from '../assets/simple_smooth_background-desktop.webp';

// Import story section assets
import usImageMain from '../assets/us-image-main.svg';
import belgiumFlower from '../assets/Belgium_flower-red.svg';

// CSS filter to change the flower color to muted blue (#94B1C8) with low opacity
const FLOWER_COLOR_FILTER = 'sepia(100%) saturate(150%) hue-rotate(180deg) brightness(90%) opacity(0.25)';

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

      {/* Belgium flower decoration - large subtle background element on right */}
      <Box
        position="absolute"
        top="50%"
        right={["-100px", "-80px", "-60px"]}
        transform="translateY(-50%)"
        w={["300px", "400px", "500px"]}
        h={["300px", "400px", "500px"]}
        zIndex={0}
        pointerEvents="none"
      >
        <Image
          src={belgiumFlower}
          alt=""
          w="100%"
          h="100%"
          objectFit="contain"
          filter={FLOWER_COLOR_FILTER}
        />
      </Box>

      <Container maxW="container.lg" position="relative" zIndex={1}>
        <VStack spacing={12}>
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
            </VStack>
          </ScrollReveal>

          {/* Story Content - Image + Text Layout */}
          <Flex 
            direction={["column", "column", "row"]} 
            gap={[8, 10, 12]} 
            align="flex-start"
            maxW="900px"
            position="relative"
          >
            {/* Left side - Circular photo with decorative frame */}
            <ScrollReveal variants={fadeInLeft}>
              <Box position="relative" w={["200px", "220px", "240px"]} mx={["auto", "auto", 0]}>
                {/* Circular couple photo with decorative frame */}
                <Image
                  src={usImageMain}
                  alt={t('story.coupleAlt', 'Carolina and Thomas')}
                  w="100%"
                  h="auto"
                />
              </Box>
            </ScrollReveal>

            {/* Right side - Text content */}
            <ScrollReveal variants={fadeInRight} flex={1}>
              <VStack align={["center", "center", "flex-start"]} spacing={5} textAlign={["center", "center", "left"]}>
                <Text fontSize={["md", "lg"]} lineHeight="1.9" color="neutral.dark">
                  {t('story.paragraph1')}
                </Text>
                <Text fontSize={["md", "lg"]} lineHeight="1.9" color="neutral.dark">
                  {t('story.paragraph2')}
                </Text>
              </VStack>
            </ScrollReveal>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
}
