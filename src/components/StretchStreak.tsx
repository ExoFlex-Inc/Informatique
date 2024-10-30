import { 
  Typography, 
  Paper,  
  Box,
  CircularProgress,
  Grid,
} from '@mui/material'
import { 
  Whatshot as WhatshotIcon
} from '@mui/icons-material'

interface StretchStreakProps {
  currentStreak: number;
  longestStreak: number;
}

export default function StretchStreak({ currentStreak, longestStreak }: StretchStreakProps) {
    return (
    <Grid item xs={12} md={4}>
    <Paper
        elevation={3}
        sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: 240,
            position: 'relative',
            backgroundColor: 'white',
        }}
        >
        <Typography component="h2" variant="h6" color="blueAccent.main" gutterBottom>
            Stretch Streak
        </Typography>
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
            <CircularProgress 
            variant="determinate" 
            value={(currentStreak / longestStreak) * 100} 
            size={120} 
            thickness={4} 
            color="secondary"
            />
            <Box
            sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
            >
            <WhatshotIcon sx={{ fontSize: 60, color: 'orange' }} />
            </Box>
        </Box>
        <Typography component="p" variant="h4" color={"blueAccent.main"} sx={{ mt: 2 }}>
            {currentStreak} days
        </Typography>
        </Paper>
    </Grid>
    );
}