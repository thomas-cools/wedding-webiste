import { Box, Image } from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'

const MotionBox = motion(Box)

interface LoadingScreenProps {
  isLoading: boolean
  logo?: string
}

export default function LoadingScreen({ isLoading, logo }: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <MotionBox
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="neutral.light"
          zIndex={9999}
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* Animated Logo */}
          <MotionBox
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {logo ? (
              <Image
                src={logo}
                alt="Loading"
                h={['80px', '100px', '120px']}
                w="auto"
              />
            ) : (
              <Box
                fontFamily="heading"
                fontSize={['4xl', '5xl', '6xl']}
                fontWeight="300"
                letterSpacing="0.1em"
                color="neutral.dark"
              >
                C & T
              </Box>
            )}
          </MotionBox>

          {/* Animated Line */}
          <MotionBox
            mt={8}
            h="1px"
            bg="primary.soft"
            initial={{ width: 0 }}
            animate={{ width: '120px' }}
            transition={{ duration: 1.2, ease: 'easeInOut', delay: 0.3 }}
          />

          {/* Pulsing dots */}
          <Box display="flex" gap={2} mt={6}>
            {[0, 1, 2].map((i) => (
              <MotionBox
                key={i}
                w="6px"
                h="6px"
                borderRadius="full"
                bg="primary.soft"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </Box>
        </MotionBox>
      )}
    </AnimatePresence>
  )
}
