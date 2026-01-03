import { useCallback } from 'react'
import { Box, Container, Heading, Text, VStack, Image, useDisclosure, Flex } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { ScrollReveal, fadeInLeft, fadeInRight } from '../animations'
import { GalleryLightbox } from './GalleryLightbox'
import { useGalleryNavigation } from './useGalleryNavigation'
import type { GalleryImage, PhotoGalleryProps } from './types'

// Import responsive background images
import bgMobile from '../../assets/textured-background-mobile.webp'
import bgTablet from '../../assets/textured-background-tablet.webp'
import bgDesktop from '../../assets/textured-background-desktop.webp'

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
import photo2025 from '../../assets/C&T-2025.webp'

// Timeline data with years and their photos
const timelineData = [
  { year: '2017', photo: photo2017, alt: 'Carolina and Thomas 2017' },
  { year: '2018', photo: photo2018, alt: 'Carolina and Thomas 2018' },
  { year: '2019', photo: photo2019, alt: 'Carolina and Thomas 2019' },
  { year: '2020', photo: photo2020, alt: 'Carolina and Thomas 2020' },
  { year: '2021', photo: photo2021, alt: 'Carolina and Thomas 2021' },
  { year: '2022', photo: photo2022, alt: 'Carolina and Thomas 2022' },
  { year: '2023', photo: photo2023, alt: 'Carolina and Thomas 2023' },
  { year: '2024', photo: photo2024, alt: 'Carolina and Thomas 2024' },
  { year: '2025', photo: photo2025, alt: 'Carolina and Thomas 2025' },
]

// Gallery images for lightbox (in chronological order)
const defaultImages: GalleryImage[] = timelineData.map(item => ({
  src: item.photo,
  alt: item.alt,
  aspectRatio: 3 / 4,
}))

interface TimelineItemProps {
  year: string
  photo: string
  alt: string
  caption: string
  storyText: string
  isLeft: boolean
  index: number
  onImageClick: (index: number) => void
  isLast: boolean
}

