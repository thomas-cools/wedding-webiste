import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  HStack,
  Text,
} from '@chakra-ui/react'
import { ChevronDownIcon } from '@chakra-ui/icons'
import { languages, LanguageCode } from '../i18n'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = (code: LanguageCode) => {
    i18n.changeLanguage(code)
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        variant="ghost"
        size="sm"
        rightIcon={<ChevronDownIcon />}
        fontWeight="400"
        _hover={{ color: 'primary.deep' }}
      >
        <HStack spacing={2}>
          <Text fontSize="lg">{currentLanguage.flag}</Text>
          <Text display={['none', 'inline']}>{currentLanguage.code.toUpperCase()}</Text>
        </HStack>
      </MenuButton>
      <MenuList 
        bg="neutral.light" 
        borderColor="primary.soft"
        minW="auto"
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            bg={lang.code === i18n.language ? 'primary.soft' : 'transparent'}
            color={lang.code === i18n.language ? 'neutral.dark' : 'neutral.dark'}
            _hover={{ bg: 'chateau.champagne' }}
          >
            <HStack spacing={3}>
              <Text fontSize="lg">{lang.flag}</Text>
              <Text>{lang.name}</Text>
            </HStack>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  )
}
