import { useState, useCallback, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  HStack,
  VStack,
  AspectRatio,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { ScrollReveal, StaggerContainer, StaggerItem } from './animations'

const MotionBox = motion(Box)
const MotionImage = motion(Image)

export interface GalleryImage {
  /** Source URL for the image */
  src: string
  /** WebP version of the image (optional) */
  srcWebp?: string
  /** Thumbnail URL (optional, falls back to src) */
  thumbnail?: string
  /** Thumbnail WebP version (optional) */
  thumbnailWebp?: string
  /** Alt text for accessibility */
  alt: string
  /** Optional caption */
  caption?: string
  /** Aspect ratio (default: 4/3) */
  aspectRatio?: number
}

export interface PhotoGalleryProps {
  /** Array of images to display */
  images?: GalleryImage[]
  /** Number of columns on different breakpoints */
  columns?: { base: number; sm: number; md: number; lg: number }
  /** Gap between images */
  gap?: number
}

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

export function PhotoGallery({
  images = defaultImages,
  columns = { base: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
}: PhotoGalleryProps) {
  const { t } = useTranslation()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectedImage = images[selectedIndex]

  const openLightbox = useCallback((index: number) => {
    setSelectedIndex(index)
    onOpen()
  }, [onOpen])

  const goToPrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }, [images.length])

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }, [images.length])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
          goToNext()
          break
        case 'Escape':
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, goToPrevious, goToNext, onClose])

  // Touch/swipe support
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    if (isLeftSwipe) goToNext()
    if (isRightSwipe) goToPrevious()
  }

  if (images.length === 0) {
    return null
  }

  return (
    <Box
      id="gallery"
      py={[16, 20, 24]}
      bg="neutral.warm"
    >
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
              fontSize={["3xl", "4xl", "5xl"]}
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
            <Text
              fontSize="lg"
              color="neutral.muted"
              maxW="600px"
              fontWeight="300"
            >
              {t('gallery.subtitle')}
            </Text>
          </VStack>
        </ScrollReveal>

        {/* Image Grid */}
        <StaggerContainer>
          <SimpleGrid columns={columns} spacing={gap}>
            {images.map((image, index) => (
              <StaggerItem key={index}>
                <MotionBox
                  cursor="pointer"
                  onClick={() => openLightbox(index)}
                  borderRadius="lg"
                  overflow="hidden"
                  boxShadow="md"
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${t('gallery.viewImage')} ${index + 1}: ${image.alt}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openLightbox(index)
                    }
                  }}
                >
                  <AspectRatio ratio={image.aspectRatio || 4 / 3}>
                    <Box position="relative">
                      <picture>
                        {image.thumbnailWebp && (
                          <source srcSet={image.thumbnailWebp} type="image/webp" />
                        )}
                        {image.srcWebp && !image.thumbnailWebp && (
                          <source srcSet={image.srcWebp} type="image/webp" />
                        )}
                        <Image
                          src={image.thumbnail || image.src}
                          alt={image.alt}
                          objectFit="cover"
                          w="100%"
                          h="100%"
                          loading="lazy"
                          transition="transform 0.3s ease"
                          _groupHover={{ transform: 'scale(1.05)' }}
                        />
                      </picture>
                      {/* Hover overlay */}
                      <Box
                        position="absolute"
                        inset={0}
                        bg="blackAlpha.400"
                        opacity={0}
                        transition="opacity 0.3s ease"
                        _groupHover={{ opacity: 1 }}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Box
                          as="span"
                          color="white"
                          fontSize="2xl"
                          aria-hidden="true"
                        >
                          🔍
                        </Box>
                      </Box>
                    </Box>
                  </AspectRatio>
                  {image.caption && (
                    <Box
                      p={3}
                      bg="white"
                    >
                      <Text
                        fontSize="sm"
                        color="neutral.muted"
                        textAlign="center"
                      >
                        {image.caption}
                      </Text>
                    </Box>
                  )}
                </MotionBox>
              </StaggerItem>
            ))}
          </SimpleGrid>
        </StaggerContainer>
      </Container>

      {/* Lightbox Modal */}
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="6xl"
        isCentered
        motionPreset="scale"
      >
        <ModalOverlay bg="blackAlpha.900" />
        <ModalContent
          bg="transparent"
          boxShadow="none"
          maxW="95vw"
          maxH="95vh"
          m={4}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <ModalCloseButton
            color="white"
            size="lg"
            top={-12}
            right={0}
            _hover={{ bg: 'whiteAlpha.200' }}
            aria-label={t('gallery.close')}
          />
          <ModalBody p={0} display="flex" alignItems="center" justifyContent="center">
            <HStack spacing={4} w="100%" justify="center" align="center">
              {/* Previous Button */}
              <IconButton
                aria-label={t('gallery.previous')}
                icon={<ChevronLeftIcon />}
                onClick={goToPrevious}
                variant="ghost"
                color="white"
                fontSize="4xl"
                size="lg"
                _hover={{ bg: 'whiteAlpha.200' }}
                display={['none', 'flex']}
              />

              {/* Image */}
              <AnimatePresence mode="wait">
                <MotionBox
                  key={selectedIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  maxW="80vw"
                  maxH="85vh"
                >
                  <VStack spacing={4}>
                    <picture>
                      {selectedImage?.srcWebp && (
                        <source srcSet={selectedImage.srcWebp} type="image/webp" />
                      )}
                      <MotionImage
                        src={selectedImage?.src}
                        alt={selectedImage?.alt}
                        maxH="75vh"
                        maxW="80vw"
                        objectFit="contain"
                        borderRadius="md"
                      />
                    </picture>
                    {selectedImage?.caption && (
                      <Text color="white" fontSize="lg" textAlign="center">
                        {selectedImage.caption}
                      </Text>
                    )}
                    <Text color="whiteAlpha.700" fontSize="sm">
                      {selectedIndex + 1} / {images.length}
                    </Text>
                  </VStack>
                </MotionBox>
              </AnimatePresence>

              {/* Next Button */}
              <IconButton
                aria-label={t('gallery.next')}
                icon={<ChevronRightIcon />}
                onClick={goToNext}
                variant="ghost"
                color="white"
                fontSize="4xl"
                size="lg"
                _hover={{ bg: 'whiteAlpha.200' }}
                display={['none', 'flex']}
              />
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Mobile swipe hint */}
      {isOpen && (
        <Box
          position="fixed"
          bottom={4}
          left="50%"
          transform="translateX(-50%)"
          display={['block', 'none']}
          zIndex="modal"
        >
          <Text color="whiteAlpha.600" fontSize="sm">
            {t('gallery.swipeHint')}
          </Text>
        </Box>
      )}
    </Box>
  )
}

// Simple chevron icons (to avoid adding another dependency)
function ChevronLeftIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
