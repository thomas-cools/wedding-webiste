import { Box, Container, VStack, Text, Heading, Flex, Image } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ScrollReveal, fadeInLeft, fadeInRight } from './animations';

// Import responsive background images
import bgMobile from '../assets/simple_smooth_background-mobile.webp';
import bgTablet from '../assets/simple_smooth_background-tablet.webp';
import bgDesktop from '../assets/simple_smooth_background-desktop.webp';

// Import story section assets
import couplePhoto from '../assets/C&T-2025.webp';
import tcLogo from '../assets/tc_logo.svg';
import belgiumFlower from '../assets/Belgium_flower-blue.svg';

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
        opacity={0.4}
      >
        <Image
          src={belgiumFlower}
          alt=""
          w="100%"
          h="100%"
          objectFit="contain"
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
            {/* Left side - Rectangular photo with monogram overlay */}
            <ScrollReveal variants={fadeInLeft}>
              <Box position="relative" w={["160px", "180px", "200px"]} mx={["auto", "auto", 0]}>
                {/* Rectangular couple photo with rounded corners */}
                <Box
                  position="relative"
                  borderRadius="lg"
                  overflow="hidden"
                  boxShadow="lg"
                >
                  <Image
                    src={couplePhoto}
                    alt={t('story.coupleAlt', 'Carolina and Thomas')}
                    w="100%"
                    h="auto"
                    display="block"
                  />
                </Box>
                {/* TC Monogram logo overlay */}
                <Box
                  position="absolute"
                  top={["-70px", "-85px", "-100px"]}
                  right="-15px"
                  w={["105px", "128px", "150px"]}
                  h={["105px", "128px", "150px"]}
                  zIndex={2}
                >
                  <Image
                    src={tcLogo}
                    alt=""
                    w="100%"
                    h="100%"
                    objectFit="contain"
                    filter="opacity(0.7)"
                  />
                </Box>
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
