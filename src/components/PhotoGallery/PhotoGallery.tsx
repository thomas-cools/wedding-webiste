import { useCallback } from 'react'
import { Box, Container, Heading, Text, VStack, useDisclosure } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { ScrollReveal } from '../animations'
import { GalleryGrid } from './GalleryGrid'
import { GalleryLightbox } from './GalleryLightbox'
import { useGalleryNavigation } from './useGalleryNavigation'
import type { GalleryImage, PhotoGalleryProps } from './types'

// Placeholder images for demo (can be replaced with real images)
const defaultImages: GalleryImage[] = [
  {
    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    alt: 'Couple photo 1',
    aspectRatio: 4 / 3,
  },
  {
    src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',
    alt: 'Couple photo 2',
    aspectRatio: 3 / 4,
  },
  {
    src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80',
    alt: 'Couple photo 3',
    aspectRatio: 4 / 3,
  },
  {
    src: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80',
    alt: 'Couple photo 4',
    aspectRatio: 1,
  },
  {
    src: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800&q=80',
    alt: 'Couple photo 5',
    aspectRatio: 4 / 3,
  },
  {
    src: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&q=80',
    alt: 'Couple photo 6',
    aspectRatio: 3 / 4,
  },
]

/**
 * Photo gallery section with responsive grid and lightbox viewer.
 * 
 * Features:
 * - Responsive thumbnail grid
 * - Full-screen lightbox modal
 * - Keyboard navigation (arrow keys, escape)
 * - Touch/swipe support on mobile
 * - WebP support with fallbacks
 */
export function PhotoGallery({
  images = defaultImages,
  columns = { base: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
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
    <Box id="gallery" py={[16, 20, 24]} bg="neutral.warm">
      <Container maxW="container.xl">
        {/* Section Header */}
        <ScrollReveal>
          <VStack spacing={4} mb={12} textAlign="center">
            <Text
              fontSize="sm"
              textTransform="uppercase"
              letterSpacing="0.3em"
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
            <Box
              as="hr"
              border="none"
              borderTop="1px solid"
              borderColor="primary.soft"
              width="80px"
              opacity={0.5}
            />
            <Text fontSize="lg" color="neutral.muted" maxW="600px" fontWeight="300">
              {t('gallery.subtitle')}
            </Text>
          </VStack>
        </ScrollReveal>

        {/* Image Grid */}
        <GalleryGrid
          images={images}
          columns={columns}
          gap={gap}
          onImageClick={openLightbox}
        />
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
