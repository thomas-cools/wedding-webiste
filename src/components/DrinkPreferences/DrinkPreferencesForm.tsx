import {
  Box,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  FormErrorMessage,
  Heading,
  Text,
  useToast,
  Icon,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useDrinkPreferencesForm } from './useDrinkPreferencesForm'
import type { WineChoice, BeerChoice, CocktailChoice, NonAlcoholicChoice } from './types'

export interface DrinkPreferencesFormProps {
  onSuccess?: () => void
}

function DrinkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 2L16 2L14 10H10L8 2Z" />
      <path d="M12 10V20" />
      <path d="M8 20H16" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <Box as="span" display="inline-flex" mr={1.5} flexShrink={0}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Box>
  )
}

interface OptionPillProps {
  isSelected: boolean
  onToggle: () => void
  children: React.ReactNode
}

function OptionPill({ isSelected, onToggle, children }: OptionPillProps) {
  return (
    <WrapItem>
      <Box
        as="button"
        type="button"
        onClick={onToggle}
        display="inline-flex"
        alignItems="center"
        px={[4, 5]}
        py={[2, 2.5]}
        borderRadius="full"
        border="1.5px solid"
        borderColor={isSelected ? '#94B1C8' : 'rgba(48,15,12,0.15)'}
        bg={isSelected ? 'rgba(148,177,200,0.12)' : 'white'}
        color="#300F0C"
        fontSize={['xs', 'sm']}
        fontFamily="'Montserrat', sans-serif"
        fontWeight={isSelected ? '500' : '400'}
        letterSpacing="0.01em"
        lineHeight="1.4"
        cursor="pointer"
        transition="all 0.2s ease"
        _hover={{
          borderColor: isSelected ? '#648EC0' : 'rgba(148,177,200,0.6)',
          bg: isSelected ? 'rgba(148,177,200,0.18)' : 'rgba(148,177,200,0.06)',
          transform: 'translateY(-1px)',
          boxShadow: '0 2px 8px rgba(148,177,200,0.15)',
        }}
        _focusVisible={{
          outline: 'none',
          boxShadow: '0 0 0 2px #94B1C8',
        }}
        _active={{
          transform: 'translateY(0)',
        }}
      >
        {isSelected && <CheckIcon />}
        {children}
      </Box>
    </WrapItem>
  )
}

