import {
  Box,
  Stack,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  Checkbox,
  Button,
  FormErrorMessage,
  FormHelperText,
  Heading,
  Text,
  useToast,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useRsvpForm } from './useRsvpForm'
import type { Likelihood, EventAnswer, Accommodation, TravelPlan, Rsvp } from './types'

export interface RsvpFormProps {
  onSuccess?: (entry: Rsvp, isUpdate: boolean) => void
}

export default function RsvpForm({ onSuccess }: RsvpFormProps) {
  const { t } = useTranslation()
  const toast = useToast()

  const form = useRsvpForm({
    onSuccess: (entry, isUpdate) => {
      toast({
        title: isUpdate ? t('rsvp.success.updatedTitle') : t('rsvp.success.savedTitle'),
        description: isUpdate ? t('rsvp.success.updatedMessage') : t('rsvp.success.savedMessage'),
        status: isUpdate ? 'info' : 'success',
        duration: 4000,
        isClosable: true,
        variant: 'solid',
        position: 'top',
      })
      // Call the parent's onSuccess callback if provided
      onSuccess?.(entry, isUpdate)
    },
    onAddressWarning: () => {
      toast({
        title: t('rsvp.validation.addressIncompleteTitle'),
        description: t('rsvp.validation.addressIncompleteMessage'),
        status: 'warning',
        duration: 6000,
        isClosable: true,
        variant: 'solid',
        position: 'top',
      })
    },
  })

  return (
    <>
      <Box as="section" py={4} maxW="container.sm" mx="auto" px={[4, 0]}>
        {/* Section Header */}
        <Box textAlign="center" mb={[8, 12]}>
          <Heading
            as="h2"
            fontFamily="heading"
            fontSize={['2xl', '3xl', '4xl']}
            fontWeight="400"
            mb={4}
            color="neutral.light"
          >
            {t('rsvp.title')}
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
            {t('rsvp.description')}
          </Text>
        </Box>

        {/* Form */}
        <Box
          as="form"
          name="rsvp"
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
                px: 6,
                _placeholder: { color: 'rgba(48,15,12,0.4)' },
                _focus: { borderColor: '#94B1C8', boxShadow: '0 0 0 1px #94B1C8' },
              },
              '& textarea': { 
                bg: 'white',
                color: '#300F0C',
                borderColor: 'rgba(48,15,12,0.2)',
                borderRadius: 'xl',
                px: 6,
                py: 4,
                _placeholder: { color: 'rgba(48,15,12,0.4)' },
                _focus: { borderColor: '#94B1C8', boxShadow: '0 0 0 1px #94B1C8' },
              },
              '& .chakra-checkbox__label': { color: '#300F0C' },
              '& .chakra-form__helper-text': { color: 'rgba(48,15,12,0.6)' },
              '& .chakra-form__error-message': { color: '#4C050C' },
            }}
          >
          {/* Hidden fields for Netlify Forms */}
          <input type="hidden" name="form-name" value="rsvp" />
          <input type="hidden" name="firstName" />
          <input type="hidden" name="email" />
          <input type="hidden" name="likelihood" />
          <input type="hidden" name="events" />
          <input type="hidden" name="accommodation" />
          <input type="hidden" name="travelPlan" />
          <input type="hidden" name="guests" />
          <input type="hidden" name="dietary" />
          <input type="hidden" name="mailingAddress" />
          <input type="hidden" name="mailingAddressPlaceId" />
          <input type="hidden" name="franceTips" />
          <input type="hidden" name="additionalNotes" />

          <Stack spacing={8}>
            {/* Name Field */}
            <FormControl isInvalid={!!form.errors.firstName}>
              <FormLabel>{t('rsvp.form.yourName')}</FormLabel>
              <Input
                name="firstName"
                value={form.firstName}
                onChange={e => {
                  const val = e.target.value
                  form.setFirstName(val)
                  if (form.errors.firstName) form.validateField('firstName', val)
                }}
                onBlur={() => form.validateField('firstName')}
                placeholder={t('rsvp.form.namePlaceholder')}
              />
              <FormErrorMessage>{form.errors.firstName}</FormErrorMessage>
            </FormControl>

            {/* Email Field */}
            <FormControl isInvalid={!!form.errors.email}>
              <FormLabel>{t('rsvp.form.email')}</FormLabel>
              <Input
                name="email"
                type="email"
                value={form.email}
                onChange={e => {
                  const val = e.target.value
                  form.setEmail(val)
                  if (form.errors.email) form.validateField('email', val)
                }}
                onBlur={() => form.validateField('email')}
                placeholder={t('rsvp.form.emailPlaceholder')}
              />
              <FormErrorMessage>{form.errors.email}</FormErrorMessage>
            </FormControl>

            {/* Likelihood Selection */}
            <FormControl isInvalid={!!form.errors.likelihood}>
              <FormLabel>{t('rsvp.form.willYouJoin')}</FormLabel>
              <Select
                name="likelihood"
                value={form.likelihood}
                onChange={e => {
                  const val = e.target.value as Likelihood
                  form.setLikelihood(val)
                  form.validateField('likelihood', val)
                }}
                onBlur={() => form.validateField('likelihood')}
                placeholder={t('rsvp.form.pleaseSelect')}
              >
                <option value="definitely">{t('rsvp.form.joyfullyAccept')}</option>
                <option value="highly_likely">{t('rsvp.form.likelyAttend')}</option>
                <option value="maybe">{t('rsvp.form.notYetCertain')}</option>
                <option value="no">{t('rsvp.form.regretfullyDecline')}</option>
              </Select>
              <FormHelperText fontSize="sm" color="neutral.muted">
                {t('rsvp.form.attendHint')}
              </FormHelperText>
              <FormErrorMessage>{form.errors.likelihood}</FormErrorMessage>
            </FormControl>

            {form.likelihood && form.likelihood !== 'no' && (
              <>
                {/* Mailing Address with Autocomplete */}
                <FormControl isInvalid={!!form.errors.mailingAddress}>
                  <FormLabel>{t('rsvp.form.mailingAddress')}</FormLabel>
                  <Box position="relative">
                    <Input
                      name="mailingAddress"
                      value={form.mailingAddress}
                      onChange={e => {
                        form.setMailingAddress(e.target.value)
                        if (form.mailingAddressPlaceId) form.setMailingAddressPlaceId('')
                        if (form.errors.mailingAddress) form.validateField('mailingAddress')
                      }}
                      onFocus={() => {
                        if (form.mailingAddressSuggestions.length > 0) form.setMailingAddressSuggestionsOpen(true)
                      }}
                      onBlur={() => {
                        window.setTimeout(() => form.setMailingAddressSuggestionsOpen(false), 120)
                        form.validateField('mailingAddress')
                      }}
                      placeholder={t('rsvp.form.mailingAddressPlaceholder')}
                      autoComplete="street-address"
                    />

                    {form.mailingAddressSuggestionsOpen && form.mailingAddressSuggestions.length > 0 && (
                      <Box
                        role="listbox"
                        position="absolute"
                        top="100%"
                        left={0}
                        right={0}
                        mt={2}
                        bg="white"
                        borderWidth="1px"
                        borderColor="primary.soft"
                        borderRadius="md"
                        overflow="hidden"
                        zIndex={10}
                        boxShadow="md"
                      >
                        {form.mailingAddressSuggestions.slice(0, 6).map(s => (
                          <Box
                            key={s.placeId}
                            role="option"
                            px={4}
                            py={3}
                            cursor="pointer"
                            _hover={{ bg: 'neutral.light' }}
                            onMouseDown={e => {
                              e.preventDefault()
                              form.selectAddressSuggestion(s)
                            }}
                          >
                            <Text fontSize="sm" color="neutral.dark">
                              {s.description}
                            </Text>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>

                  {form.mailingAddressAutocompleteLimited && (
                    <FormHelperText fontSize="sm" color="neutral.muted">
                      {t('rsvp.validation.autocompleteUnavailable')}
                    </FormHelperText>
                  )}
                  <FormErrorMessage>{form.errors.mailingAddress}</FormErrorMessage>
                </FormControl>

                {/* Event Selection */}
                <FormControl isInvalid={form.hasAttemptedSubmit && !!form.errors.events}>
                  <Box p={6} bg="rgba(176,210,236,0.1)" borderWidth="2px" borderColor="#B0D2EC" borderRadius="lg">
                    <FormLabel mb={6}>{t('rsvp.form.eventsTitle')}</FormLabel>

                    <Stack spacing={6}>
                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="400" textTransform="none" letterSpacing="normal">
                          {t('rsvp.form.welcomeDinner')}
                        </FormLabel>
                        <Select
                          name="events.welcome"
                          value={form.events.welcome}
                          onChange={e => form.setEventAnswer('welcome', e.target.value as EventAnswer)}
                          placeholder={t('rsvp.form.pleaseSelect')}
                        >
                          <option value="yes">{t('rsvp.form.willAttend')}</option>
                          <option value="arriving_late">{t('rsvp.form.arrivingLate')}</option>
                          <option value="no">{t('rsvp.form.unableToAttend')}</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="400" textTransform="none" letterSpacing="normal">
                          {t('rsvp.form.weddingDay')}
                        </FormLabel>
                        <Select
                          name="events.ceremony"
                          value={form.events.ceremony}
                          onChange={e => form.setEventAnswer('ceremony', e.target.value as EventAnswer)}
                          placeholder={t('rsvp.form.pleaseSelect')}
                        >
                          <option value="yes">{t('rsvp.form.willAttend')}</option>
                          <option value="no">{t('rsvp.form.unableToAttend')}</option>
                        </Select>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="sm" fontWeight="400" textTransform="none" letterSpacing="normal">
                          {t('rsvp.form.farewellBrunch')}
                        </FormLabel>
                        <Select
                          name="events.brunch"
                          value={form.events.brunch}
                          onChange={e => form.setEventAnswer('brunch', e.target.value as EventAnswer)}
                          placeholder={t('rsvp.form.pleaseSelect')}
                        >
                          <option value="yes">{t('rsvp.form.willAttend')}</option>
                          <option value="no">{t('rsvp.form.unableToAttend')}</option>
                        </Select>
                      </FormControl>

                      {form.hasAttemptedSubmit && form.errors.events && (
                        <Text color="#4C050C" fontSize="sm">
                          {form.errors.events}
                        </Text>
                      )}
                    </Stack>
                  </Box>
                </FormControl>

                {/* Accommodation */}
                <FormControl>
                  <FormLabel>{t('rsvp.form.accommodation')}</FormLabel>
                  <Select
                    value={form.accommodation}
                    onChange={e => form.setAccommodation(e.target.value as Accommodation)}
                    placeholder={t('rsvp.form.pleaseSelect')}
                  >
                    <option value="venue">{t('rsvp.form.stayingChateau')}</option>
                    <option value="own">{t('rsvp.form.arrangingOwn')}</option>
                    <option value="recommend">{t('rsvp.form.wouldLikeRec')}</option>
                  </Select>
                  {form.accommodation === 'venue' && (
                    <Text fontSize="xs" color="rgba(48,15,12,0.6)" mt={2} fontStyle="italic">
                      {t('rsvp.form.onsiteInterestHint')}
                    </Text>
                  )}
                </FormControl>

                {/* Travel Plan */}
                <FormControl>
                  <FormLabel>{t('rsvp.form.travel')}</FormLabel>
                  <Select
                    value={form.travelPlan}
                    onChange={e => form.setTravelPlan(e.target.value as TravelPlan)}
                    placeholder={t('rsvp.form.pleaseSelect')}
                  >
                    <option value="rent_car">{t('rsvp.form.rentingCar')}</option>
                    <option value="need_shuttle">{t('rsvp.form.shuttleService')}</option>
                    <option value="no_plan">{t('rsvp.form.stillPlanning')}</option>
                  </Select>
                </FormControl>

                {/* Dietary Requirements */}
                <FormControl>
                  <FormLabel>{t('rsvp.form.dietary')}</FormLabel>
                  <Input
                    value={form.dietary}
                    onChange={e => form.setDietary(e.target.value)}
                    placeholder={t('rsvp.form.dietaryPlaceholder')}
                  />
                </FormControl>

                {/* France Tips Checkbox */}
                <Checkbox
                  isChecked={form.franceTips}
                  onChange={e => form.setFranceTips(e.target.checked)}
                  colorScheme="blue"
                >
                  <Text fontSize="sm" color="#300F0C">{t('rsvp.form.franceTips')}</Text>
                </Checkbox>

                {/* Plus One Section */}
                <Box>
                  <FormLabel>{t('rsvp.form.plusOneSection')}</FormLabel>
                  <Stack spacing={4}>
                    <Checkbox
                      isChecked={form.hasPlusOne}
                      onChange={e => {
                        const next = e.target.checked
                        form.setHasPlusOne(next)
                        if (!next) {
                          form.setPlusOne({ name: '', dietary: '' })
                        } else {
                          setTimeout(() => form.validateField('plusOne'), 0)
                        }
                      }}
                      colorScheme="blue"
                    >
                      <Text fontSize="sm" color="#300F0C">{t('rsvp.form.hasPlusOne')}</Text>
                    </Checkbox>

                    {form.hasPlusOne && (
                      <Box p={5} bg="rgba(176,210,236,0.1)" borderWidth="2px" borderColor="#B0D2EC" borderRadius="xl">
                        <Stack spacing={3}>
                          <Input
                            name="plusOne.name"
                            value={form.plusOne.name}
                            onChange={e => {
                              form.setPlusOne(p => ({ ...p, name: e.target.value }))
                              if (form.errors.plusOne) form.validateField('plusOne')
                            }}
                            onBlur={() => form.validateField('plusOne')}
                            placeholder={t('rsvp.form.plusOneNamePlaceholder')}
                          />
                          <Input
                            name="plusOne.dietary"
                            value={form.plusOne.dietary || ''}
                            onChange={e => form.setPlusOne(p => ({ ...p, dietary: e.target.value }))}
                            placeholder={t('rsvp.form.plusOneDietaryPlaceholder')}
                          />
                          {form.errors.plusOne && (
                            <Text color="#4C050C" fontSize="sm">
                              {form.errors.plusOne}
                            </Text>
                          )}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </Box>

                {/* Children Section */}
                <Box>
                  <FormLabel>{t('rsvp.form.childrenSection')}</FormLabel>
                  <Stack spacing={4}>
                    <Checkbox
                      isChecked={form.hasChildren}
                      onChange={e => {
                        const next = e.target.checked
                        form.setHasChildren(next)
                        if (!next) {
                          // Clear children when unchecked
                        } else {
                          setTimeout(() => form.validateField('children'), 0)
                        }
                      }}
                      colorScheme="blue"
                    >
                      <Text fontSize="sm" color="#300F0C">{t('rsvp.form.hasChildren')}</Text>
                    </Checkbox>

                    {form.hasChildren && (
                      <Box p={5} bg="rgba(176,210,236,0.1)" borderWidth="2px" borderColor="#B0D2EC" borderRadius="xl">
                        <Stack spacing={4}>
                        {form.children.map((c, i) => (
                          <Box key={i} p={4} bg="rgba(255,255,255,0.5)" borderWidth="1px" borderColor="rgba(48,15,12,0.15)" borderRadius="lg">
                            <Stack spacing={3}>
                              <Flex direction={['column', 'row']} gap={3}>
                                <Input
                                  name={`children.${i}.name`}
                                  value={c.name}
                                  onChange={e => form.updateChild(i, { name: e.target.value })}
                                  placeholder={t('rsvp.form.childName', { number: i + 1 })}
                                  flex={2}
                                />
                                <Input
                                  value={c.age || ''}
                                  onChange={e => form.updateChild(i, { age: e.target.value })}
                                  placeholder={t('rsvp.form.childAgePlaceholder')}
                                  maxW={['100%', '80px']}
                                  type="number"
                                  min="0"
                                  max="17"
                                />
                              </Flex>
                              <Flex direction={['column', 'row']} gap={3}>
                                <Input
                                  value={c.dietary || ''}
                                  onChange={e => form.updateChild(i, { dietary: e.target.value })}
                                  placeholder={t('rsvp.form.childDietaryPlaceholder')}
                                  flex={1}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => form.removeChild(i)}
                                  colorScheme="red"
                                  alignSelf={['stretch', 'center']}
                                >
                                  {t('rsvp.form.remove')}
                                </Button>
                              </Flex>
                            </Stack>
                          </Box>
                        ))}

                        <Button 
                          onClick={form.addChild}
                          variant="ghost" 
                          size="sm" 
                          alignSelf="flex-start"
                          color="#648EC0"
                          _hover={{ bg: 'rgba(148,177,200,0.15)' }}
                        >
                          {t('rsvp.form.addChild')}
                        </Button>
                        {form.errors.children && (
                          <Text color="#4C050C" fontSize="sm">
                            {form.errors.children}
                          </Text>
                        )}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </Box>

                {/* Additional Notes */}
                <FormControl>
                  <FormLabel>{t('rsvp.form.additionalNotes')}</FormLabel>
                  <Textarea
                    rows={3}
                    onChange={e => form.setAdditionalNotes(e.target.value)}
                    value={form.additionalNotes}
                    placeholder={t('rsvp.form.notesPlaceholder')}
                  />
                </FormControl>
              </>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              width="full" 
              size="lg" 
              mt={4}
              bg="#300F0C"
              color="#E3DFCE"
              borderRadius="full"
              _hover={{ bg: '#4C050C' }}
              _active={{ bg: '#300F0C' }}
            >
              {t('rsvp.form.submit')}
            </Button>

            {/* Status Messages */}
            {form.status === 'saved' && (
              <Text textAlign="center" color="#648EC0" fontSize="sm">
                {t('rsvp.success.thankYouSaved')}
              </Text>
            )}
            {form.status === 'updated' && (
              <Text textAlign="center" color="#648EC0" fontSize="sm">
                {t('rsvp.success.thankYouUpdated')}
              </Text>
            )}
          </Stack>
        </Box>
      </Box>
    </>
  )
}
