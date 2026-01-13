// src/components/organizations/OrganizationCard.jsx
import { Card, CardContent, Typography, Chip, Box, Avatar } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';

const OrganizationCard = ({ org, isOwned = false }) => {
  const typeIcon = org.org_type === 'business' ? <BusinessIcon /> : <PersonIcon />;
  const statusColor =
    org.status === 'active' ? 'success' :
    org.status === 'pending' ? 'warning' :
    'error';

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {org.logo ? (
            <Avatar src={org.logo} sx={{ mr: 2, width: 56, height: 56 }} />
          ) : (
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
              {org.name.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <Box>
            <Typography variant="h6">{org.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {org.org_type.charAt(0).toUpperCase() + org.org_type.slice(1)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            icon={typeIcon}
            label={org.org_type === 'personal' ? 'Personal' : 'Business'}
            color="primary"
            size="small"
          />
          <Chip
            label={org.status.toUpperCase()}
            color={statusColor}
            size="small"
          />
          {org.is_verified && (
            <Chip label="Verified" color="success" size="small" />
          )}
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {org.description || 'No description provided.'}
        </Typography>

        {org.mpesa_paybill && (
          <Typography variant="caption" display="block" color="text.secondary">
            M-Pesa Paybill: {org.mpesa_paybill}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default OrganizationCard;