function TimelineItem({ year, photo, alt, caption, storyText, isLeft, index, onImageClick, isLast }: TimelineItemProps) {
  return (
    <Box position="relative" w="100%">
      {/* Year marker on the center line - Desktop */}
      <Box
        position="absolute"
        left="50%"
        transform="translateX(-50%)"
        top="0"
        zIndex={3}
        display={['none', 'none', 'flex']}
        flexDirection="column"
        alignItems="center"
      >
        <Box
          bg="primary.soft"
          color="white"
          px={5}
          py={2}
          borderRadius="full"
          fontWeight="600"
          fontSize="lg"
          boxShadow="md"
          fontFamily="heading"
        >
          {year}
        </Box>
      </Box>

      {/* Mobile: Year badge above content */}
      <Box
        display={['flex', 'flex', 'none']}
        justifyContent="center"
        mb={4}
      >
        <Box
          bg="primary.soft"
          color="white"
          px={4}
          py={2}
          borderRadius="full"
          fontWeight="600"
          fontSize="md"
          boxShadow="md"
          fontFamily="heading"
        >
          {year}
        </Box>
      </Box>

      {/* Desktop: Two-column layout */}
      <Flex
        display={['none', 'none', 'flex']}
        direction="row"
        align="flex-start"
        justify="center"
        gap={0}
        pt={14}
      >
        {/* Left column */}
        <Box flex="1" display="flex" justifyContent="flex-end" pr={10}>
          {isLeft ? (
            <ScrollReveal variants={fadeInLeft}>
              <Box maxW="300px" textAlign="right">
                <Box
                  borderRadius="lg"
                  overflow="hidden"
                  boxShadow="xl"
                  mb={3}
                  display="inline-block"
                  cursor="pointer"
                  transition="transform 0.3s ease, box-shadow 0.3s ease"
                  _hover={{ transform: 'scale(1.02)', boxShadow: '2xl' }}
                  onClick={() => onImageClick(index)}
                  position="relative"
                >
                  <Image
                    src={photo}
                    alt={alt}
                    w="260px"
                    h="auto"
                    objectFit="cover"
                  />
                  {/* TC Monogram on the last photo */}
                  {isLast && (
                    <Box
                      position="absolute"
                      bottom="-40px"
                      right="-40px"
                      w="100px"
                      h="100px"
                      zIndex={3}
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
                <Text
                  fontSize="sm"
                  fontStyle="italic"
                  color="neutral.soft"
                  mt={2}
                >
                  {caption}
                </Text>
              </Box>
            </ScrollReveal>
          ) : (
            <ScrollReveal variants={fadeInLeft}>
              <Box maxW="320px" textAlign="right" pt={4}>
                <Text fontSize="md" lineHeight="1.9" color="neutral.dark">
                  {storyText}
                </Text>
              </Box>
            </ScrollReveal>
          )}
        </Box>

        {/* Center line */}
        <Box w="4px" bg="transparent" position="relative" flexShrink={0}>
          <Box
            position="absolute"
            top={0}
            bottom={0}
            left="50%"
            transform="translateX(-50%)"
            w="3px"
            bgGradient="linear(to-b, primary.soft, accent.blush)"
            opacity={0.4}
          />
        </Box>

        {/* Right column */}
        <Box flex="1" display="flex" justifyContent="flex-start" pl={10}>
          {!isLeft ? (
            <ScrollReveal variants={fadeInRight}>
              <Box maxW="300px" textAlign="left">
                <Box
                  borderRadius="lg"
                  overflow="hidden"
                  boxShadow="xl"
                  mb={3}
                  display="inline-block"
                  cursor="pointer"
                  transition="transform 0.3s ease, box-shadow 0.3s ease"
                  _hover={{ transform: 'scale(1.02)', boxShadow: '2xl' }}
                  onClick={() => onImageClick(index)}
                  position="relative"
                >
                  <Image
                    src={photo}
                    alt={alt}
                    w="260px"
                    h="auto"
                    objectFit="cover"
                  />
                  {/* TC Monogram on the last photo */}
                  {isLast && (
                    <Box
                      position="absolute"
                      bottom="-40px"
                      left="-40px"
                      w="100px"
                      h="100px"
                      zIndex={3}
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
                <Text
                  fontSize="sm"
                  fontStyle="italic"
                  color="neutral.soft"
                  mt={2}
                >
                  {caption}
                </Text>
              </Box>
            </ScrollReveal>
          ) : (
            <ScrollReveal variants={fadeInRight}>
              <Box maxW="320px" textAlign="left" pt={4}>
                <Text fontSize="md" lineHeight="1.9" color="neutral.dark">
                  {storyText}
                </Text>
              </Box>
            </ScrollReveal>
          )}
        </Box>
      </Flex>

      {/* Mobile: Stacked layout */}
      <Box display={['block', 'block', 'none']} px={4} mb={12}>
        <Box textAlign="center" mb={4}>
          <Box
            borderRadius="lg"
            overflow="hidden"
            boxShadow="xl"
            mb={3}
            display="inline-block"
            cursor="pointer"
            transition="transform 0.3s ease, box-shadow 0.3s ease"
            _hover={{ transform: 'scale(1.02)', boxShadow: '2xl' }}
            onClick={() => onImageClick(index)}
            position="relative"
          >
            <Image
              src={photo}
              alt={alt}
              w="220px"
              h="auto"
              objectFit="cover"
              loading="eager"
            />
            {/* TC Monogram on the last photo - Mobile */}
            {isLast && (
              <Box
                position="absolute"
                bottom="-30px"
                right="-30px"
                w="70px"
                h="70px"
                zIndex={3}
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
          <Text
            fontSize="sm"
            fontStyle="italic"
            color="neutral.soft"
            mt={2}
          >
            {caption}
          </Text>
        </Box>
        <Text
          fontSize="md"
          lineHeight="1.8"
          color="neutral.dark"
          textAlign="center"
          maxW="320px"
          mx="auto"
        >
          {storyText}
        </Text>
      </Box>
    </Box>
  )
}

/**
 * Photo gallery section with vertical timeline layout.
 * 
 * Features:
 * - Textured linen background
 * - Vertical timeline from 2017 to 2025
 * - Alternating left/right photo placement
 * - Year badges on center line
 * - Photo captions and story text
 * - Belgium flower decorations
 * - TC monogram accent on final photo
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
      {/* Background with tiling texture for crisp display at any size */}
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
      >
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
        opacity={0.2}
      >
        <Image
          src={belgiumFlower}
          alt=""
          w="100%"
          h="100%"
          objectFit="contain"
        />
      </Box>

      {/* Belgium flower decoration - bottom left */}
      <Box
        position="absolute"
        bottom={["100px", "150px", "200px"]}
        left={["-80px", "-60px", "-40px"]}
        w={["180px", "250px", "350px"]}
        h={["180px", "250px", "350px"]}
        zIndex={0}
        pointerEvents="none"
        opacity={0.15}
        transform="rotate(180deg) scaleX(-1)"
      >
        <Image
          src={belgiumFlower}
          alt=""
          w="100%"
          h="100%"
          objectFit="contain"
        />
      </Box>

      <Container maxW="container.xl" pt={["100px", "120px", "140px"]} pb={[16, 20, 24]} position="relative" zIndex={1}>
        {/* Section Header */}
        <ScrollReveal>
          <VStack spacing={4} mb={[10, 14, 16]} textAlign="center">
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
              as="h1"
              fontFamily="heading"
              fontSize={['3xl', '4xl', '5xl']}
              fontWeight="300"
              color="neutral.dark"
              letterSpacing="0.02em"
            >
              {t('gallery.title')}
            </Heading>
            <Text
              fontSize={['md', 'lg']}
              color="neutral.dark"
              maxW="600px"
              lineHeight="1.8"
              mt={4}
            >
              {t('gallery.intro')}
            </Text>
          </VStack>
        </ScrollReveal>

        {/* Timeline */}
        <VStack spacing={[12, 14, 8]} w="100%" position="relative">
          {/* Vertical line - desktop only (full height) */}
          <Box
            position="absolute"
            left="50%"
            top={0}
            bottom={0}
            w="3px"
            transform="translateX(-50%)"
            bgGradient="linear(to-b, transparent, primary.soft 5%, accent.blush 95%, transparent)"
            display={['none', 'none', 'block']}
            zIndex={0}
            opacity={0.4}
          />

          {timelineData.map((item, index) => (
            <TimelineItem
              key={item.year}
              year={item.year}
              photo={item.photo}
              alt={item.alt}
              caption={t(`gallery.timeline.${item.year}.caption`, '')}
              storyText={t(`gallery.timeline.${item.year}.text`, '')}
              isLeft={index % 2 === 0}
              index={index}
              onImageClick={openLightbox}
              isLast={index === timelineData.length - 1}
            />
          ))}
        </VStack>

        {/* Closing quote */}
        <ScrollReveal>
          <Box textAlign="center" mt={[12, 16, 20]} px={4} pb={[8, 10, 12]}>
            <Text
              fontSize={['xl', '2xl']}
              fontFamily="heading"
              fontStyle="italic"
              color="primary.soft"
              maxW="700px"
              mx="auto"
            >
              {t('gallery.quote')}
            </Text>
          </Box>
        </ScrollReveal>
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
