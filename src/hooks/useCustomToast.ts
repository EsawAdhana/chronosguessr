import { useToast } from '@chakra-ui/react';

export const useCustomToast = () => {
  const toast = useToast();
  return {
    showToast: (title: string, description: string, status: 'info' | 'error' = 'info') => {
      toast({
        title,
        description,
        status,
        duration: 3000,
        isClosable: true,
      });
    },
  };
}; 