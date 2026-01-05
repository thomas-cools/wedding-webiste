import { useTranslation } from 'react-i18next'
import {
  Box,
  Container,
  Button,
  HStack,
  Flex,
  Image as ChakraImage,
  VStack,
  Text,
  Heading,
  Grid,
  GridItem,
  Image
} from '@chakra-ui/react'
import { Link } from 'react-router-dom'
import { ArrowBackIcon } from '@chakra-ui/icons'
import LanguageSwitcher from '../components/LanguageSwitcher'
import PasswordGate from '../components/PasswordGate'
import Footer from '../components/Footer'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'
import { ScrollReveal } from '../components/animations'

// Import logo
import weddingLogoSmall from '../assets/monogram_websiteT&C-small.webp'
import weddingLogoMedium from '../assets/monogram_websiteT&C-medium.webp'
import weddingLogo2x from '../assets/monogram_websiteT&C-2x.webp'

// Import background for footer scallop gaps
import bgDesktop from '../assets/textured-background-desktop.webp'
import bgTablet from '../assets/textured-background-tablet.webp'
import bgMobile from '../assets/textured-background-mobile.webp'

// Assets
import tcLogo from '../assets/tc_logo.svg';
import belgiumFlower from '../assets/Belgium_flower.svg';

// Photos
import photo2017 from '../assets/C&T-2017.webp';
import photo2018 from '../assets/C&T-2018.webp';
import photo2019 from '../assets/C&T-2019.webp';
import photo2020 from '../assets/C&T-2020.webp';
import photo2021 from '../assets/C&T-2021.webp';
import photo2022 from '../assets/C&T-2022.webp';
import photo2023 from '../assets/C&T-2023.webp';
import photo2024 from '../assets/C&T-2024.webp';
import photo2025 from '../assets/C&T-2025.webp';

