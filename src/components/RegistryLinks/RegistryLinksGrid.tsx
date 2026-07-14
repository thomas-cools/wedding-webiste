import React from 'react';
import { useTranslation } from 'react-i18next';
import { SimpleGrid } from '@chakra-ui/react';
import { StaggerContainer, StaggerItem } from '../animations';
import { RegistryLinkCard } from './RegistryLinkCard';
import { registryLinks } from '../../config';
import giftIcon from '../../assets/gift_icon.svg';

interface RegistryLinkCopy {
  name: string;
  description: string;
  buttonLabel: string;
}

export const RegistryLinksGrid: React.FC = () => {
  const { t } = useTranslation();
  const linksCopy = t('registry.links', { returnObjects: true }) as RegistryLinkCopy[];

  return (
    <StaggerContainer>
      <SimpleGrid columns={[1, 1, 2]} spacing={6}>
        {registryLinks.map((link, index) => {
          const copy = linksCopy?.[index];
          if (!copy) return null;
          return (
            <StaggerItem key={link.id}>
              <RegistryLinkCard
                name={copy.name}
                description={copy.description}
                buttonLabel={copy.buttonLabel}
                url={link.url}
                logoSrc={giftIcon}
              />
            </StaggerItem>
          );
        })}
      </SimpleGrid>
    </StaggerContainer>
  );
};

export default RegistryLinksGrid;
