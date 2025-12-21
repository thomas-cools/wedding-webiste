import { Box, Container, VStack, Text, Heading, Flex, Image } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ScrollReveal, fadeInLeft, fadeInRight } from './animations';
import { Divider } from '@chakra-ui/react';

export default function StorySection() {
  const { t } = useTranslation();
  return (
    <Box id="story" py={[20, 28]} bg="white" scrollMarginTop={["100px", "130px", "150px"]}>
      <Container maxW="container.lg">
        <VStack spacing={16}>
          {/* Section Header */}
          <ScrollReveal>
            <VStack spacing={4} textAlign="center" maxW="600px">
              <Text 
                fontSize="xs" 
                textTransform="uppercase" 
                letterSpacing="0.35em" 
                color="primary.soft"
                fontWeight="500"
              >
                {t('story.label')}
              </Text>
              <Heading 
                as="h2" 
                fontFamily="heading" 
                fontSize={["3xl", "4xl"]} 
                fontWeight="400"
              >
                {t('story.title')}
              </Heading>
              <Divider borderColor="primary.soft" w="120px" mx="auto" my={2} />
            </VStack>
          </ScrollReveal>
          {/* Story Content - Elegant Layout */}
          <Flex 
            direction={["column", "column", "row"]} 
            gap={[10, 10, 16]} 
            align="center"
            maxW="1000px"
          >
            <ScrollReveal variants={fadeInLeft} flex={1} maxW={["100%", "100%", "450px"]}>
              <Image 
                src="https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=2070&auto=format&fit=crop" 
                alt="Sofia and Lucas" 
                w="100%"
                h={["300px", "400px", "500px"]}
                objectFit="cover"
              />
            </ScrollReveal>
            <ScrollReveal variants={fadeInRight} flex={1}>
              <VStack align={["center", "center", "flex-start"]} spacing={6} textAlign={["center", "center", "left"]}>
                <Text fontSize="lg" lineHeight="1.9">
                  {t('story.paragraph1')}
                </Text>
                <Text fontSize="lg" lineHeight="1.9">
                  {t('story.paragraph2')}
                </Text>
                <Text 
                  fontFamily="heading" 
                  fontStyle="italic" 
                  fontSize="xl"
                  color="primary.deep" 
                  mt={4}
                >
                  "{t('story.quote')}"
                </Text>
              </VStack>
            </ScrollReveal>
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
}