function GalleryPageContent() {
  const { t } = useTranslation()

  return (
    <Box minH="100vh" bg="neutral.warm" display="flex" flexDirection="column">
      {/* Minimal Header */}
      <Box 
        as="header"
        role="banner"
        py={[4, 6]} 
        position="fixed" 
        top={0} 
        left={0} 
        right={0} 
        zIndex={100}
        bg="#300F0C"
      >
        <Container maxW="container.xl" px={[4, 6, 8]}>
          <Flex justify="center" align="center" position="relative">
            {/* Back to Home - Left */}
            <HStack 
              spacing={4} 
              position="absolute"
              left={0}
            >
              <Button
                as={Link}
                to="/"
                variant="ghost"
                size="sm"
                color="#E3DFCE"
                _hover={{ bg: 'whiteAlpha.200' }}
                leftIcon={<ArrowBackIcon />}
              >
                {t('gallery.backToHome', 'Back')}
              </Button>
            </HStack>
            
            {/* Centered Logo */}
            <Link to="/">
              <ChakraImage 
                src={weddingLogoSmall} 
                srcSet={`${weddingLogoSmall} 60w, ${weddingLogoMedium} 100w, ${weddingLogo2x} 200w`}
                sizes="(max-width: 480px) 40px, (max-width: 768px) 45px, 50px"
                alt={t('header.initials')}
                h={["40px", "45px", "50px"]}
                w="auto"
                cursor="pointer"
              />
            </Link>
            
            {/* Language Switcher - Right */}
            <HStack 
              spacing={4} 
              position="absolute"
              right={0}
            >
              <LanguageSwitcher />
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Box 
        as="main" 
        id="main-content" 
        role="main" 
        tabIndex={-1}
        flex="1"
        pt={24}
        position="relative"
        overflow="hidden"
      >
        {/* Background */}
        <Box
          position="absolute"
          inset={0}
          zIndex={0}
          sx={{
            backgroundImage: [
              `url(${bgMobile})`,
              `url(${bgTablet})`,
              `url(${bgDesktop})`,
            ],
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
            backgroundPosition: 'center top',
          }}
        />

        {/* Decorative Flower Top Right */}
        <Box
          position="absolute"
          top="100px"
          right="-100px"
          w={["300px", "500px", "600px"]}
          zIndex={1}
          pointerEvents="none"
          sx={{
            opacity: 0.4,
            mixBlendMode: 'overlay',
            filter: 'drop-shadow(1px 1px 0px rgba(255,255,255,0.5)) drop-shadow(-1px -1px 0px rgba(0,0,0,0.2))',
          }}
        >
          <Image src={belgiumFlower} w="100%" />
        </Box>

         {/* Decorative Flower Bottom Left */}
        <Box
          position="absolute"
          bottom="-50px"
          left="-50px"
          w={["200px", "300px", "400px"]}
          zIndex={1}
          pointerEvents="none"
          transform="scaleX(-1)"
          sx={{
            opacity: 0.4,
            mixBlendMode: 'overlay',
            filter: 'drop-shadow(1px 1px 0px rgba(255,255,255,0.5)) drop-shadow(-1px -1px 0px rgba(0,0,0,0.2))',
          }}
        >
          <Image src={belgiumFlower} w="100%" />
        </Box>

        <Container maxW="container.xl" position="relative" zIndex={2} py={20}>
          <VStack spacing={16}>
            {/* Header */}
            <ScrollReveal>
              <VStack spacing={4} textAlign="center">
                <Text 
                  fontSize="xs" 
                  textTransform="uppercase" 
                  letterSpacing="0.35em" 
                  color="neutral.dark"
                  fontWeight="500"
                >
                  {t('story.label')}
                </Text>
                <Heading 
                  as="h2" 
                  fontFamily="heading" 
                  fontSize={["3xl", "4xl", "5xl"]} 
                  fontWeight="400"
                  color="primary.deep"
                >
                  {t('story.title')}
                </Heading>
              </VStack>
            </ScrollReveal>

            {/* Content Grid */}
            <Grid
              templateColumns={{ base: "1fr", lg: "1fr 1.9fr 1fr" }}
              gap={8}
              w="full"
            >
              {/* Left Column Images */}
              <GridItem display={{ base: "none", lg: "block" }}>
                 <VStack spacing={32} align="flex-start" pt={20}>
                    <Box w="80%">
                      <Image src={photo2017} alt="Carolina & Thomas 2017" borderRadius="sm" boxShadow="md" />
                    </Box>
                    <Box w="70%" ml={8}>
                      <Image src={photo2019} alt="Carolina & Thomas 2019" borderRadius="sm" boxShadow="md" />
                    </Box>
                    <Box w="85%">
                      <Image src={photo2021} alt="Carolina & Thomas 2021" borderRadius="sm" boxShadow="md" />
                    </Box>
                    <Box w="90%" ml={4}>
                      <Image src={photo2024} alt="Carolina & Thomas 2024" borderRadius="sm" boxShadow="md" />
                    </Box>
                 </VStack>
              </GridItem>

              {/* Center Column - Text + Center Image */}
              <GridItem>
                <VStack spacing={12}>
                  <Box 
                    bg="whiteAlpha.300" 
                    p={8} 
                    borderRadius="md" 
                    backdropFilter="blur(2px)"
                    textAlign="left"
                  >
                    <VStack spacing={6} align="start">
                      <Text fontSize="lg" lineHeight="1.8" color="neutral.dark">
                        {t('gallery.story.paragraph1')}
                      </Text>
                      <Text fontSize="lg" lineHeight="1.8" color="neutral.dark">
                        {t('gallery.story.paragraph2')}
                      </Text>
                      <Text fontSize="lg" lineHeight="1.8" color="neutral.dark">
                        {t('gallery.story.paragraph3')}
                      </Text>
                      <Text fontSize="lg" lineHeight="1.8" color="neutral.dark">
                        {t('gallery.story.paragraph4')}
                      </Text>
                      <Text fontSize="lg" lineHeight="1.8" color="neutral.dark">
                        {t('gallery.story.paragraph5')}
                      </Text>
                      <Text fontSize="lg" lineHeight="1.8" color="neutral.dark">
                        {t('gallery.story.paragraph6')}
                      </Text>
                      <Text fontSize="lg" lineHeight="1.8" color="neutral.dark">
                        {t('gallery.story.paragraph7')}
                      </Text>
                      <Text fontSize="lg" lineHeight="1.8" color="neutral.dark">
                        {t('gallery.story.paragraph8')}
                      </Text>
                      <Text fontSize="lg" lineHeight="1.8" color="neutral.dark">
                        {t('gallery.story.paragraph9')}
                      </Text>
                    </VStack>
                  </Box>

                  {/* Center Image */}
                  <Box w="70%" mx="auto">
                     <Image src={photo2023} alt="Carolina & Thomas 2023" borderRadius="sm" boxShadow="md" />
                  </Box>
                </VStack>
              </GridItem>

              {/* Right Column Images */}
              <GridItem display={{ base: "none", lg: "block" }}>
                <VStack spacing={40} align="flex-end" pt={40}>
                    <Box w="75%" mr={8}>
                      <Image src={photo2018} alt="Carolina & Thomas 2018" borderRadius="sm" boxShadow="md" />
                    </Box>
                    <Box w="85%">
                      <Image src={photo2020} alt="Carolina & Thomas 2020" borderRadius="sm" boxShadow="md" />
                    </Box>
                    <Box w="90%" mr={4}>
                      <Image src={photo2022} alt="Carolina & Thomas 2022" borderRadius="sm" boxShadow="md" />
                    </Box>
                    
                    {/* Bottom Right with Logo */}
                    <Box position="relative" w="80%">
                      <Image src={photo2025} alt="Carolina & Thomas 2025" borderRadius="sm" boxShadow="md" />
                      <Box 
                        position="absolute" 
                        bottom="-40px" 
                        right="-40px" 
                        w="120px" 
                        zIndex={3}
                      >
                        <Image src={tcLogo} alt="TC Logo" opacity={0.8} />
                      </Box>
                    </Box>
                </VStack>
              </GridItem>
            </Grid>
            
            {/* Mobile Layout (All Photos) */}
            <VStack display={{ base: "flex", lg: "none" }} spacing={12} w="full" pt={8}>
               <Image src={photo2017} alt="Carolina & Thomas 2017" borderRadius="sm" boxShadow="md" w="80%" alignSelf="flex-start" />
               <Image src={photo2018} alt="Carolina & Thomas 2018" borderRadius="sm" boxShadow="md" w="75%" alignSelf="flex-end" />
               <Image src={photo2019} alt="Carolina & Thomas 2019" borderRadius="sm" boxShadow="md" w="85%" alignSelf="center" />
               <Image src={photo2020} alt="Carolina & Thomas 2020" borderRadius="sm" boxShadow="md" w="70%" alignSelf="flex-start" />
               <Image src={photo2021} alt="Carolina & Thomas 2021" borderRadius="sm" boxShadow="md" w="80%" alignSelf="flex-end" />
               <Image src={photo2022} alt="Carolina & Thomas 2022" borderRadius="sm" boxShadow="md" w="75%" alignSelf="center" />
               <Image src={photo2023} alt="Carolina & Thomas 2023" borderRadius="sm" boxShadow="md" w="85%" alignSelf="flex-start" />
               <Image src={photo2024} alt="Carolina & Thomas 2024" borderRadius="sm" boxShadow="md" w="70%" alignSelf="flex-end" />
               
               {/* Final photo with logo */}
               <Box position="relative" w="80%" alignSelf="center">
                  <Image src={photo2025} alt="Carolina & Thomas 2025" borderRadius="sm" boxShadow="md" />
                  <Box 
                    position="absolute" 
                    bottom="-30px" 
                    right="-30px" 
                    w="100px" 
                    zIndex={3}
                  >
                    <Image src={tcLogo} alt="TC Logo" opacity={0.8} />
                  </Box>
               </Box>
            </VStack>

          </VStack>
        </Container>
      </Box>

      <Footer sectionAboveBgImage={bgDesktop} />
    </Box>
  )
}

export default function GalleryPage() {
  const { features } = useFeatureFlags()

  // Wrap with password gate if feature is enabled
  if (features.requirePassword) {
    return <PasswordGate bg="#300F0C"><GalleryPageContent /></PasswordGate>
  }

  return <GalleryPageContent />
}
