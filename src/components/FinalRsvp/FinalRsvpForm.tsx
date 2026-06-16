import {
  Box,
  Stack,
  Flex,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Select,
  Textarea,
  Checkbox,
  Button,
  Heading,
  Text,
  Radio,
  RadioGroup,
  Badge,
  Divider,
  useToast,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import type { FinalRsvpGuestData } from './useFinalRsvpToken'
import { useFinalRsvpForm } from './useFinalRsvpForm'

const FORM_STYLES = {
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
  '& .chakra-checkbox__label': { color: '#300F0C' },
  '& .chakra-radio__label': { color: '#300F0C' },
  '& .chakra-form__helper-text': { color: 'rgba(48,15,12,0.6)' },
  '& .chakra-form__error-message': { color: '#4C050C' },
}

const sectionHeadingProps = {
  as: 'h3' as const,
  fontFamily: 'heading',
  fontSize: ['lg', 'xl'],
  fontWeight: '500',
  color: '#300F0C',
  mb: 4,
}

const SectionDivider = () => (
  <Box my={6}>
    <Box as="hr" borderColor="rgba(48,15,12,0.15)" />
  </Box>
)

export interface FinalRsvpFormProps {
  guestData: FinalRsvpGuestData | null
  onSuccess?: () => void
}

export default function FinalRsvpForm({ guestData, onSuccess }: FinalRsvpFormProps) {
  const { t } = useTranslation()
  const toast = useToast()

  const form = useFinalRsvpForm({
    initialPartyMembers: guestData?.partyMembers || [],
    initialEmail: guestData?.email || '',
    onSuccess: () => {
      toast({
        title: t('finalRsvp.success.title'),
        description: t('finalRsvp.success.message'),
        status: 'success',
        duration: 5000,
        isClosable: true,
        variant: 'solid',
        position: 'top',
      })
      onSuccess?.()
    },
    onAddressWarning: () => {
      toast({
        title: t('finalRsvp.validation.addressIncompleteTitle'),
        description: t('finalRsvp.validation.addressIncompleteMessage'),
        status: 'warning',
        duration: 6000,
        isClosable: true,
        variant: 'solid',
        position: 'top',
      })
    },
  })

  return (
    <Box as="section" py={4} maxW="container.sm" mx="auto" px={[4, 0]}>
      {/* Header */}
      <Box textAlign="center" mb={[8, 12]}>
        <Heading
          as="h2"
          fontFamily="heading"
          fontSize={['2xl', '3xl', '4xl']}
          fontWeight="400"
          mb={4}
          color="neutral.light"
        >
          {t('finalRsvp.title')}
        </Heading>
        <Box my={6}>
          <Box as="hr" borderColor="primary.light" w="120px" mx="auto" opacity={0.6} />
        </Box>
        <Text color="rgba(246,241,235,0.75)" fontSize={['sm', 'md']} lineHeight="1.8" px={[2, 0]}>
          {t('finalRsvp.description')}
        </Text>
        {form.firstName && (
          <Text color="rgba(246,241,235,0.9)" fontSize={['md', 'lg']} mt={3} fontFamily="heading">
            {form.firstName}
            {form.guests.length > 1 && ` & ${t('finalRsvp.party')}`}
          </Text>
        )}
      </Box>

      {/* Form */}
      <Box
        as="form"
        name="final-rsvp"
        method="POST"
        data-netlify="true"
        onSubmit={form.handleSubmit}
        bg="#E3DFCE"
        p={[6, 10, 14]}
        borderRadius="lg"
        boxShadow="xl"
        sx={FORM_STYLES}
      >
        {/* Hidden Netlify fields */}
        <input type="hidden" name="form-name" value="final-rsvp" />
        <input type="hidden" name="firstName" />
        <input type="hidden" name="email" />
        <input type="hidden" name="events" />
        <input type="hidden" name="guests" />
        <input type="hidden" name="stayingAtVenue" />
        <input type="hidden" name="accommodationAddress" />
        <input type="hidden" name="accommodationAddressPlaceId" />
        <input type="hidden" name="songRequest" />
        <input type="hidden" name="arrivalDate" />
        <input type="hidden" name="departureDate" />
        <input type="hidden" name="photographyConsent" />
        <input type="hidden" name="additionalNotes" />

        <Stack spacing={8}>
          {/* ── Day Attendance ── */}
          <Box>
            <Heading {...sectionHeadingProps}>{t('finalRsvp.form.attendanceTitle')}</Heading>
            <Text fontSize="sm" color="rgba(48,15,12,0.6)" mb={4}>
              {t('finalRsvp.form.attendanceDescription')}
            </Text>
            <Stack spacing={4}>
              {(['welcome', 'ceremony', 'brunch'] as const).map((day) => (
                <FormControl key={day} isInvalid={!!form.errors.events && form.hasAttemptedSubmit}>
                  <FormLabel fontSize="sm" mb={1}>{t(`finalRsvp.form.event.${day}`)}</FormLabel>
                  <Select
                    value={form.events[day]}
                    onChange={(e) => form.setEventAnswer(day, e.target.value as never)}
                    placeholder={t('finalRsvp.form.selectAttendance')}
                  >
                    <option value="yes">{t('finalRsvp.form.attending')}</option>
                    <option value="arriving_late">{t('finalRsvp.form.arrivingLate')}</option>
                    <option value="no">{t('finalRsvp.form.notAttending')}</option>
                  </Select>
                </FormControl>
              ))}
              {form.errors.events && form.hasAttemptedSubmit && (
                <Text color="#4C050C" fontSize="sm">{form.errors.events}</Text>
              )}
            </Stack>
          </Box>

          <SectionDivider />

          {/* ── Accommodation ── */}
          <Box>
            <Heading {...sectionHeadingProps}>{t('finalRsvp.form.accommodationTitle')}</Heading>
            <FormControl isInvalid={!!form.errors.stayingAtVenue && form.hasAttemptedSubmit} mb={4}>
              <RadioGroup
                value={form.stayingAtVenue === null ? '' : String(form.stayingAtVenue)}
                onChange={(v) => form.setStayingAtVenue(v === 'true')}
              >
                <Stack spacing={3}>
                  <Radio value="true">
                    <Text fontSize="sm">{t('finalRsvp.form.stayingAtVenue')}</Text>
                  </Radio>
                  <Radio value="false">
                    <Text fontSize="sm">{t('finalRsvp.form.notStayingAtVenue')}</Text>
                  </Radio>
                </Stack>
              </RadioGroup>
              {form.errors.stayingAtVenue && form.hasAttemptedSubmit && (
                <FormErrorMessage>{form.errors.stayingAtVenue}</FormErrorMessage>
              )}
            </FormControl>

            {form.stayingAtVenue === false && (
              <FormControl isInvalid={!!form.errors.accommodationAddress}>
                <FormLabel>{t('finalRsvp.form.accommodationAddress')}</FormLabel>
                <Box position="relative">
                  <Input
                    value={form.accommodationAddress}
                    onChange={(e) => {
                      form.setAccommodationAddress(e.target.value)
                      if (form.accommodationAddressPlaceId) form.setAccommodationAddressPlaceId('')
                    }}
                    onFocus={() => {
                      if (form.accommodationSuggestions.length > 0) form.setAccommodationSuggestionsOpen(true)
                    }}
                    onBlur={() => {
                      window.setTimeout(() => form.setAccommodationSuggestionsOpen(false), 120)
                      form.validateField('accommodationAddress')
                    }}
                    placeholder={t('finalRsvp.form.accommodationAddressPlaceholder')}
                    autoComplete="street-address"
                  />
                  {form.accommodationSuggestionsOpen && form.accommodationSuggestions.length > 0 && (
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
                      {form.accommodationSuggestions.slice(0, 6).map((s) => (
                        <Box
                          key={s.placeId}
                          role="option"
                          px={4}
                          py={3}
                          cursor="pointer"
                          _hover={{ bg: 'neutral.light' }}
                          onMouseDown={(e) => { e.preventDefault(); form.selectAccommodationSuggestion(s) }}
                        >
                          <Text fontSize="sm" color="neutral.dark">{s.description}</Text>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
                {form.accommodationAutocompleteLimited && (
                  <FormHelperText>{t('finalRsvp.validation.autocompleteUnavailable')}</FormHelperText>
                )}
                <FormErrorMessage>{form.errors.accommodationAddress}</FormErrorMessage>
                <FormHelperText>{t('finalRsvp.form.accommodationAddressHint')}</FormHelperText>
              </FormControl>
            )}
          </Box>

          <SectionDivider />

          {/* ── Menu Choices (per guest) ── */}
          <Box>
            <Heading {...sectionHeadingProps}>{t('finalRsvp.form.menuTitle')}</Heading>
            <Text fontSize="sm" color="rgba(48,15,12,0.6)" mb={5}>
              {t('finalRsvp.form.menuDescription')}
            </Text>
            <Stack spacing={6}>
              {form.guests.map((guest, index) => (
                <Box
                  key={index}
                  p={5}
                  bg="white"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="rgba(48,15,12,0.1)"
                >
                  <Flex align="center" justify="space-between" mb={4} wrap="wrap" gap={2}>
                    <Text fontWeight="600" color="#300F0C" fontSize="md">
                      {guest.name || t('finalRsvp.form.guest', { number: index + 1 })}
                    </Text>
                    {index > 0 && (
                      <Flex align="center" gap={2}>
                        <Text fontSize="xs" color="rgba(48,15,12,0.5)">{t('finalRsvp.form.isChild')}</Text>
                        <Checkbox
                          isChecked={guest.isChild}
                          onChange={(e) => {
                            form.updateGuest(index, {
                              isChild: e.target.checked,
                              appetizer: e.target.checked ? undefined : '',
                              main: e.target.checked ? undefined : '',
                            })
                          }}
                          colorScheme="orange"
                        />
                      </Flex>
                    )}
                  </Flex>

                  {guest.isChild ? (
                    <Flex align="center" gap={2}>
                      <Badge colorScheme="orange" borderRadius="full" px={3} py={1}>
                        {t('finalRsvp.form.childrensMeal')}
                      </Badge>
                      <Text fontSize="xs" color="rgba(48,15,12,0.5)">
                        {t('finalRsvp.form.childrensMealNote')}
                      </Text>
                    </Flex>
                  ) : (
                    <Stack spacing={4}>
                      {/* Appetizer */}
                      <FormControl isInvalid={!!form.errors[`guest_${index}_appetizer`]}>
                        <FormLabel fontSize="sm">{t('finalRsvp.form.appetizer')}</FormLabel>
                        <Stack spacing={2}>
                          {(['ceviche', 'gaspacho'] as const).map((opt) => (
                            <Box
                              key={opt}
                              as="label"
                              display="flex"
                              alignItems="flex-start"
                              gap={3}
                              p={3}
                              borderRadius="md"
                              border="1px solid"
                              borderColor={guest.appetizer === opt ? '#94B1C8' : 'rgba(48,15,12,0.1)'}
                              bg={guest.appetizer === opt ? 'rgba(148,177,200,0.1)' : 'transparent'}
                              cursor="pointer"
                              transition="all 0.15s"
                              _hover={{ borderColor: '#94B1C8' }}
                            >
                              <input
                                type="radio"
                                name={`appetizer_${index}`}
                                value={opt}
                                checked={guest.appetizer === opt}
                                onChange={() => form.updateGuest(index, { appetizer: opt })}
                                style={{ marginTop: 3, flexShrink: 0 }}
                              />
                              <Box>
                                <Text fontSize="sm" color="#300F0C" fontStyle="italic">
                                  {t(`finalRsvp.menu.appetizer.${opt}`)}
                                </Text>
                                {opt === 'gaspacho' && (
                                  <Badge colorScheme="green" fontSize="10px" mt={1}>V</Badge>
                                )}
                              </Box>
                            </Box>
                          ))}
                        </Stack>
                        <FormErrorMessage>{form.errors[`guest_${index}_appetizer`]}</FormErrorMessage>
                      </FormControl>

                      <Divider borderColor="rgba(48,15,12,0.1)" />

                      {/* Main Course */}
                      <FormControl isInvalid={!!form.errors[`guest_${index}_main`]}>
                        <FormLabel fontSize="sm">{t('finalRsvp.form.mainCourse')}</FormLabel>
                        <Stack spacing={2}>
                          {(['bar', 'tournedos'] as const).map((opt) => (
                            <Box
                              key={opt}
                              as="label"
                              display="flex"
                              alignItems="flex-start"
                              gap={3}
                              p={3}
                              borderRadius="md"
                              border="1px solid"
                              borderColor={guest.main === opt ? '#94B1C8' : 'rgba(48,15,12,0.1)'}
                              bg={guest.main === opt ? 'rgba(148,177,200,0.1)' : 'transparent'}
                              cursor="pointer"
                              transition="all 0.15s"
                              _hover={{ borderColor: '#94B1C8' }}
                            >
                              <input
                                type="radio"
                                name={`main_${index}`}
                                value={opt}
                                checked={guest.main === opt}
                                onChange={() => form.updateGuest(index, { main: opt })}
                                style={{ marginTop: 3, flexShrink: 0 }}
                              />
                              <Text fontSize="sm" color="#300F0C" fontStyle="italic">
                                {t(`finalRsvp.menu.main.${opt}`)}
                              </Text>
                            </Box>
                          ))}
                        </Stack>
                        <FormErrorMessage>{form.errors[`guest_${index}_main`]}</FormErrorMessage>
                      </FormControl>
                    </Stack>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>

          <SectionDivider />

          {/* ── Song Request ── */}
          <FormControl>
            <FormLabel>{t('finalRsvp.form.songRequest')}</FormLabel>
            <Input
              value={form.songRequest}
              onChange={(e) => form.setSongRequest(e.target.value)}
              placeholder={t('finalRsvp.form.songRequestPlaceholder')}
            />
            <FormHelperText>{t('finalRsvp.form.songRequestHint')}</FormHelperText>
          </FormControl>

          <SectionDivider />

          {/* ── Arrival & Departure ── */}
          <Box>
            <Heading {...sectionHeadingProps}>{t('finalRsvp.form.travelTitle')}</Heading>
            <Text fontSize="sm" color="rgba(48,15,12,0.6)" mb={4}>
              {t('finalRsvp.form.travelDescription')}
            </Text>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel>{t('finalRsvp.form.arrivalDate')}</FormLabel>
                <Input
                  type="date"
                  value={form.arrivalDate}
                  onChange={(e) => form.setArrivalDate(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>{t('finalRsvp.form.departureDate')}</FormLabel>
                <Input
                  type="date"
                  value={form.departureDate}
                  onChange={(e) => form.setDepartureDate(e.target.value)}
                />
              </FormControl>
            </Stack>
          </Box>

          <SectionDivider />

          {/* ── Photography Consent ── */}
          <Box>
            <Heading {...sectionHeadingProps}>{t('finalRsvp.form.photographyTitle')}</Heading>
            <Text fontSize="sm" color="rgba(48,15,12,0.6)" mb={4}>
              {t('finalRsvp.form.photographyDescription')}
            </Text>
            <RadioGroup
              value={form.photographyConsent === null ? '' : String(form.photographyConsent)}
              onChange={(v) => form.setPhotographyConsent(v === '' ? null : v === 'true')}
            >
              <Stack spacing={3}>
                <Radio value="true">{t('finalRsvp.form.photographyYes')}</Radio>
                <Radio value="false">{t('finalRsvp.form.photographyNo')}</Radio>
              </Stack>
            </RadioGroup>
          </Box>

          <SectionDivider />

          {/* ── Additional Notes ── */}
          <FormControl>
            <FormLabel>{t('finalRsvp.form.additionalNotes')}</FormLabel>
            <Textarea
              value={form.additionalNotes}
              onChange={(e) => form.setAdditionalNotes(e.target.value)}
              placeholder={t('finalRsvp.form.notesPlaceholder')}
              rows={3}
            />
          </FormControl>

          {/* ── Submit ── */}
          <Button
            type="submit"
            isLoading={form.isSubmitting}
            loadingText={t('finalRsvp.form.submitting')}
            bg="#300F0C"
            color="#E3DFCE"
            size="lg"
            borderRadius="full"
            w="100%"
            _hover={{ bg: '#4C050C' }}
            _active={{ bg: '#300F0C' }}
            fontSize={['sm', 'md']}
            letterSpacing="wide"
          >
            {t('finalRsvp.form.submit')}
          </Button>
        </Stack>
      </Box>
    </Box>
  )
}
