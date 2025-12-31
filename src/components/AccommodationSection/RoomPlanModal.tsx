import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalBody, 
  ModalCloseButton, 
  Image 
} from '@chakra-ui/react';
import venueRoomsImg from '../../assets/venue_rooms.webp';

interface RoomPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoomPlanModal: React.FC<RoomPlanModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" isCentered>
      <ModalOverlay bg="blackAlpha.800" />
      <ModalContent 
        bg="transparent" 
        boxShadow="none" 
        maxW="95vw" 
        maxH="95vh"
        m={4}
      >
        <ModalCloseButton 
          color="white" 
          size="lg" 
          top={4} 
          right={4}
          bg="blackAlpha.600"
          borderRadius="full"
          _hover={{ bg: "blackAlpha.800" }}
          aria-label="Close modal"
        />
        <ModalBody 
          display="flex" 
          alignItems="center" 
          justifyContent="center" 
          p={0}
          onClick={onClose}
        >
          <Image 
            src={venueRoomsImg} 
            alt={t('travel.viewFloorplan')}
            maxW="100%"
            maxH="90vh"
            objectFit="contain"
            borderRadius="md"
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
