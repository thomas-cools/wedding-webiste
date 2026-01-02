import { useCallback } from 'react'
import { Box, Container, Heading, Text, VStack, Image, useDisclosure } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { ScrollReveal, fadeInUp } from '../animations'
import { GalleryLightbox } from './GalleryLightbox'
import { useGalleryNavigation } from './useGalleryNavigation'
import type { GalleryImage, PhotoGalleryProps } from './types'

// Import responsive background images
import bgMobile from '../../assets/simple_smooth_background-mobile.webp'
import bgTablet from '../../assets/simple_smooth_background-tablet.webp'
import bgDesktop from '../../assets/simple_smooth_background-desktop.webp'

// Import decorative assets
import belgiumFlower from '../../assets/Belgium_flower.svg'
import tcLogo from '../../assets/tc_logo.svg'

// Import couple photos
import photo2017 from '../../assets/C&T-2017.webp'
import photo2018 from '../../assets/C&T-2018.webp'
import photo2019 from '../../assets/C&T-2019.webp'
import photo2020 from '../../assets/C&T-2020.webp'
import photo2021 from '../../assets/C&T-2021.webp'
import photo2022 from '../../assets/C&T-2022.webp'
import photo2023 from '../../assets/C&T-2023.webp'
import photo2024 from '../../assets/C&T-2024.webp'

// Gallery images with our actual photos
const defaultImages: GalleryImage[] = [
  { src: photo2017, alt: 'Carolina and Thomas 2017', aspectRatio: 3 / 4 },
  { src: photo2018, alt: 'Carolina and Thomas 2018', aspectRatio: 4 / 3 },
  { src: photo2019, alt: 'Carolina and Thomas 2019', aspectRatio: 3 / 4 },
  { src: photo2020, alt: 'Carolina and Thomas 2020', aspectRatio: 4 / 3 },
  { src: photo2021, alt: 'Carolina and Thomas 2021', aspectRatio: 3 / 4 },
  { src: photo2022, alt: 'Carolina and Thomas 2022', aspectRatio: 4 / 3 },
  { src: photo2023, alt: 'Carolina and Thomas 2023', aspectRatio: 3 / 4 },
  { src: photo2024, alt: 'Carolina and Thomas 2024', aspectRatio: 4 / 3 },
]

// Photo layout configuration for scattered organic layout
// Each photo has position (left/right alignment), size, and offset
const photoLayouts = [
  { align: 'left', width: ['120px', '140px', '160px'], ml: ['5%', '10%', '15%'], mr: 'auto', mt: 0 },
  { align: 'right', width: ['130px', '160px', '180px'], ml: 'auto', mr: ['15%', '20%', '25%'], mt: ['-30px', '-40px', '-50px'] },
  { align: 'left', width: ['110px', '130px', '150px'], ml: ['8%', '5%', '8%'], mr: 'auto', mt: ['20px', '30px', '40px'] },
  { align: 'right', width: ['140px', '170px', '200px'], ml: 'auto', mr: ['5%', '10%', '12%'], mt: ['-20px', '-30px', '-40px'] },
  { align: 'left', width: ['100px', '120px', '140px'], ml: ['3%', '8%', '10%'], mr: 'auto', mt: ['30px', '40px', '50px'] },
  { align: 'right', width: ['130px', '160px', '190px'], ml: 'auto', mr: ['8%', '15%', '18%'], mt: ['-10px', '-20px', '-30px'] },
  { align: 'left', width: ['90px', '110px', '130px'], ml: ['10%', '12%', '15%'], mr: 'auto', mt: ['20px', '30px', '40px'] },
  { align: 'right', width: ['150px', '180px', '210px'], ml: 'auto', mr: ['10%', '15%', '20%'], mt: ['-40px', '-50px', '-60px'] },
]

/**
 * Photo gallery section with organic scattered layout.
 * 
 * Features:
 * - Textured linen background
 * - Scattered/organic photo layout
 * - Belgium flower decorations
 * - TC monogram accent
 * - Full-screen lightbox modal
 * - Keyboard navigation (arrow keys, escape)
 * - Touch/swipe support on mobile
 */