export default function DrinkPreferencesForm({ onSuccess }: DrinkPreferencesFormProps) {
  const { t } = useTranslation()
  const toast = useToast()

  const form = useDrinkPreferencesForm({
    onSuccess: () => {
      toast({
        title: t('drinkPreferences.success.title'),
        description: t('drinkPreferences.success.message'),
        status: 'success',
        duration: 4000,
        isClosable: true,
        variant: 'solid',
        position: 'top',
      })
      onSuccess?.()
    },
  })

  const wineOptions: { value: WineChoice; label: string }[] = [
    { value: 'white', label: t('drinkPreferences.form.wine.white') },
    { value: 'red', label: t('drinkPreferences.form.wine.red') },
    { value: 'sparkling', label: t('drinkPreferences.form.wine.sparkling') },
    { value: 'skip', label: t('drinkPreferences.form.wine.skip') },
  ]

  const beerOptions: { value: BeerChoice; label: string }[] = [
    { value: 'light_crisp', label: t('drinkPreferences.form.beer.light_crisp') },
    { value: 'belgian_blonde', label: t('drinkPreferences.form.beer.belgian_blonde') },
    { value: 'no_beer', label: t('drinkPreferences.form.beer.no_beer') },
  ]

  const cocktailOptions: { value: CocktailChoice; label: string }[] = [
    { value: 'agave', label: t('drinkPreferences.form.cocktail.agave') },
    { value: 'aperitivo', label: t('drinkPreferences.form.cocktail.aperitivo') },
    { value: 'classic_mixers', label: t('drinkPreferences.form.cocktail.classic_mixers') },
    { value: 'beer_wine_only', label: t('drinkPreferences.form.cocktail.beer_wine_only') },
  ]

  const nonAlcoholicOptions: { value: NonAlcoholicChoice; label: string }[] = [
    { value: 'af_wine', label: t('drinkPreferences.form.nonAlcoholic.af_wine') },
    { value: 'af_beer', label: t('drinkPreferences.form.nonAlcoholic.af_beer') },
    { value: 'mocktails', label: t('drinkPreferences.form.nonAlcoholic.mocktails') },
    { value: 'sparkling_water', label: t('drinkPreferences.form.nonAlcoholic.sparkling_water') },
  ]

  return (
    <Box as="section" py={4} maxW="container.sm" mx="auto" px={[4, 0]}>
      {/* Section Header */}
      <Box textAlign="center" mb={[8, 12]}>
        <Box mb={4}>
          <Icon as={DrinkIcon} w={8} h={8} color="primary.light" opacity={0.7} />
        </Box>
        <Heading
          as="h2"
          fontFamily="heading"
          fontSize={['2xl', '3xl', '4xl']}
          fontWeight="400"
          mb={4}
          color="neutral.light"
        >
          {t('drinkPreferences.title')}
        </Heading>
        <Box my={6}>
          <Box as="hr" borderColor="primary.light" w="120px" mx="auto" opacity={0.6} />
        </Box>
        <Text
          color="rgba(246,241,235,0.75)"
          fontSize={['sm', 'md']}
          textAlign="center"
          lineHeight="1.8"
          px={[2, 0]}
        >
          {t('drinkPreferences.description')}
        </Text>
      </Box>

      {/* Form */}
      <Box
        as="form"
        name="drink-preferences"
        method="POST"
        data-netlify="true"
        onSubmit={form.handleSubmit}
        bg="#E3DFCE"
        p={[6, 10, 14]}
        borderRadius="lg"
        boxShadow="xl"
        sx={{
          '& label': { color: '#300F0C' },
          '& input, & select': {
            bg: 'white',
            color: '#300F0C',
            borderColor: 'rgba(48,15,12,0.2)',
            borderRadius: 'full',
            px: [3, 6],
            fontSize: ['sm', 'md'],
            _placeholder: { color: 'rgba(48,15,12,0.4)' },
            _focus: { borderColor: '#94B1C8', boxShadow: '0 0 0 1px #94B1C8' },
          },
          '& textarea': {
            bg: 'white',
            color: '#300F0C',
            borderColor: 'rgba(48,15,12,0.2)',
            borderRadius: 'xl',
            px: [3, 6],
            py: 4,
            fontSize: ['sm', 'md'],
            _placeholder: { color: 'rgba(48,15,12,0.4)' },
            _focus: { borderColor: '#94B1C8', boxShadow: '0 0 0 1px #94B1C8' },
          },
          '& .chakra-form__helper-text': { color: 'rgba(48,15,12,0.6)' },
          '& .chakra-form__error-message': { color: '#4C050C' },
        }}
      >
        {/* Hidden fields for Netlify Forms */}
        <input type="hidden" name="form-name" value="drink-preferences" />
        <input type="hidden" name="firstName" />
        <input type="hidden" name="email" />
        <input type="hidden" name="wine" />
        <input type="hidden" name="beer" />
        <input type="hidden" name="cocktail" />
        <input type="hidden" name="favoriteCocktail" />
        <input type="hidden" name="nonAlcoholic" />
        <input type="hidden" name="comments" />

        <Stack spacing={8}>
          {/* Name */}
          <FormControl isInvalid={!!form.errors.firstName}>
            <FormLabel>{t('drinkPreferences.form.yourName')}</FormLabel>
            <Input
              name="firstName"
              value={form.firstName}
              onChange={(e) => {
                form.setFirstName(e.target.value)
                if (form.errors.firstName) form.validateField('firstName', e.target.value)
              }}
              onBlur={() => form.validateField('firstName')}
              placeholder={t('drinkPreferences.form.namePlaceholder')}
            />
            <FormErrorMessage>{form.errors.firstName}</FormErrorMessage>
          </FormControl>

          {/* Email */}
          <FormControl isInvalid={!!form.errors.email}>
            <FormLabel>{t('drinkPreferences.form.email')}</FormLabel>
            <Input
              name="email"
              type="email"
              value={form.email}
              onChange={(e) => {
                form.setEmail(e.target.value)
                if (form.errors.email) form.validateField('email', e.target.value)
              }}
              onBlur={() => form.validateField('email')}
              placeholder={t('drinkPreferences.form.emailPlaceholder')}
            />
            <FormErrorMessage>{form.errors.email}</FormErrorMessage>
          </FormControl>

          {/* Divider */}
          <Box><Box as="hr" borderColor="rgba(48,15,12,0.15)" /></Box>

          {/* 1. Wine */}
          <FormControl>
            <FormLabel fontWeight="600" fontSize={['md', 'lg']}>
              🍷 {t('drinkPreferences.form.wineTitle')}
            </FormLabel>
            <Text color="rgba(48,15,12,0.65)" fontSize="sm" mb={3}>
              {t('drinkPreferences.form.wineSubtitle')}
            </Text>
            <Wrap spacing={[2, 3]}>
              {wineOptions.map((opt) => (
                <OptionPill
                  key={opt.value}
                  isSelected={form.wine.includes(opt.value)}
                  onToggle={() => form.toggleWine(opt.value)}
                >
                  {opt.label}
                </OptionPill>
              ))}
            </Wrap>
          </FormControl>

          {/* 2. Beer */}
          <FormControl>
            <FormLabel fontWeight="600" fontSize={['md', 'lg']}>
              🍺 {t('drinkPreferences.form.beerTitle')}
            </FormLabel>
            <Text color="rgba(48,15,12,0.65)" fontSize="sm" mb={3}>
              {t('drinkPreferences.form.beerSubtitle')}
            </Text>
            <Wrap spacing={[2, 3]}>
              {beerOptions.map((opt) => (
                <OptionPill
                  key={opt.value}
                  isSelected={form.beer.includes(opt.value)}
                  onToggle={() => form.toggleBeer(opt.value)}
                >
                  {opt.label}
                </OptionPill>
              ))}
            </Wrap>
          </FormControl>

          {/* 3. Cocktail */}
          <FormControl>
            <FormLabel fontWeight="600" fontSize={['md', 'lg']}>
              🍸 {t('drinkPreferences.form.cocktailTitle')}
            </FormLabel>
            <Text color="rgba(48,15,12,0.65)" fontSize="sm" mb={3}>
              {t('drinkPreferences.form.cocktailSubtitle')}
            </Text>
            <Wrap spacing={[2, 3]}>
              {cocktailOptions.map((opt) => (
                <OptionPill
                  key={opt.value}
                  isSelected={form.cocktail.includes(opt.value)}
                  onToggle={() => form.toggleCocktail(opt.value)}
                >
                  {opt.label}
                </OptionPill>
              ))}
            </Wrap>
            <Input
              name="favoriteCocktail"
              value={form.favoriteCocktail}
              onChange={(e) => form.setFavoriteCocktail(e.target.value)}
              placeholder={t('drinkPreferences.form.favoriteCocktailPlaceholder')}
              mt={4}
              maxLength={120}
            />
            <Text color="rgba(48,15,12,0.5)" fontSize="xs" mt={1.5}>
              {t('drinkPreferences.form.favoriteCocktailLabel')}
            </Text>
          </FormControl>

          {/* 4. Non-Alcoholic */}
          <FormControl>
            <FormLabel fontWeight="600" fontSize={['md', 'lg']}>
              🥤 {t('drinkPreferences.form.nonAlcoholicTitle')}
            </FormLabel>
            <Text color="rgba(48,15,12,0.65)" fontSize="sm" mb={3}>
              {t('drinkPreferences.form.nonAlcoholicSubtitle')}
            </Text>
            <Wrap spacing={[2, 3]}>
              {nonAlcoholicOptions.map((opt) => (
                <OptionPill
                  key={opt.value}
                  isSelected={form.nonAlcoholic.includes(opt.value)}
                  onToggle={() => form.toggleNonAlcoholic(opt.value)}
                >
                  {opt.label}
                </OptionPill>
              ))}
            </Wrap>

            {form.errors.drinks && (
              <Text color="#4C050C" fontSize="sm" mt={3}>
                {form.errors.drinks}
              </Text>
            )}
          </FormControl>

          {/* Divider */}
          <Box><Box as="hr" borderColor="rgba(48,15,12,0.15)" /></Box>

          {/* 5. Comments */}
          <FormControl>
            <FormLabel fontWeight="600" fontSize={['md', 'lg']}>
              {t('drinkPreferences.form.commentsTitle')}
            </FormLabel>
            <Textarea
              name="comments"
              value={form.comments}
              onChange={(e) => form.setComments(e.target.value)}
              placeholder={t('drinkPreferences.form.commentsPlaceholder')}
              rows={4}
            />
          </FormControl>

          {/* Submit */}
          <Button
            type="submit"
            isLoading={form.status === 'submitting'}
            loadingText={t('drinkPreferences.form.submit')}
            bg="#300F0C"
            color="#E3DFCE"
            size="lg"
            w="full"
            borderRadius="full"
            fontWeight="400"
            letterSpacing="1px"
            _hover={{ bg: '#4a1f1a' }}
            _active={{ bg: '#1a0806' }}
          >
            {t('drinkPreferences.form.submit')}
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
