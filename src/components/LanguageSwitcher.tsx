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

interface LanguageSwitcherProps {
  color?: string
  hoverBg?: string
  activeBg?: string
}

export default function LanguageSwitcher({ 
  color = 'white', 
  hoverBg = 'whiteAlpha.200',
  activeBg = 'whiteAlpha.300'
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation()
  
  const currentLanguage = languages.find(lang => lang.code === i18n.resolvedLanguage) || languages.find(lang => lang.code === i18n.language) || languages[0]

  const handleLanguageChange = (code: LanguageCode) => {
    i18n.changeLanguage(code)
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        variant="ghost"
        size="sm"
        rightIcon={<ChevronDownIcon color={color} />}
        fontWeight="400"
        color={color}
        _hover={{ color: color, bg: hoverBg }}
        _active={{ bg: activeBg }}
      >
        <HStack spacing={2}>
          <Text fontSize="lg">{currentLanguage.flag}</Text>
          <Text display={['none', 'inline']} color={color}>{currentLanguage.code.toUpperCase()}</Text>
        </HStack>
      </MenuButton>
      <MenuList 
        bg="rgba(39, 11, 12, 0.95)"
        borderColor="whiteAlpha.200"
        borderWidth="1px"
        boxShadow="lg"
        minW="160px"
        py={2}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            bg="transparent"
            color="white"
            fontWeight={lang.code === i18n.language ? '500' : '400'}
            _hover={{ bg: 'transparent', color: 'white' }}
            _focus={{ bg: 'transparent', color: 'white' }}
          >
            <HStack spacing={3}>
              <Text fontSize="lg">{lang.flag}</Text>
              <Text color="white">{lang.name}</Text>
            </HStack>
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  )
}
