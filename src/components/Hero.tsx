import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Button,
  Flex,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { motion, useScroll, useTransform } from 'framer-motion'
import { MotionBox, heroFadeIn, heroStagger } from './animations'

const MotionImg = motion.img

/**
 * Responsive image configuration for the hero background.
 * Provide multiple sizes for optimal loading on different devices.
 */
export interface HeroImageSet {
  /** Mobile image (750px wide, portrait) */
  mobile?: string
  /** Tablet image (1280px wide) */
  tablet?: string
  /** Desktop image (1920px wide) */
  desktop: string
  /** High-res desktop image (2560px wide, for retina displays) */
  desktop2x?: string
  /** WebP versions for better compression (optional) */
  webp?: {
    mobile?: string
    tablet?: string
    desktop?: string
    desktop2x?: string
  }
  /** Alt text for accessibility */
  alt?: string
}

interface HeroProps {
  /** Single background image URL (simple usage) */
  backgroundImage?: string
  /** Responsive image set (recommended for production) */
  imageSet?: HeroImageSet
  /** Overlay opacity (0-1, default: 0.3) */
  overlayOpacity?: number

  /** Optional collage overlay to mimic the original baked-in banner layout */
  collage?: {
    envelopeSrc: string
    venueSrc: string
    stampSrc: string
  }

  /** Whether to show the scroll indicator link (default: true) */
  showScrollIndicator?: boolean
  /** Where the scroll indicator should link to (default: #story) */
  scrollIndicatorHref?: string
}

