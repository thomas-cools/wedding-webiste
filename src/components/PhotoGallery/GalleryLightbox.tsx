import {
  Box,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  IconButton,
  HStack,
  VStack,
  Text,
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { GalleryImage } from './types'

const MotionBox = motion(Box)
const MotionImage = motion(Image)

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

export interface GalleryLightboxProps {
  /** Whether the lightbox is open */
  isOpen: boolean
  /** Callback to close the lightbox */
  onClose: () => void
  /** Array of images */
  images: GalleryImage[]
  /** Currently selected image index */
  selectedIndex: number
  /** Navigate to previous image */
  onPrevious: () => void
  /** Navigate to next image */
  onNext: () => void
  /** Touch event handlers for swipe support */
  touchHandlers?: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: () => void
  }
}

/**
 * Lightbox modal for displaying gallery images in full screen.
 * Supports navigation via buttons, keyboard arrows, and touch swipes.
 */
export function GalleryLightbox({
  isOpen,
  onClose,
  images,
  selectedIndex,
  onPrevious,
  onNext,
  touchHandlers,
}: GalleryLightboxProps) {
  const { t } = useTranslation()
  const selectedImage = images[selectedIndex]

  if (!selectedImage) return null

  return (
    <>
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
          {...touchHandlers}
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
                onClick={onPrevious}
                variant="ghost"
                color="white"
                fontSize="4xl"
                size="lg"
                _hover={{ bg: 'whiteAlpha.200' }}
                display={['none', 'flex']}
              />

              {/* Image with animation */}
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
                      {selectedImage.srcWebp && (
                        <source srcSet={selectedImage.srcWebp} type="image/webp" />
                      )}
                      <MotionImage
                        src={selectedImage.src}
                        alt={selectedImage.alt}
                        maxH="75vh"
                        maxW="80vw"
                        objectFit="contain"
                        borderRadius="md"
                      />
                    </picture>
                    {selectedImage.caption && (
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
                onClick={onNext}
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
    </>
  )
}
