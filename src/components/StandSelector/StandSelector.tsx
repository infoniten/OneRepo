import React, { useEffect, useState } from 'react';
import { Box, Button, ButtonGroup, Typography } from '@mui/material';

interface StandSelectorProps {
  onStandChange: (stand: string) => void;
}

export const StandSelector: React.FC<StandSelectorProps> = ({ onStandChange }) => {
  const [stands, setStands] = useState<string[]>([]);
  const [selectedStand, setSelectedStand] = useState<string>('IFT');

  useEffect(() => {
    const fetchStands = async () => {
      try {
        const response = await fetch('/api/stands');
        const data = await response.json();
        setStands(data);
      } catch (error) {
        console.error('Error fetching stands:', error);
      }
    };

    fetchStands();
  }, []);

  const handleStandChange = (stand: string) => {
    setSelectedStand(stand);
    onStandChange(stand);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Выберите стенд:
      </Typography>
      <ButtonGroup variant="contained" aria-label="stand selection">
        {stands.map((stand) => (
          <Button
            key={stand}
            onClick={() => handleStandChange(stand)}
            variant={selectedStand === stand ? 'contained' : 'outlined'}
            sx={{
              backgroundColor: selectedStand === stand ? 'primary.main' : 'transparent',
              '&:hover': {
                backgroundColor: selectedStand === stand ? 'primary.dark' : 'primary.light',
              },
            }}
          >
            {stand}
          </Button>
        ))}
      </ButtonGroup>
    </Box>
  );
}; 