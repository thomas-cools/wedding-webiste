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
import { MotionBox, heroFadeIn, heroStagger } from './animations'

interface HeroProps {
  backgroundImage?: string
}

export default function Hero({ backgroundImage }: HeroProps) {
  const { t } = useTranslation()

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
      {/* Background Image with Overlay */}
      {backgroundImage && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          backgroundImage={`url(${backgroundImage})`}
          backgroundSize="cover"
          backgroundPosition="center"
          backgroundRepeat="no-repeat"
          _after={{
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bg: 'rgba(0, 0, 0, 0.3)',
          }}
        />
      )}

      {/* Decorative Frame */}
      <MotionBox
        position="absolute"
        top={["20px", "40px"]}
        left={["20px", "40px"]}
        right={["20px", "40px"]}
        bottom={["20px", "40px"]}
        border="1px solid"
        borderColor={backgroundImage ? "whiteAlpha.400" : "primary.soft"}
        pointerEvents="none"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
      />

      {/* Content */}
      <Container maxW="container.lg" position="relative" zIndex={1}>
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
              color={backgroundImage ? "whiteAlpha.900" : "primary.soft"}
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
                color={backgroundImage ? "white" : "neutral.dark"}
                letterSpacing="0.05em"
              >
                {t('hero.bride')}
              </Heading>
              
              <Text
                fontFamily="heading"
                fontSize={["3xl", "4xl", "5xl"]}
                fontWeight="300"
                color={backgroundImage ? "whiteAlpha.800" : "primary.soft"}
                fontStyle="italic"
              >
                {t('hero.and')}
              </Text>
              
              <Heading
                as="h1"
                fontFamily="heading"
                fontSize={["5xl", "6xl", "7xl"]}
                fontWeight="300"
                color={backgroundImage ? "white" : "neutral.dark"}
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
              borderColor={backgroundImage ? "whiteAlpha.500" : "primary.soft"}
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
                color={backgroundImage ? "white" : "neutral.dark"}
                letterSpacing="0.15em"
              >
                {t('hero.date')}
              </Text>
              <Text
                fontFamily="heading"
                fontSize={["lg", "xl"]}
                fontWeight="300"
                color={backgroundImage ? "whiteAlpha.900" : "neutral.muted"}
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
              color={backgroundImage ? "whiteAlpha.800" : "neutral.muted"}
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
              variant={backgroundImage ? "outline" : "primary"}
              size="lg"
              mt={8}
              color={backgroundImage ? "white" : undefined}
              borderColor={backgroundImage ? "white" : undefined}
              _hover={{
                bg: backgroundImage ? "whiteAlpha.200" : undefined,
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
      <Box
        position="absolute"
        bottom={["40px", "60px"]}
        left="50%"
        transform="translateX(-50%)"
        textAlign="center"
      >
        <Box
          as="a"
          href="#story"
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
            borderColor={backgroundImage ? "whiteAlpha.600" : "primary.soft"}
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
              bg: backgroundImage ? "whiteAlpha.600" : "primary.soft",
              borderRadius: 'full',
            }}
          />
        </Box>
      </Box>
    </Box>
  )
}
