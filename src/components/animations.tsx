import { motion, Variants, useReducedMotion } from 'framer-motion'
import { Box, BoxProps } from '@chakra-ui/react'
import { forwardRef, ReactNode } from 'react'

// Create motion-enabled Chakra components
export const MotionBox = motion(Box)

// Animation variants
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
    },
  },
}

export const fadeInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export const fadeInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 40,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

// Scroll-triggered animation wrapper
interface ScrollRevealProps extends BoxProps {
  children: ReactNode
  variants?: Variants
  delay?: number
  once?: boolean
}

export const ScrollReveal = forwardRef<HTMLDivElement, ScrollRevealProps>(
  ({ children, variants = fadeInUp, delay = 0, once = true, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion()

    if (shouldReduceMotion) {
      return <Box ref={ref} {...props}>{children}</Box>
    }

    return (
      <MotionBox
        ref={ref}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin: '-50px', amount: 0.1 }}
        variants={variants}
        transition={{ delay }}
        {...props}
      >
        {children}
      </MotionBox>
    )
  }
)

ScrollReveal.displayName = 'ScrollReveal'

// Stagger container for lists
interface StaggerContainerProps extends BoxProps {
  children: ReactNode
  once?: boolean
}

export const StaggerContainer = forwardRef<HTMLDivElement, StaggerContainerProps>(
  ({ children, once = true, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion()

    if (shouldReduceMotion) {
      return <Box ref={ref} {...props}>{children}</Box>
    }

    return (
      <MotionBox
        ref={ref}
        initial="hidden"
        whileInView="visible"
        viewport={{ once, margin: '-50px', amount: 0.1 }}
        variants={staggerContainer}
        {...props}
      >
        {children}
      </MotionBox>
    )
  }
)

StaggerContainer.displayName = 'StaggerContainer'

// Stagger item for use inside StaggerContainer
interface StaggerItemProps extends BoxProps {
  children: ReactNode
}

export const StaggerItem = forwardRef<HTMLDivElement, StaggerItemProps>(
  ({ children, ...props }, ref) => {
    const shouldReduceMotion = useReducedMotion()

    if (shouldReduceMotion) {
      return <Box ref={ref} {...props}>{children}</Box>
    }

    return (
      <MotionBox ref={ref} variants={staggerItem} {...props}>
        {children}
      </MotionBox>
    )
  }
)

StaggerItem.displayName = 'StaggerItem'

// Hero-specific animations (longer, more dramatic)
export const heroFadeIn: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
}

export const heroStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
}
