import React from 'react';
import { useTranslation } from 'react-i18next';
import { SimpleGrid } from '@chakra-ui/react';
import { StaggerContainer, StaggerItem } from '../animations';
import { RegistryLinkCard } from './RegistryLinkCard';
import { registryLinks, withJoyRegistryPassword } from '../../config';
import marriageGiftIcon from '../../assets/JustMarried.svg';

interface RegistryLinkCopy {
  name: string;
  description: string;
  buttonLabel: string;
  passwordLabel: string;
  copyPassword: string;
  passwordCopied: string;
}

export const RegistryLinksGrid: React.FC = () => {
  const { t } = useTranslation();
  const linksCopy = t('registry.links', { returnObjects: true }) as RegistryLinkCopy[];

  return (
    <StaggerContainer>
      <SimpleGrid
        columns={[1, 1, registryLinks.length > 1 ? 2 : 1]}
        spacing={6}
        maxW={registryLinks.length === 1 ? '560px' : undefined}
        mx="auto"
      >
        {registryLinks.map((link, index) => {
          const copy = linksCopy?.[index];
          if (!copy) return null;
          return (
            <StaggerItem key={link.id}>
              <RegistryLinkCard
                name={copy.name}
                description={copy.description}
                buttonLabel={copy.buttonLabel}
                passwordLabel={copy.passwordLabel}
                copyPassword={copy.copyPassword}
                passwordCopied={copy.passwordCopied}
                password={withJoyRegistryPassword}
                url={link.url}
                logoSrc={marriageGiftIcon}
              />
            </StaggerItem>
          );
        })}
      </SimpleGrid>
    </StaggerContainer>
  );
};

export default RegistryLinksGrid;
