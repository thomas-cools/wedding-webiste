import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Container,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  Flex,
  Grid,
  HStack,
  IconButton,
  Image as ChakraImage,
  VStack,
  useDisclosure,
} from '@chakra-ui/react'
import { HamburgerIcon } from '@chakra-ui/icons'
import { Link, useLocation } from 'react-router-dom'
import { useFeatureFlags } from '../contexts/FeatureFlagsContext'
import LanguageSwitcher from './LanguageSwitcher'
import weddingLogoSmall from '../assets/monogram_websiteT&C-small.webp'
import weddingLogoMedium from '../assets/monogram_websiteT&C-medium.webp'
import weddingLogo2x from '../assets/monogram_websiteT&C-2x.webp'

interface SiteHeaderProps {
  withTimelineAnchor?: boolean
}

interface SiteNavLink {
  href: string
  label: string
  enabled: boolean
  isHashLink?: boolean
}

export default function SiteHeader({ withTimelineAnchor = true }: SiteHeaderProps) {
  const { t } = useTranslation()
  const { features } = useFeatureFlags()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const location = useLocation()

  const detailsHref = location.pathname === '/' ? '#timeline' : '/#timeline'

  const navLinks = useMemo(
    () =>
      [
        {
          href: '/accommodations',
          label: t('header.travel'),
          enabled: features.showAccommodation,
        },
        {
          href: '/faq',
          label: t('header.faq'),
          enabled: true,
        },
        {
          href: detailsHref,
          label: t('header.details'),
          enabled: withTimelineAnchor,
          isHashLink: detailsHref.startsWith('#'),
        },
        {
          href: '/services',
          label: t('header.transport', 'Transport'),
          enabled: true,
        },
        {
          href: '/registry',
          label: t('header.registry'),
          enabled: true,
        },
      ].filter((link) => link.enabled) as SiteNavLink[],
    [detailsHref, features.showAccommodation, t, withTimelineAnchor]
  )

  return (
    <>
      <Box
        as="header"
        role="banner"
        py={[4, 6]}
        position="fixed"
        top={0}
        left={0}
        right={0}
        zIndex={100}
        bg="#300F0C"
      >
        <Container maxW="container.xl" px={[4, 6, 8]}>
          <Grid templateColumns="1fr auto 1fr" alignItems="center" width="100%">
            <Box>
              <HStack
                as="nav"
                aria-label={t('accessibility.mainNavigation', 'Main navigation')}
                spacing={10}
                display={["none", "none", "flex"]}
              >
                {navLinks.slice(0, Math.ceil(navLinks.length / 2)).map((link) =>
                  link.isHashLink ? (
                    <Button key={link.href} as="a" href={link.href} variant="ghost" size="sm" color="#E3DFCE" _hover={{ bg: 'whiteAlpha.200' }}>
                      {link.label}
                    </Button>
                  ) : (
                    <Button key={link.href} as={Link} to={link.href} variant="ghost" size="sm" color="#E3DFCE" _hover={{ bg: 'whiteAlpha.200' }}>
                      {link.label}
                    </Button>
                  )
                )}
              </HStack>
            </Box>

            <Flex justify="center">
              <Link to="/" aria-label={t('accessibility.goHome', 'Go to home')}>
                <ChakraImage
                  src={weddingLogoSmall}
                  srcSet={`${weddingLogoSmall} 60w, ${weddingLogoMedium} 100w, ${weddingLogo2x} 200w`}
                  sizes="(max-width: 480px) 40px, (max-width: 768px) 45px, 50px"
                  alt={t('header.initials')}
                  h={["40px", "45px", "50px"]}
                  w="auto"
                  cursor="pointer"
                />
              </Link>
            </Flex>

            <Flex justify="flex-end" align="center">
              <HStack spacing={10} display={["none", "none", "flex"]} align="center">
                {navLinks.slice(Math.ceil(navLinks.length / 2)).map((link) =>
                  link.isHashLink ? (
                    <Button key={link.href} as="a" href={link.href} variant="ghost" size="sm" color="#E3DFCE" _hover={{ bg: 'whiteAlpha.200' }}>
                      {link.label}
                    </Button>
                  ) : (
                    <Button key={link.href} as={Link} to={link.href} variant="ghost" size="sm" color="#E3DFCE" _hover={{ bg: 'whiteAlpha.200' }}>
                      {link.label}
                    </Button>
                  )
                )}
                <LanguageSwitcher />
              </HStack>

              <HStack spacing={2} display={["flex", "flex", "none"]}>
                <LanguageSwitcher />
                <IconButton
                  aria-label={t('accessibility.openMenu', 'Open menu')}
                  icon={<HamburgerIcon />}
                  variant="ghost"
                  onClick={onOpen}
                  size="sm"
                  color="#E3DFCE"
                  _hover={{ bg: 'whiteAlpha.200' }}
                />
              </HStack>
            </Flex>
          </Grid>
        </Container>
      </Box>

      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="neutral.light">
          <DrawerCloseButton />
          <DrawerBody pt={16}>
            <VStack spacing={6} align="stretch">
              {navLinks.map((link) =>
                link.isHashLink ? (
                  <Button
                    key={link.href}
                    as="a"
                    href={link.href}
                    variant="ghost"
                    size="lg"
                    justifyContent="flex-start"
                    onClick={onClose}
                  >
                    {link.label}
                  </Button>
                ) : (
                  <Button
                    key={link.href}
                    as={Link}
                    to={link.href}
                    variant="ghost"
                    size="lg"
                    justifyContent="flex-start"
                    onClick={onClose}
                  >
                    {link.label}
                  </Button>
                )
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  )
}