export function PhotoGallery({
  images = defaultImages,
}: PhotoGalleryProps) {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const {
    selectedIndex,
    setSelectedIndex,
    goToPrevious,
    goToNext,
    touchHandlers,
  } = useGalleryNavigation({
    totalItems: images.length,
    isActive: isOpen,
    onClose,
  })

  const openLightbox = useCallback(
    (index: number) => {
      setSelectedIndex(index)
      onOpen()
    },
    [setSelectedIndex, onOpen]
  )

  if (images.length === 0) {
    return null
  }

  return (
    <Box id="gallery" position="relative" overflow="hidden">
      {/* Background with responsive images */}
      <Box position="absolute" inset={0} zIndex={0}>
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
        {/* Subtle overlay for cohesion */}
        <Box position="absolute" inset={0} bg="whiteAlpha.300" />
      </Box>

      {/* Belgium flower decoration - top right */}
      <Box
        position="absolute"
        top={["-20px", "-40px", "-60px"]}
        right={["-60px", "-40px", "-20px"]}
        w={["200px", "300px", "400px"]}
        h={["200px", "300px", "400px"]}
        zIndex={0}
        pointerEvents="none"
        opacity={0.25}
      >
        <Image
          src={belgiumFlower}
          alt=""
          w="100%"
          h="100%"
          objectFit="contain"
        />
      </Box>

      {/* Belgium flower decoration - bottom right */}
      <Box
        position="absolute"
        bottom={["50px", "80px", "100px"]}
        right={["-80px", "-60px", "-40px"]}
        w={["180px", "250px", "350px"]}
        h={["180px", "250px", "350px"]}
        zIndex={0}
        pointerEvents="none"
        opacity={0.2}
        transform="rotate(180deg)"
      >
        <Image
          src={belgiumFlower}
          alt=""
          w="100%"
          h="100%"
          objectFit="contain"
        />
      </Box>

      <Container maxW="container.lg" pt={["100px", "120px", "140px"]} pb={[16, 20, 24]} position="relative" zIndex={1}>
        {/* Section Header */}
        <ScrollReveal>
          <VStack spacing={4} mb={[10, 12, 16]} textAlign="center">
            <Text
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="0.35em"
              color="primary.soft"
              fontWeight="500"
            >
              {t('gallery.preheading')}
            </Text>
            <Heading
              as="h2"
              fontFamily="heading"
              fontSize={['3xl', '4xl', '5xl']}
              fontWeight="300"
              color="neutral.dark"
              letterSpacing="0.02em"
            >
              {t('gallery.title')}
            </Heading>
          </VStack>
        </ScrollReveal>

        {/* Scattered Photo Layout */}
        <Box position="relative" pb={[8, 12, 16]}>
          {images.map((image, index) => {
            const layout = photoLayouts[index % photoLayouts.length]
            const isLastPhoto = index === images.length - 1
            
            return (
              <ScrollReveal key={index} variants={fadeInUp} delay={index * 0.1}>
                <Box
                  position="relative"
                  w={layout.width}
                  ml={layout.ml}
                  mr={layout.mr}
                  mt={index === 0 ? 0 : layout.mt}
                  mb={[4, 5, 6]}
                >
                  {/* Photo container */}
                  <Box
                    position="relative"
                    overflow="hidden"
                    boxShadow="lg"
                    cursor="pointer"
                    transition="transform 0.3s ease, box-shadow 0.3s ease"
                    _hover={{
                      transform: 'scale(1.02)',
                      boxShadow: 'xl',
                    }}
                    onClick={() => openLightbox(index)}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      w="100%"
                      h="auto"
                      display="block"
                    />
                  </Box>

                  {/* TC Monogram on the last photo */}
                  {isLastPhoto && (
                    <Box
                      position="absolute"
                      bottom={["-50px", "-60px", "-70px"]}
                      right={["-40px", "-50px", "-60px"]}
                      w={["80px", "100px", "120px"]}
                      h={["80px", "100px", "120px"]}
                      zIndex={2}
                      pointerEvents="none"
                    >
                      <Image
                        src={tcLogo}
                        alt=""
                        w="100%"
                        h="100%"
                        objectFit="contain"
                        opacity={0.6}
                      />
                    </Box>
                  )}
                </Box>
              </ScrollReveal>
            )
          })}
        </Box>
      </Container>

      {/* Lightbox Modal */}
      <GalleryLightbox
        isOpen={isOpen}
        onClose={onClose}
        images={images}
        selectedIndex={selectedIndex}
        onPrevious={goToPrevious}
        onNext={goToNext}
        touchHandlers={touchHandlers}
      />
    </Box>
  )
}

// Re-export types for external use
export type { GalleryImage, PhotoGalleryProps } from './types'
