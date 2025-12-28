import { Box, SimpleGrid, Image, Text, AspectRatio } from '@chakra-ui/react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { StaggerContainer, StaggerItem } from '../animations'
import type { GalleryImage } from './types'

const MotionBox = motion(Box)

export interface GalleryGridProps {
  /** Array of images to display */
  images: GalleryImage[]
  /** Number of columns on different breakpoints */
  columns: { base: number; sm: number; md: number; lg: number }
  /** Gap between images */
  gap: number
  /** Callback when an image is clicked */
  onImageClick: (index: number) => void
}

/**
 * Responsive grid of gallery thumbnails with hover effects.
 */
export function GalleryGrid({ images, columns, gap, onImageClick }: GalleryGridProps) {
  const { t } = useTranslation()

  return (
    <StaggerContainer>
      <SimpleGrid columns={columns} spacing={gap}>
        {images.map((image, index) => (
          <StaggerItem key={index}>
            <MotionBox
              cursor="pointer"
              onClick={() => onImageClick(index)}
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
                  onImageClick(index)
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
                    <Box as="span" color="white" fontSize="2xl" aria-hidden="true">
                      🔍
                    </Box>
                  </Box>
                </Box>
              </AspectRatio>
              {image.caption && (
                <Box p={3} bg="white">
                  <Text fontSize="sm" color="neutral.muted" textAlign="center">
                    {image.caption}
                  </Text>
                </Box>
              )}
            </MotionBox>
          </StaggerItem>
        ))}
      </SimpleGrid>
    </StaggerContainer>
  )
}
