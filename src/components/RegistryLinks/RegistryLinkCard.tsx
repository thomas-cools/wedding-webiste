import React from 'react';
import { Box, VStack, Heading, Text, Image, Button, HStack, Code } from '@chakra-ui/react';
import { CopyIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { useState } from 'react';

export interface RegistryLinkCardProps {
  name: string;
  description: string;
  buttonLabel: string;
  passwordLabel: string;
  copyPassword: string;
  passwordCopied: string;
  password: string;
  url: string;
  logoSrc: string;
}

export const RegistryLinkCard: React.FC<RegistryLinkCardProps> = ({
  name,
  description,
  buttonLabel,
  passwordLabel,
  copyPassword,
  passwordCopied,
  password,
  url,
  logoSrc,
}) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyPassword = async () => {
    await navigator.clipboard.writeText(password);
    setIsCopied(true);
  };

  return (
    <Box bg="neutral.light" borderWidth="1px" borderColor="primary.soft" borderRadius="md" p={[8, 10]} h="full">
      <VStack spacing={6} textAlign="center" h="full">
        <Image src={logoSrc} alt="" w="48px" h="48px" borderRadius="md" />
        <Heading as="h3" fontFamily="heading" fontSize="xl" fontWeight="400" color="primary.deep">
          {name}
        </Heading>
        <Text fontSize="sm" color="neutral.muted" maxW="450px" flex={1}>
          {description}
        </Text>
        <HStack spacing={3} aria-label={passwordLabel}>
          <Code px={3} py={2} fontSize="md" letterSpacing="0.12em">
            {password}
          </Code>
          <Button
            type="button"
            aria-label={isCopied ? passwordCopied : copyPassword}
            title={isCopied ? passwordCopied : copyPassword}
            onClick={handleCopyPassword}
            variant="ghost"
            size="sm"
            minW="auto"
            px={2}
          >
            <CopyIcon />
          </Button>
        </HStack>
        <Button
          as="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          bg="transparent"
          color="neutral.dark"
          border="1px solid"
          borderColor="primary.soft"
          borderRadius="full"
          px={8}
          py={5}
          fontSize="sm"
          fontWeight="500"
          letterSpacing="0.05em"
          rightIcon={<ExternalLinkIcon w={3} h={3} />}
          _hover={{
            bg: 'neutral.dark',
            color: 'white',
            borderColor: 'neutral.dark',
            transform: 'translateY(-2px)',
          }}
          transition="all 0.3s ease"
        >
          {buttonLabel}
        </Button>
      </VStack>
    </Box>
  );
};