export default function Hero({
  backgroundImage,
  imageSet,
  overlayOpacity = 0.3,
  collage,
  showScrollIndicator = true,
  scrollIndicatorHref = '#story',
}: HeroProps) {
  const { t } = useTranslation()
  
  // Parallax scroll effect
  const { scrollY } = useScroll()
  const backgroundY = useTransform(scrollY, [0, 500], [0, 150])
  const overlayOpacityAnim = useTransform(scrollY, [0, 300], [overlayOpacity, overlayOpacity + 0.3])
  
  // Determine if we have any background image
  const hasBackground = Boolean(backgroundImage || imageSet)
  
  // For simple backgroundImage prop, use CSS background
  // For imageSet, we'll use a proper <picture> element
  const useImageElement = Boolean(imageSet)

  return (
    <Box
      as="section"
      id="hero"
      position="relative"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      bg="chateau.stone"
    >
      {/* Responsive Background Image using <picture> element */}
      {useImageElement && imageSet && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          overflow="hidden"
        >
          <Box
            as="picture"
            display="block"
            w="100%"
            h="100%"
          >
            {/* WebP sources (best compression) */}
            {imageSet.webp?.desktop2x && (
              <source
                media="(min-width: 1920px)"
                srcSet={imageSet.webp.desktop2x}
                type="image/webp"
              />
            )}
            {imageSet.webp?.desktop && (
              <source
                media="(min-width: 1024px)"
                srcSet={imageSet.webp.desktop}
                type="image/webp"
              />
            )}
            {imageSet.webp?.tablet && (
              <source
                media="(min-width: 768px)"
                srcSet={imageSet.webp.tablet}
                type="image/webp"
              />
            )}
            {imageSet.webp?.mobile && (
              <source
                srcSet={imageSet.webp.mobile}
                type="image/webp"
              />
            )}
            
            {/* JPEG/PNG fallback sources */}
            {imageSet.desktop2x && (
              <source
                media="(min-width: 1920px)"
                srcSet={imageSet.desktop2x}
              />
            )}
            {imageSet.desktop && (
              <source
                media="(min-width: 1024px)"
                srcSet={imageSet.desktop}
              />
            )}
            {imageSet.tablet && (
              <source
                media="(min-width: 768px)"
                srcSet={imageSet.tablet}
              />
            )}
            
            {/* Fallback image */}
            <Box
              as="img"
              src={imageSet.mobile || imageSet.desktop}
              alt={imageSet.alt || 'Wedding hero background'}
              loading="eager"
              w="100%"
              h="100%"
              objectFit="cover"
              objectPosition="center"
            />
          </Box>
        </Box>
      )}

      {/* Simple CSS Background Image with Parallax */}
      {!useImageElement && backgroundImage && (
        <MotionBox
          position="absolute"
          top={"-50px"}
          left={0}
          right={0}
          bottom={"-50px"}
          style={{ y: backgroundY }}
        >
          <Box
            as="img"
            src={backgroundImage}
            alt="Wedding hero background"
            loading="eager"
            decoding="async"
            w="100%"
            h="100%"
            objectFit="cover"
            objectPosition="center"
          />
        </MotionBox>
      )}
      
      {/* Animated Overlay */}
      {hasBackground && (
        <MotionBox
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="black"
          style={{ opacity: overlayOpacityAnim }}
          pointerEvents="none"
        />
      )}

      {/* Collage overlays (above the dark overlay so the envelope reads clearly) */}
      {hasBackground && collage && (
        <Box position="absolute" inset={0} pointerEvents="none" zIndex={1}>
          {/* Cursive headline */}
          <Text
            position="absolute"
            top={['12%', '11%', '10%']}
            left="50%"
            transform="translateX(-50%)"
            fontFamily="accent"
            fontStyle="italic"
            fontWeight="400"
            fontSize={['46px', '64px', '78px']}
            lineHeight="1"
            color="whiteAlpha.900"
            whiteSpace="nowrap"
          >
            {t('hero.invited')}
          </Text>

          {/* Envelope centered (the hero text sits on top of this) */}
          <Box
            as="img"
            src={collage.envelopeSrc}
            alt="Envelope"
            loading="eager"
            decoding="async"
            position="absolute"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            w={['300px', '460px', '600px']}
            maxW={['92vw', '80vw', '720px']}
            h="auto"
            opacity={0.98}
          />

          {/* Postcard stamp (left) */}
          <Box
            as="img"
            src={collage.stampSrc}
            alt="Decorative postcard stamp"
            loading="eager"
            decoding="async"
            position="absolute"
            top={['62%', '63%', '64%']}
            left={['6%', '10%', '16%']}
            w={['120px', '150px', '190px']}
            maxW={['34vw', '26vw', '220px']}
            h="auto"
            transform="rotate(-8deg)"
            transformOrigin="center"
            opacity={0.98}
          />

          {/* Venue postcard (right) */}
          <Box
            as="img"
            src={collage.venueSrc}
            alt="Venue postcard"
            position="absolute"
            top={['62%', '63%', '64%']}
            right={['6%', '10%', '16%']}
            w={['220px', '280px', '340px']}
            maxW={['52vw', '40vw', '420px']}
            h="auto"
            transform="rotate(6deg)"
            transformOrigin="center"
            opacity={0.98}
          />
        </Box>
      )}

      {/* Decorative Frame */}
      <MotionBox
        position="absolute"
        top={["20px", "40px"]}
        left={["20px", "40px"]}
        right={["20px", "40px"]}
        bottom={["20px", "40px"]}
        border="1px solid"
        borderColor={hasBackground ? "whiteAlpha.400" : "primary.soft"}
        pointerEvents="none"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
      />

      {/* Content */}
      <Container maxW="container.lg" position="relative" zIndex={2}>
        <MotionBox
          as={VStack}
          spacing={8}
          textAlign="center"
          initial="hidden"
          animate="visible"
          variants={heroStagger}
        >
          {/* Pre-heading */}
          <MotionBox variants={heroFadeIn}>
            <Text
              fontSize="sm"
              textTransform="uppercase"
              letterSpacing="0.35em"
              color={hasBackground ? "whiteAlpha.900" : "primary.soft"}
              fontWeight="400"
            >
              {t('hero.together')}
            </Text>
          </MotionBox>

          {/* Couple Names */}
          <MotionBox variants={heroFadeIn}>
            <Flex
              direction={["column", "row"]}
              align="center"
              justify="center"
              gap={[4, 8]}
            >
              <Heading
                as="h1"
                fontFamily="heading"
                fontSize={["5xl", "6xl", "7xl"]}
                fontWeight="300"
                color={hasBackground ? "white" : "neutral.dark"}
                letterSpacing="0.05em"
              >
                {t('hero.bride')}
              </Heading>
              
              <Text
                fontFamily="heading"
                fontSize={["3xl", "4xl", "5xl"]}
                fontWeight="300"
                color={hasBackground ? "whiteAlpha.800" : "primary.soft"}
                fontStyle="italic"
              >
                {t('hero.and')}
              </Text>
              
              <Heading
                as="h1"
                fontFamily="heading"
                fontSize={["5xl", "6xl", "7xl"]}
                fontWeight="300"
                color={hasBackground ? "white" : "neutral.dark"}
                letterSpacing="0.05em"
              >
                {t('hero.groom')}
              </Heading>
            </Flex>
          </MotionBox>

          {/* Decorative Divider */}
          <MotionBox variants={heroFadeIn}>
            <Box
              as="hr"
              border="none"
              borderTop="1px solid"
              borderColor={hasBackground ? "whiteAlpha.500" : "primary.soft"}
              width="120px"
              mx="auto"
            />
          </MotionBox>

          {/* Date */}
          <MotionBox variants={heroFadeIn}>
            <VStack spacing={2}>
              <Text
                fontFamily="heading"
                fontSize={["xl", "2xl"]}
                fontWeight="300"
                color={hasBackground ? "white" : "neutral.dark"}
                letterSpacing="0.15em"
              >
                {t('hero.date')}
              </Text>
              <Text
                fontFamily="heading"
                fontSize={["lg", "xl"]}
                fontWeight="300"
                color={hasBackground ? "whiteAlpha.900" : "neutral.muted"}
                letterSpacing="0.1em"
              >
                {t('hero.year')}
              </Text>
            </VStack>
          </MotionBox>

          {/* Venue */}
          <MotionBox variants={heroFadeIn}>
            <Text
              fontSize="sm"
              textTransform="uppercase"
              letterSpacing="0.25em"
              color={hasBackground ? "whiteAlpha.800" : "neutral.muted"}
              fontWeight="400"
            >
              {t('hero.venue')}
            </Text>
          </MotionBox>

          {/* CTA Button */}
          <MotionBox
            variants={heroFadeIn}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              as="a"
              href="#rsvp"
              variant={hasBackground ? "outline" : "primary"}
              size="lg"
              mt={8}
              color={hasBackground ? "white" : undefined}
              borderColor={hasBackground ? "white" : undefined}
              _hover={{
                bg: hasBackground ? "whiteAlpha.200" : undefined,
                transform: "translateY(-2px)",
              }}
              transition="all 0.3s ease"
            >
              {t('hero.respond')}
            </Button>
          </MotionBox>
        </MotionBox>
      </Container>

      {/* Scroll Indicator */}
      {showScrollIndicator && (
        <Box
          position="absolute"
          bottom={["40px", "60px"]}
          left="50%"
          transform="translateX(-50%)"
          textAlign="center"
        >
          <Box
            as="a"
            href={scrollIndicatorHref}
            display="block"
            animation="bounce 2s infinite"
            sx={{
              '@keyframes bounce': {
                '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' },
                '40%': { transform: 'translateY(-10px)' },
                '60%': { transform: 'translateY(-5px)' },
              },
            }}
          >
            <Box
              w="30px"
              h="50px"
              border="2px solid"
              borderColor={hasBackground ? "whiteAlpha.600" : "primary.soft"}
              borderRadius="full"
              position="relative"
              mx="auto"
              _before={{
                content: '""',
                position: 'absolute',
                top: '8px',
                left: '50%',
                transform: 'translateX(-50%)',
                w: '4px',
                h: '8px',
                bg: hasBackground ? "whiteAlpha.600" : "primary.soft",
                borderRadius: 'full',
              }}
            />
          </Box>
        </Box>
      )}
    </Box>
  )
}
