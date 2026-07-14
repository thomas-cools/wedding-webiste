import { Box, Container, VStack, Text, Heading, Button } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ScrollReveal } from './animations';

export default function RegistrySection() {
  const { t } = useTranslation();
  return (
    <Box id="registry" py={[20, 24]} bg="neutral.light" scrollMarginTop={["100px", "130px", "150px"]}>
      <Container maxW="container.md">
        <ScrollReveal>
          <VStack spacing={6} textAlign="center">
            <Text
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="0.35em"
              color="primary.soft"
              fontWeight="500"
            >
              {t('registry.label')}
            </Text>
            <Heading
              as="h2"
              fontFamily="heading"
              fontSize={["3xl", "4xl"]}
              fontWeight="400"
              color="neutral.dark"
            >
              {t('registry.title')}
            </Heading>
            <Text fontSize={["md", "lg"]} lineHeight="1.9" color="neutral.dark" maxW="600px">
              {t('registry.teaserDescription')}
            </Text>
            <Button as={Link} to="/registry#page-top" variant="primary" mt={2}>
              {t('registry.viewButton')}
            </Button>
          </VStack>
        </ScrollReveal>
      </Container>
    </Box>
  );
}
