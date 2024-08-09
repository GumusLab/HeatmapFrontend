// ListComponent.jsx
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import React from 'react';
// import StyledListItemButton from './StyledListItemButton';
import Divider from '@mui/material/Divider';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { styled } from '@mui/material/styles';


const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
    '&.Mui-selected': {
      backgroundColor: theme.palette.action.selected,
    },
  }));

interface ListComponentProps {
    selectedIndex: number;
    handleItemClick: (index: number) => void;
  }
const ListComponent: React.FC<ListComponentProps> = ({ selectedIndex, handleItemClick }) => {
  return (
    <List sx={{ backgroundColor: '#1E90FF', borderRadius: '5px', ml: 0, mr: 0, pt: 0, pb: 0, border: '0.5px solid black' }}>
      {['A-z', 'Cluster','Sum','Variance'].map((text, idx) => (
        <React.Fragment key={text}>
          <ListItem key={text} disablePadding>
            <StyledListItemButton
              sx={{ height: 30 }}
              selected={selectedIndex === idx}
              onClick={() => handleItemClick(idx)}
            >
              <ListItemText
                primary={text}
                primaryTypographyProps={{
                  style: {
                    fontSize: '14px',
                    fontWeight: 'normal',
                    fontFamily: 'Arial, sans-serif',
                    textAlign: 'center',
                    color: '#F5F5F5',
                  },
                }}
              />
            </StyledListItemButton>
          </ListItem>
          {idx !== 3 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default ListComponent;
